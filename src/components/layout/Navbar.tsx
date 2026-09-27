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

export function Navbar() {
  const { page, setPage } = useUi()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0c1424]/95 backdrop-blur-xl lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 px-1 pt-1 pb-[max(0.4rem,env(safe-area-inset-bottom))]">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = page === item.id
          if (item.id === 'add') {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPage('add')}
                className="flex flex-col items-center"
              >
                <span className="-mt-5 grid size-12 place-items-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-950/50 transition duration-200 active:scale-95">
                  <Plus className="size-5" />
                </span>
                <span className={cn('mt-1 text-[11px]', active ? 'text-white' : 'text-slate-400')}>
                  Tambah
                </span>
              </button>
            )
          }
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setPage(item.id)}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] transition duration-200',
                active ? 'text-blue-200' : 'text-slate-400',
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
