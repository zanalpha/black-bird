import { compareTransactionsDesc, isTransaction } from '@/lib/finance'
import type { Transaction } from '@/types/finance'

export type Tombstone = {
  id: string
  at: string
}

export type LedgerBook = {
  transactions: Transaction[]
  deleted: Tombstone[]
}

const MAX_TOMBSTONES = 2000

export function timeMs(value: string) {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

export function isTombstone(value: unknown): value is Tombstone {
  if (!value || typeof value !== 'object') return false
  const tomb = value as Partial<Tombstone>
  return (
    typeof tomb.id === 'string' &&
    tomb.id.length > 0 &&
    typeof tomb.at === 'string' &&
    Number.isFinite(timeMs(tomb.at))
  )
}

export function addTombstone(items: Tombstone[], id: string, at: string) {
  return [...items.filter((item) => item.id !== id), { id, at }]
}

function considerTransaction(
  map: Map<string, Transaction>,
  item: Transaction,
  preferOnTie: boolean,
) {
  const prev = map.get(item.id)
  const nextMs = timeMs(item.updatedAt)
  if (!Number.isFinite(nextMs)) return
  if (!prev) {
    map.set(item.id, item)
    return
  }
  const prevMs = timeMs(prev.updatedAt)
  if (nextMs > prevMs || (nextMs === prevMs && preferOnTie)) {
    map.set(item.id, item)
  }
}

function considerTombstone(
  map: Map<string, string>,
  item: Tombstone,
  preferOnTie: boolean,
) {
  const nextMs = timeMs(item.at)
  const prev = map.get(item.id)
  if (prev === undefined) {
    map.set(item.id, item.at)
    return
  }
  const prevMs = timeMs(prev)
  if (nextMs > prevMs || (nextMs === prevMs && preferOnTie)) {
    map.set(item.id, item.at)
  }
}

export function mergeLedger(
  localTx: Transaction[],
  localDeleted: Tombstone[],
  remoteTx: Transaction[],
  remoteDeleted: Tombstone[],
): LedgerBook {
  const transactions = new Map<string, Transaction>()
  for (const item of remoteTx) {
    if (isTransaction(item)) considerTransaction(transactions, item, true)
  }
  for (const item of localTx) {
    if (isTransaction(item)) considerTransaction(transactions, item, false)
  }

  const deleted = new Map<string, string>()
  for (const item of remoteDeleted) {
    if (isTombstone(item)) considerTombstone(deleted, item, true)
  }
  for (const item of localDeleted) {
    if (isTombstone(item)) considerTombstone(deleted, item, false)
  }

  for (const [id, at] of deleted) {
    const item = transactions.get(id)
    if (!item || timeMs(at) >= timeMs(item.updatedAt)) {
      transactions.delete(id)
    } else {
      deleted.delete(id)
    }
  }

  const tombs: Tombstone[] = [...deleted.entries()]
    .map(([id, at]) => ({ id, at }))
    .sort((a, b) => timeMs(b.at) - timeMs(a.at) || a.id.localeCompare(b.id))
    .slice(0, MAX_TOMBSTONES)

  return {
    transactions: [...transactions.values()].sort(compareTransactionsDesc),
    deleted: tombs,
  }
}

export function sameLedger(a: LedgerBook, b: LedgerBook) {
  if (a.transactions.length !== b.transactions.length) return false
  if (a.deleted.length !== b.deleted.length) return false
  const remoteTx = new Map(b.transactions.map((item) => [item.id, item]))
  for (const item of a.transactions) {
    const other = remoteTx.get(item.id)
    if (!other) return false
    if (
      item.type !== other.type ||
      item.amount !== other.amount ||
      item.date !== other.date ||
      item.category !== other.category ||
      item.note !== other.note ||
      timeMs(item.createdAt) !== timeMs(other.createdAt) ||
      timeMs(item.updatedAt) !== timeMs(other.updatedAt)
    ) {
      return false
    }
  }
  const remoteDeleted = new Map(b.deleted.map((item) => [item.id, item.at]))
  for (const item of a.deleted) {
    const at = remoteDeleted.get(item.id)
    if (at === undefined || timeMs(at) !== timeMs(item.at)) return false
  }
  return true
}
