import { useId, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { SegmentedControl } from '@/components/ledger/SegmentedControl'
import { useFinance } from '@/context/FinanceContext'
import { todayISO } from '@/lib/dates'
import { categoriesFor, validateDraft } from '@/lib/finance'
import { formatThousands, sanitizeAmount } from '@/lib/money'
import type { FieldErrors, Transaction, TxType } from '@/types/finance'

const CUSTOM = '__custom'

type FormState = {
  type: TxType
  amount: string
  date: string
  category: string
  customCategory: string
  note: string
}

function emptyForm(): FormState {
  return {
    type: 'pengeluaran',
    amount: '',
    date: todayISO(),
    category: '',
    customCategory: '',
    note: '',
  }
}

function toForm(transaction: Transaction | null): FormState {
  if (!transaction) return emptyForm()
  const presets = categoriesFor(transaction.type)
  const isPreset = (presets as readonly string[]).includes(transaction.category)
  return {
    type: transaction.type,
    amount: String(transaction.amount),
    date: transaction.date,
    category: isPreset ? transaction.category : CUSTOM,
    customCategory: isPreset ? '' : transaction.category,
    note: transaction.note,
  }
}

function resolvedCategory(form: FormState) {
  return form.category === CUSTOM ? form.customCategory : form.category
}

export function TransactionDialog({
  open,
  transaction,
  formSession,
  onOpenChange,
}: {
  open: boolean
  transaction: Transaction | null
  formSession: number
  onOpenChange: (open: boolean) => void
}) {
  const { addTransaction, updateTransaction } = useFinance()
  const [seenSession, setSeenSession] = useState(formSession)
  const [form, setForm] = useState<FormState>(() => toForm(transaction))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [attempted, setAttempted] = useState(false)
  const amountId = useId()
  const dateId = useId()
  const categoryId = useId()
  const customId = useId()
  const noteId = useId()

  if (seenSession !== formSession) {
    setSeenSession(formSession)
    setForm(toForm(transaction))
    setErrors({})
    setAttempted(false)
  }

  function commit(next: FormState) {
    setForm(next)
    if (!attempted) return
    setErrors(
      validateDraft({
        type: next.type,
        amount: next.amount,
        date: next.date,
        category: resolvedCategory(next),
        note: next.note,
      }).errors,
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setAttempted(true)
    const result = validateDraft({
      type: form.type,
      amount: form.amount,
      date: form.date,
      category: resolvedCategory(form),
      note: form.note,
    })
    setErrors(result.errors)
    if (!result.value) {
      const focusId = result.errors.amount
        ? amountId
        : result.errors.date
          ? dateId
          : result.errors.category
            ? form.category === CUSTOM
              ? customId
              : categoryId
            : result.errors.note
              ? noteId
              : null
      if (focusId) document.getElementById(focusId)?.focus()
      return
    }

    if (transaction) {
      updateTransaction(transaction.id, result.value)
      toast.success('Transaksi diperbarui.')
    } else {
      addTransaction(result.value)
      toast.success('Transaksi dicatat.')
    }
    onOpenChange(false)
  }

  const categoryErrorOnCustom = form.category === CUSTOM
  const presets = categoriesFor(form.type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Ubah transaksi' : 'Catat transaksi'}
          </DialogTitle>
          <DialogDescription>
            Nominal, tanggal, dan kategori wajib diisi. Catatan boleh dikosongkan.
          </DialogDescription>
        </DialogHeader>
        <form noValidate className="grid gap-4" onSubmit={handleSubmit}>
          <SegmentedControl
            label="Jenis transaksi"
            value={form.type}
            onChange={(type) =>
              commit({ ...form, type, category: '', customCategory: '' })
            }
            options={[
              { value: 'pemasukan', label: 'Pemasukan' },
              { value: 'pengeluaran', label: 'Pengeluaran' },
            ]}
          />

          <div className="grid gap-2">
            <Label htmlFor={amountId}>Nominal</Label>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
                Rp
              </span>
              <Input
                id={amountId}
                inputMode="numeric"
                autoComplete="off"
                spellCheck={false}
                placeholder="0"
                value={formatThousands(form.amount)}
                aria-invalid={Boolean(errors.amount) || undefined}
                aria-describedby={errors.amount ? `${amountId}-error` : undefined}
                className="h-11 pl-10 text-base tabular-nums"
                onChange={(event) =>
                  commit({ ...form, amount: sanitizeAmount(event.target.value) })
                }
              />
            </div>
            {errors.amount ? (
              <p id={`${amountId}-error`} role="alert" className="text-sm text-destructive">
                {errors.amount}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Rupiah penuh, tanpa sen.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor={dateId}>Tanggal</Label>
            <Input
              id={dateId}
              type="date"
              min="2000-01-01"
              max="2100-12-31"
              value={form.date}
              aria-invalid={Boolean(errors.date) || undefined}
              aria-describedby={errors.date ? `${dateId}-error` : undefined}
              className="h-11"
              onChange={(event) => commit({ ...form, date: event.target.value })}
            />
            {errors.date ? (
              <p id={`${dateId}-error`} role="alert" className="text-sm text-destructive">
                {errors.date}
              </p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor={categoryId}>Kategori</Label>
            <Select
              value={form.category || undefined}
              onValueChange={(category) =>
                commit({
                  ...form,
                  category,
                  customCategory: category === CUSTOM ? form.customCategory : '',
                })
              }
            >
              <SelectTrigger
                id={categoryId}
                aria-invalid={
                  Boolean(errors.category && !categoryErrorOnCustom) || undefined
                }
                aria-describedby={
                  errors.category && !categoryErrorOnCustom
                    ? `${categoryId}-error`
                    : undefined
                }
                className="h-11 w-full"
              >
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-72">
                {presets.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value={CUSTOM}>Kategori sendiri</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && !categoryErrorOnCustom ? (
              <p id={`${categoryId}-error`} role="alert" className="text-sm text-destructive">
                {errors.category}
              </p>
            ) : null}
          </div>

          {form.category === CUSTOM ? (
            <div className="grid gap-2">
              <Label htmlFor={customId}>Nama kategori</Label>
              <Input
                id={customId}
                value={form.customCategory}
                maxLength={40}
                autoComplete="off"
                placeholder="Contoh: Tabungan"
                aria-invalid={Boolean(errors.category) || undefined}
                aria-describedby={errors.category ? `${customId}-error` : undefined}
                className="h-11"
                onChange={(event) =>
                  commit({ ...form, customCategory: event.target.value })
                }
              />
              {errors.category ? (
                <p id={`${customId}-error`} role="alert" className="text-sm text-destructive">
                  {errors.category}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor={noteId}>Catatan</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {form.note.length}/200
              </span>
            </div>
            <Textarea
              id={noteId}
              value={form.note}
              maxLength={200}
              placeholder="Opsional"
              aria-invalid={Boolean(errors.note) || undefined}
              aria-describedby={errors.note ? `${noteId}-error` : undefined}
              onChange={(event) => commit({ ...form, note: event.target.value })}
            />
            {errors.note ? (
              <p id={`${noteId}-error`} role="alert" className="text-sm text-destructive">
                {errors.note}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" className="h-10">
              Simpan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
