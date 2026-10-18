import { mergeLedger, sameLedger, type Tombstone } from '../src/lib/ledger-sync.ts'
import type { Transaction } from '../src/types/finance.ts'

function tx(partial: Partial<Transaction> & Pick<Transaction, 'id' | 'updatedAt'>): Transaction {
  return {
    type: 'pemasukan',
    amount: 1000,
    date: '2026-10-16',
    category: 'Kas Tambahan',
    note: '',
    createdAt: '2026-10-16T00:00:00.000Z',
    ...partial,
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

const local = tx({ id: 'a', updatedAt: '2026-10-16T02:00:00.000Z', amount: 2000 })
const remoteOlder = tx({ id: 'a', updatedAt: '2026-10-16T01:00:00.000Z', amount: 1000 })
const remoteOnly = tx({
  id: 'b',
  type: 'pengeluaran',
  category: 'Makan',
  updatedAt: '2026-10-16T03:00:00.000Z',
  amount: 500,
})

const kept = mergeLedger([local], [], [remoteOlder, remoteOnly], [])
assert(kept.transactions.length === 2, 'union keeps both ids')
assert(kept.transactions.find((item) => item.id === 'a')?.amount === 2000, 'newer local amount wins')

const removed = mergeLedger(
  [local],
  [{ id: 'a', at: '2026-10-16T04:00:00.000Z' }],
  [remoteOlder],
  [],
)
assert(removed.transactions.length === 0, 'newer tombstone removes the transaction')
assert(removed.deleted.some((item) => item.id === 'a'), 'tombstone is kept')

const revived = mergeLedger(
  [local],
  [],
  [],
  [{ id: 'a', at: '2026-10-16T01:00:00.000Z' }],
)
assert(revived.transactions.length === 1, 'newer edit survives an older tombstone')
assert(revived.deleted.length === 0, 'obsolete tombstone is dropped')

const tied = mergeLedger(
  [tx({ id: 'a', updatedAt: '2026-10-16T01:00:00.000Z', note: 'lokal' })],
  [],
  [tx({ id: 'a', updatedAt: '2026-10-16T01:00:00Z', note: 'remote' })],
  [],
)
assert(tied.transactions[0]?.note === 'remote', 'equal time keeps the remote copy')
assert(
  sameLedger(tied, {
    transactions: tied.transactions,
    deleted: [] as Tombstone[],
  }),
  'same book ignores timestamp spelling',
)

const emptyDevice = mergeLedger([], [], [remoteOnly], [])
assert(emptyDevice.transactions[0]?.id === 'b', 'empty device receives the shared book')

const extra = tx({
  id: 'kas',
  category: 'Dana Lainnya',
  amount: 25000,
  updatedAt: '2026-10-16T09:00:00.000Z',
})
const shared = mergeLedger(
  [extra],
  [{ id: 'a', at: '2026-10-16T10:00:00.000Z' }],
  [local],
  [],
)
assert(shared.transactions.length === 1 && shared.transactions[0]?.id === 'kas', 'delete and add merge')
console.log('ledger sync ok')
