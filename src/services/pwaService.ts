// PWA Registration, Install Prompt, and Notification Service

export type InstallPromptOutcome = 'accepted' | 'dismissed' | 'unavailable'

class PWAService {
  private deferredPrompt: any = null
  private installListeners: Array<(canInstall: boolean) => void> = []

  constructor() {
    this.init()
  }

  private init() {
    if (typeof window === 'undefined') return

    // 1. Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] ServiceWorker registered with scope:', registration.scope)

            // Listen for updates
            registration.onupdatefound = () => {
              const installingWorker = registration.installing
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                      console.log('[PWA] New version available! Reloading advised.')
                    }
                  }
                }
              }
            }
          })
          .catch((error) => {
            console.warn('[PWA] ServiceWorker registration failed:', error)
          })
      })
    }

    // 2. Capture 'beforeinstallprompt'
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.deferredPrompt = e
      this.notifyInstallListeners(true)
    })

    // 3. Track appinstalled
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null
      this.notifyInstallListeners(false)
      console.log('[PWA] Salora was successfully installed.')
    })
  }

  // --- Installability ---
  public canInstall(): boolean {
    return this.deferredPrompt !== null
  }

  public isStandalone(): boolean {
    if (typeof window === 'undefined') return false
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    )
  }

  public isIOS(): boolean {
    if (typeof window === 'undefined') return false
    const ua = window.navigator.userAgent.toLowerCase()
    return /iphone|ipad|ipod/.test(ua)
  }

  public async promptInstall(): Promise<InstallPromptOutcome> {
    if (!this.deferredPrompt) {
      return 'unavailable'
    }

    try {
      this.deferredPrompt.prompt()
      const choice = await this.deferredPrompt.userChoice
      this.deferredPrompt = null
      this.notifyInstallListeners(false)
      return choice.outcome as InstallPromptOutcome
    } catch (err) {
      console.warn('[PWA] Install prompt failed:', err)
      return 'unavailable'
    }
  }

  public subscribeInstallChange(callback: (canInstall: boolean) => void): () => void {
    this.installListeners.push(callback)
    callback(this.canInstall())
    return () => {
      this.installListeners = this.installListeners.filter((cb) => cb !== callback)
    }
  }

  private memoryDismissUntil: number | null = null

  public isDismissedRecently(): boolean {
    let dismissedUntil: string | null = null
    if (typeof localStorage !== 'undefined') {
      dismissedUntil = localStorage.getItem('salora_pwa_dismissed_until')
    } else if (this.memoryDismissUntil) {
      dismissedUntil = String(this.memoryDismissUntil)
    }
    return Boolean(dismissedUntil && Date.now() < Number(dismissedUntil))
  }

  public dismissPrompt(days: number = 7) {
    const cooldownMs = Date.now() + 1000 * 60 * 60 * 24 * days
    this.memoryDismissUntil = cooldownMs
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('salora_pwa_dismissed_until', String(cooldownMs))
    }
  }

  private notifyInstallListeners(canInstall: boolean) {
    this.installListeners.forEach((cb) => cb(canInstall))
  }

  // --- Push Notifications Architecture ---
  public async getNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied'
    }
    return Notification.permission
  }

  public async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied'
    }
    const permission = await Notification.requestPermission()
    return permission
  }

  public async sendNotification(
    title: string,
    options?: {
      body?: string
      icon?: string
      badge?: string
      data?: { url?: string; type?: string }
      tag?: string
    }
  ): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }

    if (Notification.permission !== 'granted') {
      const p = await this.requestNotificationPermission()
      if (p !== 'granted') return false
    }

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready
        if (reg.showNotification) {
          await reg.showNotification(title, {
            body: options?.body || '',
            icon: options?.icon || '/salora.png',
            badge: options?.badge || '/salora.png',
            data: options?.data || { url: '/dashboard' },
            tag: options?.tag,
          })
          return true
        }
      }

      // Fallback to desktop Notification constructor
      new Notification(title, {
        body: options?.body,
        icon: options?.icon || '/salora.png',
      })
      return true
    } catch (err) {
      console.warn('[PWA] Notification display failed:', err)
      return false
    }
  }

  // Specific Business Notification Triggers
  public async sendAppointmentReminder(clientName: string, serviceName: string, timeStr: string) {
    return this.sendNotification(`Appointment Reminder — ${serviceName}`, {
      body: `Hi ${clientName}, your session is booked for today at ${timeStr}. We are excited to see you!`,
      data: { url: '/appointments', type: 'appointment_reminder' },
      tag: 'apt-reminder',
    })
  }

  public async sendQueueAlert(tokenNumber: string, clientName: string, station: string = 'Station 2') {
    return this.sendNotification(`Token #${tokenNumber} is Next!`, {
      body: `${clientName}, your stylist is ready for you at ${station}.`,
      data: { url: '/appointments/queue', type: 'queue_alert' },
      tag: `token-${tokenNumber}`,
    })
  }

  public async sendPaymentNotification(invoiceNumber: string, amountFormatted: string, method: string) {
    return this.sendNotification(`Payment Succeeded — ${amountFormatted}`, {
      body: `Invoice #${invoiceNumber} settled via ${method.toUpperCase()}. E-Receipt issued.`,
      data: { url: '/sales', type: 'payment_received' },
      tag: `invoice-${invoiceNumber}`,
    })
  }

  public async sendBusinessAlert(title: string, summary: string) {
    return this.sendNotification(`Salora HQ: ${title}`, {
      body: summary,
      data: { url: '/dashboard', type: 'business_alert' },
      tag: 'biz-alert',
    })
  }
}

export const pwaService = new PWAService()
