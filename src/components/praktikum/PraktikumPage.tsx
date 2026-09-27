import { FlaskConical, Plus } from 'lucide-react'
import { useSchedule } from '@/context/ScheduleContext'
import { useUi } from '@/context/UiContext'
import { Button } from '@/components/ui/button'
import { ScheduleCard } from '@/components/schedule/ScheduleCard'
import type { DayValue } from '@/types/schedule'

function weekIndex(day: DayValue): number {
  return day === 0 ? 7 : day
}

export function PraktikumPage() {
  const { schedules } = useSchedule()
  const { openCreate } = useUi()
  const labs = schedules
    .filter((schedule) => schedule.type === 'praktikum')
    .sort((a, b) => weekIndex(a.day) - weekIndex(b.day) || a.startTime.localeCompare(b.startTime))

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-indigo-300/80 uppercase">
            Laboratorium
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Jadwal Praktikum</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            Praktikum yang kamu tambahkan langsung masuk ke dashboard dan jadwal mingguan.
          </p>
        </div>
        <Button className="h-11" onClick={() => openCreate('praktikum')}>
          <Plus />
          Tambah Praktikum
        </Button>
      </header>

      {labs.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-indigo-300/25 bg-indigo-500/[0.06] px-5 py-14 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-indigo-500/15 text-indigo-100">
            <FlaskConical />
          </div>
          <h2 className="mt-4 text-xl font-semibold">🧪 Jadwal praktikum belum tersedia</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-300">
            Tambahkan jadwal praktikum ketika jadwal dari kampus sudah diperbarui.
          </p>
          <Button className="mt-5 h-11" onClick={() => openCreate('praktikum')}>
            <Plus />
            Tambah Praktikum
          </Button>
        </section>
      ) : (
        <div className="grid gap-3">
          {labs.map((schedule) => (
            <ScheduleCard key={schedule.id} schedule={schedule} />
          ))}
        </div>
      )}
    </div>
  )
}
