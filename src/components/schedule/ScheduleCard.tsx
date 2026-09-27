import { Clock3, MapPin, Pencil, Trash2 } from 'lucide-react'
import { ACTIVITY_META, displayText } from '@/lib/schedule'
import { cn } from '@/lib/utils'
import { useSchedule } from '@/context/ScheduleContext'
import { useUi } from '@/context/UiContext'
import type { Schedule } from '@/types/schedule'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/schedule/StatusBadge'

export function ScheduleCard({
  schedule,
  compact = false,
}: {
  schedule: Schedule
  compact?: boolean
}) {
  const { now } = useSchedule()
  const { openDetail, openEdit, requestDelete } = useUi()
  const meta = ACTIVITY_META[schedule.type]

  return (
    <article
      className={cn(
        'rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-400/35 hover:bg-white/[0.05]',
        'border-l-4',
        meta.border,
        compact ? 'p-3' : 'p-4',
      )}
    >
      <button
        type="button"
        onClick={() => openDetail(schedule.id)}
        className="w-full text-left"
      >
        <div className={cn('flex gap-3', compact ? 'flex-col items-start' : 'items-start justify-between')}>
          <div className="min-w-0">
            <p className={cn('font-semibold tracking-tight', compact ? 'text-sm' : 'text-base')}>
              {meta.emoji} {schedule.name}
            </p>
            {schedule.courseName ? (
              <p className="mt-1 text-xs text-slate-400">Mata kuliah: {schedule.courseName}</p>
            ) : null}
          </div>
          <StatusBadge schedule={schedule} now={now} />
        </div>
        <div className={cn('mt-3 space-y-1.5 text-sm text-slate-300', compact && 'text-xs')}>
          <p className="flex items-center gap-2">
            <Clock3 className="size-3.5 text-blue-300" />
            <span className="tabular-nums">
              {schedule.startTime} - {schedule.endTime}
            </span>
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="size-3.5 text-indigo-300" />
            <span>{displayText(schedule.room)}</span>
          </p>
          <p>
            <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs', meta.chip)}>
              {meta.emoji} {meta.label}
            </span>
          </p>
        </div>
      </button>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => openEdit(schedule.id)}
        >
          <Pencil />
          Edit
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="h-8"
          onClick={() => requestDelete(schedule.id)}
        >
          <Trash2 />
          Hapus
        </Button>
      </div>
    </article>
  )
}
