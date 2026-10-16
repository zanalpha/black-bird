import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { compareTransactionsDesc } from '@/lib/finance'
import {
  createId,
  loadTransactions,
  saveTransactions,
  type LoadResult,
} from '@/lib/storage'
import type { Transaction, TransactionInput } from '@/types/finance'

type FinanceContextValue = {
  loadError: string | null
  saveError: string | null
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

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [boot] = useState(bootLedger)
  const allowSave = useRef(boot.ok)
  const [loadError, setLoadError] = useState<string | null>(
    boot.ok ? null : boot.message,
  )
  const [saveError, setSaveError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(
    boot.ok ? droppedNotice(boot.dropped) : null,
  )
  const [transactions, setTransactions] = useState<Transaction[]>(
    boot.ok ? boot.transactions : [],
  )
  const transactionsRef = useRef(transactions)

  const write = useCallback((next: Transaction[]) => {
    transactionsRef.current = next
    setTransactions(next)
    if (!allowSave.current) return
    const result = saveTransactions(next)
    setSaveError(result.ok ? null : result.message)
  }, [])

  const addTransaction = useCallback(
    (input: TransactionInput) => {
      const now = new Date().toISOString()
      const transaction: Transaction = {
        ...input,
        id: createId(),
        createdAt: now,
        updatedAt: now,
      }
      write([transaction, ...transactionsRef.current].sort(compareTransactionsDesc))
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
      )
    },
    [write],
  )

  const deleteTransaction = useCallback(
    (id: string) => {
      write(transactionsRef.current.filter((transaction) => transaction.id !== id))
    },
    [write],
  )

  const clearAll = useCallback(() => {
    write([])
  }, [write])

  const replaceUnreadableData = useCallback(() => {
    allowSave.current = true
    setLoadError(null)
    setNotice(null)
    write([])
  }, [write])

  const dismissNotice = useCallback(() => {
    setNotice(null)
  }, [])

  const retrySave = useCallback(() => {
    if (!allowSave.current) return
    const result = saveTransactions(transactions)
    setSaveError(result.ok ? null : result.message)
  }, [transactions])

  const value = useMemo<FinanceContextValue>(
    () => ({
      loadError,
      saveError,
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
      loadError,
      notice,
      replaceUnreadableData,
      retrySave,
      saveError,
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
