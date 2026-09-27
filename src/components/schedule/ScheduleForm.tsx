import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { useSchedule } from '@/context/ScheduleContext'
import {
  ACTIVITY_META,
  findConflicts,
  formatNameList,
  isDayValue,
  normalizeTime,
  validateDraft,
} from '@/lib/schedule'
import { cn } from '@/lib/utils'
import {
  ACTIVITY_TYPES,
  DAYS,
  type ActivityType,
  type Schedule,
  type ScheduleDraft,
} from '@/types/schedule'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

interface FormState {
  name: string
  courseName: string
  type: ActivityType
  day: string
  startTime: string
  endTime: string
  room: string
  lecturer: string
  notes: string
}

function toForm(initial: Schedule | null, defaultType: ActivityType): FormState {
  if (!initial) {
    return {
      name: '',
      courseName: '',
      type: defaultType,
      day: '',
      startTime: '',
      endTime: '',
      room: '',
      lecturer: '',
      notes: '',
    }
  }
  return {
    name: initial.name,
    courseName: initial.courseName,
    type: initial.type,
    day: String(initial.day),
    startTime: initial.startTime,
    endTime: initial.endTime,
    room: initial.room,
    lecturer: initial.lecturer,
    notes: initial.notes,
  }
}

export function ScheduleForm({
  initial = null,
  defaultType = 'kuliah',
  onCancel,
  onSaved,
}: {
  initial?: Schedule | null
  defaultType?: ActivityType
  onCancel?: () => void
  onSaved?: (schedule: Schedule) => void
}) {
  const { schedules, saveSchedule } = useSchedule()
  const [form, setForm] = useState<FormState>(() => toForm(initial, defaultType))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [conflicts, setConflicts] = useState<Schedule[]>([])

  const isPraktikum = form.type === 'praktikum'
  const nameLabel = isPraktikum ? 'Nama Praktikum' : 'Nama Mata Kuliah'
  const roomLabel = isPraktikum ? 'Laboratorium/Ruangan' : 'Ruangan'
  const lecturerLabel = isPraktikum ? 'Dosen/Asisten' : 'Dosen'

  const conflictNames = useMemo(
    () => formatNameList(conflicts.map((item) => item.name)),
    [conflicts],
  )

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: '' }))
    setConflicts([])
  }

  function buildDraft(): ScheduleDraft | null {
    const nextErrors = validateDraft(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0 || !isDayValue(Number(form.day))) return null
    return {
      id: initial?.id,
      name: form.name,
      courseName: form.courseName,
      type: form.type,
      day: Number(form.day) as ScheduleDraft['day'],
      startTime: normalizeTime(form.startTime),
      endTime: normalizeTime(form.endTime),
      room: form.room,
      lecturer: form.lecturer,
      notes: form.notes,
    }
  }

  function commit(draft: ScheduleDraft) {
    const saved = saveSchedule(draft)
    toast.success(initial ? 'Perubahan disimpan.' : 'Jadwal tersimpan.')
    onSaved?.(saved)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const draft = buildDraft()
    if (!draft) return
    const found = findConflicts(schedules, draft)
    if (found.length > 0) {
      setConflicts(found)
      return
    }
    commit(draft)
  }

  function saveAnyway() {
    const draft = buildDraft()
    if (!draft) return
    commit(draft)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={nameLabel} error={errors.name} className="sm:col-span-2" required>
          <Input
            value={form.name}
            onChange={(event) => update('name', event.target.value)}
            placeholder={isPraktikum ? 'Contoh: Praktikum Jaringan' : 'Contoh: Sistem Multimedia'}
            aria-invalid={Boolean(errors.name)}
            className="h-11"
          />
        </Field>

        {isPraktikum ? (
          <Field label="Mata Kuliah" className="sm:col-span-2">
            <Input
              value={form.courseName}
              onChange={(event) => update('courseName', event.target.value)}
              placeholder="Mata kuliah yang terkait"
              className="h-11"
            />
          </Field>
        ) : null}

        <Field label="Jenis Kegiatan" required>
          <Select value={form.type} onValueChange={(value) => update('type', value as ActivityType)}>
            <SelectTrigger className="h-11 w-full">
              <SelectValue placeholder="Pilih jenis" />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {ACTIVITY_META[type].emoji} {ACTIVITY_META[type].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Hari" error={errors.day} required>
          <Select value={form.day || undefined} onValueChange={(value) => update('day', value)}>
            <SelectTrigger className="h-11 w-full" aria-invalid={Boolean(errors.day)}>
              <SelectValue placeholder="Pilih hari" />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((day) => (
                <SelectItem key={day.value} value={String(day.value)}>
                  {day.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Jam Mulai" error={errors.startTime} required>
          <Input
            type="time"
            value={form.startTime}
            onChange={(event) => update('startTime', event.target.value)}
            aria-invalid={Boolean(errors.startTime)}
            className="h-11"
          />
        </Field>

        <Field label="Jam Selesai" error={errors.endTime} required>
          <Input
            type="time"
            value={form.endTime}
            onChange={(event) => update('endTime', event.target.value)}
            aria-invalid={Boolean(errors.endTime)}
            className="h-11"
          />
        </Field>

        <Field label={roomLabel}>
          <Input
            value={form.room}
            onChange={(event) => update('room', event.target.value)}
            placeholder={isPraktikum ? 'Contoh: Lab Jaringan' : 'Contoh: GS4A'}
            className="h-11"
          />
        </Field>

        <Field label={lecturerLabel}>
          <Input
            value={form.lecturer}
            onChange={(event) => update('lecturer', event.target.value)}
            placeholder="Opsional"
            className="h-11"
          />
        </Field>

        <Field label="Catatan" className="sm:col-span-2">
          <Textarea
            value={form.notes}
            onChange={(event) => update('notes', event.target.value)}
            placeholder="Opsional. Contoh: bawa laptop, kuis pembuka."
            className="min-h-24"
          />
        </Field>
      </div>

      {conflicts.length > 0 ? (
        <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4">
          <p className="font-medium text-amber-100">⚠️ Jadwal Bertabrakan</p>
          <p className="mt-1 text-sm leading-relaxed text-amber-50/90">
            Jadwal ini bertabrakan dengan {conflictNames}.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setConflicts([])}>
              Batal
            </Button>
            <Button type="button" onClick={saveAnyway}>
              Simpan Tetap
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <Button type="button" variant="outline" className="h-11" onClick={onCancel}>
            Batal
          </Button>
        ) : null}
        <Button type="submit" className="h-11 px-5 shadow-lg shadow-blue-950/40">
          {initial ? 'Simpan Perubahan' : 'Simpan'}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  error,
  required,
  className,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label>
        {label}
        {required ? <span className="text-rose-300"> *</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  )
}
