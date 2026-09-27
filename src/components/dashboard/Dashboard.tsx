import { BookOpen, CalendarRange, Clock3, FlaskConical, MapPin, Plus } from 'lucide-react'
import { useSchedule } from '@/context/ScheduleContext'
import { useUi } from '@/context/UiContext'
import {
  ACTIVITY_META,
  countdownParts,
  dayLabel,
  formatClock,
  formatLongDate,
  getNextSchedule,
  getOngoing,
  pad,
  schedulesForDay,
  statusOf,
} from '@/lib/schedule'
import type { Schedule } from '@/types/schedule'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ScheduleCard } from '@/components/schedule/ScheduleCard'

export function Dashboard() {
  const { schedules, now } = useSchedule()
  const { openCreate } = useUi()
  const today = now.getDay() as Schedule['day']
  const todayItems = schedulesForDay(schedules, today)
  const ongoing = getOngoing(schedules, now)
  const next = getNextSchedule(schedules, now)
  const kuliah = schedules.filter((item) => item.type === 'kuliah').length
  const praktikum = schedules.filter((item) => item.type === 'praktikum').length
  const todayDone =
    todayItems.length > 0 &&
    todayItems.every((item) => statusOf(item, now) === 'completed')

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-blue-300/80 uppercase">
            Jadwal Kuliah Dzaky
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Halo, Dzaky 👋</h1>
          <p className="mt-2 text-sm text-slate-300 sm:text-base">Hari ini, {formatLongDate(now)}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] backdrop-blur">
          <p className="flex items-center gap-2 text-[11px] tracking-[0.14em] text-slate-400 uppercase">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            Jam sekarang
          </p>
          <p className="mt-1 font-mono text-3xl font-medium tabular-nums tracking-tight">
            {formatClock(now)}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon="📚" label="Total Mata Kuliah" value={String(kuliah)} hint="Jenis kuliah" />
        <StatCard icon="🧪" label="Total Praktikum" value={String(praktikum)} hint="Menunggu update kampus jika 0" />
        <StatCard icon="📅" label="Jadwal Minggu Ini" value={String(schedules.length)} hint="Seluruh jadwal berulang" />
        <StatCard
          icon="⏰"
          label="Jadwal Berikutnya"
          value={next?.schedule.name ?? 'Tidak ada'}
          hint={
            next
              ? `${dayLabel(next.schedule.day)} · ${next.schedule.startTime}`
              : 'Tambahkan jadwal baru'
          }
          compactValue
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.85)] sm:p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Jadwal Hari Ini</h2>
              <p className="text-sm text-slate-400">{dayLabel(today)}</p>
            </div>
            <Button className="h-10" onClick={() => openCreate('schedule')}>
              <Plus />
              Tambah Jadwal
            </Button>
          </div>
          {todayItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-4 py-10 text-center">
              <p className="text-lg font-medium">🎉 Tidak ada jadwal kuliah hari ini</p>
              <p className="mt-2 text-sm text-slate-400">
                Manfaatkan waktu untuk istirahat atau mengerjakan tugas.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {todayItems.map((schedule) => (
                <ScheduleCard key={schedule.id} schedule={schedule} />
              ))}
            </div>
          )}
        </section>

        <CountdownPanel
          ongoing={ongoing}
          next={next}
          todayDone={todayDone}
          now={now}
        />
      </div>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="size-3.5" /> Kuliah berulang setiap minggu
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FlaskConical className="size-3.5" /> Praktikum bisa ditambah kapan saja
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarRange className="size-3.5" /> Data tersimpan di browser ini
        </span>
      </p>
    </div>
  )
}

function CountdownPanel({
  ongoing,
  next,
  todayDone,
  now,
}: {
  ongoing: Schedule | null
  next: { schedule: Schedule; start: Date } | null
  todayDone: boolean
  now: Date
}) {
  if (ongoing) {
    const meta = ACTIVITY_META[ongoing.type]
    return (
      <aside className="rounded-3xl border border-rose-400/25 bg-rose-500/[0.08] p-5 lg:col-span-2">
        <p className="text-sm font-semibold text-rose-100">🔴 Sedang Berlangsung</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">{ongoing.name}</h2>
        <p className="mt-2 text-sm tabular-nums text-slate-200">
          {ongoing.startTime} - {ongoing.endTime}
        </p>
        <p className="mt-3 flex items-center gap-2 text-sm text-slate-300">
          <MapPin className="size-4 text-rose-200" />
          {ongoing.room || '-'}
        </p>
        <p className="mt-2 text-sm text-slate-300">
          {meta.emoji} {meta.label}
        </p>
      </aside>
    )
  }

  if (!next) {
    return (
      <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 lg:col-span-2">
        <p className="text-sm text-slate-400">Belum ada jadwal berikutnya.</p>
        <h2 className="mt-2 text-xl font-semibold">Tambahkan jadwal pertama.</h2>
      </aside>
    )
  }

  const parts = countdownParts(next.start, now)
  const meta = ACTIVITY_META[next.schedule.type]
  const heading =
    next.schedule.type === 'praktikum'
      ? 'Praktikum berikutnya dimulai dalam'
      : next.schedule.type === 'kuliah'
        ? 'Kuliah berikutnya dimulai dalam'
        : 'Jadwal berikutnya dimulai dalam'
  const units =
    parts.days > 0
      ? [
          { label: 'Hari', value: pad(parts.days) },
          { label: 'Jam', value: pad(parts.hours) },
          { label: 'Menit', value: pad(parts.minutes) },
        ]
      : [
          { label: 'Jam', value: pad(parts.hours) },
          { label: 'Menit', value: pad(parts.minutes) },
          { label: 'Detik', value: pad(parts.seconds) },
        ]

  return (
    <aside className="rounded-3xl border border-white/10 bg-gradient-to-b from-blue-500/10 to-indigo-500/5 p-5 lg:col-span-2">
      {todayDone ? (
        <p className="mb-3 text-sm font-medium text-emerald-200">✓ Selesai</p>
      ) : null}
      <p className="text-sm text-slate-300">{heading}</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {units.map((unit) => (
          <div key={unit.label} className="rounded-2xl bg-black/25 px-2 py-3 text-center">
            <p className="font-mono text-2xl font-medium tabular-nums">{unit.value}</p>
            <p className="mt-1 text-[10px] tracking-[0.14em] text-slate-400 uppercase">{unit.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
        <p className="font-medium">
          {meta.emoji} {next.schedule.name}
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm text-slate-300">
          <Clock3 className="size-3.5 text-blue-300" />
          <span className="tabular-nums">
            {dayLabel(next.schedule.day)} · {next.schedule.startTime} - {next.schedule.endTime}
          </span>
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm text-slate-300">
          <MapPin className="size-3.5 text-indigo-300" />
          {next.schedule.room || '-'}
        </p>
      </div>
    </aside>
  )
}

function StatCard({
  icon,
  label,
  value,
  hint,
  compactValue = false,
}: {
  icon: string
  label: string
  value: string
  hint: string
  compactValue?: boolean
}) {
  return (
    <Card size="sm" className="border-0 bg-white/[0.03] shadow-none ring-white/10">
      <CardContent className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-500/15 text-lg ring-1 ring-white/10">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-400">{label}</p>
          <p className={compactValue ? 'truncate text-base font-semibold' : 'text-2xl font-semibold tabular-nums'}>
            {value}
          </p>
          <p className="truncate text-[11px] text-slate-500">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}
