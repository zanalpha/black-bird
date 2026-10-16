import { typeLabel } from '@/lib/finance'
import type { Transaction } from '@/types/finance'

function escapeCell(value: string) {
  if (/[;"\r\n]/.test(value)) return `"${value.replaceAll('"', '""')}"`
  return value
}

export function toCsv(transactions: Transaction[]) {
  const header = ['Tanggal', 'Jenis', 'Kategori', 'Nominal', 'Catatan']
  const rows = transactions.map((tx) => [
    tx.date,
    typeLabel(tx.type),
    tx.category,
    String(tx.amount),
    tx.note,
  ])
  const body = [header, ...rows]
    .map((row) => row.map(escapeCell).join(';'))
    .join('\r\n')
  return `\uFEFF${body}`
}

export function downloadCsv(filename: string, transactions: Transaction[]) {
  const blob = new Blob([toCsv(transactions)], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
