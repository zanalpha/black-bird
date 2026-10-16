import { useState } from 'react'
import { EmptyState } from '@/components/ledger/EmptyState'
import { MonthlyChart } from '@/components/ledger/MonthlyChart'
import { MonthSwitcher } from '@/components/ledger/MonthSwitcher'
import { StatCard } from '@/components/ledger/StatCard'
import { TransactionList } from '@/components/ledger/TransactionList'
import { useLedgerUi } from '@/context/LedgerUiContext'
import { usePreferences } from '@/context/PreferencesContext'
import { useFinance } from '@/context/FinanceContext'
import {
  currentMonthKey,
  formatMonthLabel,
  shiftMonth,
} from '@/lib/dates'
import { totals, transactionsInMonth } from '@/lib/finance'
import { formatRupiah } from '@/lib/money'

function countLabel(count: number) {
  return count === 0 ? 'Belum ada transaksi' : `${count} transaksi`
}

export function DashboardPage() {
  const { transactions } = useFinance()
  const { preferences } = usePreferences()
  const { openCreate } = useLedgerUi()
  const [month, setMonth] = useState(currentMonthKey)
  const monthItems = transactionsInMonth(transactions, month)
  const summary = totals(monthItems)
  const previous = totals(
    transactionsInMonth(transactions, shiftMonth(month, -1)),
  )
  const recent = monthItems.slice(0, 5)

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dasbor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan {formatMonthLabel(month)}
          </p>
        </div>
        <MonthSwitcher value={month} onChange={setMonth} />
      </header>

      {transactions.length === 0 ? (
        <EmptyState
          title="Buku kas masih kosong"
          body="Catat pemasukan atau pengeluaran pertama. Data tersimpan otomatis di perangkat ini."
          actionLabel="Catat transaksi"
          onAction={openCreate}
        />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              label="Pemasukan"
              value={formatRupiah(summary.income)}
              detail={countLabel(
                monthItems.filter((tx) => tx.type === 'pemasukan').length,
              )}
            />
            <StatCard
              label="Pengeluaran"
              value={formatRupiah(summary.expense)}
              detail={
                summary.income > 0
                  ? `${Math.round((summary.expense / summary.income) * 100)}% dari pemasukan`
                  : countLabel(
                      monthItems.filter((tx) => tx.type === 'pengeluaran').length,
                    )
              }
            />
            <StatCard
              className="sm:col-span-2 xl:col-span-1"
              tone="inverse"
              label="Saldo"
              value={formatRupiah(summary.balance)}
              detail={countLabel(summary.count)}
            />
          </section>

          {previous.count > 0 ? (
            <p className="text-sm text-muted-foreground">
              {balanceDelta(
                summary.balance,
                previous.balance,
                formatMonthLabel(shiftMonth(month, -1)),
              )}
            </p>
          ) : null}

          <MonthlyChart
            transactions={transactions}
            month={month}
            onSelect={setMonth}
          />

          <section className="grid gap-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">Transaksi bulan ini</h2>
              <a
                href="#/transaksi"
                className="text-sm font-medium underline-offset-4 hover:underline"
              >
                Lihat semua
              </a>
            </div>
            <TransactionList
              items={recent}
              view={preferences.view}
              empty={
                <p className="rounded-2xl bg-card px-4 py-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
                  Belum ada transaksi di {formatMonthLabel(month)}.
                </p>
              }
            />
          </section>
        </>
      )}
    </div>
  )
}

function balanceDelta(current: number, previous: number, previousLabel: string) {
  const diff = current - previous
  if (diff === 0) return `Saldo sama dengan ${previousLabel}.`
  const direction = diff > 0 ? 'lebih tinggi' : 'lebih rendah'
  return `Saldo ${formatRupiah(Math.abs(diff))} ${direction} dari ${previousLabel}.`
}
