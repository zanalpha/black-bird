import { ScheduleProvider } from '@/context/ScheduleContext'
import { AppShell } from '@/components/layout/AppShell'
import { Toaster } from '@/components/ui/sonner'

export default function App() {
  return (
    <ScheduleProvider>
      <AppShell />
      <Toaster position="top-center" offset={16} />
    </ScheduleProvider>
  )
}
