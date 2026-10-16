import { useEffect, useState } from 'react'
import {
  ArrowLeftRight,
  Bird,
  LayoutDashboard,
  Moon,
  PieChart,
  Plus,
  Settings,
  Sun,
} from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { DashboardPage } from '@/components/dashboard/DashboardPage'
import { ReportPage } from '@/components/reports/ReportPage'
import { SettingsPage } from '@/components/settings/SettingsPage'
import { TransactionPage } from '@/components/transactions/TransactionPage'
import { LedgerUiProvider, useLedgerUi } from '@/context/LedgerUiContext'
import { useFinance } from '@/context/FinanceContext'
import { usePreferences } from '@/context/PreferencesContext'
import { cn } from '@/lib/utils'

type Page = 'dasbor' | 'transaksi' | 'laporan' | 'pengaturan'

const NAV: { id: Page; href: string; label: string; icon: typeof Bird }[] = [
  { id: 'dasbor', href: '#/', label: 'Dasbor', icon: LayoutDashboard },
  { id: 'transaksi', href: '#/transaksi', label: 'Transaksi', icon: ArrowLeftRight },
  { id: 'laporan', href: '#/laporan', label: 'Laporan', icon: PieChart },
  { id: 'pengaturan', href: '#/pengaturan', label: 'Pengaturan', icon: Settings },
]

const TITLES: Record<Page, string> = {
  dasbor: 'Dasbor',
  transaksi: 'Transaksi',
  laporan: 'Laporan',
  pengaturan: 'Pengaturan',
}

function readPage(): Page {
  const hash = window.location.hash
  if (hash === '#/transaksi') return 'transaksi'
  if (hash === '#/laporan') return 'laporan'
  if (hash === '#/pengaturan') return 'pengaturan'
  return 'dasbor'
}

export function AppShell() {
  return (
    <LedgerUiProvider>
      <Shell />
    </LedgerUiProvider>
  )
}

function Shell() {
  const [page, setPage] = useState<Page>(readPage)
  const { saveError, syncError, notice, dismissNotice, retrySave } = useFinance()
  const { preferences, setTheme } = usePreferences()
  const { openCreate } = useLedgerUi()

  useEffect(() => {
    const onHash = () => setPage(readPage())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.title = `${TITLES[page]} · Black Bird`
    window.scrollTo(0, 0)
  }, [page])

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15.5rem_minmax(0,1fr)]">
      <a href="#konten" className="skip-link">
        Langsung ke isi
      </a>
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex items-center gap-3 px-4 py-5">
          <BirdMark />
          <div>
            <p className="font-semibold tracking-tight">Black Bird</p>
            <p className="text-xs text-muted-foreground">Buku kas pribadi</p>
          </div>
        </div>
        <div className="px-3">
          <Button type="button" className="h-10 w-full" onClick={openCreate}>
            <Plus />
            Catat transaksi
          </Button>
        </div>
        <nav className="mt-4 grid gap-1 px-3" aria-label="Utama">
          {NAV.map((item) => (
            <NavLink key={item.id} item={item} active={page === item.id} />
          ))}
        </nav>
        <div className="mt-auto grid gap-3 p-3">
          <p className="px-2 text-xs text-muted-foreground">
            {syncError
              ? 'Perangkat lain belum mendapat perubahan terakhir.'
              : 'Buku yang sama di setiap perangkat.'}
          </p>
          <Button
            type="button"
            variant="secondary"
            className="h-10 w-full"
            onClick={() =>
              setTheme(preferences.theme === 'dark' ? 'light' : 'dark')
            }
          >
            {preferences.theme === 'dark' ? <Sun /> : <Moon />}
            {preferences.theme === 'dark' ? 'Tema terang' : 'Tema gelap'}
          </Button>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <BirdMark />
            <span className="truncate font-semibold">Black Bird</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label={
                preferences.theme === 'dark'
                  ? 'Ganti ke tema terang'
                  : 'Ganti ke tema gelap'
              }
              onClick={() =>
                setTheme(preferences.theme === 'dark' ? 'light' : 'dark')
              }
            >
              {preferences.theme === 'dark' ? <Sun /> : <Moon />}
            </Button>
            <Button type="button" className="h-10" onClick={openCreate}>
              <Plus />
              Catat
            </Button>
          </div>
        </header>

        <main
          id="konten"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 py-6 pb-28 outline-none md:px-8 md:py-8 md:pb-10"
        >
          {saveError ? (
            <div
              role="alert"
              className="mb-4 flex flex-col gap-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
            >
              <p>{saveError}</p>
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={retrySave}
              >
                Coba simpan lagi
              </Button>
            </div>
          ) : null}
          {syncError ? (
            <div
              role="alert"
              className="mb-4 flex flex-col gap-3 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
            >
              <p>{syncError}</p>
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={retrySave}
              >
                Coba sambungkan lagi
              </Button>
            </div>
          ) : null}
          {notice ? (
            <div
              role="status"
              className="mb-4 flex items-start justify-between gap-3 rounded-2xl bg-muted px-4 py-3 text-sm"
            >
              <p>{notice}</p>
              <Button type="button" variant="ghost" className="h-9" onClick={dismissNotice}>
                Tutup
              </Button>
            </div>
          ) : null}

          <div className={page === 'dasbor' ? 'grid gap-6' : 'hidden'}>
            <DashboardPage />
          </div>
          <div className={page === 'transaksi' ? undefined : 'hidden'}>
            <TransactionPage />
          </div>
          <div className={page === 'laporan' ? undefined : 'hidden'}>
            <ReportPage />
          </div>
          <div className={page === 'pengaturan' ? undefined : 'hidden'}>
            <SettingsPage />
          </div>
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-background/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden"
        aria-label="Utama"
      >
        {NAV.map((item) => (
          <NavLink key={item.id} item={item} active={page === item.id} compact />
        ))}
      </nav>
      <Toaster theme={preferences.theme} position="top-center" />
    </div>
  )
}

function NavLink({
  item,
  active,
  compact = false,
}: {
  item: (typeof NAV)[number]
  active: boolean
  compact?: boolean
}) {
  const Icon = item.icon
  return (
    <a
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'font-medium transition-colors',
        compact
          ? 'flex flex-col items-center justify-center gap-1 px-1 py-2 text-center text-[0.7rem] leading-tight'
          : 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm',
        active
          ? compact
            ? 'text-foreground shadow-[inset_0_2px_0_0_var(--primary)]'
            : 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground',
        !compact && !active && 'hover:bg-muted',
      )}
    >
      <Icon className={cn(compact ? 'size-5' : 'size-4', active && compact && 'text-primary')} />
      {item.label}
    </a>
  )
}

function BirdMark() {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-foreground text-background">
      <Bird className="size-5" aria-hidden="true" />
    </span>
  )
}
