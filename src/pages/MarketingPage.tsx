import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Megaphone,
  Users,
  Tag,
  BarChart3,
  Plus,
  Sparkles,
  Send,
  Check,
  Play,
  Pause,
  AlertCircle,
  Eye,
  Clock,
  ShieldCheck,
  Smartphone,
  Mail,
  MessageSquare,
  ChevronRight,
  X,
  Filter,
  ArrowUpRight,
  Copy,
  RefreshCw,
  Gift,
  Coins,
  CheckCircle2,
  Calendar,
  AlertTriangle,
} from 'lucide-react'
import {
  CustomerSegment,
  MarketingCampaign,
  MarketingOffer,
  CampaignStatus,
  CommunicationChannel,
  OfferType,
  SegmentConditionField,
  SegmentOperator,
  Client,
  MarketingDashboardStats,
} from '@/types'
import { campaignService } from '@/services/campaignService'
import { offerService } from '@/services/offerService'
import { clientService } from '@/services/clientService'
import { filterClientsBySegment } from '@/services/marketing/segmentEvaluator'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

export const MarketingPage: React.FC = () => {
  const { addToast } = useToastStore()

  // Main navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'campaigns' | 'segments' | 'offers' | 'history'>('dashboard')

  // Data states
  const [stats, setStats] = useState<MarketingDashboardStats | null>(null)
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([])
  const [segments, setSegments] = useState<CustomerSegment[]>([])
  const [offers, setOffers] = useState<MarketingOffer[]>([])
  const [allClients, setAllClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Modals
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false)
  const [isCreateSegmentOpen, setIsCreateSegmentOpen] = useState(false)
  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false)
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false)
  const [isCustomerListModalOpen, setIsCustomerListModalOpen] = useState(false)
  const [isTestMessageModalOpen, setIsTestMessageModalOpen] = useState(false)

  // Selected entities for modals
  const [selectedSegmentForList, setSelectedSegmentForList] = useState<CustomerSegment | null>(null)
  const [matchingClientsList, setMatchingClientsList] = useState<Client[]>([])
  const [campaignToLaunch, setCampaignToLaunch] = useState<MarketingCampaign | null>(null)
  const [campaignForTest, setCampaignForTest] = useState<MarketingCampaign | null>(null)
  const [testRecipient, setTestRecipient] = useState('+91 98765 43210')
  const [isSendingTest, setIsSendingTest] = useState(false)

  // Campaign Form State
  const [campName, setCampName] = useState('')
  const [campSegmentId, setCampSegmentId] = useState('')
  const [campChannel, setCampChannel] = useState<CommunicationChannel>('WHATSAPP')
  const [campOfferCode, setCampOfferCode] = useState('')
  const [campStartDate, setCampStartDate] = useState(new Date().toISOString().split('T')[0])
  const [campEndDate, setCampEndDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [campSubject, setCampSubject] = useState('')
  const [campMessage, setCampMessage] = useState(
    'Hi {{customer_name}},\nTreat your hair to our restorative ritual. Enjoy special salon savings with code {{offer_details}} at {{salon_name}}!'
  )
  const [previewChannel, setPreviewChannel] = useState<CommunicationChannel>('WHATSAPP')

  // Segment Builder Form State
  const [builderName, setBuilderName] = useState('')
  const [builderDescription, setBuilderDescription] = useState('')
  const [builderCombinator, setBuilderCombinator] = useState<'AND' | 'OR'>('AND')
  const [builderConditions, setBuilderConditions] = useState<
    { id: string; field: SegmentConditionField; operator: SegmentOperator; value: any }[]
  >([
    { id: 'bc-1', field: 'lastVisitDays', operator: 'greaterThanOrEqual', value: 60 },
    { id: 'bc-2', field: 'totalSpending', operator: 'greaterThanOrEqual', value: 5000 },
  ])

  // Offer Builder Form State
  const [offerName, setOfferName] = useState('')
  const [offerCode, setOfferCode] = useState('')
  const [offerType, setOfferType] = useState<OfferType>('PERCENTAGE_DISCOUNT')
  const [offerValue, setOfferValue] = useState<number>(20)
  const [offerMinSpend, setOfferMinSpend] = useState<number>(1000)
  const [offerMaxDiscount, setOfferMaxDiscount] = useState<number>(1500)
  const [offerStartDate, setOfferStartDate] = useState(new Date().toISOString().split('T')[0])
  const [offerEndDate, setOfferEndDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [offerUsageLimit, setOfferUsageLimit] = useState<number>(500)
  const [offerCanStackLoyalty, setOfferCanStackLoyalty] = useState(false)
  const [offerCanStackMembership, setOfferCanStackMembership] = useState(false)

  // Filters
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<string>('ALL')
  const [historyChannelFilter, setHistoryChannelFilter] = useState<string>('ALL')

  const reloadData = async () => {
    setIsLoading(true)
    try {
      const [s, c, seg, off, clients] = await Promise.all([
        campaignService.getDashboardStats(),
        campaignService.getCampaigns(),
        campaignService.getSegments(),
        offerService.getAll(),
        clientService.getAll(),
      ])
      setStats(s)
      setCampaigns(c)
      setSegments(seg)
      setOffers(off)
      setAllClients(clients)
      if (seg.length > 0 && !campSegmentId) {
        setCampSegmentId(seg[0].id)
      }
    } catch (err) {
      console.warn('Failed loading marketing data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    reloadData()
  }, [])

  // Live audience calculation for Segment Builder
  const liveBuilderAudience = useMemo(() => {
    if (!allClients.length) return []
    return filterClientsBySegment(allClients, {
      combinator: builderCombinator,
      conditions: builderConditions,
    })
  }, [allClients, builderCombinator, builderConditions])

  // Click on audience count to view clients
  const handleOpenCustomerList = (segment: CustomerSegment) => {
    setSelectedSegmentForList(segment)
    const matches = filterClientsBySegment(allClients, segment)
    setMatchingClientsList(matches)
    setIsCustomerListModalOpen(true)
  }

  // Segment condition controls
  const handleAddCondition = () => {
    setBuilderConditions([
      ...builderConditions,
      {
        id: `bc-${Date.now()}`,
        field: 'totalVisits',
        operator: 'greaterThanOrEqual',
        value: 3,
      },
    ])
  }

  const handleRemoveCondition = (id: string) => {
    if (builderConditions.length <= 1) {
      addToast({
        title: 'At Least One Condition Required',
        message: 'A customer segment must define at least one rule.',
        type: 'warning',
      })
      return
    }
    setBuilderConditions(builderConditions.filter((c) => c.id !== id))
  }

  const handleUpdateCondition = (id: string, updates: Partial<(typeof builderConditions)[0]>) => {
    setBuilderConditions(
      builderConditions.map((c) => (c.id === id ? { ...c, ...updates } : c))
    )
  }

  const handleSaveSegment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!builderName.trim()) {
      addToast({ title: 'Name Required', message: 'Please specify a segment name.', type: 'warning' })
      return
    }
    try {
      await campaignService.createSegment({
        name: builderName.trim(),
        description: builderDescription.trim() || 'Custom segmented customer group',
        combinator: builderCombinator,
        conditions: builderConditions,
        isPreset: false,
      })
      addToast({
        title: 'Segment Created',
        message: `Saved "${builderName}" targeting ${liveBuilderAudience.length} matching customers.`,
        type: 'success',
      })
      setIsCreateSegmentOpen(false)
      setBuilderName('')
      setBuilderDescription('')
      reloadData()
    } catch (err: any) {
      addToast({ title: 'Error', message: err.message || 'Could not save segment.', type: 'danger' })
    }
  }

  // Offer Creation
  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!offerName.trim() || !offerCode.trim()) {
      addToast({ title: 'Fields Required', message: 'Offer name and coupon code are required.', type: 'warning' })
      return
    }
    try {
      await offerService.create({
        name: offerName.trim(),
        code: offerCode.trim().toUpperCase(),
        type: offerType,
        value: Number(offerValue),
        minimumSpend: Number(offerMinSpend) || undefined,
        maximumDiscount: Number(offerMaxDiscount) || undefined,
        applicableServices: ['ALL'],
        startDate: offerStartDate,
        endDate: offerEndDate,
        usageLimit: Number(offerUsageLimit) || undefined,
        canStackWithLoyalty: offerCanStackLoyalty,
        canStackWithMembershipDiscount: offerCanStackMembership,
        isActive: true,
      })
      addToast({
        title: 'Promotional Offer Created',
        message: `Coupon code "${offerCode.toUpperCase()}" is live and ready for billing.`,
        type: 'success',
      })
      setIsCreateOfferOpen(false)
      setOfferName('')
      setOfferCode('')
      reloadData()
    } catch (err: any) {
      addToast({ title: 'Error', message: err.message || 'Could not create offer.', type: 'danger' })
    }
  }

  // Campaign Creation
  const handleSaveCampaign = async (status: CampaignStatus = 'DRAFT') => {
    if (!campName.trim()) {
      addToast({ title: 'Campaign Name Required', message: 'Please provide a name for this campaign.', type: 'warning' })
      return
    }
    const targetSeg = segments.find((s) => s.id === campSegmentId)
    const audienceSize = targetSeg ? targetSeg.customerCount : 0

    try {
      const created = await campaignService.createCampaign({
        name: campName.trim(),
        segmentId: campSegmentId,
        segmentName: targetSeg?.name || 'Custom Audience',
        channel: campChannel,
        offerCode: campOfferCode || undefined,
        status,
        startDate: campStartDate,
        endDate: campEndDate,
        audienceSize,
        subject: campSubject || undefined,
        message: campMessage,
      })

      setIsCreateCampaignOpen(false)
      setCampName('')
      setCampOfferCode('')
      reloadData()

      if (status === 'RUNNING') {
        addToast({
          title: 'Campaign Launched!',
          message: `Campaign broadcast dispatched to ${audienceSize} customers via ${campChannel}.`,
          type: 'success',
        })
      } else {
        addToast({
          title: status === 'SCHEDULED' ? 'Campaign Scheduled' : 'Draft Saved',
          message: `Campaign saved successfully.`,
          type: 'info',
        })
      }
    } catch (err: any) {
      addToast({ title: 'Failed to Save Campaign', message: err.message, type: 'danger' })
    }
  }

  // Prompt Confirmation Safety Modal
  const handlePromptLaunch = (camp: MarketingCampaign) => {
    setCampaignToLaunch(camp)
    setIsSafetyModalOpen(true)
  }

  const handleConfirmLaunch = async () => {
    if (!campaignToLaunch) return
    try {
      await campaignService.updateStatus(campaignToLaunch.id, 'RUNNING')
      addToast({
        title: 'Campaign Activated & Dispatched',
        message: `Broadcast live! Dispatched to ${campaignToLaunch.audienceSize} targeted clients via ${campaignToLaunch.channel}.`,
        type: 'success',
      })
      setIsSafetyModalOpen(false)
      setCampaignToLaunch(null)
      reloadData()
    } catch (err: any) {
      addToast({ title: 'Launch Failed', message: err.message, type: 'danger' })
    }
  }

  // Send Test Campaign Message
  const handleSendTest = async () => {
    if (!campaignForTest || !testRecipient.trim()) return
    setIsSendingTest(true)
    try {
      await campaignService.sendTestMessage(campaignForTest.id, testRecipient.trim())
      addToast({
        title: 'Test Message Dispatched',
        message: `Simulated transmission dispatched to ${testRecipient}.`,
        type: 'success',
      })
      setIsTestMessageModalOpen(false)
    } catch (err: any) {
      addToast({ title: 'Test Failed', message: err.message, type: 'danger' })
    } finally {
      setIsSendingTest(false)
    }
  }

  // Interpolated Preview Text
  const previewText = useMemo(() => {
    let text = campMessage
    text = text.replace(/\{\{customer_name\}\}/gi, 'Priya Sharma')
    text = text.replace(/\{\{salon_name\}\}/gi, 'SALORA Luxe Studio')
    text = text.replace(/\{\{service_name\}\}/gi, 'Restorative Hair Spa')
    text = text.replace(/\{\{offer_details\}\}/gi, campOfferCode || 'GLOW25')
    text = text.replace(/\{\{amount\}\}/gi, '₹2,500')
    return text
  }, [campMessage, campOfferCode])

  return (
    <div className="space-y-6 animate-in fade-in duration-150 pb-12">
      {/* ─── Top Header & Workstation Actions ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-text-primary font-sans">
              Marketing & Campaign Workstation
            </h1>
            <Badge variant="primary" size="sm">
              Phase 3
            </Badge>
          </div>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Data-driven segmentation, dynamic promotional offers, and omnichannel customer engagement.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to="/marketing/communications">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<MessageSquare className="h-3.5 w-3.5 text-primary" />}
            >
              Communication Center
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateOfferOpen(true)}
            leftIcon={<Tag className="h-3.5 w-3.5 text-accent" />}
          >
            + Create Offer
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCreateSegmentOpen(true)}
            leftIcon={<Users className="h-3.5 w-3.5 text-emerald-500" />}
          >
            + Segment Builder
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setCampName('')
              setIsCreateCampaignOpen(true)
            }}
            leftIcon={<Megaphone className="h-3.5 w-3.5" />}
            className="shadow-glow-primary/30"
          >
            + New Campaign
          </Button>
        </div>
      </div>

      {/* ─── Main Tabs Bar ─── */}
      <div className="border-b border-border">
        <div className="flex items-center gap-2 overflow-x-auto pb-px">
          {[
            { id: 'dashboard', label: 'Dashboard & Metrics', icon: BarChart3 },
            { id: 'campaigns', label: 'Campaigns', count: campaigns.length, icon: Megaphone },
            { id: 'segments', label: 'Audience Segments', count: segments.length, icon: Users },
            { id: 'offers', label: 'Offers & Coupons', count: offers.length, icon: Tag },
            { id: 'history', label: 'Analytics & History', icon: Clock },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 py-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-[color,border-color]',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full tabular-nums',
                      isActive ? 'bg-primary/15 text-primary' : 'bg-surface-subtle text-text-muted'
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TAB 1: MARKETING DASHBOARD (Requirement 1)
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-6">
          {/* Top 6 KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Active Campaigns */}
            <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                Active Campaigns
              </span>
              <div className="text-2xl font-extrabold text-primary tabular-nums mt-1 font-sans">
                {stats.activeCampaigns}
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                ● Broadcasting Live
              </span>
            </div>

            {/* Messages Sent */}
            <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                Messages Sent
              </span>
              <div className="text-2xl font-extrabold text-text-primary tabular-nums mt-1 font-sans">
                {stats.messagesSent}
              </div>
              <span className="text-[10px] text-text-muted mt-1">All Omnichannels</span>
            </div>

            {/* Delivered */}
            <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                Delivered
              </span>
              <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 font-sans">
                {stats.delivered}
              </div>
              <span className="text-[10px] text-text-muted mt-1">
                {Math.round((stats.delivered / (stats.messagesSent || 1)) * 100)}% Delivery Rate
              </span>
            </div>

            {/* Opened / Read */}
            <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                Opened / Read
              </span>
              <div className="text-2xl font-extrabold text-sky-600 dark:text-sky-400 tabular-nums mt-1 font-sans">
                {stats.opened}
              </div>
              <span className="text-[10px] text-text-muted mt-1">
                {Math.round((stats.opened / (stats.delivered || 1)) * 100)}% Open Rate
              </span>
            </div>

            {/* Conversions */}
            <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                Conversions
              </span>
              <div className="text-2xl font-extrabold text-violet-600 dark:text-violet-400 tabular-nums mt-1 font-sans">
                {stats.conversions}
              </div>
              <span className="text-[10px] text-violet-600 dark:text-violet-400 font-bold mt-1">
                {Math.round((stats.conversions / (stats.opened || 1)) * 100)}% Redemption
              </span>
            </div>

            {/* Revenue From Campaigns */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Campaign Revenue
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-300 tabular-nums mt-1 font-sans">
                {formatCurrency(stats.revenueFromCampaigns, 'INR')}
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
                Direct Attributed ROI
              </span>
            </div>
          </div>

          {/* Visual Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Campaign Performance */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div>
                  <CardTitle className="text-sm font-bold">Campaign Performance Comparison</CardTitle>
                  <CardDescription className="text-xs">
                    Attributed salon revenue & booking redemptions
                  </CardDescription>
                </div>
                <span className="text-[11px] font-bold text-text-muted px-2 py-0.5 rounded-md bg-surface-subtle border border-border">
                  Simulated Analytics
                </span>
              </div>

              <div className="space-y-4 pt-1">
                {stats.campaignPerformanceChart.map((item, idx) => {
                  const maxRev = 50000
                  const pct = Math.min(100, Math.round((item.revenue / maxRev) * 100))
                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-text-primary">{item.campaignName}</span>
                        <div className="flex items-center gap-3 tabular-nums">
                          <span className="text-text-muted">{item.redemptions} Bookings</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(item.revenue, 'INR')}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-surface-subtle overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-emerald-500 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Chart 2: Customer Engagement by Channel */}
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div>
                  <CardTitle className="text-sm font-bold">Customer Engagement by Channel</CardTitle>
                  <CardDescription className="text-xs">
                    Delivery, Open and Conversion benchmarks across touchpoints
                  </CardDescription>
                </div>
                <span className="text-[11px] font-bold text-text-muted px-2 py-0.5 rounded-md bg-surface-subtle border border-border">
                  Omnichannel
                </span>
              </div>

              <div className="space-y-3.5 pt-1">
                {stats.engagementChart.map((ch, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-surface-subtle border border-border/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        {ch.channel === 'WhatsApp' && <Smartphone className="w-4 h-4 text-emerald-500" />}
                        {ch.channel === 'SMS' && <MessageSquare className="w-4 h-4 text-sky-500" />}
                        {ch.channel === 'Email' && <Mail className="w-4 h-4 text-purple-500" />}
                        {ch.channel === 'In-App' && <Sparkles className="w-4 h-4 text-violet-500" />}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-text-primary block">{ch.channel}</span>
                        <span className="text-[10px] text-text-muted">Delivery: {ch.deliveryRate}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-right tabular-nums">
                      <div>
                        <span className="text-[10px] text-text-muted block">Open Rate</span>
                        <span className="font-bold text-sky-600 dark:text-sky-400">{ch.openRate}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-text-muted block">Conversion</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{ch.conversionRate}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Quick Active Campaigns Highlight */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary">Live Broadcasts & Performance</h3>
              <Button size="sm" variant="ghost" onClick={() => setActiveTab('campaigns')}>
                View All Campaigns →
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {campaigns.slice(0, 3).map((camp) => (
                <Card key={camp.id} className="p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {camp.channel}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                        ● {camp.status}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-text-primary mt-2">{camp.name}</h4>
                    <p className="text-xs text-text-muted mt-0.5">Audience: {camp.segmentName}</p>
                  </div>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-text-muted block">Redemptions</span>
                      <span className="font-bold text-text-primary tabular-nums">
                        {camp.metrics.redemptions} ({camp.metrics.conversionRate}%)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-text-muted block">Attributed Revenue</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(camp.metrics.revenue, 'INR')}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 2: CAMPAIGNS (Requirement 4, 8, 14)
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {['ALL', 'RUNNING', 'SCHEDULED', 'PAUSED', 'COMPLETED', 'DRAFT'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setCampaignStatusFilter(st)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap',
                    campaignStatusFilter === st
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-surface border-border text-text-muted hover:text-text-primary'
                  )}
                >
                  {st === 'ALL' ? 'All Campaigns' : st}
                </button>
              ))}
            </div>

            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsCreateCampaignOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              New Campaign
            </Button>
          </div>

          <div className="space-y-3">
            {campaigns
              .filter((c) => campaignStatusFilter === 'ALL' || c.status === campaignStatusFilter)
              .map((camp) => (
                <Card key={camp.id} className="p-5 space-y-4">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border/80">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-lg text-xs font-bold',
                            camp.channel === 'WHATSAPP' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
                            camp.channel === 'SMS' && 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
                            camp.channel === 'EMAIL' && 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
                            camp.channel === 'IN_APP' && 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20'
                          )}
                        >
                          {camp.channel}
                        </span>

                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide',
                            camp.status === 'RUNNING' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
                            camp.status === 'SCHEDULED' && 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
                            camp.status === 'PAUSED' && 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
                            camp.status === 'COMPLETED' && 'bg-surface-subtle text-text-muted border border-border',
                            camp.status === 'DRAFT' && 'bg-surface-subtle text-text-secondary border border-border'
                          )}
                        >
                          {camp.status}
                        </span>

                        {camp.offerCode && (
                          <span className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                            Code: {camp.offerCode}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-text-primary pt-1">{camp.name}</h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
                        <span>
                          Target Audience:{' '}
                          <button
                            type="button"
                            onClick={() => {
                              const seg = segments.find((s) => s.id === camp.segmentId)
                              if (seg) handleOpenCustomerList(seg)
                            }}
                            className="font-bold text-primary hover:underline"
                          >
                            {camp.segmentName} ({camp.audienceSize} clients)
                          </button>
                        </span>
                        <span>•</span>
                        <span>
                          Schedule: {camp.startDate} to {camp.endDate}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCampaignForTest(camp)
                          setIsTestMessageModalOpen(true)
                        }}
                        leftIcon={<Send className="w-3.5 h-3.5" />}
                      >
                        Send Test
                      </Button>

                      {camp.status === 'RUNNING' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await campaignService.updateStatus(camp.id, 'PAUSED')
                            reloadData()
                          }}
                          leftIcon={<Pause className="w-3.5 h-3.5 text-amber-500" />}
                        >
                          Pause
                        </Button>
                      ) : camp.status === 'PAUSED' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            await campaignService.updateStatus(camp.id, 'RUNNING')
                            reloadData()
                          }}
                          leftIcon={<Play className="w-3.5 h-3.5 text-emerald-500" />}
                        >
                          Resume
                        </Button>
                      ) : camp.status === 'DRAFT' || camp.status === 'SCHEDULED' ? (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handlePromptLaunch(camp)}
                          leftIcon={<Play className="w-3.5 h-3.5" />}
                        >
                          Launch Now
                        </Button>
                      ) : null}
                    </div>
                  </div>

                  {/* Campaign Metrics Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-surface-subtle">
                      <span className="text-[10px] text-text-muted block uppercase">Audience</span>
                      <span className="text-sm font-bold text-text-primary tabular-nums">
                        {camp.audienceSize}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-surface-subtle">
                      <span className="text-[10px] text-text-muted block uppercase">Sent</span>
                      <span className="text-sm font-bold text-text-primary tabular-nums">
                        {camp.metrics.sent}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-surface-subtle">
                      <span className="text-[10px] text-text-muted block uppercase">Delivered</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {camp.metrics.delivered}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-surface-subtle">
                      <span className="text-[10px] text-text-muted block uppercase">Read / Opened</span>
                      <span className="text-sm font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                        {camp.metrics.read}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-surface-subtle">
                      <span className="text-[10px] text-text-muted block uppercase">Redemptions</span>
                      <span className="text-sm font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                        {camp.metrics.redemptions} ({camp.metrics.conversionRate}%)
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block uppercase font-bold">
                        Attributed Revenue
                      </span>
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-300 tabular-nums">
                        {formatCurrency(camp.metrics.revenue, 'INR')}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 3: SEGMENTS & VISUAL BUILDER (Requirement 2 & 3)
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'segments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-text-primary">Dynamic Customer Segments</h3>
              <p className="text-xs text-text-muted">
                Pre-calculated audience groups updating automatically based on salon activity
              </p>
            </div>

            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsCreateSegmentOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Open Visual Filter Builder
            </Button>
          </div>

          {/* Segments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.map((seg) => (
              <Card key={seg.id} className="p-5 flex flex-col justify-between space-y-4 hover:border-primary/50 transition-colors">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider',
                        seg.isPreset ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                      )}
                    >
                      {seg.isPreset ? 'System Preset' : 'Custom Segment'}
                    </span>

                    {/* Clickable Live Audience Count */}
                    <button
                      type="button"
                      onClick={() => handleOpenCustomerList(seg)}
                      className="px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-primary/10 hover:text-primary text-xs font-bold text-text-primary flex items-center gap-1 border border-border transition-colors group"
                      title="Click to view targeted customers"
                    >
                      <Users className="w-3 h-3 text-primary" />
                      <span className="tabular-nums">{seg.customerCount} customers</span>
                      <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                    </button>
                  </div>

                  <h4 className="text-sm font-bold text-text-primary">{seg.name}</h4>
                  <p className="text-xs text-text-muted leading-relaxed">{seg.description}</p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div className="text-[11px] text-text-muted">
                    Combinator: <span className="font-bold text-text-secondary">{seg.combinator}</span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCampSegmentId(seg.id)
                      setCampName(`${seg.name} Campaign`)
                      setIsCreateCampaignOpen(true)
                    }}
                    leftIcon={<Megaphone className="w-3 h-3 text-primary" />}
                    className="text-xs h-7 px-2.5"
                  >
                    Target in Campaign
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 4: OFFERS & COUPONS (Requirement 5 & 6)
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'offers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-text-primary">Promotional Offers & Coupon Vouchers</h3>
              <p className="text-xs text-text-muted">
                Coupons validated automatically at POS checkout with minimum spend and anti-stacking rules
              </p>
            </div>

            <Button
              size="sm"
              variant="primary"
              onClick={() => setIsCreateOfferOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              Create New Coupon
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {offers.map((offer) => (
              <Card key={offer.id} className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-pink-500 bg-pink-500/10 px-2.5 py-0.5 rounded-full border border-pink-500/20">
                      {offer.type.replace('_', ' ')}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        offer.isActive ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-surface-subtle text-text-muted'
                      )}
                    >
                      {offer.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="font-mono text-lg font-black text-amber-600 dark:text-amber-400 tracking-wider">
                      {offer.code}
                    </div>
                    <h4 className="text-sm font-bold text-text-primary mt-1">{offer.name}</h4>
                  </div>

                  <div className="mt-2.5 p-2.5 rounded-xl bg-surface-subtle space-y-1 text-xs text-text-muted">
                    <div className="flex justify-between">
                      <span>Discount Value:</span>
                      <span className="font-bold text-text-primary">
                        {offer.type === 'PERCENTAGE_DISCOUNT' && `${offer.value}% OFF`}
                        {offer.type === 'FIXED_DISCOUNT' && `₹${offer.value} OFF`}
                        {offer.type === 'BUY_ONE_GET_ONE' && 'Buy 1 Get 1'}
                        {offer.type === 'FREE_SERVICE' && 'Complimentary Service'}
                      </span>
                    </div>

                    {offer.minimumSpend && (
                      <div className="flex justify-between">
                        <span>Min Order:</span>
                        <span className="font-bold text-text-primary">₹{offer.minimumSpend}</span>
                      </div>
                    )}

                    {offer.maximumDiscount && (
                      <div className="flex justify-between">
                        <span>Max Cap:</span>
                        <span className="font-bold text-text-primary">₹{offer.maximumDiscount}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Validity:</span>
                      <span className="font-bold text-text-primary">{offer.endDate}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-text-muted mt-2 italic">{offer.terms}</p>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <span className="text-text-muted">
                    Used: <strong className="text-text-primary tabular-nums">{offer.usedCount}</strong>
                    {offer.usageLimit ? ` / ${offer.usageLimit}` : ' (Unlimited)'}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(offer.code)
                      addToast({
                        title: 'Copied',
                        message: `Coupon ${offer.code} copied to clipboard.`,
                        type: 'info',
                      })
                    }}
                    className="p-1.5 rounded-lg bg-surface-subtle hover:bg-border text-text-muted hover:text-text-primary transition-colors"
                    aria-label={`Copy coupon ${offer.code}`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TAB 5: CAMPAIGN HISTORY & ANALYTICS (Requirement 10)
      ══════════════════════════════════════════════════════ */}
      {activeTab === 'history' && (
        <Card className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div>
              <CardTitle className="text-base font-bold">Campaign Delivery & Redemption History</CardTitle>
              <CardDescription className="text-xs">
                Complete audit trail of all outbound marketing initiatives
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Channel:</span>
              <select
                value={historyChannelFilter}
                onChange={(e) => setHistoryChannelFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-border bg-surface text-xs text-text-primary focus:border-primary focus:outline-none"
              >
                <option value="ALL">All Channels</option>
                <option value="WHATSAPP">WhatsApp</option>
                <option value="SMS">SMS Carrier</option>
                <option value="EMAIL">Email</option>
                <option value="IN_APP">In-App</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-subtle border-b border-border text-text-muted uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-3">Campaign</th>
                  <th className="py-3 px-3">Audience</th>
                  <th className="py-3 px-3">Channel</th>
                  <th className="py-3 px-3">Sent</th>
                  <th className="py-3 px-3">Delivered</th>
                  <th className="py-3 px-3">Redeemed</th>
                  <th className="py-3 px-3">Revenue</th>
                  <th className="py-3 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {campaigns
                  .filter((c) => historyChannelFilter === 'ALL' || c.channel === historyChannelFilter)
                  .map((camp) => (
                    <tr key={camp.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-text-primary block">{camp.name}</span>
                        <span className="text-[10px] text-text-muted">
                          {camp.startDate} to {camp.endDate}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-text-secondary">{camp.segmentName}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold px-2 py-0.5 rounded-md text-[10px] bg-primary/10 text-primary border border-primary/20">
                          {camp.channel}
                        </span>
                      </td>
                      <td className="py-3 px-3 tabular-nums font-semibold">{camp.metrics.sent}</td>
                      <td className="py-3 px-3 tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                        {camp.metrics.delivered}
                      </td>
                      <td className="py-3 px-3 tabular-nums font-semibold text-violet-600 dark:text-violet-400">
                        {camp.metrics.redemptions} ({camp.metrics.conversionRate}%)
                      </td>
                      <td className="py-3 px-3 tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(camp.metrics.revenue, 'INR')}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase',
                            camp.status === 'RUNNING' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
                            camp.status === 'COMPLETED' && 'bg-surface-subtle text-text-muted',
                            camp.status === 'SCHEDULED' && 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
                            camp.status === 'PAUSED' && 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
                            camp.status === 'DRAFT' && 'bg-surface-subtle text-text-secondary'
                          )}
                        >
                          {camp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL 1: CREATE / EDIT CAMPAIGN (Requirement 4 & 7)
      ══════════════════════════════════════════════════════ */}
      {isCreateCampaignOpen && (
        <Modal
          isOpen={isCreateCampaignOpen}
          onClose={() => setIsCreateCampaignOpen(false)}
          title="Create Marketing Campaign"
          size="xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Campaign Title *
                </label>
                <Input
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="e.g. Monsoon Balayage Revival"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Target Audience Segment */}
                <div>
                  <label className="text-xs font-bold text-text-primary block mb-1">
                    Audience Segment *
                  </label>
                  <select
                    value={campSegmentId}
                    onChange={(e) => setCampSegmentId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
                  >
                    {segments.map((seg) => (
                      <option key={seg.id} value={seg.id}>
                        {seg.name} ({seg.customerCount} guests)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delivery Channel */}
                <div>
                  <label className="text-xs font-bold text-text-primary block mb-1">
                    Channel *
                  </label>
                  <select
                    value={campChannel}
                    onChange={(e) => {
                      const ch = e.target.value as CommunicationChannel
                      setCampChannel(ch)
                      setPreviewChannel(ch)
                    }}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="SMS">SMS Carrier</option>
                    <option value="EMAIL">Email</option>
                    <option value="IN_APP">In-App Notification</option>
                  </select>
                </div>
              </div>

              {/* Offer Voucher Attachment */}
              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Attached Coupon Offer (Optional)
                </label>
                <select
                  value={campOfferCode}
                  onChange={(e) => setCampOfferCode(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
                >
                  <option value="">-- No Discount Offer Attached --</option>
                  {offers.map((off) => (
                    <option key={off.id} value={off.code}>
                      [{off.code}] {off.name} ({off.value}% / ₹{off.value})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-primary block mb-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={campStartDate}
                    onChange={(e) => setCampStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-primary block mb-1">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={campEndDate}
                    onChange={(e) => setCampEndDate(e.target.value)}
                  />
                </div>
              </div>

              {campChannel === 'EMAIL' && (
                <div>
                  <label className="text-xs font-bold text-text-primary block mb-1">
                    Email Subject Line
                  </label>
                  <Input
                    value={campSubject}
                    onChange={(e) => setCampSubject(e.target.value)}
                    placeholder="e.g. Special Privilege: Enjoy 25% Off at SALORA"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Message Content (Dynamic Variables Supported)
                </label>
                <textarea
                  rows={4}
                  value={campMessage}
                  onChange={(e) => setCampMessage(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none leading-relaxed"
                  placeholder="Use {{customer_name}}, {{offer_details}}, {{salon_name}}…"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCreateCampaignOpen(false)}
                >
                  Cancel
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveCampaign('DRAFT')}
                  >
                    Save Draft
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveCampaign('SCHEDULED')}
                  >
                    Schedule
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleSaveCampaign('RUNNING')}
                    leftIcon={<Play className="w-3.5 h-3.5" />}
                  >
                    Launch Now
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Multi-Channel Message Preview (Requirement 7) */}
            <div className="space-y-3 bg-surface-subtle p-4 rounded-2xl border border-border flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-primary" />
                    <span>Realistic Channel Preview</span>
                  </span>

                  <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border text-[10px]">
                    {(['WHATSAPP', 'SMS', 'EMAIL', 'IN_APP'] as CommunicationChannel[]).map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setPreviewChannel(ch)}
                        className={cn(
                          'px-2 py-0.5 rounded-lg font-bold transition-all',
                          previewChannel === ch ? 'bg-primary text-white' : 'text-text-muted hover:text-text-primary'
                        )}
                      >
                        {ch === 'WHATSAPP' && 'WA'}
                        {ch === 'SMS' && 'SMS'}
                        {ch === 'EMAIL' && 'Mail'}
                        {ch === 'IN_APP' && 'App'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Preview Mockup Container ── */}
                <div className="mt-4">
                  {/* WHATSAPP MOCKUP */}
                  {previewChannel === 'WHATSAPP' && (
                    <div className="rounded-2xl overflow-hidden border border-emerald-800/40 shadow-lg bg-[#0b141a] text-slate-100 font-sans">
                      {/* WA Header */}
                      <div className="bg-[#202c33] px-3 py-2 flex items-center justify-between text-xs text-slate-200 border-b border-slate-700/50">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-[11px] text-white">
                            S
                          </div>
                          <div>
                            <span className="font-bold text-white block leading-tight">SALORA Luxe Studio</span>
                            <span className="text-[10px] text-emerald-400">Official Business Account</span>
                          </div>
                        </div>
                      </div>

                      {/* WA Body */}
                      <div className="p-3 bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px] min-h-[180px] flex flex-col justify-end">
                        <div className="max-w-[85%] bg-[#005c4b] p-3 rounded-2xl rounded-tl-sm text-xs text-white shadow-md space-y-2">
                          <p className="whitespace-pre-wrap leading-relaxed">{previewText}</p>
                          {campOfferCode && (
                            <div className="p-2 rounded-xl bg-black/30 border border-white/10 flex items-center justify-between">
                              <span className="font-mono text-amber-300 font-bold">{campOfferCode}</span>
                              <span className="text-[10px] text-emerald-300">Tap to Redeem</span>
                            </div>
                          )}
                          <div className="flex justify-end items-center space-x-1 text-[10px] text-slate-300">
                            <span>10:30 AM</span>
                            <span className="text-sky-300">✓✓</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SMS MOCKUP */}
                  {previewChannel === 'SMS' && (
                    <div className="rounded-2xl overflow-hidden border border-border shadow-lg bg-surface text-text-primary font-sans p-4 space-y-3">
                      <div className="text-center">
                        <span className="text-[10px] font-bold text-text-muted uppercase">Today • 10:30 AM</span>
                        <div className="text-xs font-bold text-text-primary mt-0.5">SALORA-ALERT</div>
                      </div>
                      <div className="max-w-[85%] p-3 rounded-2xl bg-primary text-white text-xs leading-relaxed space-y-2">
                        <p className="whitespace-pre-wrap">{previewText}</p>
                      </div>
                      <span className="text-[10px] text-text-muted block text-right">Delivered</span>
                    </div>
                  )}

                  {/* EMAIL MOCKUP */}
                  {previewChannel === 'EMAIL' && (
                    <div className="rounded-2xl overflow-hidden border border-border shadow-lg bg-white text-slate-900 font-sans p-4 space-y-3">
                      <div className="border-b pb-2 flex items-center justify-between">
                        <span className="font-serif font-black text-sm tracking-wider text-violet-900">SALORA LUXE</span>
                        <span className="text-[10px] text-slate-500">concierge@salora.com</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">
                        {campSubject || 'Exclusive Privilege: Complimentary Salon Saving'}
                      </h4>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {previewText}
                      </div>
                      {campOfferCode && (
                        <div className="text-center p-2 rounded-xl bg-violet-50 border border-violet-200">
                          <span className="text-[10px] text-violet-700 font-semibold block">USE PROMO CODE</span>
                          <span className="font-mono text-sm font-bold text-violet-900">{campOfferCode}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* IN-APP MOCKUP */}
                  {previewChannel === 'IN_APP' && (
                    <div className="rounded-2xl overflow-hidden border border-violet-500/40 shadow-xl bg-slate-900 text-white font-sans p-4 space-y-2.5">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-lg bg-pink-500 flex items-center justify-center text-xs">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold">SALORA In-App Privilege</span>
                      </div>
                      <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{previewText}</p>
                      <button
                        type="button"
                        className="w-full py-1.5 rounded-lg bg-violet-600 text-white text-xs font-bold"
                      >
                        Claim Privilege
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-surface border border-border text-[11px] text-text-muted">
                <strong>Safety Verification:</strong> Promotional messages strictly observe customer DND preferences. Inactive marketing opted-out clients are excluded automatically.
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL 2: CAMPAIGN SAFETY & CONFIRMATION (Requirement 14)
      ══════════════════════════════════════════════════════ */}
      {isSafetyModalOpen && campaignToLaunch && (
        <Modal
          isOpen={isSafetyModalOpen}
          onClose={() => setIsSafetyModalOpen(false)}
          title="Confirm Campaign Dispatch"
          size="md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold text-amber-900 dark:text-amber-100 mb-1">
                  Campaign Broadcast Confirmation
                </strong>
                This campaign will target <strong className="font-bold underline">{campaignToLaunch.audienceSize} customers</strong> via{' '}
                <strong className="font-bold uppercase">{campaignToLaunch.channel}</strong>.
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-text-muted">Campaign:</span>
                <span className="font-bold text-text-primary">{campaignToLaunch.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Target Audience:</span>
                <span className="font-bold text-text-primary">{campaignToLaunch.segmentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Attached Offer:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {campaignToLaunch.offerCode || 'None'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">DND Suppression:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Active (Opt-Outs Suppressed)</span>
              </div>
            </div>

            <p className="text-[11px] text-text-muted leading-relaxed">
              Once launched, the communication gateway begins queued delivery through the provider registry. You can pause or cancel at any time.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSafetyModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await campaignService.updateStatus(campaignToLaunch.id, 'SCHEDULED')
                  setIsSafetyModalOpen(false)
                  setCampaignToLaunch(null)
                  reloadData()
                }}
              >
                Schedule for Later
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmLaunch}
                leftIcon={<Play className="w-3.5 h-3.5" />}
              >
                Launch Now ({campaignToLaunch.audienceSize} Clients)
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL 3: CAMPAIGN CUSTOMER LIST (Requirement 9)
      ══════════════════════════════════════════════════════ */}
      {isCustomerListModalOpen && selectedSegmentForList && (
        <Modal
          isOpen={isCustomerListModalOpen}
          onClose={() => setIsCustomerListModalOpen(false)}
          title={`Audience: ${selectedSegmentForList.name} (${matchingClientsList.length} clients)`}
          size="lg"
        >
          <div className="space-y-3">
            <p className="text-xs text-text-muted">
              Live matching clients based on {selectedSegmentForList.combinator} rule evaluation:
            </p>

            <div className="max-h-[380px] overflow-y-auto border border-border rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle border-b border-border text-text-muted uppercase text-[10px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Contact</th>
                    <th className="py-2.5 px-3">Last Visit</th>
                    <th className="py-2.5 px-3">Total Spend</th>
                    <th className="py-2.5 px-3">Eligibility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {matchingClientsList.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={c.fullName} size="sm" />
                          <div>
                            <span className="font-bold text-text-primary block">{c.fullName}</span>
                            <span className="text-[10px] text-text-muted">
                              {c.isVip ? 'VIP Gold' : 'Regular Guest'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-text-muted tabular-nums">
                        <div>{c.phone}</div>
                        <div className="text-[10px]">{c.email}</div>
                      </td>
                      <td className="py-2.5 px-3 tabular-nums">
                        {c.lastVisitDate ? formatDate(c.lastVisitDate) : 'No prior visit'}
                      </td>
                      <td className="py-2.5 px-3 font-bold tabular-nums">
                        {formatCurrency(c.totalSpent || 0, 'INR')}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Eligible
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" onClick={() => setIsCustomerListModalOpen(false)}>
                Close List
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL 4: VISUAL SEGMENT BUILDER (Requirement 3)
      ══════════════════════════════════════════════════════ */}
      {isCreateSegmentOpen && (
        <Modal
          isOpen={isCreateSegmentOpen}
          onClose={() => setIsCreateSegmentOpen(false)}
          title="Visual Customer Segment Builder"
          size="lg"
        >
          <form onSubmit={handleSaveSegment} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Segment Name *
                </label>
                <Input
                  value={builderName}
                  onChange={(e) => setBuilderName(e.target.value)}
                  placeholder="e.g. Inactive High Rollers"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Description
                </label>
                <Input
                  value={builderDescription}
                  onChange={(e) => setBuilderDescription(e.target.value)}
                  placeholder="e.g. Clients absent > 60 days with spend > ₹5k"
                />
              </div>
            </div>

            {/* Combinator toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-subtle border border-border">
              <div>
                <span className="text-xs font-bold text-text-primary block">
                  Rule Evaluation Logic
                </span>
                <span className="text-[11px] text-text-muted">
                  Choose whether all rules or any single rule must match
                </span>
              </div>

              <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setBuilderCombinator('AND')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                    builderCombinator === 'AND' ? 'bg-primary text-white shadow-xs' : 'text-text-muted'
                  )}
                >
                  AND (All Match)
                </button>
                <button
                  type="button"
                  onClick={() => setBuilderCombinator('OR')}
                  className={cn(
                    'px-3 py-1 rounded-lg text-xs font-bold transition-all',
                    builderCombinator === 'OR' ? 'bg-primary text-white shadow-xs' : 'text-text-muted'
                  )}
                >
                  OR (Any Match)
                </button>
              </div>
            </div>

            {/* Dynamic Filter Conditions List */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-text-primary block">Filter Conditions</label>
              {builderConditions.map((cond, idx) => (
                <div key={cond.id} className="p-3 rounded-xl bg-surface border border-border flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-text-muted w-6">#{idx + 1}</span>

                  {/* Field Selector */}
                  <select
                    value={cond.field}
                    onChange={(e) =>
                      handleUpdateCondition(cond.id, {
                        field: e.target.value as SegmentConditionField,
                      })
                    }
                    className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text-primary focus:border-primary focus:outline-none"
                  >
                    <option value="lastVisitDays">Last Visit (Days Ago)</option>
                    <option value="totalVisits">Total Visits</option>
                    <option value="totalSpending">Total Spending (₹)</option>
                    <option value="rewardPoints">Loyalty Points</option>
                    <option value="age">Age</option>
                    <option value="gender">Gender</option>
                    <option value="birthdayMonth">Birthday Month (1-12)</option>
                  </select>

                  {/* Operator */}
                  <select
                    value={cond.operator}
                    onChange={(e) =>
                      handleUpdateCondition(cond.id, {
                        operator: e.target.value as SegmentOperator,
                      })
                    }
                    className="rounded-lg border border-border bg-surface px-2 py-1.5 text-xs text-text-primary focus:border-primary focus:outline-none"
                  >
                    <option value="greaterThanOrEqual">&gt;= (At least)</option>
                    <option value="lessThanOrEqual">&lt;= (At most)</option>
                    <option value="equals">= (Exactly)</option>
                    <option value="notEquals">!= (Not equal)</option>
                    <option value="greaterThan">&gt; (More than)</option>
                    <option value="lessThan">&lt; (Less than)</option>
                  </select>

                  {/* Value */}
                  <input
                    type="text"
                    value={cond.value}
                    onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                    className="w-24 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text-primary focus:border-primary focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveCondition(cond.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors ml-auto"
                    aria-label="Remove condition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAddCondition}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                + Add Condition
              </Button>
            </div>

            {/* Live Audience Calculation Box */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase">
                  Live Audience Calculation:
                </span>
                <span className="text-sm font-black text-emerald-800 dark:text-emerald-200">
                  {liveBuilderAudience.length} Customers Match This Rule
                </span>
              </div>
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                ≈ {Math.round((liveBuilderAudience.length / (allClients.length || 1)) * 100)}% of client base
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateSegmentOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Save Dynamic Segment
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL 5: OFFER BUILDER (Requirement 5 & 6)
      ══════════════════════════════════════════════════════ */}
      {isCreateOfferOpen && (
        <Modal
          isOpen={isCreateOfferOpen}
          onClose={() => setIsCreateOfferOpen(false)}
          title="Create Promotional Offer & Coupon"
          size="lg"
        >
          <form onSubmit={handleSaveOffer} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Offer Title *
                </label>
                <Input
                  value={offerName}
                  onChange={(e) => setOfferName(e.target.value)}
                  placeholder="e.g. Signature Hair Spa 20% Off"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Coupon Code *
                </label>
                <Input
                  value={offerCode}
                  onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                  placeholder="e.g. GLOW20"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Offer Type *
                </label>
                <select
                  value={offerType}
                  onChange={(e) => setOfferType(e.target.value as OfferType)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none"
                >
                  <option value="PERCENTAGE_DISCOUNT">Percentage Discount (%)</option>
                  <option value="FIXED_DISCOUNT">Fixed Discount (₹)</option>
                  <option value="BUY_ONE_GET_ONE">Buy One Get One (BOGO)</option>
                  <option value="FREE_SERVICE">Free Complimentary Service</option>
                  <option value="BONUS_POINTS">Bonus Loyalty Points</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Value ({offerType === 'PERCENTAGE_DISCOUNT' ? '%' : '₹'}) *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={offerValue}
                  onChange={(e) => setOfferValue(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Min Spend (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={offerMinSpend}
                  onChange={(e) => setOfferMinSpend(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Max Cap (₹)
                </label>
                <Input
                  type="number"
                  min="0"
                  value={offerMaxDiscount}
                  onChange={(e) => setOfferMaxDiscount(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={offerStartDate}
                  onChange={(e) => setOfferStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={offerEndDate}
                  onChange={(e) => setOfferEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Stacking Options (Requirement 13) */}
            <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border space-y-2">
              <span className="text-xs font-bold text-text-primary block">
                Discount Stacking Policy
              </span>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={offerCanStackLoyalty}
                    onChange={(e) => setOfferCanStackLoyalty(e.target.checked)}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <span>Stackable with Loyalty Points</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={offerCanStackMembership}
                    onChange={(e) => setOfferCanStackMembership(e.target.checked)}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <span>Stackable with Membership Tier Discount</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreateOfferOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm">
                Activate Offer & Coupon
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ══════════════════════════════════════════════════════
          MODAL 6: SEND TEST MESSAGE (Requirement 4)
      ══════════════════════════════════════════════════════ */}
      {isTestMessageModalOpen && campaignForTest && (
        <Modal
          isOpen={isTestMessageModalOpen}
          onClose={() => setIsTestMessageModalOpen(false)}
          title={`Send Test Message: ${campaignForTest.name}`}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-xs text-text-muted">
              Simulate dispatching this campaign to verify copy, variables, and channel formatting.
            </p>

            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Recipient Contact (Phone / Email)
              </label>
              <Input
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="+91 98765 43210 or your.email@example.com"
                required
              />
            </div>

            <div className="p-3 rounded-xl bg-surface-subtle text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-text-muted">Delivery Channel:</span>
                <span className="font-bold text-text-primary">{campaignForTest.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Attached Offer:</span>
                <span className="font-mono font-bold text-amber-500">{campaignForTest.offerCode || 'None'}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTestMessageModalOpen(false)}
                disabled={isSendingTest}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSendTest}
                isLoading={isSendingTest}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Send Test
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
