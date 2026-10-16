import { Bird } from 'lucide-react'
import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { FinanceProvider, useFinance } from '@/context/FinanceContext'
import { PreferencesProvider } from '@/context/PreferencesContext'

export default function App() {
  return (
    <PreferencesProvider>
      <FinanceProvider>
        <BookGate />
      </FinanceProvider>
    </PreferencesProvider>
  )
}

function BookGate() {
  const { hydrated, loadError, transactions, replaceUnreadableData } = useFinance()
  const [confirm, setConfirm] = useState(false)

  if (!loadError && !hydrated && transactions.length === 0) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-md text-center">
          <Bird className="mx-auto size-8" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            Membuka buku kas
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Mengambil transaksi yang tersimpan di tautan ini.
          </p>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-md text-center">
          <Bird className="mx-auto size-8" aria-hidden="true" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            Buku kas tidak terbaca
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Data lama tidak diubah sampai kamu memulai buku kas baru.
          </p>
          {confirm ? (
            <div className="mt-6 grid gap-3">
              <p className="text-sm">
                Data lama yang tidak terbaca akan ditimpa di perangkat ini.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={() => setConfirm(false)}
                >
                  Batal
                </Button>
                <Button type="button" className="h-10" onClick={replaceUnreadableData}>
                  Ya, mulai baru
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              className="mt-6 h-10"
              onClick={() => setConfirm(true)}
            >
              Mulai buku baru
            </Button>
          )}
        </div>
      </div>
    )
  }

  return <AppShell />
}
