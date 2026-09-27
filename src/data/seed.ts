import type { Schedule } from '@/types/schedule'

const createdAt = '2026-09-01T00:00:00.000Z'

function seed(
  id: string,
  name: string,
  day: Schedule['day'],
  startTime: string,
  endTime: string,
  room: string,
): Schedule {
  return {
    id,
    name,
    courseName: '',
    type: 'kuliah',
    day,
    startTime,
    endTime,
    room,
    lecturer: '',
    notes: '',
    createdAt,
    updatedAt: createdAt,
  }
}

/** Jadwal kuliah awal. Praktikum sengaja kosong sampai kampus mengirimkannya. */
export const SEED_SCHEDULES: Schedule[] = [
  seed('seed-sistem-multimedia', 'Sistem Multimedia', 2, '14:40', '16:20', 'SportCenter'),
  seed('seed-technopreneurship', 'Technopreneurship', 3, '10:30', '12:10', 'GS4A'),
  seed('seed-keamanan-jaringan', 'Sistem Keamanan Jaringan', 6, '10:30', '12:10', 'GS4A'),
  seed('seed-network-troubleshooting', 'Network Troubleshooting', 6, '12:10', '13:50', 'GS4C'),
]
