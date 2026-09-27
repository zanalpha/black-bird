import { SEED_SCHEDULES } from '@/data/seed'
import { isActivityType, isDayValue } from '@/lib/schedule'
import {
  DEFAULT_SETTINGS,
  REMINDER_OPTIONS,
  STORAGE_KEYS,
  type AppSettings,
  type BackupFile,
  type ReminderMinutes,
  type Schedule,
} from '@/types/schedule'

/**
 * Lapisan penyimpanan. UI hanya bicara lewat fungsi ini.
 * Nanti bisa diganti adapter Supabase, Firebase, atau API MySQL
 * tanpa mengubah komponen halaman.
 */
export interface ScheduleRepository {
  loadSchedules(): Schedule[] | null
  saveSchedules(schedules: Schedule[]): void
  loadSettings(): AppSettings
  saveSettings(settings: AppSettings): void
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function normalizeSchedule(value: unknown): Schedule | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  if (typeof raw.name !== 'string' || !raw.name.trim()) return null
  if (typeof raw.type !== 'string' || !isActivityType(raw.type)) return null
  if (typeof raw.day !== 'number' || !isDayValue(raw.day)) return null
  if (typeof raw.startTime !== 'string' || typeof raw.endTime !== 'string') return null
  const start = raw.startTime.slice(0, 5)
  const end = raw.endTime.slice(0, 5)
  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end) || end <= start) return null
  const now = new Date().toISOString()
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : crypto.randomUUID(),
    name: raw.name.trim(),
    courseName: typeof raw.courseName === 'string' ? raw.courseName.trim() : '',
    type: raw.type,
    day: raw.day,
    startTime: start,
    endTime: end,
    room: typeof raw.room === 'string' ? raw.room.trim() : '',
    lecturer: typeof raw.lecturer === 'string' ? raw.lecturer.trim() : '',
    notes: typeof raw.notes === 'string' ? raw.notes.trim() : '',
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : now,
  }
}

function isReminderMinutes(value: unknown): value is ReminderMinutes {
  return typeof value === 'number' && REMINDER_OPTIONS.includes(value as ReminderMinutes)
}

export function normalizeSettings(value: unknown): AppSettings | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Partial<AppSettings>
  return {
    notificationsEnabled: Boolean(raw.notificationsEnabled),
    reminderMinutes: isReminderMinutes(raw.reminderMinutes) ? raw.reminderMinutes : 15,
    soundEnabled: raw.soundEnabled !== false,
    permissionPromptDismissed: Boolean(raw.permissionPromptDismissed),
  }
}

export function parseBackup(
  data: unknown,
): { schedules: Schedule[]; settings?: AppSettings; skipped: number } | null {
  const source = Array.isArray(data)
    ? data
    : data && typeof data === 'object' && Array.isArray((data as { schedules?: unknown }).schedules)
      ? (data as { schedules: unknown[] }).schedules
      : null
  if (!source) return null
  const schedules = source
    .map((item) => normalizeSchedule(item))
    .filter((item): item is Schedule => item !== null)
  if (source.length > 0 && schedules.length === 0) return null
  const settings =
    data && typeof data === 'object' && !Array.isArray(data)
      ? normalizeSettings((data as { settings?: unknown }).settings) ?? undefined
      : undefined
  return { schedules, settings, skipped: source.length - schedules.length }
}

export function buildBackup(schedules: Schedule[], settings: AppSettings): BackupFile {
  return {
    version: 1,
    app: 'jadwal-kuliah-dzaky',
    exportedAt: new Date().toISOString(),
    schedules,
    settings,
  }
}

export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)))
      } catch {
        reject(new Error('invalid-json'))
      }
    }
    reader.onerror = () => reject(new Error('read-failed'))
    reader.readAsText(file)
  })
}

export function signatureOf(schedule: Schedule): string {
  return [
    schedule.name,
    schedule.day,
    schedule.startTime,
    schedule.endTime,
    schedule.type,
    schedule.room,
  ]
    .join('|')
    .toLowerCase()
}

export function mergeSchedules(
  current: Schedule[],
  incoming: Schedule[],
): { schedules: Schedule[]; added: number } {
  const ids = new Set(current.map((item) => item.id))
  const signatures = new Set(current.map((item) => signatureOf(item)))
  const schedules = [...current]
  let added = 0
  for (const item of incoming) {
    const signature = signatureOf(item)
    if (signatures.has(signature)) continue
    const copy = { ...item }
    if (ids.has(copy.id)) copy.id = crypto.randomUUID()
    ids.add(copy.id)
    signatures.add(signature)
    schedules.push(copy)
    added += 1
  }
  return { schedules, added }
}

export const localStorageRepository: ScheduleRepository = {
  loadSchedules() {
    if (!canUseStorage()) return null
    const raw = localStorage.getItem(STORAGE_KEYS.schedules)
    if (raw === null) return null
    try {
      const parsed = JSON.parse(raw) as unknown
      if (!Array.isArray(parsed)) return []
      return parsed
        .map((item) => normalizeSchedule(item))
        .filter((item): item is Schedule => item !== null)
    } catch {
      return []
    }
  },
  saveSchedules(schedules) {
    if (!canUseStorage()) return
    localStorage.setItem(STORAGE_KEYS.schedules, JSON.stringify(schedules))
  },
  loadSettings() {
    if (!canUseStorage()) return { ...DEFAULT_SETTINGS }
    const raw = localStorage.getItem(STORAGE_KEYS.settings)
    if (!raw) return { ...DEFAULT_SETTINGS }
    try {
      return normalizeSettings(JSON.parse(raw)) ?? { ...DEFAULT_SETTINGS }
    } catch {
      return { ...DEFAULT_SETTINGS }
    }
  },
  saveSettings(settings) {
    if (!canUseStorage()) return
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings))
  },
}

export function loadInitialSchedules(repository: ScheduleRepository = localStorageRepository): Schedule[] {
  const stored = repository.loadSchedules()
  if (stored === null) {
    repository.saveSchedules(SEED_SCHEDULES)
    return SEED_SCHEDULES
  }
  return stored
}

interface FiredEntry {
  key: string
  at: number
}

const firedMemory = new Set<string>()

function readFired(): FiredEntry[] {
  if (!canUseStorage()) return []
  const raw = localStorage.getItem(STORAGE_KEYS.remindersFired)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as FiredEntry[]
    const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000
    return Array.isArray(parsed) ? parsed.filter((entry) => entry.at >= cutoff) : []
  } catch {
    return []
  }
}

export function claimReminder(key: string): boolean {
  if (firedMemory.has(key)) return false
  const entries = readFired()
  if (entries.some((entry) => entry.key === key)) {
    firedMemory.add(key)
    return false
  }
  firedMemory.add(key)
  entries.push({ key, at: Date.now() })
  if (canUseStorage()) {
    try {
      localStorage.setItem(STORAGE_KEYS.remindersFired, JSON.stringify(entries))
    } catch {
      // Pengingat tetap berjalan untuk sesi ini.
    }
  }
  return true
}
