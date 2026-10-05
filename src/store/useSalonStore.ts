import { create } from 'zustand'
import { Salon, SalonOnboardingData, BookingSettings } from '@/types'
import { firestoreService, SALORA_COLLECTIONS } from '@/services/firebase/firestoreService'
import { isFirebaseConfigured } from '@/lib/firebase'

interface SalonState {
  salon: Salon
  onboardingData: SalonOnboardingData
  loadSalonFromFirestore: () => Promise<void>
  updateSalon: (updates: Partial<Salon>) => void
  updateBookingSettings: (settings: Partial<BookingSettings>) => void
  updatePrintingSettings: (settings: Partial<NonNullable<Salon['printingSettings']>>) => void
  updateNotificationSettings: (settings: Partial<NonNullable<Salon['notificationSettings']>>) => void
  updateTaxInformation: (settings: Partial<NonNullable<Salon['taxInformation']>>) => void
  updateOnboardingData: (updates: Partial<SalonOnboardingData>) => void
  applyOnboardingToSalon: () => void
  resetOnboarding: () => void
}

const defaultEmptySalon: Salon = {
  id: 'main',
  name: 'Salora',
  tagline: 'Salon & Spa Studio',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  postalCode: '',
  businessHours: {
    open: '09:00',
    close: '20:00',
  },
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  bookingSettings: {
    onlineBookingEnabled: true,
    advanceBookingDays: 30,
    minimumNoticeHours: 1,
    cancellationWindowHours: 2,
    rescheduleWindowHours: 2,
    depositType: 'none',
    depositAmount: 0,
    allowStaffSelection: true,
    allowPreferredStaff: true,
    showPricing: true,
    showServiceDuration: true,
    bufferTimeMinutes: 5,
  },
  printingSettings: {
    paperWidth: '80mm',
    autoPrintReceipts: false,
    receiptHeader: 'Salora',
    receiptFooter: 'Thank you for visiting!',
    showGstNumber: true,
    tokenPrefix: 'T-',
  },
  notificationSettings: {
    sendAppointmentSms: false,
    sendAppointmentWhatsapp: false,
    sendEmailReceipts: false,
    sendMarketingPromos: false,
    senderId: 'SALORA',
  },
  openHours: [
    { day: 'Monday', open: '09:00', close: '20:00', closed: false },
    { day: 'Tuesday', open: '09:00', close: '20:00', closed: false },
    { day: 'Wednesday', open: '09:00', close: '20:00', closed: false },
    { day: 'Thursday', open: '09:00', close: '20:00', closed: false },
    { day: 'Friday', open: '09:00', close: '20:00', closed: false },
    { day: 'Saturday', open: '09:00', close: '20:00', closed: false },
    { day: 'Sunday', open: '10:00', close: '18:00', closed: true },
  ],
}

const defaultOnboarding: SalonOnboardingData = {
  salonName: 'Salora',
  salonTagline: 'Luxury Hair & Wellness Studio',
  logoUrl: '/salora.png',
  city: '',
  state: '',
  postalCode: '',
  phone: '',
  openingTime: '09:00',
  closingTime: '20:00',
  workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  services: [],
  firstStaff: {
    name: '',
    email: '',
    phone: '',
    role: 'Stylist',
  },
}

const SALON_STORAGE_KEY = 'SALORA_active_salon'

const getInitialSalon = (): Salon => {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(SALON_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // If it's old demo salon data, purge it
        if (!parsed.id || parsed.name === 'LuxeCut Studio & Spa') {
          localStorage.removeItem(SALON_STORAGE_KEY)
          return defaultEmptySalon
        }
        return parsed
      }
    } catch {
      // fallback
    }
  }
  return defaultEmptySalon
}

export const useSalonStore = create<SalonState>((set, get) => {
  // Listen or load from salon/main if Firebase is configured
  if (typeof window !== 'undefined' && isFirebaseConfigured) {
    firestoreService
      .get<Salon>(SALORA_COLLECTIONS.SALON, 'main')
      .then((salonDoc) => {
        if (salonDoc) {
          set({ salon: salonDoc })
          localStorage.setItem(SALON_STORAGE_KEY, JSON.stringify(salonDoc))
        }
      })
      .catch((err) => {
        console.warn('[useSalonStore] Could not load salon/main:', err)
      })
  }

  return {
    salon: getInitialSalon(),
    onboardingData: defaultOnboarding,

    loadSalonFromFirestore: async () => {
      if (!isFirebaseConfigured) return
      try {
        const doc = await firestoreService.get<Salon>(SALORA_COLLECTIONS.SALON, 'main')
        if (doc) {
          set({ salon: doc })
          if (typeof window !== 'undefined') {
            localStorage.setItem(SALON_STORAGE_KEY, JSON.stringify(doc))
          }
        }
      } catch (err) {
        console.warn('[useSalonStore] loadSalonFromFirestore error:', err)
      }
    },

    updateSalon: (updates) => {
      const updated = { ...get().salon, ...updates, updatedAt: new Date().toISOString() }
      if (typeof window !== 'undefined') {
        localStorage.setItem(SALON_STORAGE_KEY, JSON.stringify(updated))
      }
      set({ salon: updated })

      if (isFirebaseConfigured) {
        firestoreService.set(SALORA_COLLECTIONS.SALON, 'main', updated, { merge: true }).catch((err) => {
          console.warn('[useSalonStore] Failed to sync salon to Firestore:', err)
        })
      }
    },

    updateBookingSettings: (settingsUpdates) => {
      const currentSettings = get().salon.bookingSettings || defaultEmptySalon.bookingSettings!
      const updatedSalon = {
        ...get().salon,
        bookingSettings: {
          ...currentSettings,
          ...settingsUpdates,
        },
        updatedAt: new Date().toISOString(),
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(SALON_STORAGE_KEY, JSON.stringify(updatedSalon))
      }
      set({ salon: updatedSalon })

      if (isFirebaseConfigured) {
        firestoreService.set(SALORA_COLLECTIONS.SALON, 'main', updatedSalon, { merge: true }).catch(console.warn)
      }
    },

    updatePrintingSettings: (settingsUpdates) => {
      const currentSettings = get().salon.printingSettings || defaultEmptySalon.printingSettings!
      const updatedSalon = {
        ...get().salon,
        printingSettings: {
          ...currentSettings,
          ...settingsUpdates,
        },
        updatedAt: new Date().toISOString(),
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(SALON_STORAGE_KEY, JSON.stringify(updatedSalon))
      }
      set({ salon: updatedSalon })

      if (isFirebaseConfigured) {
        firestoreService.set(SALORA_COLLECTIONS.SALON, 'main', updatedSalon, { merge: true }).catch(console.warn)
      }
    },

    updateNotificationSettings: (settingsUpdates) => {
      const currentSettings = get().salon.notificationSettings || defaultEmptySalon.notificationSettings!
      const updatedSalon = {
        ...get().salon,
        notificationSettings: {
          ...currentSettings,
          ...settingsUpdates,
        },
        updatedAt: new Date().toISOString(),
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(SALON_STORAGE_KEY, JSON.stringify(updatedSalon))
      }
      set({ salon: updatedSalon })

      if (isFirebaseConfigured) {
        firestoreService.set(SALORA_COLLECTIONS.SALON, 'main', updatedSalon, { merge: true }).catch(console.warn)
      }
    },

    updateTaxInformation: (settingsUpdates) => {
      const currentSettings = get().salon.taxInformation || defaultEmptySalon.taxInformation || {
        businessTaxId: '',
        defaultGstRate: 18,
        pricesIncludeTax: false,
      }
      const updatedSalon = {
        ...get().salon,
        taxInformation: {
          ...currentSettings,
          ...settingsUpdates,
        },
        updatedAt: new Date().toISOString(),
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(SALON_STORAGE_KEY, JSON.stringify(updatedSalon))
      }
      set({ salon: updatedSalon })

      if (isFirebaseConfigured) {
        firestoreService.set(SALORA_COLLECTIONS.SALON, 'main', updatedSalon, { merge: true }).catch(console.warn)
      }
    },

    updateOnboardingData: (updates) =>
      set((state) => ({
        onboardingData: { ...state.onboardingData, ...updates },
      })),

    applyOnboardingToSalon: () => {
      const data = get().onboardingData
      const updated: Salon = {
        ...get().salon,
        name: data.salonName || get().salon.name,
        tagline: data.salonTagline || get().salon.tagline,
        city: data.city || get().salon.city,
        state: data.state || get().salon.state,
        pincode: data.postalCode || get().salon.pincode,
        postalCode: data.postalCode || get().salon.postalCode,
        phone: data.phone || get().salon.phone,
        openHours: [
          { day: 'Monday', open: data.openingTime, close: data.closingTime, closed: !data.workingDays.includes('Monday') },
          { day: 'Tuesday', open: data.openingTime, close: data.closingTime, closed: !data.workingDays.includes('Tuesday') },
          { day: 'Wednesday', open: data.openingTime, close: data.closingTime, closed: !data.workingDays.includes('Wednesday') },
          { day: 'Thursday', open: data.openingTime, close: data.closingTime, closed: !data.workingDays.includes('Thursday') },
          { day: 'Friday', open: data.openingTime, close: data.closingTime, closed: !data.workingDays.includes('Friday') },
          { day: 'Saturday', open: data.openingTime, close: data.closingTime, closed: !data.workingDays.includes('Saturday') },
          { day: 'Sunday', open: data.openingTime, close: data.closingTime, closed: !data.workingDays.includes('Sunday') },
        ],
        updatedAt: new Date().toISOString(),
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(SALON_STORAGE_KEY, JSON.stringify(updated))
      }
      set({ salon: updated })

      if (isFirebaseConfigured) {
        firestoreService.set(SALORA_COLLECTIONS.SALON, 'main', updated, { merge: true }).catch(console.warn)
      }
    },

    resetOnboarding: () => set({ onboardingData: defaultOnboarding }),
  }
})
