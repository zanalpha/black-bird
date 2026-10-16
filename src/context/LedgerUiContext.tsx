import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ledger/ConfirmDialog'
import { TransactionDialog } from '@/components/ledger/TransactionDialog'
import { useFinance } from '@/context/FinanceContext'
import { formatDateLong } from '@/lib/dates'
import { typeLabel } from '@/lib/finance'
import { formatSignedRupiah } from '@/lib/money'
import type { Transaction } from '@/types/finance'

type LedgerUiContextValue = {
  openCreate: () => void
  openEdit: (transaction: Transaction) => void
  requestDelete: (transaction: Transaction) => void
}

const LedgerUiContext = createContext<LedgerUiContextValue | null>(null)

export function LedgerUiProvider({ children }: { children: ReactNode }) {
  const { deleteTransaction } = useFinance()
  const [formOpen, setFormOpen] = useState(false)
  const [formSession, setFormSession] = useState(0)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<Transaction | null>(null)
  const [shownDelete, setShownDelete] = useState<Transaction | null>(null)

  const value = useMemo<LedgerUiContextValue>(
    () => ({
      openCreate() {
        setEditing(null)
        setFormSession((session) => session + 1)
        setFormOpen(true)
      },
      openEdit(transaction) {
        setEditing(transaction)
        setFormSession((session) => session + 1)
        setFormOpen(true)
      },
      requestDelete(transaction) {
        setShownDelete(transaction)
        setDeleting(transaction)
      },
    }),
    [],
  )

  return (
    <LedgerUiContext.Provider value={value}>
      {children}
      <TransactionDialog
        open={formOpen}
        transaction={editing}
        formSession={formSession}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditing(null)
        }}
      />
      <ConfirmDialog
        open={deleting !== null}
        title="Hapus transaksi ini?"
        description={
          shownDelete
            ? `${formatDateLong(shownDelete.date)} · ${shownDelete.category} · ${typeLabel(shownDelete.type)} ${formatSignedRupiah(shownDelete.type, shownDelete.amount)}. Tindakan ini tidak bisa dibatalkan.`
            : ''
        }
        confirmLabel="Hapus"
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        onConfirm={() => {
          if (!deleting) return
          deleteTransaction(deleting.id)
          toast.success('Transaksi dihapus.')
          setDeleting(null)
        }}
      />
    </LedgerUiContext.Provider>
  )
}

export function useLedgerUi() {
  const context = useContext(LedgerUiContext)
  if (!context) {
    throw new Error('useLedgerUi must be used within LedgerUiProvider')
  }
  return context
}
