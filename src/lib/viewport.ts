import { useEffect, useState } from 'react'
import { usePreferences } from '@/context/PreferencesContext'
import type { TransactionView } from '@/types/finance'

const WIDE_QUERY = '(min-width: 1024px)'

export function useWideLayout() {
  const [wide, setWide] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia(WIDE_QUERY).matches,
  )

  useEffect(() => {
    const media = window.matchMedia(WIDE_QUERY)
    const sync = () => setWide(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return wide
}

export function useAdaptiveView(): TransactionView {
  const { preferences } = usePreferences()
  const wide = useWideLayout()
  return wide ? preferences.view : 'kartu'
}
