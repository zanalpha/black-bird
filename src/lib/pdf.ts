import { jsPDF } from 'jspdf'
import { ACTIVITY_META, displayText, formatLongDate, formatStamp } from '@/lib/schedule'
import { DAYS, type Schedule } from '@/types/schedule'

export function exportSchedulePdf(schedules: Schedule[], now = new Date()): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 18

  const ensure = (height: number) => {
    if (y + height <= 282) return
    doc.addPage()
    y = 18
  }

  const write = (text: string, size: number, weight: 'normal' | 'bold' = 'normal', color: [number, number, number] = [15, 23, 42]) => {
    doc.setFont('helvetica', weight)
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, pageWidth - 28) as string[]
    ensure(lines.length * (size * 0.45) + 2)
    doc.text(lines, 14, y)
    y += lines.length * (size * 0.45) + 2
  }

  write('Jadwal Kuliah Dzaky', 18, 'bold', [15, 39, 68])
  write(`Dicetak ${formatLongDate(now)}`, 10, 'normal', [71, 85, 105])
  y += 4

  if (schedules.length === 0) {
    write('Belum ada jadwal.', 12)
  }

  for (const day of DAYS) {
    const items = schedules
      .filter((schedule) => schedule.day === day.value)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
    ensure(16)
    write(day.label, 13, 'bold', [30, 64, 175])
    if (items.length === 0) {
      write('Tidak ada jadwal', 10, 'normal', [100, 116, 139])
      y += 2
      continue
    }
    for (const item of items) {
      const meta = ACTIVITY_META[item.type]
      write(`${item.startTime} - ${item.endTime}  ${item.name}`, 11, 'bold')
      const course = item.courseName ? ` | Mata kuliah: ${item.courseName}` : ''
      write(
        `${meta.label} | Ruangan: ${displayText(item.room)} | Dosen: ${displayText(item.lecturer)}${course}`,
        10,
        'normal',
        [51, 65, 85],
      )
      if (item.notes.trim()) {
        write(`Catatan: ${item.notes.trim()}`, 10, 'normal', [71, 85, 105])
      }
      y += 1
    }
    y += 3
  }

  write(`${schedules.length} jadwal tersimpan. Data mingguan berulang setiap pekan.`, 9, 'normal', [100, 116, 139])
  doc.save(`jadwal-kuliah-dzaky-${formatStamp(now)}.pdf`)
}
