import { useEffect } from 'react'
import { useSchedule } from '@/context/ScheduleContext'
import { playChime, showBrowserNotification } from '@/lib/notify'
import { nextFutureStart, reminderKey, reminderPhrase, ACTIVITY_META } from '@/lib/schedule'
import { claimReminder } from '@/lib/storage'
import { showReminderToast } from '@/components/reminder/Notification'

export function Reminder() {
  const { schedules, settings, now } = useSchedule()

  useEffect(() => {
    if (!settings.notificationsEnabled) return
    const lead = settings.reminderMinutes * 60 * 1000
    for (const schedule of schedules) {
      const start = nextFutureStart(schedule, now)
      const remindAt = start.getTime() - lead
      if (now.getTime() < remindAt || now.getTime() >= start.getTime()) continue
      const key = reminderKey(schedule.id, start)
      if (!claimReminder(key)) continue
      showReminderToast(schedule, settings.reminderMinutes)
      const meta = ACTIVITY_META[schedule.type]
      showBrowserNotification(
        'Pengingat Kuliah',
        `${reminderPhrase(settings.reminderMinutes)} lagi kamu memiliki ${meta.noun} ${schedule.name}.\n📍 ${schedule.room || '-'}\n⏰ ${schedule.startTime} - ${schedule.endTime}`,
        key,
      )
      if (settings.soundEnabled) void playChime()
    }
  }, [now, schedules, settings])

  return null
}
