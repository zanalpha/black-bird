import type { ReactNode } from 'react'
import { Clock3, MapPin, Pencil, Trash2 } from 'lucide-react'
import { ACTIVITY_META, dayLabel, displayText } from '@/lib/schedule'
import { useSchedule } from '@/context/ScheduleContext'
import type { Schedule } from '@/types/schedule'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/schedule/StatusBadge'

export function ScheduleDetail({
  schedule,
  onEdit,
  onDelete,
}: {
  schedule: Schedule
  onEdit: () => void
  onDelete: () => void
}) {
  const { now } = useSchedule()
  const meta = ACTIVITY_META[schedule.type]

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight">{schedule.name}</h2>
          <StatusBadge schedule={schedule} now={now} />
        </div>
        <p>
          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${meta.chip}`}>
            {meta.emoji} {meta.label}
          </span>
        </p>
      </div>

      <dl className="grid gap-3 text-sm">
        {schedule.courseName ? (
          <DetailRow label="Mata Kuliah" value={schedule.courseName} />
        ) : null}
        <DetailRow label="Hari" value={dayLabel(schedule.day)} />
        <DetailRow
          label="Jam"
          value={
            <span className="inline-flex items-center gap-2 tabular-nums">
              <Clock3 className="size-3.5 text-blue-300" />
              {schedule.startTime} - {schedule.endTime}
            </span>
          }
        />
        <DetailRow
          label="Ruangan"
          value={
            <span className="inline-flex items-center gap-2">
              <MapPin className="size-3.5 text-indigo-300" />
              {displayText(schedule.room)}
            </span>
          }
        />
        <DetailRow label={schedule.type === 'praktikum' ? 'Dosen/Asisten' : 'Dosen'} value={displayText(schedule.lecturer)} />
        <DetailRow label="Catatan" value={displayText(schedule.notes)} />
      </dl>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onEdit}>
          <Pencil />
          Edit
        </Button>
        <Button type="button" variant="destructive" onClick={onDelete}>
          <Trash2 />
          Hapus
        </Button>
      </div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-1 text-slate-100">{value}</dd>
    </div>
  )
}
