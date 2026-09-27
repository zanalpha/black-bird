import { schedulesForDay } from '@/lib/schedule'
import { cn } from '@/lib/utils'
import { useSchedule } from '@/context/ScheduleContext'
import { DAYS, type Schedule } from '@/types/schedule'
import { ScheduleCard } from '@/components/schedule/ScheduleCard'

export function WeeklyCalendar({ schedules }: { schedules: Schedule[] }) {
  const { now } = useSchedule()
  const today = now.getDay()

  return (
    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar lg:grid lg:grid-cols-7 lg:overflow-visible">
      {DAYS.map((day) => {
        const items = schedulesForDay(schedules, day.value)
        const isToday = day.value === today
        return (
          <section
            key={day.value}
            className={cn(
              'min-w-[240px] flex-1 rounded-2xl border bg-white/[0.03] p-3 lg:min-w-0',
              isToday ? 'border-blue-400/40 bg-blue-500/[0.07]' : 'border-white/10',
            )}
          >
            <header className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{day.label}</p>
                <p className="text-[11px] text-slate-500">{day.short}</p>
              </div>
              {isToday ? (
                <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-100">
                  Hari ini
                </span>
              ) : null}
            </header>
            {items.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 px-2 py-6 text-center text-xs text-slate-500">
                Tidak ada jadwal
              </p>
            ) : (
              <div className="space-y-3">
                {items.map((schedule) => (
                  <ScheduleCard key={schedule.id} schedule={schedule} compact />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
