import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loadPreferences, savePreferences } from '@/lib/preferences'
import type {
  AccentId,
  Preferences,
  TextSize,
  ThemeMode,
  TransactionView,
} from '@/types/finance'

type PreferencesContextValue = {
  preferences: Preferences
  setTheme: (theme: ThemeMode) => void
  setAccent: (accent: AccentId) => void
  setTextSize: (textSize: TextSize) => void
  setView: (view: TransactionView) => void
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null)

function applyPreferences(preferences: Preferences) {
  const root = document.documentElement
  root.classList.toggle('dark', preferences.theme === 'dark')
  root.dataset.accent = preferences.accent
  root.dataset.text = preferences.textSize
  const meta = document.querySelector('meta[name="theme-color"]')
  meta?.setAttribute(
    'content',
    preferences.theme === 'dark' ? '#090909' : '#f4f4f1',
  )
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences)

  useLayoutEffect(() => {
    applyPreferences(preferences)
    try {
      savePreferences(preferences)
    } catch {
      // Tampilan tetap berubah meski penyimpanan preferensi gagal.
    }
  }, [preferences])

  const patch = useCallback((partial: Partial<Preferences>) => {
    setPreferences((current) => ({ ...current, ...partial }))
  }, [])

  const value = useMemo<PreferencesContextValue>(
    () => ({
      preferences,
      setTheme: (theme) => patch({ theme }),
      setAccent: (accent) => patch({ accent }),
      setTextSize: (textSize) => patch({ textSize }),
      setView: (view) => patch({ view }),
    }),
    [patch, preferences],
  )

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

export function usePreferences() {
  const context = useContext(PreferencesContext)
  if (!context) {
    throw new Error('usePreferences must be used within PreferencesProvider')
  }
  return context
}
