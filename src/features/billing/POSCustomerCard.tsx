import React, { useState, useMemo, useEffect } from 'react'
import { Client, Staff, ClientMembership, ClientPackageWallet } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { SearchInput } from '@/components/ui/SearchInput'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { clientService } from '@/services/clientService'
import { staffService } from '@/services/staffService'
import { formatCurrency } from '@/utils/formatters'
import {
  User,
  Phone,
  Mail,
  Calendar,
  Hash,
  Scissors,
  UserPlus,
  AlertTriangle,
  Crown,
  Package,
  Sparkles,
  Gift,
  Tag,
} from 'lucide-react'
import { pricingBenefitService } from '@/services/pricingBenefitService'
import { loyaltyService } from '@/services/loyaltyService'
import { RewardRedemption } from '@/types'
import { cn } from '@/utils/cn'

interface POSCustomerCardProps {
  client: Client | null
  isWalkIn: boolean
  walkInName: string
  walkInPhone: string
  appointmentId: string | null
  tokenId: string | null
  staffId: string
  staffName: string
  onSelectClient: (client: Client | null) => void
  onSetWalkIn: (name: string, phone?: string) => void
  onSelectStaff: (staffId: string, staffName: string) => void
}

export const POSCustomerCard: React.FC<POSCustomerCardProps> = ({
  client,
  isWalkIn,
  walkInName,
  walkInPhone,
  appointmentId,
  tokenId,
  staffId,
  staffName,
  onSelectClient,
  onSetWalkIn,
  onSelectStaff,
}) => {
  const [clients, setClients] = useState<Client[]>([])
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isChangingClient, setIsChangingClient] = useState(!client && !walkInName)
  const [mode, setMode] = useState<'existing' | 'walkin'>(isWalkIn ? 'walkin' : 'existing')

  const [inputName, setInputName] = useState(walkInName)
  const [inputPhone, setInputPhone] = useState(walkInPhone)

  // Active Membership, Package Wallets & Loyalty for selected client
  const [activeMembership, setActiveMembership] = useState<ClientMembership | null>(null)
  const [activeWallets, setActiveWallets] = useState<ClientPackageWallet[]>([])
  const [loyaltyBalance, setLoyaltyBalance] = useState<number>(0)
  const [clientVouchers, setClientVouchers] = useState<RewardRedemption[]>([])

  useEffect(() => {
    clientService.getAll().then((c) => setClients(c || [])).catch(() => {})
    staffService.getAll().then((s) => {
      setStaffList(s || [])
      if (s && s.length > 0 && !staffId) {
        onSelectStaff(s[0].id, s[0].name)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    let isMounted = true
    if (!client?.id) {
      setActiveMembership(null)
      setActiveWallets([])
      setLoyaltyBalance(0)
      setClientVouchers([])
      return
    }

    Promise.all([
      pricingBenefitService.getClientActiveMembership(client.id),
      pricingBenefitService.getClientPackageWallets(client.id),
      loyaltyService.getClientBalance(client.id),
      loyaltyService.getClientVouchers(client.id),
    ]).then(([mem, wallets, bal, vchs]) => {
      if (isMounted) {
        setActiveMembership(mem)
        setActiveWallets(wallets)
        setLoyaltyBalance(bal)
        setClientVouchers(vchs)
      }
    })

    return () => {
      isMounted = false
    }
  }, [client?.id])

  // Filter existing clients
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients.slice(0, 4)
    const q = searchQuery.toLowerCase().trim()
    return clients.filter(
      (c) =>
        c.fullName?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.email?.toLowerCase().includes(q)
    )
  }, [searchQuery, clients])

  const handlePickClient = (c: Client) => {
    onSelectClient(c)
    setIsChangingClient(false)
  }

  const handleSaveWalkIn = () => {
    onSetWalkIn(inputName.trim() || 'Walk-In Guest', inputPhone.trim())
    setIsChangingClient(false)
  }

  return (
    <Card className="border border-border/80 bg-surface shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            Customer & Specialist
          </CardTitle>

          <button
            type="button"
            onClick={() => setIsChangingClient(!isChangingClient)}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {isChangingClient ? 'Done' : 'Change'}
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* CHANGING / SEARCHING CLIENT VIEW */}
        {isChangingClient ? (
          <div className="space-y-3">
            {/* Mode Switcher */}
            <div className="flex items-center p-0.5 rounded-lg bg-surface-subtle border border-border text-xs">
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`flex-1 py-1 font-semibold rounded-md transition-colors ${
                  mode === 'existing'
                    ? 'bg-surface text-text-primary shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Existing Client
              </button>
              <button
                type="button"
                onClick={() => setMode('walkin')}
                className={`flex-1 py-1 font-semibold rounded-md transition-colors ${
                  mode === 'walkin'
                    ? 'bg-surface text-text-primary shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                + Walk-In Guest
              </button>
            </div>

            {mode === 'existing' ? (
              <div className="space-y-2">
                <SearchInput
                  placeholder="Search name, phone or email…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClear={() => setSearchQuery('')}
                />

                <div className="max-h-48 overflow-y-auto space-y-1 pr-1 text-xs">
                  {filteredClients.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handlePickClient(c)}
                      className="p-2.5 rounded-xl border border-border hover:border-primary/50 hover:bg-surface-hover cursor-pointer transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={c.fullName} src={c.avatarUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="font-bold text-text-primary truncate">{c.fullName}</p>
                          <p className="text-[11px] text-text-muted">{c.phone}</p>
                        </div>
                      </div>
                      {c.isVip && (
                        <Badge variant="accent" size="sm">
                          VIP
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="font-semibold text-text-secondary block mb-1">
                    Guest Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Priya Sharma"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg bg-surface border border-border text-xs text-text-primary"
                  />
                </div>
                <div>
                  <label className="font-semibold text-text-secondary block mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. (310) 555-0144"
                    value={inputPhone}
                    onChange={(e) => setInputPhone(e.target.value)}
                    className="w-full h-8 px-2.5 rounded-lg bg-surface border border-border text-xs text-text-primary"
                  />
                </div>
                <Button variant="primary" size="sm" onClick={handleSaveWalkIn} className="w-full">
                  Set Walk-In Guest
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* ACTIVE SELECTED CUSTOMER CARD */
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-subtle border border-border">
              <Avatar
                name={client?.fullName || walkInName || 'Walk-In'}
                src={client?.avatarUrl}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-text-primary text-sm truncate">
                    {client?.fullName || walkInName || 'Walk-In Guest'}
                  </p>
                  {client?.isVip && (
                    <Badge variant="accent" size="sm">
                      VIP
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-text-muted mt-0.5">
                  {client?.phone || walkInPhone || 'No phone recorded'}
                </p>
                {client?.email && (
                  <p className="text-[11px] text-text-muted truncate">{client.email}</p>
                )}
              </div>
            </div>

            {/* Active Membership Tier Card */}
            {activeMembership && (
              <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Crown className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-amber-800 dark:text-amber-300">
                        {activeMembership.tier} Member
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                        {activeMembership.benefits.find((b) => b.type === 'SERVICE_DISCOUNT')?.value || 15}% Discount
                      </span>
                    </div>
                    <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                      Expires: {new Date(activeMembership.endDate || activeMembership.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • Visits: {activeMembership.totalVisits ?? activeMembership.visitsCount ?? 0}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={activeMembership.status === 'EXPIRING' ? 'warning' : 'accent'}
                  size="sm"
                  className="uppercase text-[9px] font-black"
                >
                  {activeMembership.status}
                </Badge>
              </div>
            )}

            {/* Active Service Package Wallets */}
            {activeWallets.length > 0 && (
              <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 space-y-1.5 text-xs">
                <div className="flex items-center justify-between font-bold text-teal-800 dark:text-teal-300">
                  <span className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-teal-600" />
                    Prepaid Package Wallet
                  </span>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-500/20 px-1.5 py-0.2 rounded">
                    {activeWallets.length} {activeWallets.length === 1 ? 'Pass' : 'Passes'}
                  </span>
                </div>
                {activeWallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className="p-2 rounded-lg bg-surface/80 border border-teal-500/20 text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between font-bold text-text-primary">
                      <span>{wallet.packageName}</span>
                      <span className="text-[10px] text-teal-600 font-mono">Pass #{wallet.id.slice(-4)}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px]">
                      {wallet.items.map((it) => (
                        <span
                          key={it.serviceName}
                          className={cn(
                            'px-1.5 py-0.5 rounded font-medium',
                            it.remainingQuantity > 0
                              ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 font-bold'
                              : 'bg-surface-subtle text-text-muted line-through'
                          )}
                        >
                          {it.serviceName}: {it.remainingQuantity}/{it.totalQuantity} left
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Loyalty Points & Active Vouchers Card */}
            {client && (
              <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/30 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                      <Gift className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-pink-900 dark:text-pink-200">
                          {loyaltyBalance} Loyalty Points
                        </span>
                        {client.referralCode && (
                          <span className="text-[10px] font-mono font-bold text-pink-700 dark:text-pink-300 bg-pink-500/20 px-1.5 py-0.2 rounded">
                            {client.referralCode}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-pink-700/80 dark:text-pink-400/80 mt-0.5">
                        ≈ {formatCurrency(Math.floor(loyaltyBalance / 2))} instant salon redemption value
                      </p>
                    </div>
                  </div>

                  <Badge variant="accent" size="sm" className="font-bold text-[10px]">
                    Active
                  </Badge>
                </div>

                {/* Available Vouchers Pill List */}
                {clientVouchers.filter((v) => v.status === 'ACTIVE').length > 0 && (
                  <div className="pt-1 border-t border-pink-500/20 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-pink-800 dark:text-pink-300 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Available Vouchers to Apply:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {clientVouchers
                        .filter((v) => v.status === 'ACTIVE')
                        .map((v) => (
                          <span
                            key={v.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-900 dark:text-pink-100 font-mono font-bold text-[10px]"
                          >
                            <span>{v.code}</span>
                            <span className="text-pink-700 dark:text-pink-300 font-sans">
                              ({v.type === 'DISCOUNT_VOUCHER' ? `₹${v.value}` : 'Free Ritual'})
                            </span>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Client Balance Warning if outstanding due */}
            {client && (client.outstandingBalance || 0) > 0 && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-400 flex items-center justify-between">
                <span className="flex items-center gap-1 font-semibold">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Prior Due Balance:
                </span>
                <span className="font-black tabular-nums">
                  {formatCurrency(client.outstandingBalance || 0)}
                </span>
              </div>
            )}

            {/* Linked Appointment / Queue Token Meta */}
            {(appointmentId || tokenId) && (
              <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                  Linked Reception Reference
                </span>
                <div className="flex flex-wrap items-center gap-2 font-medium">
                  {appointmentId && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-border text-[11px] text-text-secondary">
                      <Calendar className="h-3 w-3 text-primary" />
                      Appt: {appointmentId}
                    </span>
                  )}
                  {tokenId && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface border border-border text-[11px] font-black text-primary font-sans">
                      <Hash className="h-3 w-3" />
                      Token #{tokenId.replace('tok-', '')}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SPECIALIST ASSIGNMENT */}
        <div className="space-y-1.5 pt-3 border-t border-border text-xs">
          <label className="font-semibold text-text-secondary flex items-center gap-1.5">
            <Scissors className="h-3.5 w-3.5 text-primary" />
            Billing Specialist
          </label>
          <select
            aria-label="Billing Specialist"
            value={staffId}
            onChange={(e) => {
              const st = staffList.find((s) => s.id === e.target.value)
              if (st) onSelectStaff(st.id, st.name)
            }}
            className="w-full h-9 px-2.5 rounded-xl bg-surface border border-border text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-medium"
          >
            {staffList.length === 0 ? (
              <option value="">No specialists added yet</option>
            ) : (
              staffList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name} — {st.role}
                </option>
              ))
            )}
          </select>
        </div>
      </CardContent>
    </Card>
  )
}
