import type { AccentId, Preferences, TextSize } from '@/types/finance'

export const PREF_KEY = 'blackbird.preferences.v1'

export const ACCENTS: { id: AccentId; label: string; swatch: string }[] = [
  { id: 'hitam', label: 'Hitam', swatch: '#141414' },
  { id: 'perak', label: 'Perak', swatch: '#6b7280' },
  { id: 'emas', label: 'Emas', swatch: '#a68446' },
  { id: 'merah', label: 'Merah', swatch: '#9f3a3a' },
  { id: 'hijau', label: 'Hijau', swatch: '#1f6b45' },
]

export const TEXT_SIZES: { id: TextSize; label: string }[] = [
  { id: 'sm', label: 'Kecil' },
  { id: 'md', label: 'Sedang' },
  { id: 'lg', label: 'Besar' },
]

export const DEFAULT_PREFERENCES: Preferences = {
  theme: 'dark',
  accent: 'hitam',
  textSize: 'md',
  view: 'tabel',
}

function isAccent(value: unknown): value is AccentId {
  return ACCENTS.some((item) => item.id === value)
}

function isTextSize(value: unknown): value is TextSize {
  return value === 'sm' || value === 'md' || value === 'lg'
}

function defaultView(): Preferences['view'] {
  if (typeof window === 'undefined') return 'tabel'
  return window.matchMedia('(max-width: 767px)').matches ? 'kartu' : 'tabel'
}

export function loadPreferences(): Preferences {
  const fallback = { ...DEFAULT_PREFERENCES, view: defaultView() }
  try {
    const raw = localStorage.getItem(PREF_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<Preferences>
    return {
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      accent: isAccent(parsed.accent) ? parsed.accent : 'hitam',
      textSize: isTextSize(parsed.textSize) ? parsed.textSize : 'md',
      view:
        parsed.view === 'kartu' || parsed.view === 'tabel'
          ? parsed.view
          : fallback.view,
    }
  } catch {
    return fallback
  }
}

export function savePreferences(preferences: Preferences) {
  localStorage.setItem(PREF_KEY, JSON.stringify(preferences))
}
