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
import { fetchLedger, saveLedger } from '@/lib/remote-ledger'
import {
  createId,
  loadDeleted,
  loadTransactions,
  saveDeleted,
  saveTransactions,
  type LoadResult,
} from '@/lib/storage'
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

const syncFailed =
  'Buku kas belum tersambung ke perangkat lain. Data di perangkat ini tetap ada.'
const syncOffline =
  'Tidak ada internet. Data di perangkat ini tetap ada dan akan menyambung saat online.'

let syncChain: Promise<void> = Promise.resolve()

function enqueueSync(task: () => Promise<void>) {
  syncChain = syncChain.then(task, task)
  return syncChain
}

function droppedNotice(count: number) {
  if (count <= 0) return null
  return count === 1
    ? '1 transaksi rusak dilewati dan tidak dimuat.'
    : `${count} transaksi rusak dilewati dan tidak dimuat.`
}

function bootLedger(): LoadResult {
  const result = loadTransactions()
  if (result.ok && result.dropped > 0) saveTransactions(result.transactions)
  return result
}

function storageMessage(txOk: boolean, deletedOk: boolean, txMessage?: string, deletedMessage?: string) {
  if (txOk && deletedOk) return null
  return txMessage ?? deletedMessage ?? syncFailed
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [boot] = useState(bootLedger)
  const allowSave = useRef(boot.ok)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [notice, setNotice] = useState<string | null>(
    boot.ok ? droppedNotice(boot.dropped) : null,
  )
  const [transactions, setTransactions] = useState<Transaction[]>(
    boot.ok ? boot.transactions : [],
  )
  const transactionsRef = useRef(transactions)
  const deletedRef = useRef<Tombstone[]>(loadDeleted())
  const revision = useRef(0)
  const bootRef = useRef(boot)

  const persist = useCallback((next: Transaction[], deleted: Tombstone[]) => {
    transactionsRef.current = next
    deletedRef.current = deleted
    setTransactions(next)
    if (!allowSave.current) return
    const savedTx = saveTransactions(next)
    const savedDeleted = saveDeleted(deleted)
    setSaveError(
      storageMessage(
        savedTx.ok,
        savedDeleted.ok,
        savedTx.ok ? undefined : savedTx.message,
        savedDeleted.ok ? undefined : savedDeleted.message,
      ),
    )
  }, [])

  const sync = useCallback(async () => {
    const mark = revision.current
    let remote: Awaited<ReturnType<typeof fetchLedger>>
    try {
      remote = await fetchLedger()
    } catch {
      if (mark !== revision.current) return
      if (!allowSave.current) {
        setLoadError(bootRef.current.ok ? null : bootRef.current.message)
      }
      setSyncError(navigator.onLine ? syncFailed : syncOffline)
      setHydrated(true)
      return
    }

    if (mark !== revision.current) return

    if (!allowSave.current) {
      if (remote.transactions.length === 0 && remote.ids.length === 0) {
        setLoadError(bootRef.current.ok ? null : bootRef.current.message)
        setHydrated(true)
        return
      }
      allowSave.current = true
      setLoadError(null)
      setNotice(null)
    }

    const merged = mergeLedger(
      transactionsRef.current,
      deletedRef.current,
      remote.transactions,
      remote.deleted,
    )
    if (mark !== revision.current) return

    const localChanged = !sameLedger(
      { transactions: transactionsRef.current, deleted: deletedRef.current },
      merged,
    )
    if (localChanged) persist(merged.transactions, merged.deleted)

    const remoteChanged =
      !sameLedger(remote, merged) || remote.ids.length > 1
    const shouldPush =
      remoteChanged &&
      (merged.transactions.length > 0 ||
        merged.deleted.length > 0 ||
        remote.ids.length > 0)

    if (shouldPush) {
      try {
        await saveLedger(remote.ids, merged)
      } catch {
        if (mark === revision.current) setSyncError(syncFailed)
        setHydrated(true)
        return
      }
    }

    if (mark === revision.current) setSyncError(null)
    setHydrated(true)
  }, [persist])

  const scheduleSync = useCallback(() => {
    void enqueueSync(sync)
  }, [sync])

  useEffect(() => {
    scheduleSync()
    const onFocus = () => scheduleSync()
    const onVisible = () => {
      if (document.visibilityState === 'visible') scheduleSync()
    }
    window.addEventListener('focus', onFocus)
    window.addEventListener('online', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('online', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [scheduleSync])

  const write = useCallback(
    (next: Transaction[], deleted: Tombstone[]) => {
      revision.current += 1
      persist(next, deleted)
      if (allowSave.current) scheduleSync()
    },
    [persist, scheduleSync],
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
    allowSave.current = true
    setLoadError(null)
    setNotice(null)
    write([], [])
  }, [write])

  const dismissNotice = useCallback(() => {
    setNotice(null)
  }, [])

  const retrySave = useCallback(() => {
    if (allowSave.current) {
      const savedTx = saveTransactions(transactionsRef.current)
      const savedDeleted = saveDeleted(deletedRef.current)
      setSaveError(
        storageMessage(
          savedTx.ok,
          savedDeleted.ok,
          savedTx.ok ? undefined : savedTx.message,
          savedDeleted.ok ? undefined : savedDeleted.message,
        ),
      )
    }
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

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  )
}

export function useFinance() {
  const context = useContext(FinanceContext)
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider')
  }
  return context
}
