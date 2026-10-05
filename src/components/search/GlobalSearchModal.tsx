import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Users,
  CalendarCheck2,
  Sparkles,
  UserCheck,
  PackageCheck,
  CreditCard,
  ArrowRight,
  X,
} from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { searchService } from '@/services/searchService'
import { GlobalSearchResultItem } from '@/types'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  client: <Users className="h-4 w-4 text-sky-500" aria-hidden="true" />,
  appointment: <CalendarCheck2 className="h-4 w-4 text-primary" aria-hidden="true" />,
  service: <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />,
  staff: <UserCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />,
  product: <PackageCheck className="h-4 w-4 text-amber-500" aria-hidden="true" />,
  invoice: <CreditCard className="h-4 w-4 text-blue-500" aria-hidden="true" />,
}

const CATEGORIES = [
  { id: 'all', label: 'All Results' },
  { id: 'client', label: 'Clients' },
  { id: 'appointment', label: 'Appointments' },
  { id: 'service', label: 'Services' },
  { id: 'staff', label: 'Staff' },
  { id: 'product', label: 'Inventory' },
  { id: 'invoice', label: 'Invoices' },
]

export const GlobalSearchModal: React.FC = () => {
  const { isSearchOpen, closeSearch } = useUIStore()
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [results, setResults] = useState<GlobalSearchResultItem[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isSearchOpen])

  useEffect(() => {
    let isMounted = true
    setIsLoading(true)

    searchService.searchAll(query).then((items) => {
      if (!isMounted) return
      setResults(items)
      setIsLoading(false)
      setSelectedIndex(0)
    })

    return () => {
      isMounted = false
    }
  }, [query])

  const filteredResults = activeCategory === 'all'
    ? results
    : results.filter((item) => item.type === activeCategory)

  const handleSelect = (item: GlobalSearchResultItem) => {
    closeSearch()
    navigate(item.url)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredResults.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(1, filteredResults.length))
    } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
      e.preventDefault()
      handleSelect(filteredResults[selectedIndex])
    } else if (e.key === 'Escape') {
      closeSearch()
    }
  }

  if (!isSearchOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Search Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 overscroll-contain animate-in fade-in duration-150"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={closeSearch}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden z-10">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-border bg-surface">
          <Search className="h-5 w-5 text-text-muted shrink-0 mr-3" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search clients, appointments, treatments, staff, SKU…"
            autoComplete="off"
            spellCheck={false}
            className="w-full h-14 bg-transparent text-text-primary text-sm placeholder:text-text-muted focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search input"
              className="p-1 rounded-lg text-text-muted hover:text-text-primary mr-1"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex rounded-md border border-border bg-surface-subtle px-1.5 py-0.5 text-[10px] font-semibold text-text-muted">
            ESC
          </kbd>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border/70 bg-surface-subtle/50 overflow-x-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
                activeCategory === cat.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto overscroll-contain p-2">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-text-muted">
              Searching database…
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-text-primary">No matching records found</p>
              <p className="text-xs text-text-muted mt-1">
                Try searching for client names, services like “Balayage”, or invoice numbers.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredResults.map((item, index) => {
                const isSelected = index === selectedIndex
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-xl text-left transition-[background-color] duration-100',
                      isSelected ? 'bg-primary-50/80 dark:bg-primary-950/40 text-primary' : 'hover:bg-surface-subtle text-text-primary'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div className="h-9 w-9 rounded-xl bg-surface border border-border flex items-center justify-center shrink-0 shadow-xs">
                        {TYPE_ICONS[item.type] || <Sparkles className="h-4 w-4" />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-text-primary truncate">
                          {item.title}
                        </span>
                        <span className="text-xs text-text-muted truncate mt-0.5">
                          {item.subtitle}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.badgeText && (
                        <Badge variant={item.badgeVariant || 'default'} size="sm">
                          {item.badgeText}
                        </Badge>
                      )}
                      <ArrowRight className="h-4 w-4 text-text-muted shrink-0" aria-hidden="true" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 border-t border-border bg-surface-subtle/50 flex items-center justify-between text-[11px] text-text-muted">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1 py-0.5 border border-border bg-surface rounded text-[10px]">↑</kbd>{' '}
              <kbd className="px-1 py-0.5 border border-border bg-surface rounded text-[10px]">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1 py-0.5 border border-border bg-surface rounded text-[10px]">↵</kbd> to select
            </span>
          </div>
          <span>SALORA FastSearch</span>
        </div>
      </div>
    </div>
  )
}
