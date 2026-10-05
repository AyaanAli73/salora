import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Client } from '@/types'
import { clientService } from '@/services/clientService'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/formatters'
import {
  Search,
  UserPlus,
  X,
  Calendar,
  Phone,
  ChevronDown,
} from 'lucide-react'

interface ClientComboboxProps {
  selectedClient: Client | null
  onSelectClient: (client: Client | null) => void
  onOpenNewClientModal: () => void
  autoFocus?: boolean
  disabled?: boolean
  className?: string
  required?: boolean
  error?: string
}

export const ClientCombobox: React.FC<ClientComboboxProps> = ({
  selectedClient,
  onSelectClient,
  onOpenNewClientModal,
  autoFocus = true,
  disabled = false,
  className = '',
  required = true,
  error,
}) => {
  const [clients, setClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxRef = useRef<HTMLUListElement>(null)

  // Fetch all clients & subscribe to changes
  useEffect(() => {
    let isMounted = true
    const loadClients = async () => {
      try {
        const data = await clientService.getAll()
        if (isMounted) setClients(data)
      } catch (err) {
        console.error('Failed to load clients in combobox:', err)
      }
    }
    loadClients()

    // Listen to new client creations
    const handleClientCreated = (e: any) => {
      loadClients()
      if (e.detail) {
        // Auto-select is handled by callback, but ensure client is in local list
        setClients((prev) => [e.detail, ...prev.filter((c) => c.id !== e.detail.id)])
      }
    }

    window.addEventListener('salora:client-created', handleClientCreated)
    return () => {
      isMounted = false
      window.removeEventListener('salora:client-created', handleClientCreated)
    }
  }, [])

  // Auto focus input on mount if requested
  useEffect(() => {
    if (autoFocus && !selectedClient && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus, selectedClient])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Filter clients by Name, Phone, Email
  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    const cleanQ = q.replace(/\D/g, '')

    if (!q) {
      // Show first 8 recent / active clients
      return clients.slice(0, 8)
    }

    return clients
      .filter((client) => {
        const nameMatch = client.fullName.toLowerCase().includes(q)
        const emailMatch = client.email ? client.email.toLowerCase().includes(q) : false
        const cleanPhone = client.phone.replace(/\D/g, '')
        const phoneMatch =
          client.phone.includes(q) || (cleanQ.length > 0 && cleanPhone.includes(cleanQ))

        return nameMatch || emailMatch || phoneMatch
      })
      .slice(0, 10)
  }, [clients, searchQuery])

  // Scroll active item into view
  useEffect(() => {
    if (isOpen && listboxRef.current) {
      const activeElement = listboxRef.current.children[highlightedIndex] as HTMLElement
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        setIsOpen(true)
        return
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < filteredClients.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredClients.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (filteredClients.length > 0 && filteredClients[highlightedIndex]) {
          onSelectClient(filteredClients[highlightedIndex])
          setIsOpen(false)
          setSearchQuery('')
        } else if (searchQuery.trim()) {
          // Open create modal if no result and pressed enter
          onOpenNewClientModal()
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        break
      default:
        break
    }
  }

  const handleSelect = (client: Client) => {
    onSelectClient(client)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClearSelected = () => {
    onSelectClient(null)
    setSearchQuery('')
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  return (
    <div ref={containerRef} className={`space-y-1.5 ${className}`}>
      {/* Header Label + "+ New Client" Action */}
      <div className="flex items-center justify-between">
        <label
          htmlFor="client-search-input"
          className="block text-xs font-bold uppercase tracking-wider text-text-muted"
        >
          Customer {required && <span className="text-danger">*</span>}
        </label>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onOpenNewClientModal}
          leftIcon={<UserPlus className="h-3.5 w-3.5 text-primary" />}
          className="h-7 px-2.5 text-xs font-semibold text-primary border-primary/30 hover:border-primary hover:bg-primary/5 active:scale-98 transition-colors"
        >
          + New Client
        </Button>
      </div>

      {/* When a client is already selected */}
      {selectedClient ? (
        <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between gap-3 transition-colors hover:border-primary/50 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              src={selectedClient.avatarUrl}
              name={selectedClient.fullName}
              size="md"
              className="ring-2 ring-primary/20 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-text-primary truncate">
                  {selectedClient.fullName}
                </span>
                {selectedClient.isVip && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    VIP
                  </span>
                )}
                {selectedClient.status === 'new' && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    New
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-text-muted mt-0.5">
                <span className="font-mono tabular-nums flex items-center gap-1">
                  <Phone className="h-3 w-3 text-text-muted shrink-0" />
                  {selectedClient.phone}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-text-muted shrink-0" />
                  Last Visit:{' '}
                  {selectedClient.lastVisitDate
                    ? formatDate(selectedClient.lastVisitDate)
                    : 'First appointment'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearSelected}
              className="h-8 px-2.5 text-xs text-text-secondary hover:text-text-primary"
            >
              Change
            </Button>
            <button
              type="button"
              onClick={handleClearSelected}
              aria-label="Remove selected client"
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Combobox Input */
        <div className="relative">
          <div className="relative flex items-center">
            <Search className="absolute left-3 h-4 w-4 text-text-muted pointer-events-none" />
            <input
              ref={inputRef}
              id="client-search-input"
              type="text"
              role="combobox"
              aria-expanded={isOpen}
              aria-autocomplete="list"
              aria-controls="client-search-listbox"
              autoComplete="off"
              spellCheck={false}
              disabled={disabled}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setHighlightedIndex(0)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search client by name or phone..."
              className={`w-full h-11 pl-9 pr-10 rounded-xl border text-sm bg-surface text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                error
                  ? 'border-danger focus-visible:ring-danger'
                  : 'border-border hover:border-border-hover'
              }`}
            />
            {searchQuery ? (
              <button
                type="button"
                aria-label="Clear search input"
                onClick={() => {
                  setSearchQuery('')
                  inputRef.current?.focus()
                }}
                className="absolute right-3 p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <ChevronDown className="absolute right-3.5 h-4 w-4 text-text-muted pointer-events-none" />
            )}
          </div>

          {/* Combobox Dropdown Results */}
          {isOpen && (
            <div
              id="client-search-listbox"
              role="listbox"
              className="absolute z-50 left-0 right-0 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-surface shadow-xl p-1.5 animate-in fade-in zoom-in-95 duration-150"
            >
              {filteredClients.length > 0 ? (
                <ul ref={listboxRef} className="space-y-1">
                  {filteredClients.map((client, index) => {
                    const isHighlighted = index === highlightedIndex
                    return (
                      <li
                        key={client.id}
                        role="option"
                        aria-selected={isHighlighted}
                        onClick={() => handleSelect(client)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`p-2.5 rounded-lg flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isHighlighted
                            ? 'bg-primary/10 text-text-primary'
                            : 'hover:bg-surface-hover text-text-secondary'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar
                            src={client.avatarUrl}
                            name={client.fullName}
                            size="md"
                            className="shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-text-primary truncate">
                                {client.fullName}
                              </p>
                              {client.isVip && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                  VIP
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-text-muted">
                              <span className="font-mono tabular-nums">{client.phone}</span>
                              <span>•</span>
                              <span>
                                Last Visit:{' '}
                                {client.lastVisitDate
                                  ? formatDate(client.lastVisitDate)
                                  : 'Never'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {isHighlighted && (
                          <div className="shrink-0 text-primary text-xs font-medium flex items-center gap-1">
                            <span>Select</span>
                            <span className="text-[10px] px-1 py-0.5 rounded bg-surface border border-primary/30 font-mono">
                              ↵
                            </span>
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              ) : (
                /* No matching clients */
                <div className="p-4 text-center space-y-3">
                  <p className="text-xs text-text-muted">
                    No client found matching “<span className="font-semibold text-text-primary">{searchQuery}</span>”
                  </p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={onOpenNewClientModal}
                    leftIcon={<UserPlus className="h-3.5 w-3.5" />}
                    className="w-full justify-center text-xs"
                  >
                    + Create New Client
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
    </div>
  )
}
