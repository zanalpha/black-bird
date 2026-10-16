import { useState } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { MonthSwitcher } from '@/components/ledger/MonthSwitcher'
import { StatCard } from '@/components/ledger/StatCard'
import { TransactionList } from '@/components/ledger/TransactionList'
import { Button } from '@/components/ui/button'
import { useFinance } from '@/context/FinanceContext'
import { useAdaptiveView } from '@/lib/viewport'
import { downloadCsv } from '@/lib/csv'
import { currentMonthKey, formatMonthLabel } from '@/lib/dates'
import { byCategory, totals, transactionsInMonth } from '@/lib/finance'
import { formatRupiah } from '@/lib/money'

export function ReportPage() {
  const { transactions } = useFinance()
  const view = useAdaptiveView()
  const [month, setMonth] = useState(currentMonthKey)
  const monthItems = transactionsInMonth(transactions, month)
  const summary = totals(monthItems)
  const incomeCategories = byCategory(monthItems, 'pemasukan')
  const expenseCategories = byCategory(monthItems, 'pengeluaran')

  function exportMonth() {
    downloadCsv(`black-bird-${month}.csv`, monthItems)
    toast.success(`CSV ${formatMonthLabel(month)} diunduh.`)
  }

  function exportAll() {
    downloadCsv('black-bird-semua.csv', transactions)
    toast.success('CSV semua transaksi diunduh.')
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Laporan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan {formatMonthLabel(month)}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <MonthSwitcher value={month} onChange={setMonth} />
          <Button
            type="button"
            className="h-10"
            disabled={monthItems.length === 0}
            onClick={exportMonth}
          >
            <Download />
            Unduh CSV
          </Button>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Pemasukan"
          value={formatRupiah(summary.income)}
          detail={`${incomeCategories.length} kategori`}
        />
        <StatCard
          label="Pengeluaran"
          value={formatRupiah(summary.expense)}
          detail={`${expenseCategories.length} kategori`}
        />
        <StatCard
          className="sm:col-span-2 xl:col-span-1"
          tone="inverse"
          label="Saldo"
          value={formatRupiah(summary.balance)}
          detail={
            summary.count === 0
              ? 'Belum ada transaksi'
              : `${summary.count} transaksi`
          }
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <CategoryCard
          title="Pemasukan per kategori"
          total={summary.income}
          items={incomeCategories}
          empty="Tidak ada pemasukan bulan ini."
        />
        <CategoryCard
          title="Pengeluaran per kategori"
          total={summary.expense}
          items={expenseCategories}
          empty="Tidak ada pengeluaran bulan ini."
        />
      </section>

      <section className="grid gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Rincian bulan ini</h2>
            <p className="text-sm text-muted-foreground">
              Nominal di CSV berupa angka penuh, pemisah kolom titik koma.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10"
            disabled={transactions.length === 0}
            onClick={exportAll}
          >
            <Download />
            Unduh semua
          </Button>
        </div>
        <TransactionList
          items={monthItems}
          view={view}
          empty={
            <p className="rounded-2xl bg-card px-4 py-10 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
              Belum ada transaksi di {formatMonthLabel(month)}.
            </p>
          }
        />
      </section>
    </div>
  )
}

function CategoryCard({
  title,
  items,
  total,
  empty,
}: {
  title: string
  items: { category: string; amount: number }[]
  total: number
  empty: string
}) {
  const max = items[0]?.amount ?? 0

  return (
    <article className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <ul className="mt-4 grid gap-3">
          {items.map((item) => {
            const width = max === 0 ? 0 : Math.max(6, Math.round((item.amount / max) * 100))
            const share = total === 0 ? 0 : Math.round((item.amount / total) * 100)
            return (
              <li key={item.category} className="grid gap-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium break-words">{item.category}</span>
                  <span className="shrink-0 tabular-nums">
                    {formatRupiah(item.amount)}
                    <span className="text-muted-foreground"> · {share}%</span>
                  </span>
                </div>
                <span className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${width}%` }}
                  />
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}
