export function browserNotificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function browserPermission(): NotificationPermission | 'unsupported' {
  if (!browserNotificationsSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestBrowserPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!browserNotificationsSupported()) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export function showBrowserNotification(title: string, body: string, tag: string): boolean {
  if (!browserNotificationsSupported() || Notification.permission !== 'granted') return false
  try {
    new Notification(title, { body, lang: 'id', tag })
    return true
  } catch {
    return false
  }
}

export async function playChime(): Promise<void> {
  const AudioContextCtor =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) return
  const context = new AudioContextCtor()
  try {
    await context.resume()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(784, context.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(1174, context.currentTime + 0.16)
    gain.gain.setValueAtTime(0.0001, context.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.5)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start()
    oscillator.stop(context.currentTime + 0.55)
    oscillator.onended = () => {
      void context.close()
    }
  } catch {
    void context.close()
  }
}
