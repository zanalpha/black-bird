export const MIN_YEAR = 2000
export const MAX_YEAR = 2100

export const MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const

export const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
] as const

export function todayISO() {
  const date = new Date()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function currentMonthKey() {
  return todayISO().slice(0, 7)
}

export function isValidISODate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return false
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

export function isYearInRange(year: number) {
  return year >= MIN_YEAR && year <= MAX_YEAR
}

export function formatDateLong(iso: string) {
  if (!isValidISODate(iso)) return iso
  const [year, month, day] = iso.split('-').map(Number)
  return `${day} ${MONTHS[month - 1]} ${year}`
}

export function formatMonthLabel(yearMonth: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(yearMonth)
  if (!match) return yearMonth
  const month = Number(match[2])
  if (month < 1 || month > 12) return yearMonth
  return `${MONTHS[month - 1]} ${match[1]}`
}

export function shiftMonth(yearMonth: string, delta: number) {
  const match = /^(\d{4})-(\d{2})$/.exec(yearMonth)
  if (!match) return currentMonthKey()
  const date = new Date(Number(match[1]), Number(match[2]) - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function canShiftMonth(yearMonth: string, delta: number) {
  const next = shiftMonth(yearMonth, delta)
  return isYearInRange(Number(next.slice(0, 4)))
}
