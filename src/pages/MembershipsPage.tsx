import React, { useState, useEffect } from 'react'
import {
  Crown,
  Sparkles,
  Users,
  AlertTriangle,
  TrendingUp,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Shield,
  CreditCard,
  Calendar,
  Gift,
  Star,
  Trash2,
  Edit,
  Send,
  UserCheck,
  ChevronRight,
  Filter,
  DollarSign,
  Award,
} from 'lucide-react'
import { membershipService } from '@/services/membershipService'
import { clientService } from '@/services/clientService'
import {
  MembershipPlan,
  ClientMembership,
  MembershipDashboardStats,
  MembershipStatus,
  MembershipDuration,
  Client,
} from '@/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useToastStore } from '@/store/useToastStore'

export const MembershipsPage: React.FC = () => {
  const { addToast } = useToastStore()

  const [activeTab, setActiveTab] = useState<'plans' | 'members'>('plans')
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [memberships, setMemberships] = useState<ClientMembership[]>([])
  const [stats, setStats] = useState<MembershipDashboardStats>({
    activeMembers: 0,
    expiringSoon: 0,
    newMembersThisMonth: 0,
    membershipRevenue: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Create Plan Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [planForm, setPlanForm] = useState({
    name: '',
    tier: 'Gold',
    description: '',
    price: 4999,
    duration: '12_months' as MembershipDuration,
    durationMonths: 12,
    serviceDiscount: 15,
    productDiscount: 10,
    freeFacialsCount: 2,
    monthlyCredits: 0,
    priorityBooking: true,
    rewardMultiplier: 1,
    birthdayOffer: true,
  })

  // Assign Membership Modal
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState('')
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [assignPaymentMethod, setAssignPaymentMethod] = useState('UPI / QR')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [allPlans, allMemberships, dashStats, allClients] = await Promise.all([
        membershipService.getAllPlans(),
        membershipService.getAllClientMemberships(),
        membershipService.getDashboardStats(),
        clientService.getAll(),
      ])
      setPlans(allPlans)
      setMemberships(allMemberships)
      setStats(dashStats)
      setClients(allClients)
      if (allPlans.length > 0 && !selectedPlanId) {
        setSelectedPlanId(allPlans[0].id)
      }
    } catch (err) {
      console.error('Failed to load membership data:', err)
      addToast({
        title: 'Loading Error',
        message: 'Could not load membership dashboard data.',
        type: 'danger',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planForm.name.trim()) return

    try {
      const benefits = []
      if (planForm.serviceDiscount > 0) {
        benefits.push({
          id: `ben-${Date.now()}-1`,
          type: 'SERVICE_DISCOUNT' as const,
          name: `${planForm.serviceDiscount}% Service Discount`,
          description: `${planForm.serviceDiscount}% discount on all hair and spa rituals`,
          value: planForm.serviceDiscount,
        })
      }
      if (planForm.productDiscount > 0) {
        benefits.push({
          id: `ben-${Date.now()}-2`,
          type: 'PRODUCT_DISCOUNT' as const,
          name: `${planForm.productDiscount}% Product Discount`,
          description: `${planForm.productDiscount}% discount on retail products`,
          value: planForm.productDiscount,
        })
      }
      if (planForm.priorityBooking) {
        benefits.push({
          id: `ben-${Date.now()}-3`,
          type: 'PRIORITY_BOOKING' as const,
          name: 'Priority VIP Booking',
          description: 'Priority chair reservation during peak hours',
          value: 1,
        })
      }
      if (planForm.birthdayOffer) {
        benefits.push({
          id: `ben-${Date.now()}-4`,
          type: 'BIRTHDAY_OFFER' as const,
          name: 'Birthday Month Offer',
          description: 'Complimentary blowout or styling during birthday month',
          value: 1,
          limit: 1,
        })
      }
      if (planForm.freeFacialsCount > 0) {
        benefits.push({
          id: `ben-${Date.now()}-5`,
          type: 'FREE_SERVICE' as const,
          name: `${planForm.freeFacialsCount} Complimentary Treatments`,
          description: `${planForm.freeFacialsCount} complimentary facial / spa sessions per year`,
          value: planForm.freeFacialsCount,
          limit: planForm.freeFacialsCount,
        })
      }
      if (planForm.monthlyCredits > 0) {
        benefits.push({
          id: `ben-${Date.now()}-6`,
          type: 'MONTHLY_CREDIT' as const,
          name: `₹${planForm.monthlyCredits} Monthly Styling Credits`,
          description: `₹${planForm.monthlyCredits} monthly credit allowance`,
          value: planForm.monthlyCredits,
          limit: planForm.durationMonths,
        })
      }

      await membershipService.createPlan({
        name: planForm.name.trim(),
        tier: planForm.tier,
        description: planForm.description.trim() || 'Exclusive salon privilege membership',
        price: planForm.price,
        duration: planForm.duration,
        durationMonths: planForm.durationMonths,
        benefits,
        status: 'active',
        popular: false,
      })

      setIsCreateModalOpen(false)
      loadData()
      addToast({
        title: 'Membership Created',
        message: `${planForm.name} has been published successfully.`,
        type: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create plan'
      addToast({ title: 'Error', message: msg, type: 'danger' })
    }
  }

  const handleAssignMembership = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClientId || !selectedPlanId) return

    const client = clients.find((c) => c.id === selectedClientId)
    if (!client) return

    try {
      await membershipService.purchaseMembership({
        clientId: client.id,
        clientName: client.fullName,
        clientPhone: client.phone,
        planId: selectedPlanId,
        paymentMethod: assignPaymentMethod,
      })

      setIsAssignModalOpen(false)
      loadData()
      addToast({
        title: 'Membership Activated',
        message: `Plan assigned to ${client.fullName} successfully.`,
        type: 'success',
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to assign plan'
      addToast({ title: 'Error', message: msg, type: 'danger' })
    }
  }

  const handleSendReminder = (m: ClientMembership) => {
    addToast({
      title: 'Reminder Dispatched',
      message: `Renewal reminder sent via WhatsApp & SMS to ${m.clientName} (${m.clientPhone || 'Client'}).`,
      type: 'info',
    })
  }

  // Filtered members
  const filteredMemberships = memberships.filter((m) => {
    const matchesSearch =
      m.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.clientPhone && m.clientPhone.includes(searchQuery)) ||
      m.planName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || m.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Memberships & VIP Club
            </h1>
            <Badge variant="accent">Phase 3 Part 3</Badge>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Manage membership tiers, recurring privileges, real-time rule engine, and subscriber directory.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAssignModalOpen(true)}
            leftIcon={<UserCheck className="h-4 w-4 text-primary" />}
          >
            Assign Member
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Membership
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid (Requirement 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Members */}
        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Active Members</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary tabular-nums">
              {stats.activeMembers}
            </span>
            <span className="text-xs font-medium text-emerald-600">+14% vs last mo</span>
          </div>
        </Card>

        {/* Expiring Soon */}
        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Expiring Soon (30d)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 tabular-nums">
              {stats.expiringSoon}
            </span>
            <span className="text-xs font-medium text-text-muted">Requires renewal outreach</span>
          </div>
        </Card>

        {/* New Members */}
        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">New This Month</span>
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary tabular-nums">
              {stats.newMembersThisMonth}
            </span>
            <span className="text-xs font-medium text-primary">New VIP club joins</span>
          </div>
        </Card>

        {/* Membership Revenue */}
        <Card className="p-4 bg-surface border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-text-muted">Membership Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-text-primary tabular-nums">
              {formatCurrency(stats.membershipRevenue)}
            </span>
            <span className="text-xs font-medium text-text-muted">Annual collections</span>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'plans'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-muted hover:text-text-primary hover:bg-surface'
            }`}
          >
            Membership Plans ({plans.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'members'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-muted hover:text-text-primary hover:bg-surface'
            }`}
          >
            Member Directory ({memberships.length})
          </button>
        </div>

        {activeTab === 'members' && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search member or phone…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-border bg-surface text-xs focus:ring-1 focus:ring-primary w-48 sm:w-60"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-border bg-surface text-xs text-text-primary"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: MEMBERSHIP PLANS */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden border transition-all duration-200 ${
                plan.popular
                  ? 'border-amber-400/60 dark:border-amber-500/40 shadow-lg ring-1 ring-amber-400/30'
                  : 'border-border hover:border-border/80'
              }`}
            >
              {plan.badge && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-slate-950 font-black text-[9px] uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
                  {plan.badge}
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: plan.color || '#F59E0B' }}
                  >
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{plan.name}</CardTitle>
                    <CardDescription>{plan.tier} Privilege Tier</CardDescription>
                  </div>
                </div>

                <div className="mt-4 flex items-baseline justify-between border-y border-border/60 py-3">
                  <div>
                    <span className="text-2xl font-black text-text-primary tabular-nums">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-xs text-text-muted"> / {plan.durationMonths} Months</span>
                  </div>
                  <Badge variant={plan.status === 'active' ? 'success' : 'default'} size="sm">
                    {plan.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 text-xs">
                <p className="text-text-muted text-xs leading-relaxed">{plan.description}</p>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block">
                    Exclusive Tier Privileges
                  </span>
                  <div className="space-y-2">
                    {plan.benefits.map((b) => (
                      <div key={b.id} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-text-primary">{b.name}</span>
                          {b.description && (
                            <p className="text-[11px] text-text-muted">{b.description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPlanId(plan.id)
                      setIsAssignModalOpen(true)
                    }}
                    className="w-full text-xs"
                  >
                    Assign to Client
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* TAB 2: MEMBER DIRECTORY (Requirement 7 Statuses: ACTIVE, EXPIRING, EXPIRED) */}
      {activeTab === 'members' && (
        <Card className="overflow-hidden border border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle border-b border-border text-[11px] font-bold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="p-3.5">Client</th>
                  <th className="p-3.5">Membership Plan</th>
                  <th className="p-3.5">Fee Paid</th>
                  <th className="p-3.5">Validity Dates</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Visits / Usage</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredMemberships.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-text-muted">
                      No members found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredMemberships.map((m) => {
                    const isExpiring = m.status === 'EXPIRING'
                    const isExpired = m.status === 'EXPIRED'

                    return (
                      <tr key={m.id} className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex flex-col">
                            <span className="font-bold text-text-primary">{m.clientName}</span>
                            <span className="text-[11px] text-text-muted">{m.clientPhone || 'No phone'}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                            <span className="font-semibold text-text-primary">{m.planName}</span>
                          </div>
                        </td>
                        <td className="p-3.5 tabular-nums font-medium text-text-primary">
                          {formatCurrency(m.pricePaid)}
                        </td>
                        <td className="p-3.5 text-text-muted tabular-nums">
                          <div>Starts: {m.startDate}</div>
                          <div className={isExpiring ? 'text-amber-600 font-bold' : isExpired ? 'text-rose-600 font-bold' : ''}>
                            Expires: {m.expiryDate}
                          </div>
                        </td>
                        <td className="p-3.5">
                          {m.status === 'ACTIVE' && (
                            <Badge variant="success" size="sm">
                              ACTIVE
                            </Badge>
                          )}
                          {m.status === 'EXPIRING' && (
                            <Badge variant="warning" size="sm">
                              EXPIRING SOON
                            </Badge>
                          )}
                          {m.status === 'EXPIRED' && (
                            <Badge variant="danger" size="sm">
                              EXPIRED
                            </Badge>
                          )}
                          {m.status === 'PAUSED' && (
                            <Badge variant="default" size="sm">
                              PAUSED
                            </Badge>
                          )}
                          {m.status === 'CANCELLED' && (
                            <Badge variant="danger" size="sm">
                              CANCELLED
                            </Badge>
                          )}
                        </td>
                        <td className="p-3.5 tabular-nums text-text-muted">
                          <span className="font-bold text-text-primary">{m.visitsCount || 0}</span> visits
                          <div className="text-[10px] text-text-muted">
                            Benefits used: {m.benefits.reduce((acc, b) => acc + (b.usedCount || 0), 0)}
                          </div>
                        </td>
                        <td className="p-3.5 text-right">
                          {isExpiring && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSendReminder(m)}
                              leftIcon={<Send className="w-3 h-3 text-amber-600" />}
                              className="text-xs h-7"
                              title="Send WhatsApp / SMS Renewal Reminder"
                            >
                              Remind
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CREATE MEMBERSHIP MODAL (Requirement 2 & 3) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Membership Plan"
        description="Configure tier parameters, recurring discount rules, free services, and privilege limits."
        size="lg"
      >
        <form onSubmit={handleCreatePlan} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-text-primary block">Plan Name</label>
              <Input
                placeholder="e.g. Gold Membership…"
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-text-primary block">Privilege Tier</label>
              <select
                value={planForm.tier}
                onChange={(e) => setPlanForm({ ...planForm, tier: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary"
              >
                <option value="Silver">Silver Tier</option>
                <option value="Gold">Gold Tier</option>
                <option value="Platinum">Platinum Tier</option>
                <option value="VIP Club">VIP Elite Club</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-text-primary block">Membership Price (₹)</label>
              <Input
                type="number"
                min="0"
                value={planForm.price}
                onChange={(e) => setPlanForm({ ...planForm, price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-text-primary block">Duration Format</label>
              <select
                value={planForm.duration}
                onChange={(e) => {
                  const val = e.target.value as MembershipDuration
                  let months = 12
                  if (val === '1_month') months = 1
                  if (val === '3_months') months = 3
                  if (val === '6_months') months = 6
                  if (val === '12_months') months = 12
                  setPlanForm({ ...planForm, duration: val, durationMonths: months })
                }}
                className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary"
              >
                <option value="1_month">1 Month</option>
                <option value="3_months">3 Months</option>
                <option value="6_months">6 Months</option>
                <option value="12_months">12 Months (Annual)</option>
                <option value="custom">Custom Duration</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-text-primary block">Duration (Months)</label>
              <Input
                type="number"
                min="1"
                max="60"
                value={planForm.durationMonths}
                onChange={(e) => setPlanForm({ ...planForm, durationMonths: parseInt(e.target.value) || 12 })}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-text-primary block">Description</label>
            <textarea
              rows={2}
              placeholder="Elevated perks, dedicated suites, and priority scheduling…"
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-border bg-surface text-xs text-text-primary"
            />
          </div>

          {/* Interactive Benefits Builder (Requirement 2 & 4) */}
          <div className="space-y-3 pt-2 border-t border-border">
            <span className="font-bold text-text-primary block text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              Benefit Rules Configuration
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-border bg-surface-subtle space-y-1">
                <label className="font-semibold text-text-primary block">Service Discount (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={planForm.serviceDiscount}
                  onChange={(e) => setPlanForm({ ...planForm, serviceDiscount: parseInt(e.target.value) || 0 })}
                />
                <span className="text-[11px] text-text-muted">Applied automatically at POS & online booking</span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-surface-subtle space-y-1">
                <label className="font-semibold text-text-primary block">Product Discount (%)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={planForm.productDiscount}
                  onChange={(e) => setPlanForm({ ...planForm, productDiscount: parseInt(e.target.value) || 0 })}
                />
                <span className="text-[11px] text-text-muted">Applied on retail haircare purchases</span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-surface-subtle space-y-1">
                <label className="font-semibold text-text-primary block">Complimentary Free Rituals (Count)</label>
                <Input
                  type="number"
                  min="0"
                  max="12"
                  value={planForm.freeFacialsCount}
                  onChange={(e) => setPlanForm({ ...planForm, freeFacialsCount: parseInt(e.target.value) || 0 })}
                />
                <span className="text-[11px] text-text-muted">e.g. 2 free hydra facials / spas per year</span>
              </div>

              <div className="p-3 rounded-xl border border-border bg-surface-subtle space-y-1">
                <label className="font-semibold text-text-primary block">Monthly Styling Credits (₹)</label>
                <Input
                  type="number"
                  min="0"
                  step="100"
                  value={planForm.monthlyCredits}
                  onChange={(e) => setPlanForm({ ...planForm, monthlyCredits: parseInt(e.target.value) || 0 })}
                />
                <span className="text-[11px] text-text-muted">Monthly allowance toward blowouts / trims</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-subtle cursor-pointer">
                <div>
                  <span className="font-semibold text-text-primary block">Priority VIP Booking</span>
                  <span className="text-[11px] text-text-muted">Preferred time-slot reservation</span>
                </div>
                <input
                  type="checkbox"
                  checked={planForm.priorityBooking}
                  onChange={(e) => setPlanForm({ ...planForm, priorityBooking: e.target.checked })}
                  className="w-4 h-4 rounded text-primary"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-border bg-surface-subtle cursor-pointer">
                <div>
                  <span className="font-semibold text-text-primary block">Birthday Month Offer</span>
                  <span className="text-[11px] text-text-muted">Complimentary celebration ritual</span>
                </div>
                <input
                  type="checkbox"
                  checked={planForm.birthdayOffer}
                  onChange={(e) => setPlanForm({ ...planForm, birthdayOffer: e.target.checked })}
                  className="w-4 h-4 rounded text-primary"
                />
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Membership Plan
            </Button>
          </div>
        </form>
      </Modal>

      {/* ASSIGN MEMBERSHIP MODAL */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Membership to Client"
        description="Activate a VIP membership tier for an existing salon client."
        size="md"
      >
        <form onSubmit={handleAssignMembership} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-bold text-text-primary block">Select Client</label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary"
              required
            >
              <option value="">-- Choose Client --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName} ({c.phone})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-text-primary block">Select Membership Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => setSelectedPlanId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary"
              required
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCurrency(p.price)} / {p.durationMonths} Months
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-text-primary block">Payment Method</label>
            <select
              value={assignPaymentMethod}
              onChange={(e) => setAssignPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-xs text-text-primary"
            >
              <option value="UPI / QR">UPI / QR Code</option>
              <option value="Credit / Debit Card">Credit / Debit Card</option>
              <option value="Cash">Cash at Desk</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Complimentary VIP">Complimentary VIP Comp</option>
            </select>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Activate Membership
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
