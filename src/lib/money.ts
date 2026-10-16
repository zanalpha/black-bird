import type { TxType } from '@/types/finance'

export const MAX_AMOUNT = 1_000_000_000_000

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

const thousands = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
})

export function formatRupiah(amount: number) {
  return rupiah.format(amount)
}

export function formatSignedRupiah(type: TxType, amount: number) {
  const formatted = rupiah.format(Math.abs(amount))
  return type === 'pemasukan' ? `+${formatted}` : `−${formatted}`
}

export function formatThousands(amountDigits: string) {
  if (!amountDigits) return ''
  const value = Number(amountDigits)
  if (!Number.isSafeInteger(value)) return ''
  return thousands.format(value)
}

export function sanitizeAmount(raw: string) {
  return raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 15)
}
