import { formatMonthLabel, MONTHS } from '@/lib/dates'
import { yearSeries } from '@/lib/finance'
import { formatRupiah } from '@/lib/money'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/types/finance'

export function MonthlyChart({
  transactions,
  month,
  onSelect,
}: {
  transactions: Transaction[]
  month: string
  onSelect: (month: string) => void
}) {
  const year = Number(month.slice(0, 4))
  const points = yearSeries(transactions, year)
  const max = Math.max(...points.flatMap((point) => [point.income, point.expense]), 0)

  return (
    <section className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-semibold">Grafik {year}</h2>
          <p className="text-sm text-muted-foreground">
            Pemasukan dan pengeluaran tiap bulan. Pilih bulan untuk melihat ringkasannya.
          </p>
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm bg-primary" aria-hidden="true" />
            Pemasukan
          </span>
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm bg-expense" aria-hidden="true" />
            Pengeluaran
          </span>
        </div>
      </div>

      {max === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Belum ada transaksi pada tahun {year}.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto pb-1">
          <div
            role="group"
            aria-label={`Grafik tahun ${year}`}
            className="grid h-56 min-w-[40rem] grid-cols-12 gap-1"
          >
            {points.map((point, index) => {
              const active = point.key === month
              return (
                <button
                  key={point.key}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${MONTHS[index]} ${year}: pemasukan ${formatRupiah(point.income)}, pengeluaran ${formatRupiah(point.expense)}`}
                  onClick={() => onSelect(point.key)}
                  className={cn(
                    'flex h-full min-w-0 flex-col items-center justify-end gap-2 rounded-lg px-0.5 pt-2',
                    active ? 'bg-muted' : 'hover:bg-muted/70',
                  )}
                >
                  <span className="flex h-36 w-full items-end justify-center gap-1">
                    <Bar value={point.income} max={max} className="bg-primary" />
                    <Bar value={point.expense} max={max} className="bg-expense" />
                  </span>
                  <span className="text-[0.7rem] text-muted-foreground">
                    {point.label}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Nilai tertinggi di grafik {formatRupiah(max)}. Bulan dipilih:{' '}
            {formatMonthLabel(month)}.
          </p>
        </div>
      )}
    </section>
  )
}

function Bar({
  value,
  max,
  className,
}: {
  value: number
  max: number
  className: string
}) {
  const height = value <= 0 ? 0 : Math.max(4, Math.round((value / max) * 144))
  return (
    <span
      aria-hidden="true"
      className={cn('w-2 rounded-sm sm:w-3', className)}
      style={{ height }}
    />
  )
}
