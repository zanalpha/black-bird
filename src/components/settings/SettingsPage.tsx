import { useState } from 'react'
import { Download, LayoutGrid, Moon, Sun, Table } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ledger/ConfirmDialog'
import { SegmentedControl } from '@/components/ledger/SegmentedControl'
import { Button } from '@/components/ui/button'
import { useFinance } from '@/context/FinanceContext'
import { usePreferences } from '@/context/PreferencesContext'
import { ACCENTS, TEXT_SIZES } from '@/lib/preferences'
import { cn } from '@/lib/utils'
import type { TextSize, ThemeMode, TransactionView } from '@/types/finance'

export function SettingsPage() {
  const { transactions, clearAll } = useFinance()
  const { preferences, setTheme, setAccent, setTextSize, setView } =
    usePreferences()
  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <div className="grid gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Pengaturan</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tampilan berubah langsung dan tersimpan di perangkat ini.
        </p>
      </header>

      <section className="grid gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <div>
          <h2 className="text-base font-semibold">Tema</h2>
          <p className="text-sm text-muted-foreground">
            Hitam putih untuk layar terang atau gelap.
          </p>
        </div>
        <SegmentedControl<ThemeMode>
          label="Tema"
          value={preferences.theme}
          onChange={setTheme}
          options={[
            {
              value: 'light',
              label: (
                <>
                  <Sun className="size-4" aria-hidden="true" />
                  Terang
                </>
              ),
            },
            {
              value: 'dark',
              label: (
                <>
                  <Moon className="size-4" aria-hidden="true" />
                  Gelap
                </>
              ),
            },
          ]}
        />
      </section>

      <section className="grid gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <div>
          <h2 className="text-base font-semibold">Warna aksen</h2>
          <p className="text-sm text-muted-foreground">
            Dipakai pada tombol, menu yang aktif, dan batang pemasukan.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {ACCENTS.map((accent) => {
            const selected = preferences.accent === accent.id
            return (
              <button
                key={accent.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setAccent(accent.id)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-xl px-2 py-3 text-sm font-medium',
                  selected
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-foreground hover:bg-muted/70',
                )}
              >
                <span
                  aria-hidden="true"
                  className="size-7 rounded-full ring-1 ring-black/20"
                  style={{ backgroundColor: accent.swatch }}
                />
                {accent.label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <div>
          <h2 className="text-base font-semibold">Ukuran teks</h2>
          <p className="text-sm text-muted-foreground">
            Mengubah ukuran tulisan di seluruh halaman.
          </p>
        </div>
        <SegmentedControl<TextSize>
          label="Ukuran teks"
          value={preferences.textSize}
          onChange={setTextSize}
          options={TEXT_SIZES.map((size) => ({
            value: size.id,
            label: size.label,
          }))}
        />
      </section>

      <section className="grid gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <div>
          <h2 className="text-base font-semibold">Tampilan transaksi</h2>
          <p className="text-sm text-muted-foreground">
            Tabel nyaman di layar lebar. Kartu lebih mudah dibaca di HP.
          </p>
        </div>
        <SegmentedControl<TransactionView>
          label="Tampilan transaksi"
          value={preferences.view}
          onChange={setView}
          options={[
            {
              value: 'tabel',
              label: (
                <>
                  <Table className="size-4" aria-hidden="true" />
                  Tabel
                </>
              ),
            },
            {
              value: 'kartu',
              label: (
                <>
                  <LayoutGrid className="size-4" aria-hidden="true" />
                  Kartu
                </>
              ),
            },
          ]}
        />
      </section>

      <section className="grid gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <div>
          <h2 className="text-base font-semibold">Folder offline</h2>
          <p className="text-sm text-muted-foreground">
            Unduh, lalu ekstrak di PC. Klik dua kali Buka Black Bird. Tanpa
            internet, salinan terakhir di browser itu tetap bisa dipakai. Saat
            online, buku mengikuti tautan yang sama.
          </p>
        </div>
        <div>
          <Button asChild className="h-10">
            <a
              href={`${import.meta.env.BASE_URL}Black-Bird-Offline.zip`}
              download="Black-Bird-Offline.zip"
            >
              <Download />
              Unduh folder offline
            </a>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <div>
          <h2 className="text-base font-semibold">Buku kas</h2>
          <p className="text-sm text-muted-foreground">
            {transactions.length === 0
              ? 'Belum ada transaksi.'
              : `${transactions.length} transaksi tersimpan untuk tautan ini.`}{' '}
            HP dan laptop membaca buku yang sama. Menghapus data situs di satu
            browser tidak menghapus buku di perangkat lain; buku itu kembali
            saat halaman dibuka lagi.
          </p>
        </div>
        <div>
          <Button
            type="button"
            variant="destructive"
            className="h-10"
            disabled={transactions.length === 0}
            onClick={() => setConfirmClear(true)}
          >
            Hapus semua transaksi
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmClear}
        title="Hapus semua transaksi?"
        description={`${transactions.length} transaksi akan dihapus di semua perangkat. Tindakan ini tidak bisa dibatalkan.`}
        confirmLabel="Hapus semua"
        onOpenChange={setConfirmClear}
        onConfirm={() => {
          clearAll()
          setConfirmClear(false)
          toast.success('Semua transaksi dihapus.')
        }}
      />
    </div>
  )
}
