import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { compareTransactionsDesc } from '@/lib/finance'
import { addTombstone, mergeLedger, sameLedger, type Tombstone } from '@/lib/ledger-sync'
import { fetchLedger, saveLedger, type RemoteLedger } from '@/lib/remote-ledger'
import { createId } from '@/lib/storage'
import type { Transaction, TransactionInput } from '@/types/finance'

type FinanceContextValue = {
  hydrated: boolean
  loadError: string | null
  saveError: string | null
  syncError: string | null
  notice: string | null
  transactions: Transaction[]
  addTransaction: (input: TransactionInput) => void
  updateTransaction: (id: string, input: TransactionInput) => void
  deleteTransaction: (id: string) => void
  clearAll: () => void
  replaceUnreadableData: () => void
  dismissNotice: () => void
  retrySave: () => void
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

const syncFailed = 'Buku kas belum tersambung ke perangkat lain.'
const syncOffline = 'Tidak ada internet. Buku bersama belum bisa dibuka.'
const unreadable = 'Buku kas bersama tidak bisa dibaca.'

let syncChain: Promise<void> = Promise.resolve()

function enqueueSync(task: () => Promise<void>) {
  syncChain = syncChain.then(task, task)
  return syncChain
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const transactionsRef = useRef(transactions)
  const deletedRef = useRef<Tombstone[]>([])
  const shaRef = useRef<string | null>(null)
  const revision = useRef(0)

  const apply = useCallback((book: { transactions: Transaction[]; deleted: Tombstone[] }) => {
    transactionsRef.current = book.transactions
    deletedRef.current = book.deleted
    setTransactions(book.transactions)
  }, [])

  const pushBook = useCallback(
    async (book: { transactions: Transaction[]; deleted: Tombstone[] }) => {
      try {
        const sha = await saveLedger(book, shaRef.current)
        shaRef.current = sha
        return true
      } catch (error) {
        if (error instanceof Error && error.message === 'conflict') {
          const remote = await fetchLedger()
          shaRef.current = remote.sha
          const merged = mergeLedger(
            book.transactions,
            book.deleted,
            remote.transactions,
            remote.deleted,
          )
          const sha = await saveLedger(merged, remote.sha)
          shaRef.current = sha
          apply(merged)
          return true
        }
        throw error
      }
    },
    [apply],
  )

  const sync = useCallback(async () => {
    const mark = revision.current
    let remote: RemoteLedger
    try {
      remote = await fetchLedger()
    } catch (error) {
      if (mark !== revision.current) return
      const offline = typeof navigator !== 'undefined' && navigator.onLine === false
      if (error instanceof Error && error.message === unreadable) setLoadError(unreadable)
      setSyncError(offline ? syncOffline : syncFailed)
      setHydrated(true)
      return
    }

    if (mark !== revision.current) return
    shaRef.current = remote.sha
    setLoadError(null)

    const merged = mergeLedger(
      transactionsRef.current,
      deletedRef.current,
      remote.transactions,
      remote.deleted,
    )
    if (mark !== revision.current) return

    if (
      !sameLedger(
        { transactions: transactionsRef.current, deleted: deletedRef.current },
        merged,
      )
    ) {
      apply(merged)
    }

    const remoteChanged = !sameLedger(remote, merged)
    if (
      remoteChanged &&
      (merged.transactions.length > 0 ||
        merged.deleted.length > 0 ||
        remote.transactions.length > 0 ||
        remote.deleted.length > 0)
    ) {
      try {
        await pushBook(merged)
      } catch {
        if (mark === revision.current) setSyncError(syncFailed)
        setHydrated(true)
        return
      }
    }

    if (mark === revision.current) {
      setSyncError(null)
      setSaveError(null)
    }
    setHydrated(true)
  }, [apply, pushBook])

  const scheduleSync = useCallback(() => {
    void enqueueSync(sync)
  }, [sync])

  useEffect(() => {
    scheduleSync()
    const onFocus = () => scheduleSync()
    const onVisible = () => {
      if (document.visibilityState === 'visible') scheduleSync()
    }
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') scheduleSync()
    }, 12_000)
    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [scheduleSync])

  const write = useCallback(
    (next: Transaction[], deleted: Tombstone[]) => {
      revision.current += 1
      apply({ transactions: next, deleted })
      scheduleSync()
    },
    [apply, scheduleSync],
  )

  const addTransaction = useCallback(
    (input: TransactionInput) => {
      const now = new Date().toISOString()
      const transaction: Transaction = {
        ...input,
        id: createId(),
        createdAt: now,
        updatedAt: now,
      }
      write(
        [transaction, ...transactionsRef.current].sort(compareTransactionsDesc),
        deletedRef.current,
      )
    },
    [write],
  )

  const updateTransaction = useCallback(
    (id: string, input: TransactionInput) => {
      const now = new Date().toISOString()
      write(
        transactionsRef.current
          .map((transaction) =>
            transaction.id === id
              ? { ...transaction, ...input, updatedAt: now }
              : transaction,
          )
          .sort(compareTransactionsDesc),
        deletedRef.current.filter((item) => item.id !== id),
      )
    },
    [write],
  )

  const deleteTransaction = useCallback(
    (id: string) => {
      const now = new Date().toISOString()
      write(
        transactionsRef.current.filter((transaction) => transaction.id !== id),
        addTombstone(deletedRef.current, id, now),
      )
    },
    [write],
  )

  const clearAll = useCallback(() => {
    const now = new Date().toISOString()
    const deleted = transactionsRef.current.reduce(
      (items, transaction) => addTombstone(items, transaction.id, now),
      deletedRef.current,
    )
    write([], deleted)
  }, [write])

  const replaceUnreadableData = useCallback(() => {
    setLoadError(null)
    setNotice(null)
    write([], [])
  }, [write])

  const dismissNotice = useCallback(() => {
    setNotice(null)
  }, [])

  const retrySave = useCallback(() => {
    scheduleSync()
  }, [scheduleSync])

  const value = useMemo<FinanceContextValue>(
    () => ({
      hydrated,
      loadError,
      saveError,
      syncError,
      notice,
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      clearAll,
      replaceUnreadableData,
      dismissNotice,
      retrySave,
    }),
    [
      addTransaction,
      clearAll,
      deleteTransaction,
      dismissNotice,
      hydrated,
      loadError,
      notice,
      replaceUnreadableData,
      retrySave,
      saveError,
      syncError,
      transactions,
      updateTransaction,
    ],
  )

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const context = useContext(FinanceContext)
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider')
  }
  return context
}
