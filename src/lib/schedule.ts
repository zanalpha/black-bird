import {
  ACTIVITY_TYPES,
  DAYS,
  MONTH_NAMES,
  WEEKDAY_NAMES,
  type ActivityType,
  type DayFilter,
  type DayValue,
  type Schedule,
  type ScheduleDraft,
  type ScheduleStatus,
  type TypeFilter,
} from '@/types/schedule'

export interface ActivityMeta {
  label: string
  emoji: string
  noun: string
  border: string
  chip: string
}

export const ACTIVITY_META: Record<ActivityType, ActivityMeta> = {
  kuliah: {
    label: 'Kuliah',
    emoji: '📚',
    noun: 'kuliah',
    border: 'border-l-blue-400',
    chip: 'bg-blue-500/15 text-blue-100',
  },
  praktikum: {
    label: 'Praktikum',
    emoji: '🧪',
    noun: 'praktikum',
    border: 'border-l-indigo-400',
    chip: 'bg-indigo-500/15 text-indigo-100',
  },
  ujian: {
    label: 'Ujian',
    emoji: '📝',
    noun: 'ujian',
    border: 'border-l-amber-300',
    chip: 'bg-amber-400/15 text-amber-100',
  },
  seminar: {
    label: 'Seminar',
    emoji: '🎤',
    noun: 'seminar',
    border: 'border-l-cyan-300',
    chip: 'bg-cyan-400/15 text-cyan-100',
  },
  lainnya: {
    label: 'Lainnya',
    emoji: '📌',
    noun: 'kegiatan',
    border: 'border-l-slate-300',
    chip: 'bg-slate-400/15 text-slate-100',
  },
}

const TYPE_SET = new Set<string>(ACTIVITY_TYPES)
const DAY_SET = new Set<number>(DAYS.map((day) => day.value))

export function isActivityType(value: string): value is ActivityType {
  return TYPE_SET.has(value)
}

export function isDayValue(value: number): value is DayValue {
  return DAY_SET.has(value)
}

export function dayLabel(day: DayValue): string {
  return DAYS.find((item) => item.value === day)?.label ?? 'Hari'
}

export function pad(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatClock(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function formatLongDate(date: Date): string {
  return `${WEEKDAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
}

export function formatStamp(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function normalizeTime(value: string): string {
  const match = /^(\d{2}):(\d{2})/.exec(value)
  return match ? `${match[1]}:${match[2]}` : value
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export interface WeekOccurrence {
  start: Date
  end: Date
}

export function occurrenceThisWeek(schedule: Schedule, now: Date): WeekOccurrence {
  const current = new Date(now)
  const weekday = current.getDay()
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday
  const start = new Date(current)
  start.setHours(0, 0, 0, 0)
  start.setDate(current.getDate() + mondayOffset)
  const dayOffset = schedule.day === 0 ? 6 : schedule.day - 1
  start.setDate(start.getDate() + dayOffset)
  const [startHour, startMinute] = schedule.startTime.split(':').map(Number)
  const [endHour, endMinute] = schedule.endTime.split(':').map(Number)
  start.setHours(startHour || 0, startMinute || 0, 0, 0)
  const end = new Date(start)
  end.setHours(endHour || 0, endMinute || 0, 0, 0)
  return { start, end }
}

export function statusOf(schedule: Schedule, now: Date): ScheduleStatus {
  const { start, end } = occurrenceThisWeek(schedule, now)
  if (now < start) return 'upcoming'
  if (now < end) return 'ongoing'
  return 'completed'
}

export function nextFutureStart(schedule: Schedule, now: Date): Date {
  const { start } = occurrenceThisWeek(schedule, now)
  if (start > now) return start
  const next = new Date(start)
  next.setDate(next.getDate() + 7)
  return next
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export interface StatusPresentation {
  status: ScheduleStatus
  label: string
  badge: string
  dot: string
}

export function statusPresentation(schedule: Schedule, now: Date): StatusPresentation {
  const status = statusOf(schedule, now)
  const { start } = occurrenceThisWeek(schedule, now)
  if (status === 'ongoing') {
    return {
      status,
      label: 'Sedang Berlangsung',
      badge: 'bg-rose-500/15 text-rose-100',
      dot: 'bg-rose-400',
    }
  }
  if (status === 'completed') {
    return {
      status,
      label: 'Selesai',
      badge: 'bg-emerald-500/12 text-emerald-100',
      dot: 'bg-emerald-300',
    }
  }
  if (isSameLocalDay(start, now)) {
    return {
      status,
      label: 'Segera Dimulai',
      badge: 'bg-amber-400/15 text-amber-100',
      dot: 'bg-amber-300',
    }
  }
  return {
    status,
    label: 'Akan Datang',
    badge: 'bg-blue-500/15 text-blue-100',
    dot: 'bg-blue-300',
  }
}

export function schedulesForDay(schedules: Schedule[], day: DayValue): Schedule[] {
  return schedules
    .filter((schedule) => schedule.day === day)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))
}

export function getOngoing(schedules: Schedule[], now: Date): Schedule | null {
  return (
    schedules
      .filter((schedule) => statusOf(schedule, now) === 'ongoing')
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0] ?? null
  )
}

export function getNextSchedule(
  schedules: Schedule[],
  now: Date,
): { schedule: Schedule; start: Date } | null {
  let best: { schedule: Schedule; start: Date } | null = null
  for (const schedule of schedules) {
    const start = nextFutureStart(schedule, now)
    if (!best || start < best.start) best = { schedule, start }
  }
  return best
}

export function todayUpcoming(schedules: Schedule[], now: Date): Schedule | null {
  return (
    schedulesForDay(schedules, now.getDay() as DayValue)
      .filter((schedule) => statusOf(schedule, now) === 'upcoming')
      .sort((a, b) => a.startTime.localeCompare(b.startTime))[0] ?? null
  )
}

export interface CountdownParts {
  days: number
  hours: number
  minutes: number
  seconds: number
}

export function countdownParts(target: Date, now: Date): CountdownParts {
  const total = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000))
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  }
}

export function rangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA < endB && startB < endA
}

export function findConflicts(
  schedules: Schedule[],
  draft: Pick<ScheduleDraft, 'id' | 'day' | 'startTime' | 'endTime'>,
): Schedule[] {
  return schedules.filter(
    (schedule) =>
      schedule.id !== draft.id &&
      schedule.day === draft.day &&
      rangesOverlap(schedule.startTime, schedule.endTime, draft.startTime, draft.endTime),
  )
}

export function formatNameList(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length === 2) return `${names[0]} dan ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, dan ${names[names.length - 1]}`
}

export function validateDraft(input: {
  name: string
  day: string
  startTime: string
  endTime: string
  type: ActivityType
}): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!input.name.trim()) {
    errors.name =
      input.type === 'praktikum'
        ? 'Nama praktikum wajib diisi.'
        : 'Nama mata kuliah wajib diisi.'
  }
  if (!/^[0-6]$/.test(input.day) || !isDayValue(Number(input.day))) {
    errors.day = 'Hari wajib dipilih.'
  }
  if (!input.startTime) {
    errors.startTime = 'Jam mulai wajib diisi.'
  }
  if (!input.endTime) {
    errors.endTime = 'Jam selesai wajib diisi.'
  }
  if (
    input.startTime &&
    input.endTime &&
    normalizeTime(input.endTime) <= normalizeTime(input.startTime)
  ) {
    errors.endTime = 'Jam selesai harus lebih lambat dari jam mulai.'
  }
  return errors
}

export function matchesQuery(schedule: Schedule, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  const meta = ACTIVITY_META[schedule.type]
  const haystack = [
    schedule.name,
    schedule.courseName,
    schedule.room,
    schedule.lecturer,
    schedule.notes,
    meta.label,
    schedule.type,
    dayLabel(schedule.day),
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(needle)
}

export function filterSchedules(
  schedules: Schedule[],
  options: { query: string; type: TypeFilter; day: DayFilter },
): Schedule[] {
  return schedules.filter((schedule) => {
    if (options.type !== 'semua' && schedule.type !== options.type) return false
    if (options.day !== 'semua' && schedule.day !== options.day) return false
    return matchesQuery(schedule, options.query)
  })
}

export function displayText(value: string): string {
  return value.trim() ? value.trim() : '-'
}

export function reminderPhrase(minutes: number): string {
  return minutes >= 60 ? '1 jam' : `${minutes} menit`
}

export function reminderKey(scheduleId: string, start: Date): string {
  return `${scheduleId}|${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T${pad(start.getHours())}:${pad(start.getMinutes())}`
}
