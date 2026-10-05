import { create } from 'zustand'

interface UIState {
  isSidebarCollapsed: boolean
  isMobileSidebarOpen: boolean
  isSearchOpen: boolean
  isNewAppointmentModalOpen: boolean
  isNewClientModalOpen: boolean
  activeDrawer: string | null
  
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleMobileSidebar: () => void
  setMobileSidebarOpen: (open: boolean) => void
  openSearch: () => void
  closeSearch: () => void
  setSearchOpen: (open: boolean) => void
  openNewAppointmentModal: () => void
  closeNewAppointmentModal: () => void
  openNewClientModal: () => void
  closeNewClientModal: () => void
  setActiveDrawer: (drawerId: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarCollapsed: false,
  isMobileSidebarOpen: false,
  isSearchOpen: false,
  isNewAppointmentModalOpen: false,
  isNewClientModalOpen: false,
  activeDrawer: null,

  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
  toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
  setMobileSidebarOpen: (isMobileSidebarOpen) => set({ isMobileSidebarOpen }),
  openSearch: () => set({ isSearchOpen: true }),
  closeSearch: () => set({ isSearchOpen: false }),
  setSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
  openNewAppointmentModal: () => set({ isNewAppointmentModalOpen: true }),
  closeNewAppointmentModal: () => set({ isNewAppointmentModalOpen: false }),
  openNewClientModal: () => set({ isNewClientModalOpen: true }),
  closeNewClientModal: () => set({ isNewClientModalOpen: false }),
  setActiveDrawer: (activeDrawer) => set({ activeDrawer }),
}))
