import { statusPresentation } from '@/lib/schedule'
import { cn } from '@/lib/utils'
import type { Schedule } from '@/types/schedule'

export function StatusBadge({ schedule, now }: { schedule: Schedule; now: Date }) {
  const status = statusPresentation(schedule, now)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium',
        status.badge,
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          status.dot,
          status.status === 'ongoing' && 'animate-pulse',
        )}
      />
      {status.label}
    </span>
  )
}
