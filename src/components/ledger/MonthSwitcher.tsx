import { useId } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { canShiftMonth, formatMonthLabel, shiftMonth } from '@/lib/dates'

export function MonthSwitcher({
  value,
  onChange,
}: {
  value: string
  onChange: (month: string) => void
}) {
  const inputId = useId()
  const previous = canShiftMonth(value, -1)
  const next = canShiftMonth(value, 1)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        aria-label="Bulan sebelumnya"
        disabled={!previous}
        onClick={() => onChange(shiftMonth(value, -1))}
      >
        <ChevronLeft />
      </Button>
      <label className="sr-only" htmlFor={inputId}>
        Pilih bulan
      </label>
      <input
        id={inputId}
        type="month"
        min="2000-01"
        max="2100-12"
        value={value}
        aria-label={formatMonthLabel(value)}
        onChange={(event) => {
          if (event.target.value) onChange(event.target.value)
        }}
        className="h-10 w-[9.25rem] max-w-full rounded-lg border border-input bg-transparent px-2 text-sm font-medium tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        aria-label="Bulan berikutnya"
        disabled={!next}
        onClick={() => onChange(shiftMonth(value, 1))}
      >
        <ChevronRight />
      </Button>
    </div>
  )
}
