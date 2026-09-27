import { useState, type ReactNode } from 'react'
import { CalendarDays, List, Plus, Search } from 'lucide-react'
import { useSchedule } from '@/context/ScheduleContext'
import { useUi } from '@/context/UiContext'
import { ACTIVITY_META, filterSchedules } from '@/lib/schedule'
import { cn } from '@/lib/utils'
import {
  ACTIVITY_TYPES,
  DAYS,
  STORAGE_KEYS,
  type CalendarView,
  type DayFilter,
  type TypeFilter,
} from '@/types/schedule'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScheduleList } from '@/components/schedule/ScheduleList'
import { WeeklyCalendar } from '@/components/schedule/WeeklyCalendar'

function readView(): CalendarView {
  if (typeof window === 'undefined') return 'list'
  return localStorage.getItem(STORAGE_KEYS.calendarView) === 'week' ? 'week' : 'list'
}

const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: 'semua', label: 'Semua' },
  ...ACTIVITY_TYPES.map((type) => ({ id: type, label: ACTIVITY_META[type].label })),
]

export function SchedulePage() {
  const { schedules } = useSchedule()
  const { openCreate } = useUi()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<TypeFilter>('semua')
  const [day, setDay] = useState<DayFilter>('semua')
  const [view, setView] = useState<CalendarView>(readView)

  const filtered = filterSchedules(schedules, { query, type, day })
  const filtersActive = query.trim() !== '' || type !== 'semua' || day !== 'semua'

  function changeView(next: CalendarView) {
    setView(next)
    localStorage.setItem(STORAGE_KEYS.calendarView, next)
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-blue-300/80 uppercase">
            Schedule planner
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Jadwal Mingguan</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            Senin sampai Minggu. Setiap perubahan langsung tersimpan di perangkat ini.
          </p>
        </div>
        <Button className="h-11" onClick={() => openCreate('schedule')}>
          <Plus />
          Tambah Jadwal
        </Button>
      </header>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari mata kuliah..."
            aria-label="Cari mata kuliah"
            className="h-11 pl-9"
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {TYPE_FILTERS.map((item) => (
            <FilterChip
              key={item.id}
              active={type === item.id}
              onClick={() => setType(item.id)}
            >
              {item.label}
            </FilterChip>
          ))}
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar">
          <FilterChip active={day === 'semua'} onClick={() => setDay('semua')}>
            Semua Hari
          </FilterChip>
          {DAYS.map((item) => (
            <FilterChip
              key={item.value}
              active={day === item.value}
              onClick={() => setDay(item.value)}
            >
              {item.label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-400">
          {filtered.length} jadwal ditampilkan
        </p>
        <div className="inline-flex rounded-xl border border-white/10 bg-black/20 p-1">
          <ViewButton active={view === 'list'} onClick={() => changeView('list')}>
            <List className="size-4" />
            List View
          </ViewButton>
          <ViewButton active={view === 'week'} onClick={() => changeView('week')}>
            <CalendarDays className="size-4" />
            Weekly View
          </ViewButton>
        </div>
      </div>

      {view === 'list' ? (
        <ScheduleList schedules={filtered} showEmptyDays={!filtersActive} />
      ) : (
        <WeeklyCalendar schedules={filtered} />
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full px-3 py-1.5 text-sm transition duration-200',
        active
          ? 'bg-blue-500 text-white shadow-md shadow-blue-950/30'
          : 'bg-white/5 text-slate-300 hover:bg-white/10',
      )}
    >
      {children}
    </button>
  )
}

function ViewButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition duration-200',
        active ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white',
      )}
    >
      {children}
    </button>
  )
}
