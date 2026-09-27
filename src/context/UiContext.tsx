import { createContext, useContext, type ReactNode } from 'react'
import type { PageId } from '@/types/schedule'

export interface UiApi {
  page: PageId
  setPage: (page: PageId) => void
  openCreate: (mode: 'schedule' | 'praktikum') => void
  openEdit: (id: string) => void
  openDetail: (id: string) => void
  requestDelete: (id: string) => void
}

const UiContext = createContext<UiApi | null>(null)

export function UiProvider({ value, children }: { value: UiApi; children: ReactNode }) {
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

export function useUi(): UiApi {
  const context = useContext(UiContext)
  if (!context) throw new Error('useUi harus dipakai di dalam UiProvider')
  return context
}
