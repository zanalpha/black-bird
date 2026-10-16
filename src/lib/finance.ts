import {
  formatDateLong,
  isValidISODate,
  isYearInRange,
  MONTHS_SHORT,
} from '@/lib/dates'
import { formatRupiah, formatThousands, MAX_AMOUNT } from '@/lib/money'
import type {
  FieldErrors,
  Transaction,
  TransactionFilter,
  TransactionInput,
  TxType,
} from '@/types/finance'

export const INCOME_CATEGORIES = [
  'Pembayaran Grub',
  'Kas Tambahan',
  'Dana Lainnya',
] as const

export const EMPTY_FILTER: TransactionFilter = {
  search: '',
  type: 'semua',
  category: 'semua',
  from: '',
  to: '',
}

export function typeLabel(type: TxType) {
  return type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'
}

export function compareTransactionsDesc(a: Transaction, b: Transaction) {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1
  if (a.createdAt !== b.createdAt) return a.createdAt < b.createdAt ? 1 : -1
  return a.id < b.id ? 1 : -1
}

export function isTransaction(value: unknown): value is Transaction {
  if (!value || typeof value !== 'object') return false
  const tx = value as Partial<Transaction>
  return (
    typeof tx.id === 'string' &&
    tx.id.length > 0 &&
    (tx.type === 'pemasukan' || tx.type === 'pengeluaran') &&
    typeof tx.amount === 'number' &&
    Number.isSafeInteger(tx.amount) &&
    tx.amount > 0 &&
    tx.amount <= MAX_AMOUNT &&
    typeof tx.date === 'string' &&
    isValidISODate(tx.date) &&
    isYearInRange(Number(tx.date.slice(0, 4))) &&
    typeof tx.category === 'string' &&
    tx.category.trim().length > 0 &&
    tx.category.trim().length <= 40 &&
    typeof tx.note === 'string' &&
    tx.note.length <= 200 &&
    typeof tx.createdAt === 'string' &&
    tx.createdAt.length > 0 &&
    typeof tx.updatedAt === 'string' &&
    tx.updatedAt.length > 0
  )
}

export function totals(items: Transaction[]) {
  let income = 0
  let expense = 0
  for (const tx of items) {
    if (tx.type === 'pemasukan') income += tx.amount
    else expense += tx.amount
  }
  return {
    income,
    expense,
    balance: income - expense,
    count: items.length,
  }
}

export function isInMonth(date: string, yearMonth: string) {
  return date.slice(0, 7) === yearMonth
}

export function transactionsInMonth(items: Transaction[], yearMonth: string) {
  return items.filter((tx) => isInMonth(tx.date, yearMonth))
}

export type MonthPoint = {
  key: string
  label: string
  income: number
  expense: number
}

export function yearSeries(items: Transaction[], year: number): MonthPoint[] {
  return MONTHS_SHORT.map((label, index) => {
    const key = `${year}-${String(index + 1).padStart(2, '0')}`
    const summary = totals(items.filter((tx) => isInMonth(tx.date, key)))
    return { key, label, income: summary.income, expense: summary.expense }
  })
}

export function byCategory(items: Transaction[], type: TxType) {
  const map = new Map<string, number>()
  for (const tx of items) {
    if (tx.type !== type) continue
    map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount)
  }
  return [...map.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort(
      (a, b) => b.amount - a.amount || a.category.localeCompare(b.category, 'id'),
    )
}

export function uniqueCategories(items: Transaction[]) {
  return [...new Set(items.map((tx) => tx.category))].sort((a, b) =>
    a.localeCompare(b, 'id'),
  )
}

export function isFilterActive(filter: TransactionFilter) {
  return (
    filter.search.trim() !== '' ||
    filter.type !== 'semua' ||
    filter.category !== 'semua' ||
    filter.from !== '' ||
    filter.to !== ''
  )
}

export function hasInvalidDateRange(filter: TransactionFilter) {
  return filter.from !== '' && filter.to !== '' && filter.from > filter.to
}

function searchBlob(tx: Transaction) {
  return [
    tx.category,
    tx.note,
    typeLabel(tx.type),
    tx.type,
    String(tx.amount),
    formatThousands(String(tx.amount)),
    formatRupiah(tx.amount),
    formatDateLong(tx.date),
    tx.date,
  ]
    .join(' ')
    .toLowerCase()
}

export function filterTransactions(
  items: Transaction[],
  filter: TransactionFilter,
) {
  const query = filter.search.trim().toLowerCase()
  return items
    .filter((tx) => {
      if (filter.type !== 'semua' && tx.type !== filter.type) return false
      if (filter.category !== 'semua' && tx.category !== filter.category) {
        return false
      }
      if (filter.from && tx.date < filter.from) return false
      if (filter.to && tx.date > filter.to) return false
      if (query && !searchBlob(tx).includes(query)) return false
      return true
    })
    .sort(compareTransactionsDesc)
}

export function validateDraft(input: {
  type: TxType
  amount: string
  date: string
  category: string
  note: string
}): { errors: FieldErrors; value: TransactionInput | null } {
  const errors: FieldErrors = {}
  const amount = Number(input.amount)

  if (!input.amount) errors.amount = 'Nominal wajib diisi.'
  else if (!Number.isSafeInteger(amount) || amount <= 0) {
    errors.amount = 'Nominal harus lebih dari nol.'
  } else if (amount > MAX_AMOUNT) {
    errors.amount = 'Nominal maksimal Rp1.000.000.000.000.'
  }

  if (!input.date) errors.date = 'Tanggal wajib diisi.'
  else if (!isValidISODate(input.date)) errors.date = 'Tanggal tidak valid.'
  else if (!isYearInRange(Number(input.date.slice(0, 4)))) {
    errors.date = 'Tanggal harus antara tahun 2000 dan 2100.'
  }

  const category = input.category.trim()
  if (!category) errors.category = 'Kategori wajib diisi.'
  else if (category.length > 40) errors.category = 'Kategori maksimal 40 karakter.'

  const note = input.note.trim()
  if (note.length > 200) errors.note = 'Catatan maksimal 200 karakter.'

  if (Object.keys(errors).length > 0) return { errors, value: null }

  return {
    errors,
    value: {
      type: input.type,
      amount,
      date: input.date,
      category,
      note,
    },
  }
}
