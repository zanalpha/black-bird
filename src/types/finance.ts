export type TxType = 'pemasukan' | 'pengeluaran'

export type ThemeMode = 'light' | 'dark'

export type AccentId = 'hitam' | 'perak' | 'emas' | 'merah' | 'hijau'

export type TextSize = 'sm' | 'md' | 'lg'

export type TransactionView = 'tabel' | 'kartu'

export type Transaction = {
  id: string
  type: TxType
  amount: number
  date: string
  category: string
  note: string
  createdAt: string
  updatedAt: string
}

export type TransactionInput = {
  type: TxType
  amount: number
  date: string
  category: string
  note: string
}

export type Preferences = {
  theme: ThemeMode
  accent: AccentId
  textSize: TextSize
  view: TransactionView
}

export type TransactionFilter = {
  search: string
  type: 'semua' | TxType
  category: string
  from: string
  to: string
}

export type FieldErrors = Partial<
  Record<'amount' | 'date' | 'category' | 'note', string>
>
