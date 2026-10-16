import { isTransaction } from '@/lib/finance'
import { isTombstone, mergeLedger, type LedgerBook } from '@/lib/ledger-sync'

export const LEDGER_ROOT =
  'https://crudcrud.com/api/fc9fc5bd75c941019e84428054d5285a'

export type RemoteLedger = LedgerBook & {
  ids: string[]
}

type RemoteRow = {
  _id?: unknown
  transactions?: unknown
  deleted?: unknown
}

function parseRow(value: unknown): { id: string; book: LedgerBook } | null {
  if (!value || typeof value !== 'object') return null
  const row = value as RemoteRow
  if (typeof row._id !== 'string' || row._id.length === 0) return null
  if (!Array.isArray(row.transactions) || !Array.isArray(row.deleted)) return null
  const transactions = row.transactions.filter(isTransaction)
  if (row.transactions.length > 0 && transactions.length === 0) {
    throw new Error('Buku kas bersama tidak bisa dibaca.')
  }
  const deleted = row.deleted.filter(isTombstone)
  return { id: row._id, book: { transactions, deleted } }
}

export async function fetchLedger(root = LEDGER_ROOT): Promise<RemoteLedger> {
  const response = await fetch(`${root}/ledger`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(12000),
  })
  if (!response.ok) throw new Error('Buku kas bersama tidak bisa dibaca.')
  const payload: unknown = await response.json()
  if (!Array.isArray(payload)) throw new Error('Buku kas bersama tidak bisa dibaca.')

  const ids: string[] = []
  let book: LedgerBook = { transactions: [], deleted: [] }
  for (const row of payload) {
    const parsed = parseRow(row)
    if (!parsed) continue
    ids.push(parsed.id)
    book = mergeLedger(
      book.transactions,
      book.deleted,
      parsed.book.transactions,
      parsed.book.deleted,
    )
  }
  return { ids, transactions: book.transactions, deleted: book.deleted }
}

export async function saveLedger(
  ids: string[],
  book: LedgerBook,
  root = LEDGER_ROOT,
) {
  const body = JSON.stringify({
    transactions: book.transactions,
    deleted: book.deleted,
  })
  if (ids.length === 0) {
    const response = await fetch(`${root}/ledger`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body,
      signal: AbortSignal.timeout(12000),
    })
    if (!response.ok) throw new Error('Buku kas bersama belum tersimpan.')
    return
  }

  const [keep, ...extra] = ids
  const response = await fetch(`${root}/ledger/${keep}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(12000),
  })
  if (!response.ok) throw new Error('Buku kas bersama belum tersimpan.')
  await Promise.all(
    extra.map(async (id) => {
      await fetch(`${root}/ledger/${id}`, { method: 'DELETE' }).catch(() => undefined)
    }),
  )
}
