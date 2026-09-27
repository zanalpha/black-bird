import { Bell } from 'lucide-react'
import { toast } from 'sonner'
import { useSchedule } from '@/context/ScheduleContext'
import { browserNotificationsSupported, requestBrowserPermission } from '@/lib/notify'
import { ACTIVITY_META, reminderPhrase } from '@/lib/schedule'
import type { Schedule } from '@/types/schedule'
import { Button } from '@/components/ui/button'

export function showReminderToast(schedule: Schedule, minutes: number): void {
  const meta = ACTIVITY_META[schedule.type]
  const phrase = reminderPhrase(minutes)
  toast.custom(
    () => (
      <div className="w-[min(100vw-2rem,22rem)] rounded-2xl border border-blue-400/30 bg-[#121a2b] p-4 text-slate-100 shadow-2xl shadow-black/40">
        <p className="text-sm font-semibold">🔔 Pengingat Kuliah</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">
          {phrase} lagi kamu memiliki {meta.noun} {schedule.name}.
        </p>
        <p className="mt-3 text-sm">📍 {schedule.room || '-'}</p>
        <p className="text-sm tabular-nums">
          ⏰ {schedule.startTime} - {schedule.endTime}
        </p>
      </div>
    ),
    { duration: 14000, unstyled: true },
  )
}

export function NotificationPrompt() {
  const { settings, updateSettings } = useSchedule()
  if (settings.permissionPromptDismissed) return null
  const supported = browserNotificationsSupported()

  async function enable() {
    updateSettings({ notificationsEnabled: true, permissionPromptDismissed: true })
    const result = await requestBrowserPermission()
    if (result === 'granted') {
      toast.success('Pengingat aktif. Browser akan menampilkan notifikasi selama izin diberikan.')
      return
    }
    if (result === 'denied') {
      toast.message('Izin browser ditolak. Pengingat tetap tampil di dalam website selama halaman terbuka.')
      return
    }
    toast.message('Pengingat di dalam website sudah aktif.')
  }

  return (
    <section className="mb-5 rounded-2xl border border-blue-400/25 bg-blue-500/10 p-4 shadow-[0_10px_30px_-20px_rgba(37,99,235,0.8)]">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-500/20 text-blue-100">
          <Bell className="size-4" />
        </div>
        <div>
          <h2 className="font-semibold">Apakah kamu ingin mengaktifkan pengingat jadwal kuliah?</h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">
            {supported
              ? 'Notifikasi browser hanya muncul jika izin diberikan dan halaman ini tetap terbuka, atau browser mengizinkan website berjalan di latar belakang.'
              : 'Browser ini tidak mendukung notifikasi sistem. Pengingat akan tampil di dalam website.'}{' '}
            Jika tab ditutup, pengingat tidak bisa dikirim.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" className="h-10" onClick={() => void enable()}>
              🔔 Aktifkan Notifikasi
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => updateSettings({ permissionPromptDismissed: true })}
            >
              Nanti Saja
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
