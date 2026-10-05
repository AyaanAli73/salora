import { create } from 'zustand'

interface ThemeState {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('SALORA-theme') as 'light' | 'dark'
    if (saved) return saved
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
  }
  return 'light'
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggleTheme: () =>
    set((state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light'
      if (typeof window !== 'undefined') {
        localStorage.setItem('SALORA-theme', nextTheme)
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark')
          document.documentElement.classList.remove('light')
        } else {
          document.documentElement.classList.remove('dark')
          document.documentElement.classList.add('light')
        }
        const meta = document.querySelector('meta[name="theme-color"]')
        if (meta) {
          meta.setAttribute('content', nextTheme === 'dark' ? '#0F0E1E' : '#FFFFFF')
        }
      }
      return { theme: nextTheme }
    }),
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('SALORA-theme', theme)
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.remove('dark')
        document.documentElement.classList.add('light')
      }
      const meta = document.querySelector('meta[name="theme-color"]')
      if (meta) {
        meta.setAttribute('content', theme === 'dark' ? '#0F0E1E' : '#FFFFFF')
      }
    }
    set({ theme })
  },
}))
