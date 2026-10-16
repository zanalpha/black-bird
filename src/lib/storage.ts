import { compareTransactionsDesc, isTransaction } from '@/lib/finance'
import type { Transaction } from '@/types/finance'

export const TX_KEY = 'blackbird.transactions.v1'

export type LoadResult =
  | { ok: true; transactions: Transaction[]; dropped: number }
  | { ok: false; message: string }

const unreadable = 'Data di perangkat ini tidak bisa dibaca.'

export function loadTransactions(): LoadResult {
  try {
    const raw = localStorage.getItem(TX_KEY)
    if (!raw) return { ok: true, transactions: [], dropped: 0 }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return { ok: false, message: unreadable }
    const transactions = parsed.filter(isTransaction).sort(compareTransactionsDesc)
    if (parsed.length > 0 && transactions.length === 0) {
      return { ok: false, message: unreadable }
    }
    return {
      ok: true,
      transactions,
      dropped: parsed.length - transactions.length,
    }
  } catch {
    return { ok: false, message: unreadable }
  }
}

export function saveTransactions(transactions: Transaction[]) {
  try {
    localStorage.setItem(TX_KEY, JSON.stringify(transactions))
    return { ok: true as const }
  } catch {
    return {
      ok: false as const,
      message:
        'Perubahan terakhir belum tersimpan. Ruang penyimpanan perangkat mungkin penuh atau diblokir.',
    }
  }
}

export function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}
