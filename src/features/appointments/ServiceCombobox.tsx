import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Service } from '@/types'
import { serviceService } from '@/services/serviceService'
import { formatCurrency } from '@/utils/formatters'
import { Search, Clock, Check, Scissors, X } from 'lucide-react'

interface ServiceComboboxProps {
  selectedServiceId: string
  onSelectService: (service: Service) => void
  services?: Service[]
  error?: string
  className?: string
}

export const ServiceCombobox: React.FC<ServiceComboboxProps> = ({
  selectedServiceId,
  onSelectService,
  services: propServices,
  error,
  className = '',
}) => {
  const [services, setServices] = useState<Service[]>(propServices || [])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (propServices && propServices.length > 0) {
      setServices(propServices)
    } else {
      serviceService.getAll().then((data) => setServices(data))
    }
  }, [propServices])

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>()
    services.forEach((s) => {
      if (s.categoryName) set.add(s.categoryName)
      else if (s.category) set.add(s.category)
    })
    return ['All', ...Array.from(set)]
  }, [services])

  // Filtered services
  const filteredServices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return services.filter((srv) => {
      const cat = srv.categoryName || srv.category || ''
      const matchesCategory =
        selectedCategory === 'All' || cat.toLowerCase() === selectedCategory.toLowerCase()
      const matchesSearch =
        !q ||
        srv.name.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q) ||
        (srv.description && srv.description.toLowerCase().includes(q))
      return matchesCategory && matchesSearch
    })
  }, [services, searchQuery, selectedCategory])

  const selectedService = useMemo(
    () => services.find((s) => s.id === selectedServiceId) || null,
    [services, selectedServiceId]
  )

  const handleSelect = (service: Service) => {
    onSelectService(service)
    setIsDropdownOpen(false)
    setSearchQuery('')
  }

  return (
    <div ref={containerRef} className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label
          htmlFor="service-search-input"
          className="block text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5"
        >
          <Scissors className="h-3.5 w-3.5 text-primary" />
          Service / Ritual <span className="text-danger">*</span>
        </label>
        {selectedService && (
          <span className="text-xs font-medium text-text-muted">
            Duration: <strong className="text-text-primary font-mono tabular-nums">{selectedService.duration || 45} min</strong>
          </span>
        )}
      </div>

      {/* Selected Service Card / Input Trigger */}
      <div className="relative">
        <div
          role="button"
          tabIndex={0}
          aria-expanded={isDropdownOpen}
          aria-haspopup="listbox"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setIsDropdownOpen(!isDropdownOpen)
            }
          }}
          className={`w-full min-h-[46px] p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            selectedService
              ? 'border-primary/40 bg-primary/5 hover:border-primary/60'
              : 'border-border hover:border-border-hover'
          } ${error ? 'border-danger' : ''}`}
        >
          {selectedService ? (
            <div className="flex items-center justify-between w-full min-w-0 pr-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Scissors className="h-4 w-4" />
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-bold text-text-primary truncate">
                    {selectedService.name}
                  </p>
                  <p className="text-xs text-text-muted flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {selectedService.duration || 45} min
                    </span>
                    <span>•</span>
                    <span className="text-text-secondary font-medium">
                      {selectedService.categoryName || selectedService.category || 'Treatment'}
                    </span>
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-base font-extrabold text-primary tabular-nums">
                  {formatCurrency(selectedService.price || 0, 'INR')}
                </span>
                <p className="text-[10px] text-text-muted">incl. taxes</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-text-muted">
              <Search className="h-4 w-4" />
              <span>Select salon service ritual…</span>
            </div>
          )}
        </div>

        {/* Dropdown Card */}
        {isDropdownOpen && (
          <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-xl border border-border bg-surface shadow-2xl p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted pointer-events-none" />
              <input
                id="service-search-input"
                type="text"
                autoFocus
                autoComplete="off"
                spellCheck={false}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services (e.g. Hair Cut, Facial, Balayage)…"
                className="w-full h-9 pl-9 pr-8 rounded-lg border border-border bg-surface text-xs text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            {categories.length > 2 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-surface-hover text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* List of Services */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-0.5" role="listbox">
              {filteredServices.length > 0 ? (
                filteredServices.map((service) => {
                  const isSelected = service.id === selectedServiceId
                  return (
                    <button
                      key={service.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(service)}
                      className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-colors border ${
                        isSelected
                          ? 'border-primary bg-primary/10 shadow-xs'
                          : 'border-transparent hover:border-border hover:bg-surface-hover'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-text-primary truncate">
                            {service.name}
                          </p>
                          {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                          <span className="flex items-center gap-1 font-mono tabular-nums">
                            <Clock className="h-3 w-3" />
                            {service.duration || 45} min
                          </span>
                          <span>•</span>
                          <span>{service.categoryName || service.category || 'Treatment'}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-sm font-bold text-text-primary tabular-nums">
                          {formatCurrency(service.price || 0, 'INR')}
                        </span>
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="p-4 text-center text-xs text-text-muted">
                  No services found matching “{searchQuery}”
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
    </div>
  )
}
