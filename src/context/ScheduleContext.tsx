import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { createContext, useContext } from 'react'
import { createId } from '@/lib/schedule'
import {
  loadInitialSchedules,
  localStorageRepository,
  mergeSchedules,
  type ScheduleRepository,
} from '@/lib/storage'
import type { AppSettings, Schedule, ScheduleDraft } from '@/types/schedule'

interface ScheduleContextValue {
  schedules: Schedule[]
  settings: AppSettings
  now: Date
  saveSchedule: (draft: ScheduleDraft) => Schedule
  deleteSchedule: (id: string) => void
  updateSettings: (patch: Partial<AppSettings>) => void
  replaceSchedules: (schedules: Schedule[], settings?: AppSettings) => void
  importSchedules: (incoming: Schedule[]) => number
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null)

function toSchedule(draft: ScheduleDraft, existing?: Schedule): Schedule {
  const timestamp = new Date().toISOString()
  return {
    id: existing?.id ?? draft.id ?? createId(),
    name: draft.name.trim(),
    courseName: draft.type === 'praktikum' ? draft.courseName.trim() : '',
    type: draft.type,
    day: draft.day,
    startTime: draft.startTime,
    endTime: draft.endTime,
    room: draft.room.trim(),
    lecturer: draft.lecturer.trim(),
    notes: draft.notes.trim(),
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
}

export function ScheduleProvider({
  children,
  repository = localStorageRepository,
}: {
  children: ReactNode
  repository?: ScheduleRepository
}) {
  const [schedules, setSchedules] = useState<Schedule[]>(() => loadInitialSchedules(repository))
  const [settings, setSettings] = useState<AppSettings>(() => repository.loadSettings())
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    repository.saveSchedules(schedules)
  }, [repository, schedules])

  useEffect(() => {
    repository.saveSettings(settings)
  }, [repository, settings])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const saveSchedule = useCallback((draft: ScheduleDraft) => {
    const existing = draft.id ? schedules.find((item) => item.id === draft.id) : undefined
    const saved = toSchedule(draft, existing)
    setSchedules((current) => {
      if (current.some((item) => item.id === saved.id)) {
        return current.map((item) => (item.id === saved.id ? saved : item))
      }
      return [...current, saved]
    })
    return saved
  }, [schedules])

  const deleteSchedule = useCallback((id: string) => {
    setSchedules((current) => current.filter((item) => item.id !== id))
  }, [])

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((current) => ({ ...current, ...patch }))
  }, [])

  const replaceSchedules = useCallback((next: Schedule[], nextSettings?: AppSettings) => {
    setSchedules(next)
    if (nextSettings) setSettings(nextSettings)
  }, [])

  const importSchedules = useCallback((incoming: Schedule[]) => {
    const merged = mergeSchedules(schedules, incoming)
    setSchedules(merged.schedules)
    return merged.added
  }, [schedules])

  const value = useMemo(
    () => ({
      schedules,
      settings,
      now,
      saveSchedule,
      deleteSchedule,
      updateSettings,
      replaceSchedules,
      importSchedules,
    }),
    [
      schedules,
      settings,
      now,
      saveSchedule,
      deleteSchedule,
      updateSettings,
      replaceSchedules,
      importSchedules,
    ],
  )

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>
}

export function useSchedule(): ScheduleContextValue {
  const context = useContext(ScheduleContext)
  if (!context) {
    throw new Error('useSchedule harus dipakai di dalam ScheduleProvider')
  }
  return context
}
