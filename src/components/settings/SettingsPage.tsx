import { useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { Bell, Download, FileUp, Upload, Volume2 } from 'lucide-react'
import { toast } from 'sonner'
import { useSchedule } from '@/context/ScheduleContext'
import { exportSchedulePdf } from '@/lib/pdf'
import { playChime, requestBrowserPermission, showBrowserNotification, browserPermission } from '@/lib/notify'
import { formatStamp, reminderPhrase } from '@/lib/schedule'
import { buildBackup, downloadJson, parseBackup, readJsonFile } from '@/lib/storage'
import { REMINDER_OPTIONS, type AppSettings, type Schedule } from '@/types/schedule'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { showReminderToast } from '@/components/reminder/Notification'

export function SettingsPage() {
  const { schedules, settings, updateSettings, replaceSchedules, importSchedules } = useSchedule()
  const fileRef = useRef<HTMLInputElement>(null)
  const [fileMode, setFileMode] = useState<'restore' | 'merge' | null>(null)
  const [pendingRestore, setPendingRestore] = useState<{
    schedules: Schedule[]
    settings?: AppSettings
  } | null>(null)
  const permission = browserPermission()

  function downloadBackup() {
    downloadJson(
      `jadwal-kuliah-dzaky-backup-${formatStamp()}.json`,
      buildBackup(schedules, settings),
    )
    toast.success('Cadangan jadwal berhasil diunduh.')
  }

  function chooseFile(mode: 'restore' | 'merge') {
    setFileMode(mode)
    fileRef.current?.click()
  }

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    const mode = fileMode
    setFileMode(null)
    if (!file || !mode) return
    try {
      const parsed = parseBackup(await readJsonFile(file))
      if (!parsed) {
        toast.error('File tidak valid. Gunakan cadangan JSON dari website ini.')
        return
      }
      if (parsed.skipped > 0) {
        toast.message(`${parsed.skipped} baris dilewati karena datanya tidak lengkap.`)
      }
      if (mode === 'merge') {
        const added = importSchedules(parsed.schedules)
        toast.success(
          added === 0
            ? 'Tidak ada jadwal baru. Semua data sudah ada.'
            : `${added} jadwal berhasil digabungkan.`,
        )
        return
      }
      setPendingRestore({ schedules: parsed.schedules, settings: parsed.settings })
    } catch {
      toast.error('File tidak bisa dibaca.')
    }
  }

  function confirmRestore() {
    if (!pendingRestore) return
    replaceSchedules(pendingRestore.schedules)
    if (pendingRestore.settings) {
      updateSettings({
        reminderMinutes: pendingRestore.settings.reminderMinutes,
        soundEnabled: pendingRestore.settings.soundEnabled,
        notificationsEnabled: pendingRestore.settings.notificationsEnabled,
      })
    }
    toast.success('Data jadwal berhasil dipulihkan.')
    setPendingRestore(null)
  }

  async function toggleNotifications(checked: boolean) {
    if (!checked) {
      updateSettings({ notificationsEnabled: false })
      return
    }
    updateSettings({ notificationsEnabled: true, permissionPromptDismissed: true })
    const result = await requestBrowserPermission()
    if (result === 'denied') {
      toast.message('Izin browser ditolak. Pengingat tetap tampil di dalam website selama halaman terbuka.')
    } else if (result === 'unsupported') {
      toast.message('Browser ini tidak mendukung notifikasi. Pengingat tampil di dalam website.')
    }
  }

  function tryReminder() {
    const sample = schedules[0]
    if (!sample) {
      toast.message('Tambahkan jadwal dulu untuk mencoba pengingat.')
      return
    }
    showReminderToast(sample, settings.reminderMinutes)
    const sent = showBrowserNotification(
      'Pengingat Kuliah',
      `${reminderPhrase(settings.reminderMinutes)} lagi kamu memiliki ${sample.name}.`,
      `test-${sample.id}`,
    )
    if (settings.soundEnabled) void playChime()
    if (!sent) {
      toast.message('Contoh pengingat ditampilkan di dalam website.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <p className="text-xs font-medium tracking-[0.16em] text-blue-300/80 uppercase">Preferensi</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Pengaturan</h1>
        <p className="mt-1 text-sm text-slate-400">
          Pengingat, suara, dan cadangan data jadwal pribadi.
        </p>
      </header>

      <section className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <h2 className="text-base font-semibold">🔔 Notifikasi</h2>
        <SettingRow
          icon={<Bell className="size-4" />}
          title="Notifikasi"
          description="Aktifkan pengingat sebelum jadwal dimulai."
        >
          <Switch
            checked={settings.notificationsEnabled}
            onCheckedChange={(checked) => void toggleNotifications(checked)}
            aria-label="Notifikasi"
          />
        </SettingRow>
        <p className="text-xs leading-relaxed text-slate-400">
          Status izin browser: {permissionLabel(permission)}. Notifikasi browser bergantung pada izin
          browser dan apakah website tetap berjalan atau diizinkan berjalan di latar belakang. Jika
          tab ditutup atau browser memblokir notifikasi, pengingat hanya bisa tampil di dalam website
          selama halaman ini terbuka.
        </p>
        <div>
          <p className="mb-2 text-sm font-medium">Waktu pengingat</p>
          <div className="flex flex-wrap gap-2">
            {REMINDER_OPTIONS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => updateSettings({ reminderMinutes: minutes })}
                className={`rounded-full px-3 py-1.5 text-sm transition duration-200 ${
                  settings.reminderMinutes === minutes
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {minutes === 60 ? '1 jam' : `${minutes} menit`}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Default: 15 menit sebelum kuliah. Saat ini {reminderPhrase(settings.reminderMinutes)} sebelum jadwal.
          </p>
        </div>
        <SettingRow
          icon={<Volume2 className="size-4" />}
          title="Suara notifikasi"
          description="Bunyi singkat saat pengingat muncul."
        >
          <Switch
            checked={settings.soundEnabled}
            onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
            aria-label="Suara notifikasi"
          />
        </SettingRow>
        <Button type="button" variant="outline" onClick={tryReminder}>
          Coba Pengingat
        </Button>
      </section>

      <section className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <h2 className="text-base font-semibold">Cadangan data</h2>
        <p className="text-sm leading-relaxed text-slate-400">
          Semua jadwal tersimpan di localStorage browser ini. Tidak perlu database. Unduh cadangan
          JSON sebelum membersihkan data browser.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" className="h-11 justify-start" onClick={downloadBackup}>
            <Download />
            📥 Backup Jadwal
          </Button>
          <Button type="button" variant="outline" className="h-11 justify-start" onClick={() => chooseFile('restore')}>
            <Upload />
            📤 Restore Jadwal
          </Button>
          <Button type="button" variant="outline" className="h-11 justify-start" onClick={downloadBackup}>
            <Download />
            Export JSON
          </Button>
          <Button type="button" variant="outline" className="h-11 justify-start" onClick={() => chooseFile('merge')}>
            <FileUp />
            Import Jadwal
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 justify-start sm:col-span-2"
            onClick={() => exportSchedulePdf(schedules)}
          >
            <Download />
            Export ke PDF
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => void onFile(event)}
        />
      </section>

      <Dialog open={pendingRestore !== null} onOpenChange={(open) => !open && setPendingRestore(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pulihkan cadangan?</DialogTitle>
            <DialogDescription>
              Restore akan mengganti seluruh jadwal tersimpan dengan isi file ini.
              {pendingRestore?.settings
                ? ' Waktu pengingat dan suara di file juga ikut dipulihkan.'
                : ''}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingRestore(null)}>
              Batal
            </Button>
            <Button type="button" onClick={confirmRestore}>
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function permissionLabel(permission: NotificationPermission | 'unsupported'): string {
  if (permission === 'granted') return 'diizinkan'
  if (permission === 'denied') return 'ditolak'
  if (permission === 'unsupported') return 'tidak didukung browser'
  return 'belum dipilih'
}

function SettingRow({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-black/20 px-3 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-blue-300">{icon}</div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}
