import { CalendarDays, FlaskConical, Home, Plus, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUi } from '@/context/UiContext'
import type { PageId } from '@/types/schedule'

const NAV: { id: PageId; label: string; icon: typeof Home }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'schedule', label: 'Jadwal', icon: CalendarDays },
  { id: 'add', label: 'Tambah', icon: Plus },
  { id: 'praktikum', label: 'Praktikum', icon: FlaskConical },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
]

export function Sidebar() {
  const { page, setPage } = useUi()

  return (
    <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-white/10 bg-[#0e1626]/90 px-4 py-5 backdrop-blur-xl lg:flex">
      <button type="button" onClick={() => setPage('dashboard')} className="flex items-center gap-3 px-2 text-left">
        <span className="grid size-11 place-items-center rounded-2xl bg-blue-500/15 text-blue-200 ring-1 ring-blue-400/30">
          <CalendarDays className="size-5" />
        </span>
        <span>
          <span className="block text-sm font-semibold">Jadwal Kuliah</span>
          <span className="block text-xs text-slate-400">Dzaky</span>
        </span>
      </button>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = page === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPage(item.id)}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition duration-200',
                active
                  ? 'bg-blue-500/15 text-white ring-1 ring-blue-400/25'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </button>
          )
        })}
      </nav>

      <p className="px-3 text-xs leading-relaxed text-slate-500">
        Data tersimpan di perangkat ini. Tidak perlu akun atau database.
      </p>
    </aside>
  )
}
