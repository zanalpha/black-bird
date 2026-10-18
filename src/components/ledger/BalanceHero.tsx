import { formatRupiah } from '@/lib/money'
import { cn } from '@/lib/utils'

export function BalanceHero({
  label,
  amount,
  detail,
  income,
  expense,
  overall,
}: {
  label: string
  amount: number
  detail: string
  income: number
  expense: number
  overall?: number
}) {
  const negative = amount < 0

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[1.75rem] px-5 py-6 sm:px-8 sm:py-8',
        negative
          ? 'bg-[#3f1515] text-[#fff6f6]'
          : 'bg-primary text-primary-foreground',
      )}
    >
      <div
        className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-white/10"
        aria-hidden="true"
      />
      <p className="text-sm font-medium tracking-wide opacity-80">{label}</p>
      <p className="mt-2 text-[2.7rem] leading-none font-semibold tracking-tight break-words tabular-nums sm:text-6xl lg:text-7xl">
        {formatRupiah(amount)}
      </p>
      <p className="mt-3 max-w-xl text-sm opacity-80">{detail}</p>
      <dl className="relative mt-6 grid grid-cols-2 gap-2 sm:max-w-2xl sm:grid-cols-3">
        <MiniStat label="Pemasukan" value={formatRupiah(income)} negative={negative} />
        <MiniStat label="Pengeluaran" value={formatRupiah(expense)} negative={negative} />
        {overall === undefined ? null : (
          <MiniStat
            className="col-span-2 sm:col-span-1"
            label="Saldo keseluruhan"
            value={formatRupiah(overall)}
            negative={negative}
          />
        )}
      </dl>
    </section>
  )
}

function MiniStat({
  label,
  value,
  negative,
  className,
}: {
  label: string
  value: string
  negative: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl px-3 py-3',
        negative ? 'bg-white/15' : 'bg-primary-foreground/15',
        className,
      )}
    >
      <dt className="text-xs opacity-75">{label}</dt>
      <dd className="mt-1 text-sm font-semibold tracking-tight break-words tabular-nums sm:text-base">
        {value}
      </dd>
    </div>
  )
}
