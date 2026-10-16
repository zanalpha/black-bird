import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useLedgerUi } from '@/context/LedgerUiContext'
import { formatDateLong } from '@/lib/dates'
import { typeLabel } from '@/lib/finance'
import { formatSignedRupiah } from '@/lib/money'
import type { Transaction, TransactionView } from '@/types/finance'
import type { ReactNode } from 'react'

export function TransactionList({
  items,
  view,
  empty,
}: {
  items: Transaction[]
  view: TransactionView
  empty: ReactNode
}) {
  if (items.length === 0) return empty
  if (view === 'kartu') return <CardList items={items} />
  return <TableList items={items} />
}

function CardList({ items }: { items: Transaction[] }) {
  const { openEdit, requestDelete } = useLedgerUi()

  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((tx) => (
        <li
          key={tx.id}
          className="flex flex-col gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/10"
        >
          <div className="flex items-start justify-between gap-3">
            <Badge variant={tx.type === 'pemasukan' ? 'default' : 'secondary'}>
              {typeLabel(tx.type)}
            </Badge>
            <p className="shrink-0 text-right text-sm font-semibold tabular-nums sm:text-base">
              {formatSignedRupiah(tx.type, tx.amount)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="font-medium break-words">{tx.category}</p>
            <p className="text-sm text-muted-foreground">
              {formatDateLong(tx.date)}
            </p>
            {tx.note ? (
              <p className="mt-2 text-sm break-words text-muted-foreground">
                {tx.note}
              </p>
            ) : null}
          </div>
          <div className="mt-auto flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1"
              onClick={() => openEdit(tx)}
            >
              Ubah
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-10 flex-1"
              onClick={() => requestDelete(tx)}
            >
              Hapus
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}

function TableList({ items }: { items: Transaction[] }) {
  const { openEdit, requestDelete } = useLedgerUi()

  return (
    <div className="overflow-x-auto rounded-2xl bg-card ring-1 ring-foreground/10">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <caption className="sr-only">Daftar transaksi</caption>
        <thead className="border-b border-border text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Tanggal
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Jenis
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Kategori
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Catatan
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Nominal
            </th>
            <th scope="col" className="px-4 py-3 text-right font-medium">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((tx) => (
            <tr key={tx.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3 whitespace-nowrap tabular-nums">
                {formatDateLong(tx.date)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <Badge variant={tx.type === 'pemasukan' ? 'default' : 'secondary'}>
                  {typeLabel(tx.type)}
                </Badge>
              </td>
              <td className="px-4 py-3 font-medium">{tx.category}</td>
              <td className="max-w-xs px-4 py-3 text-muted-foreground">
                <span className="line-clamp-2">{tx.note || '—'}</span>
              </td>
              <td className="px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums">
                {formatSignedRupiah(tx.type, tx.amount)}
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9"
                    onClick={() => openEdit(tx)}
                  >
                    Ubah
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-9"
                    onClick={() => requestDelete(tx)}
                  >
                    Hapus
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
