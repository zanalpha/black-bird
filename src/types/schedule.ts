export const ACTIVITY_TYPES = [
  'kuliah',
  'praktikum',
  'ujian',
  'seminar',
  'lainnya',
] as const

export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export const DAYS = [
  { value: 1, label: 'Senin', short: 'Sen' },
  { value: 2, label: 'Selasa', short: 'Sel' },
  { value: 3, label: 'Rabu', short: 'Rab' },
  { value: 4, label: 'Kamis', short: 'Kam' },
  { value: 5, label: 'Jumat', short: 'Jum' },
  { value: 6, label: 'Sabtu', short: 'Sab' },
  { value: 0, label: 'Minggu', short: 'Min' },
] as const

export type DayValue = (typeof DAYS)[number]['value']

export const WEEKDAY_NAMES = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const

export const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const

export const REMINDER_OPTIONS = [5, 10, 15, 30, 60] as const

export type ReminderMinutes = (typeof REMINDER_OPTIONS)[number]

export type ScheduleStatus = 'upcoming' | 'ongoing' | 'completed'

export type TypeFilter = 'semua' | ActivityType

export type DayFilter = 'semua' | DayValue

export interface Schedule {
  id: string
  name: string
  courseName: string
  type: ActivityType
  day: DayValue
  startTime: string
  endTime: string
  room: string
  lecturer: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface AppSettings {
  notificationsEnabled: boolean
  reminderMinutes: ReminderMinutes
  soundEnabled: boolean
  permissionPromptDismissed: boolean
}

export interface ScheduleDraft {
  id?: string
  name: string
  courseName: string
  type: ActivityType
  day: DayValue
  startTime: string
  endTime: string
  room: string
  lecturer: string
  notes: string
}

export interface BackupFile {
  version: 1
  app: 'jadwal-kuliah-dzaky'
  exportedAt: string
  schedules: Schedule[]
  settings: AppSettings
}

export const STORAGE_KEYS = {
  schedules: 'jadwal-kuliah-dzaky:schedules',
  settings: 'jadwal-kuliah-dzaky:settings',
  remindersFired: 'jadwal-kuliah-dzaky:reminders-fired',
  calendarView: 'jadwal-kuliah-dzaky:calendar-view',
} as const

export const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: false,
  reminderMinutes: 15,
  soundEnabled: true,
  permissionPromptDismissed: false,
}

export type PageId = 'dashboard' | 'schedule' | 'add' | 'praktikum' | 'settings'

export type CalendarView = 'list' | 'week'
