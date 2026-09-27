import { schedulesForDay } from '@/lib/schedule'
import { DAYS, type Schedule } from '@/types/schedule'
import { ScheduleCard } from '@/components/schedule/ScheduleCard'

export function ScheduleList({
  schedules,
  showEmptyDays,
}: {
  schedules: Schedule[]
  showEmptyDays: boolean
}) {
  const groups = DAYS.map((day) => ({
    ...day,
    items: schedulesForDay(schedules, day.value),
  })).filter((group) => showEmptyDays || group.items.length > 0)

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center">
        <p className="font-medium">Tidak ada jadwal yang cocok.</p>
        <p className="mt-1 text-sm text-slate-400">Coba kata kunci atau filter yang lain.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.value} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-wide text-slate-200">{group.label}</h3>
            <span className="text-xs text-slate-500">
              {group.items.length === 0 ? 'Kosong' : `${group.items.length} jadwal`}
            </span>
          </div>
          {group.items.length === 0 ? (
            <p className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-slate-400">
              Tidak ada jadwal
            </p>
          ) : (
            <div className="grid gap-3">
              {group.items.map((schedule) => (
                <ScheduleCard key={schedule.id} schedule={schedule} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
