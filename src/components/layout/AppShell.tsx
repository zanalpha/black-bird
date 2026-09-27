import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useSchedule } from '@/context/ScheduleContext'
import { UiProvider, type UiApi } from '@/context/UiContext'
import type { PageId } from '@/types/schedule'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { PraktikumPage } from '@/components/praktikum/PraktikumPage'
import { NotificationPrompt } from '@/components/reminder/Notification'
import { Reminder } from '@/components/reminder/Reminder'
import { ScheduleDetail } from '@/components/schedule/ScheduleDetail'
import { ScheduleForm } from '@/components/schedule/ScheduleForm'
import { SchedulePage } from '@/components/schedule/SchedulePage'
import { SettingsPage } from '@/components/settings/SettingsPage'

export function AppShell() {
  const { schedules, deleteSchedule } = useSchedule()
  const [page, setPage] = useState<PageId>('dashboard')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [createMode, setCreateMode] = useState<'schedule' | 'praktikum'>('schedule')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [page])

  const editing = schedules.find((item) => item.id === editingId) ?? null
  const detail = schedules.find((item) => item.id === detailId) ?? null
  const deleting = schedules.find((item) => item.id === deleteId) ?? null

  const api = useMemo<UiApi>(
    () => ({
      page,
      setPage,
      openCreate: (mode) => {
        setCreateMode(mode)
        setEditingId(null)
        setFormOpen(true)
      },
      openEdit: (id) => {
        setDetailId(null)
        setEditingId(id)
        setFormOpen(true)
      },
      openDetail: (id) => setDetailId(id),
      requestDelete: (id) => {
        setDetailId(null)
        setDeleteId(id)
      },
    }),
    [page],
  )

  return (
    <UiProvider value={api}>
      <div className="min-h-screen lg:flex">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <main className="mx-auto w-full max-w-6xl px-4 pt-5 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-10">
            <NotificationPrompt />
            {page === 'dashboard' ? <Dashboard /> : null}
            {page === 'schedule' ? <SchedulePage /> : null}
            {page === 'add' ? <AddPage onDone={() => setPage('schedule')} onCancel={() => setPage('dashboard')} /> : null}
            {page === 'praktikum' ? <PraktikumPage /> : null}
            {page === 'settings' ? <SettingsPage /> : null}
          </main>
        </div>
        <Navbar />
      </div>
      <Reminder />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Edit Jadwal' : createMode === 'praktikum' ? 'Tambah Praktikum' : 'Tambah Jadwal'}
            </DialogTitle>
            <DialogDescription>
              Perubahan langsung tersimpan di browser ini dan muncul di seluruh jadwal.
            </DialogDescription>
          </DialogHeader>
          {formOpen ? (
            <ScheduleForm
              key={editing?.id ?? `new-${createMode}`}
              initial={editing}
              defaultType={createMode === 'praktikum' ? 'praktikum' : 'kuliah'}
              onCancel={() => setFormOpen(false)}
              onSaved={() => setFormOpen(false)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={detail !== null} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent>
          <DialogHeader className="sr-only">
            <DialogTitle>{detail?.name ?? 'Detail jadwal'}</DialogTitle>
            <DialogDescription>Detail mata kuliah, ruangan, dan waktu.</DialogDescription>
          </DialogHeader>
          {detail ? (
            <ScheduleDetail
              schedule={detail}
              onEdit={() => api.openEdit(detail.id)}
              onDelete={() => api.requestDelete(detail.id)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apakah kamu yakin ingin menghapus jadwal ini?</DialogTitle>
            <DialogDescription>
              {deleting
                ? `${deleting.name} (${deleting.startTime} - ${deleting.endTime}) akan dihapus dari jadwal mingguan.`
                : 'Jadwal yang dihapus tidak bisa dikembalikan kecuali lewat cadangan.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteId(null)}>
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!deleting) return
                deleteSchedule(deleting.id)
                setDeleteId(null)
                toast.success('Jadwal dihapus.')
              }}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UiProvider>
  )
}

function AddPage({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <p className="text-xs font-medium tracking-[0.16em] text-blue-300/80 uppercase">Jadwal baru</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Tambah Jadwal</h1>
        <p className="mt-1 text-sm text-slate-400">
          Isi mata kuliah, praktikum, ujian, atau kegiatan lain. Jadwal langsung muncul di kalender.
        </p>
      </header>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
        <ScheduleForm defaultType="kuliah" onCancel={onCancel} onSaved={onDone} />
      </div>
    </div>
  )
}
