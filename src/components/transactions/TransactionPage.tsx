import { useState } from 'react'
import { Download, LayoutGrid, Search, Table } from 'lucide-react'
import { toast } from 'sonner'
import { EmptyState } from '@/components/ledger/EmptyState'
import { SegmentedControl } from '@/components/ledger/SegmentedControl'
import { TransactionList } from '@/components/ledger/TransactionList'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useFinance } from '@/context/FinanceContext'
import { useLedgerUi } from '@/context/LedgerUiContext'
import { usePreferences } from '@/context/PreferencesContext'
import { useAdaptiveView } from '@/lib/viewport'
import { downloadCsv } from '@/lib/csv'
import {
  EMPTY_FILTER,
  filterTransactions,
  hasInvalidDateRange,
  isFilterActive,
  uniqueCategories,
} from '@/lib/finance'
import type { TransactionFilter, TransactionView } from '@/types/finance'

export function TransactionPage() {
  const { transactions } = useFinance()
  const { preferences, setView } = usePreferences()
  const view = useAdaptiveView()
  const { openCreate } = useLedgerUi()
  const [filter, setFilter] = useState<TransactionFilter>(EMPTY_FILTER)
  const invalidRange = hasInvalidDateRange(filter)
  const visible = invalidRange ? [] : filterTransactions(transactions, filter)
  const categories = uniqueCategories(transactions)
  const categoryOptions =
    filter.category !== 'semua' && !categories.includes(filter.category)
      ? [filter.category, ...categories]
      : categories
  const active = isFilterActive(filter)

  function exportRows() {
    downloadCsv('black-bird-transaksi.csv', visible)
    toast.success(
      visible.length === 1
        ? 'CSV berisi 1 transaksi diunduh.'
        : `CSV berisi ${visible.length} transaksi diunduh.`,
    )
  }

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transaksi</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {active
              ? `${visible.length} dari ${transactions.length} transaksi`
              : transactions.length === 0
                ? 'Belum ada transaksi'
                : `${transactions.length} transaksi`}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="hidden lg:block lg:w-56">
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
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10"
            disabled={visible.length === 0}
            onClick={exportRows}
          >
            <Download />
            Unduh CSV
          </Button>
        </div>
      </header>

      <section className="grid gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
        <div className="grid gap-2">
          <Label htmlFor="cari-transaksi">Cari</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="cari-transaksi"
              value={filter.search}
              placeholder="Kategori, catatan, atau nominal"
              className="h-11 pl-9"
              onChange={(event) =>
                setFilter((current) => ({ ...current, search: event.target.value }))
              }
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="grid gap-2 md:col-span-2 xl:col-span-1">
            <span className="text-sm font-medium">Jenis</span>
            <SegmentedControl
              label="Jenis transaksi"
              value={filter.type}
              onChange={(type) => setFilter((current) => ({ ...current, type }))}
              options={[
                { value: 'semua', label: 'Semua' },
                { value: 'pemasukan', label: 'Masuk' },
                { value: 'pengeluaran', label: 'Keluar' },
              ]}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="filter-kategori">Kategori</Label>
            <Select
              value={filter.category}
              onValueChange={(category) =>
                setFilter((current) => ({ ...current, category }))
              }
            >
              <SelectTrigger id="filter-kategori" className="h-11 w-full">
                <SelectValue placeholder="Semua kategori" />
              </SelectTrigger>
              <SelectContent position="popper" className="max-h-72">
                <SelectItem value="semua">Semua kategori</SelectItem>
                {categoryOptions.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="filter-dari">Dari tanggal</Label>
            <Input
              id="filter-dari"
              type="date"
              value={filter.from}
              min="2000-01-01"
              max="2100-12-31"
              className="h-11"
              onChange={(event) =>
                setFilter((current) => ({ ...current, from: event.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="filter-sampai">Sampai tanggal</Label>
            <Input
              id="filter-sampai"
              type="date"
              value={filter.to}
              min="2000-01-01"
              max="2100-12-31"
              aria-invalid={invalidRange || undefined}
              aria-describedby={invalidRange ? 'filter-tanggal-error' : undefined}
              className="h-11"
              onChange={(event) =>
                setFilter((current) => ({ ...current, to: event.target.value }))
              }
            />
          </div>
        </div>

        {invalidRange ? (
          <p id="filter-tanggal-error" role="alert" className="text-sm text-destructive">
            Tanggal awal tidak boleh setelah tanggal akhir.
          </p>
        ) : null}

        {active ? (
          <div>
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => setFilter(EMPTY_FILTER)}
            >
              Atur ulang filter
            </Button>
          </div>
        ) : null}
      </section>

      {transactions.length === 0 ? (
        <EmptyState
          title="Belum ada transaksi"
          body="Catat pemasukan atau pengeluaran. Kamu bisa mencari dan menyaringnya setelah ada data."
          actionLabel="Catat transaksi"
          onAction={openCreate}
        />
      ) : (
        <TransactionList
          items={visible}
          view={view}
          empty={
            <p className="rounded-2xl bg-card px-4 py-10 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
              {invalidRange
                ? 'Perbaiki rentang tanggal untuk melihat transaksi.'
                : 'Tidak ada transaksi yang cocok dengan pencarian atau filter.'}
            </p>
          }
        />
      )}
    </div>
  )
}
