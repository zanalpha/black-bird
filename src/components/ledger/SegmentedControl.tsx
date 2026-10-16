import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: ReactNode }[]
  onChange: (value: T) => void
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid gap-1 rounded-xl bg-muted p-1"
      style={{
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
      }}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-center text-sm leading-tight font-medium transition-colors',
              active
                ? 'bg-foreground text-background'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
