import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Edit2,
  CalendarPlus,
  MessageSquare,
  Crown,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Sparkles,
  Clock,
  Plus,
  CheckCircle2,
  Receipt,
  FileText,
  Heart,
  Send,
  Eye,
  Hash,
  Printer,
  Layers,
  ArrowRight,
  Package,
  AlertTriangle,
  Gift,
  ShieldCheck,
  Coins,
  Users,
  Copy,
  Check,
  Bell,
  RefreshCw,
  ShieldAlert,
  Smartphone,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import {
  Client,
  Appointment,
  Bill,
  ClientMembership,
  ClientPackageWallet,
  LoyaltyTransaction,
  Referral,
  CommunicationLog,
  MessageTemplate,
  CommunicationChannel,
  MessageCategory,
} from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { ClientTimeline } from './ClientTimeline'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { useUIStore } from '@/store/useUIStore'
import { useAIStore } from '@/store/useAIStore'
import { useToastStore } from '@/store/useToastStore'
import { useQueueStore } from '@/store/useQueueStore'
import { printService } from '@/services/printService'
import { clientService } from '@/services/clientService'
import { billingService } from '@/services/billingService'
import { membershipService } from '@/services/membershipService'
import { packageService } from '@/services/packageService'
import { loyaltyService } from '@/services/loyaltyService'
import { communicationService } from '@/services/communicationService'
import { BillInvoicePreviewModal } from '@/features/billing/BillInvoicePreviewModal'
import { cn } from '@/utils/cn'

interface ClientProfileProps {
  client: Client
  appointments?: Appointment[]
  onEdit: () => void
  onClientUpdated?: (updated: Client) => void
  currency?: string
}

export const ClientProfile: React.FC<ClientProfileProps> = ({
  client,
  appointments = [],
  onEdit,
  onClientUpdated,
  currency = 'INR',
}) => {
  const navigate = useNavigate()
  const { openNewAppointmentModal } = useUIStore()
  const { openDrawer } = useAIStore()
  const { addToast } = useToastStore()

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'appointments'
    | 'services'
    | 'membership'
    | 'packages'
    | 'loyalty'
    | 'payments'
    | 'notes'
    | 'communications'
  >('overview')
  const [newNoteText, setNewNoteText] = useState('')
  const [isAddingNote, setIsAddingNote] = useState(false)
  const [clientBills, setClientBills] = useState<Bill[]>([])
  const [selectedInvoice, setSelectedInvoice] = useState<Bill | null>(null)

  // Client Membership & Package Wallets
  const [clientMembership, setClientMembership] = useState<ClientMembership | null>(null)
  const [clientWallets, setClientWallets] = useState<ClientPackageWallet[]>([])

  // Loyalty & Referrals
  const [loyaltyPoints, setLoyaltyPoints] = useState<number>(client.loyaltyPoints || 0)
  const [clientTransactions, setClientTransactions] = useState<LoyaltyTransaction[]>([])
  const [clientReferrals, setClientReferrals] = useState<Referral[]>([])
  const [referralCode, setReferralCode] = useState<string>(client.referralCode || '')
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit')
  const [adjustPoints, setAdjustPoints] = useState('')
  const [adjustReason, setAdjustReason] = useState('')
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)

  // Communications & Consent
  const [clientLogs, setClientLogs] = useState<CommunicationLog[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [sendChannel, setSendChannel] = useState<CommunicationChannel>(
    (client.communicationPreferences?.preferredChannel as CommunicationChannel) || 'WHATSAPP'
  )
  const [sendCategory, setSendCategory] = useState<MessageCategory>('TRANSACTIONAL')
  const [sendSubject, setSendSubject] = useState('')
  const [sendMessageText, setSendMessageText] = useState('')
  const [isSendingMessage, setIsSendingMessage] = useState(false)
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null)
  const [logFilterChannel, setLogFilterChannel] = useState<string>('ALL')

  // Opt-in Consent state
  const [marketingOptIn, setMarketingOptIn] = useState<boolean>(
    client.communicationPreferences?.marketingOptIn ?? true
  )
  const [transactionalOptIn, setTransactionalOptIn] = useState<boolean>(
    client.communicationPreferences?.transactionalOptIn ?? true
  )
  const [preferredChannel, setPreferredChannel] = useState<CommunicationChannel>(
    (client.communicationPreferences?.preferredChannel as CommunicationChannel) || 'WHATSAPP'
  )
  const [isSavingConsent, setIsSavingConsent] = useState(false)

  const reloadLoyalty = async () => {
    try {
      const [bal, txs, refs, code] = await Promise.all([
        loyaltyService.getClientBalance(client.id),
        loyaltyService.getClientTransactions(client.id),
        loyaltyService.getClientReferrals(client.id),
        loyaltyService.getClientReferralCode(client.id, client.fullName),
      ])
      setLoyaltyPoints(bal)
      setClientTransactions(txs)
      setClientReferrals(refs)
      setReferralCode(code)
    } catch (e) {
      console.warn('Failed loading client loyalty in profile:', e)
    }
  }

  useEffect(() => {
    billingService.getByClientId(client.id).then((bills) => {
      setClientBills(bills)
    })
    membershipService.getClientMembership(client.id).then((mem) => {
      setClientMembership(mem)
    })
    packageService.getClientWallets(client.id).then((wallets) => {
      setClientWallets(wallets)
    })
    reloadLoyalty()
    reloadCommunications()
  }, [client.id])

  const reloadCommunications = async () => {
    try {
      const [allLogs, allTemplates] = await Promise.all([
        communicationService.getLogs(),
        communicationService.getTemplates(),
      ])
      const matching = allLogs.filter(
        (l) =>
          l.customerId === client.id ||
          l.customerName.toLowerCase() === client.fullName.toLowerCase() ||
          (client.phone && l.recipient.includes(client.phone.replace(/[^0-9]/g, ''))) ||
          (client.email && l.recipient.toLowerCase() === client.email.toLowerCase())
      )
      setClientLogs(matching)
      setTemplates(allTemplates.filter((t) => t.status === 'ACTIVE'))
    } catch (err) {
      console.warn('Failed loading client communications:', err)
    }
  }

  const handleSaveConsent = async () => {
    setIsSavingConsent(true)
    try {
      const updated = await clientService.update(client.id, {
        communicationPreferences: {
          marketingOptIn,
          transactionalOptIn,
          preferredChannel,
        },
      })
      if (onClientUpdated) onClientUpdated(updated)
      addToast({
        title: 'Consent Preferences Saved',
        message: `Updated messaging permissions for ${client.fullName}.`,
        type: 'success',
      })
    } catch {
      addToast({
        title: 'Update Failed',
        message: 'Could not update client consent.',
        type: 'danger',
      })
    } finally {
      setIsSavingConsent(false)
    }
  }

  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId)
    const tpl = templates.find((t) => t.id === tplId)
    if (!tpl) return
    setSendChannel(tpl.channel)
    setSendCategory(tpl.category)
    setSendSubject(tpl.subject || '')

    // Interpolate known client values
    let text = tpl.message
    text = text.replace(/\{\{customer_name\}\}/gi, client.fullName)
    text = text.replace(/\{\{salon_name\}\}/gi, 'SALORA Luxe Hair & Beauty')
    text = text.replace(/\{\{service_name\}\}/gi, client.favoriteService || 'Signature Hair Spa')
    text = text.replace(/\{\{staff_name\}\}/gi, 'Rahul Verma')
    text = text.replace(/\{\{loyalty_points\}\}/gi, String(loyaltyPoints))
    text = text.replace(/\{\{offer_details\}\}/gi, 'Flat 20% off with code BDAYGLOW20')
    setSendMessageText(text)
  }

  const handleDispatchDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sendMessageText.trim()) return

    setIsSendingMessage(true)
    try {
      const recipientContact =
        sendChannel === 'EMAIL'
          ? client.email
          : client.phone || client.id

      const result = await communicationService.dispatch({
        customerId: client.id,
        customerName: client.fullName,
        recipientContact,
        channel: sendChannel,
        category: sendCategory,
        templateId: selectedTemplateId || undefined,
        subject: sendSubject || undefined,
        body: sendMessageText.trim(),
        referenceId: `direct-${Date.now()}`,
        customerOptIn: {
          marketingOptIn,
          transactionalOptIn,
        },
      })

      if (result.status === 'FAILED') {
        addToast({
          title: 'Message Blocked / Suppressed',
          message: result.error || 'Delivery was not completed.',
          type: 'danger',
        })
      } else {
        addToast({
          title: 'Message Dispatched',
          message: `Successfully transmitted via ${sendChannel}.`,
          type: 'success',
        })
      }

      setIsSendMessageModalOpen(false)
      setSendMessageText('')
      setSendSubject('')
      setSelectedTemplateId('')
      await reloadCommunications()
    } catch (err: any) {
      addToast({
        title: 'Dispatch Error',
        message: err.message || 'Could not send communication.',
        type: 'danger',
      })
    } finally {
      setIsSendingMessage(false)
    }
  }

  const handleRetryMessage = async (logId: string) => {
    setRetryingLogId(logId)
    try {
      const updated = await communicationService.retryFailedMessage(logId)
      addToast({
        title: 'Retry Successful',
        message: `Message re-delivered. Current status: ${updated.status}.`,
        type: 'success',
      })
      await reloadCommunications()
    } catch (err: any) {
      addToast({
        title: 'Retry Failed',
        message: err.message || 'Could not retry delivery.',
        type: 'danger',
      })
    } finally {
      setRetryingLogId(null)
    }
  }

  const handleAdjustPoints = async () => {
    const pts = parseInt(adjustPoints, 10)
    if (isNaN(pts) || pts <= 0) {
      addToast({
        title: 'Invalid Points',
        message: 'Please enter a positive point number.',
        type: 'warning',
      })
      return
    }
    if (!adjustReason.trim()) {
      addToast({
        title: 'Reason Required',
        message: 'Never silently modify point balance. A justification reason is required.',
        type: 'warning',
      })
      return
    }

    setIsAdjusting(true)
    try {
      const signedPoints = adjustType === 'credit' ? pts : -pts
      await loyaltyService.addTransaction({
        clientId: client.id,
        clientName: client.fullName,
        type: 'ADJUSTED',
        points: signedPoints,
        reason: `Manual Admin Adjustment: ${adjustReason.trim()}`,
      })

      await reloadLoyalty()
      setIsAdjustModalOpen(false)
      setAdjustPoints('')
      setAdjustReason('')

      addToast({
        title: 'Points Adjusted',
        message: `Successfully ${adjustType === 'credit' ? 'credited' : 'debited'} ${pts} points.`,
        type: 'success',
      })
    } catch (err: any) {
      addToast({
        title: 'Adjustment Failed',
        message: err.message || 'Could not adjust loyalty points.',
        type: 'danger',
      })
    } finally {
      setIsAdjusting(false)
    }
  }

  const { tokens } = useQueueStore()
  const todayStr = new Date().toISOString().split('T')[0]
  const todayToken = tokens.find(
    (t) =>
      (t.clientId === client.id ||
        t.clientName.toLowerCase() === client.fullName.toLowerCase()) &&
      (!t.date || t.date === todayStr)
  )
  const todayAppointment = appointments.find(
    (a) => a.date === todayStr || a.clientId === client.id
  )

  const addressString =
    typeof client.address === 'object'
      ? [client.address.street, client.address.city, client.address.state, client.address.postalCode]
          .filter(Boolean)
          .join(', ')
      : client.address

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNoteText.trim()) return

    setIsAddingNote(true)
    try {
      const newNote = await clientService.addNote(client.id, newNoteText.trim(), 'Salon Reception')
      const updatedClient: Client = {
        ...client,
        clientNotes: [newNote, ...(client.clientNotes || [])],
      }
      if (onClientUpdated) onClientUpdated(updatedClient)
      setNewNoteText('')
      addToast({
        title: 'Note Added',
        message: 'Private salon note saved successfully.',
        type: 'success',
      })
    } catch {
      addToast({
        title: 'Error',
        message: 'Could not save note.',
        type: 'danger',
      })
    } finally {
      setIsAddingNote(false)
    }
  }

  const handleSendMessage = () => {
    setIsSendMessageModalOpen(true)
  }

  const tabs: { id: typeof activeTab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'appointments', label: 'Appointments', count: appointments.length || client.totalVisits },
    { id: 'services', label: 'Services' },
    { id: 'membership', label: 'Membership', count: clientMembership ? 1 : undefined },
    { id: 'packages', label: 'Packages', count: clientWallets.length || undefined },
    { id: 'loyalty', label: 'Loyalty & Referrals', count: loyaltyPoints || undefined },
    { id: 'payments', label: 'Payments', count: clientBills.length || undefined },
    { id: 'notes', label: 'Notes', count: client.clientNotes?.length || 0 },
    { id: 'communications', label: 'Communications', count: clientLogs.length || undefined },
  ]

  return (
    <div className="space-y-6">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/clients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary transition-[color]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Clients</span>
        </Link>
      </div>

      {/* 1. Profile Header Card */}
      <Card className="p-6 sm:p-7 relative overflow-hidden">
        {/* Glow decoration */}
        <div
          className="absolute -right-16 -top-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left Avatar & Client Details */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 min-w-0">
            <div className="relative shrink-0">
              <Avatar name={client.fullName} src={client.avatarUrl} size="xl" />
              {client.isVip && (
                <div
                  className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center shadow-md border-2 border-surface"
                  title="VIP Client"
                >
                  <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary font-sans">
                  {client.fullName}
                </h1>
                <StatusBadge status={client.status} />
              </div>

              {/* Contact info row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
                  <span className="tabular-nums font-medium text-text-secondary">{client.phone}</span>
                </span>

                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-accent shrink-0" aria-hidden="true" />
                  <span className="text-text-secondary">{client.email}</span>
                </span>

                {addressString && (
                  <span className="flex items-center gap-1.5 truncate max-w-xs">
                    <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" aria-hidden="true" />
                    <span className="truncate">{addressString}</span>
                  </span>
                )}
              </div>

              {/* Tags & Communication Consent pill row */}
              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                {client.tags && client.tags.length > 0 && client.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-subtle border border-border text-text-secondary"
                  >
                    {tag}
                  </span>
                ))}

                {/* Consent Badges */}
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border',
                    transactionalOptIn
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                  )}
                  title="Transactional messaging status"
                >
                  <Bell className="w-3 h-3" />
                  <span>Transactional: {transactionalOptIn ? 'Opted In' : 'Paused'}</span>
                </span>

                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border',
                    marketingOptIn
                      ? 'bg-violet-500/10 border-violet-500/30 text-violet-700 dark:text-violet-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                  )}
                  title="Marketing and promotional campaign status"
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Marketing: {marketingOptIn ? 'Opted In' : 'DND Active'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto shrink-0">
            <Button
              variant="outline"
              size="md"
              onClick={handleSendMessage}
              leftIcon={<MessageSquare className="h-4 w-4 text-accent" />}
            >
              Message
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={() =>
                openDrawer('When did she last visit?', {
                  sourcePage: 'client_profile',
                  clientId: client.id,
                  clientName: client.fullName,
                })
              }
              leftIcon={<Sparkles className="h-4 w-4 text-primary" />}
              className="border-primary/30 hover:border-primary text-text-primary"
            >
              Ask AI
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={onEdit}
              leftIcon={<Edit2 className="h-4 w-4" />}
            >
              Edit Profile
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={openNewAppointmentModal}
              leftIcon={<CalendarPlus className="h-4 w-4" />}
              className="shadow-glow-primary/40"
            >
              Book Appointment
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. SUMMARY METRICS (5 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Visits */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Total Visits
          </span>
          <div className="text-2xl font-extrabold text-text-primary tabular-nums mt-1 font-sans">
            {client.totalVisits}
          </div>
          <span className="text-[10px] text-text-muted mt-1">Appointments booked</span>
        </div>

        {/* Total Spent */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Total Spent
          </span>
          <div className="text-2xl font-extrabold text-text-primary tabular-nums mt-1 font-sans">
            {formatCurrency(client.totalSpent, currency)}
          </div>
          <span className="text-[10px] text-text-muted mt-1">Lifetime salon value</span>
        </div>

        {/* Last Visit */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Last Visit
          </span>
          <div className="text-sm font-bold text-text-primary tabular-nums mt-2 truncate">
            {client.lastVisitDate ? formatDate(client.lastVisitDate) : 'No prior visits'}
          </div>
          <span className="text-[10px] text-text-muted mt-1">Previous check-in</span>
        </div>

        {/* Favorite Service */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
            Favorite Service
          </span>
          <div className="text-xs font-bold text-text-primary mt-2 truncate" title={client.favoriteService}>
            {client.favoriteService || 'Hair Cut & Styling'}
          </div>
          <span className="text-[10px] text-text-muted mt-1">Most frequent ritual</span>
        </div>

        {/* Outstanding Balance */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">
              Balance Due
            </span>
            {(client.outstandingBalance || 0) > 0 && (
              <Link
                to={`/sales/billing?clientId=${client.id}`}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5"
              >
                Settle <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          <div className="text-2xl font-extrabold text-text-primary tabular-nums mt-1 font-sans">
            {formatCurrency(client.outstandingBalance || 0, currency)}
          </div>
          <span className={cn('text-[10px] font-bold mt-1', (client.outstandingBalance || 0) > 0 ? 'text-danger' : 'text-success')}>
            {(client.outstandingBalance || 0) > 0 ? 'Unpaid invoice balance' : 'Zero balance / Paid up'}
          </span>
        </div>
      </div>

      {/* 2.5. LOYALTY & REFERRAL QUICK METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Loyalty Points */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-transparent border border-pink-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                Loyalty Points
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl font-extrabold text-pink-600 dark:text-pink-300 tabular-nums font-sans">
                  {loyaltyPoints}
                </span>
                <span className="text-xs font-bold text-text-muted">PTS</span>
                <span className="text-[10px] text-text-muted ml-1">
                  (≈ ₹{Math.floor(loyaltyPoints / 2)})
                </span>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsAdjustModalOpen(true)}
            className="text-xs border-pink-500/30 hover:border-pink-500 text-pink-700 dark:text-pink-300 h-8 px-2.5"
          >
            + Adjust
          </Button>
        </div>

        {/* Referral Code */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                Referral Code
              </span>
              <span className="font-mono text-base font-black text-text-primary tracking-wider truncate block">
                {referralCode || 'N/A'}
              </span>
            </div>
          </div>
          {referralCode && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(referralCode)
                setCopiedCode(true)
                setTimeout(() => setCopiedCode(false), 2000)
                addToast({
                  title: 'Copied',
                  message: `Referral code "${referralCode}" copied.`,
                  type: 'info',
                })
              }}
              className="text-xs h-8 px-2"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          )}
        </div>

        {/* Referral Count */}
        <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">
                Referral Count
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-extrabold text-text-primary tabular-nums font-sans">
                  {clientReferrals.length}
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                  ({clientReferrals.filter((r) => r.status === 'COMPLETED').length} Completed)
                </span>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setActiveTab('loyalty')}
            className="text-xs text-primary hover:underline h-8 px-2"
          >
            View Details
          </Button>
        </div>
      </div>

      {/* TODAY'S VISIT & LIVE QUEUE CARD (Phase 2 Integration) */}
      {(todayToken || todayAppointment) && (
        <div className="p-4 rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/[0.07] to-violet-500/[0.02] shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black tracking-widest text-primary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Today's Visit
                </span>
                {todayToken && (
                  <Badge variant="primary" size="sm">
                    Live Queue
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-baseline gap-3">
                {todayToken ? (
                  <div>
                    <span className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight font-sans">
                      TOKEN {todayToken.displayNumber}
                    </span>
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                      {todayToken.status.replace('_', ' ')}
                    </span>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-text-primary">
                    Appointment Scheduled for Today
                  </span>
                )}
              </div>

              {todayAppointment && (
                <p className="text-xs text-text-secondary">
                  <strong>Current Appointment:</strong> {todayAppointment.startTime} • {todayAppointment.serviceName} with {todayAppointment.staffName}
                </p>
              )}
              {todayToken?.estimatedWaitMinutes && (
                <p className="text-[11px] text-text-muted">
                  Estimated Waiting Time: ~{todayToken.estimatedWaitMinutes} min
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              {todayToken && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => printService.printToken(todayToken)}
                  leftIcon={<Printer className="h-3.5 w-3.5" />}
                  className="text-xs"
                >
                  Print Slip
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/appointments/queue')}
                leftIcon={<Layers className="h-3.5 w-3.5" />}
                className="text-xs shadow-glow-primary/30"
              >
                View in Queue
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="border-b border-border/80">
        <div className="flex items-center gap-2 overflow-x-auto pb-px">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 py-3 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-[color,border-color]',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'
                )}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.2 rounded-full tabular-nums',
                      isActive ? 'bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300' : 'bg-surface-subtle text-text-muted'
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

      {/* 4. Tab Content Area */}
      <div>
        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Customer Service Timeline */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">
                    Customer Service Timeline
                  </h3>
                  <p className="text-xs text-text-muted">
                    Chronological history of treatments, services and formulas
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openNewAppointmentModal}
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                >
                  Add Appointment
                </Button>
              </div>

              <ClientTimeline
                timeline={client.timeline || []}
                currency={currency}
              />
            </div>

            {/* Right 1 Col: Stylist Notes & Preferences Summary */}
            <div className="space-y-4">
              <Card className="p-5">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  <span>Stylist Notes & Formula</span>
                </h4>
                {client.notes ? (
                  <div className="p-3.5 rounded-xl bg-surface-subtle/80 border border-border/80 text-xs text-text-secondary leading-relaxed">
                    {client.notes}
                  </div>
                ) : (
                  <p className="text-xs text-text-muted italic">
                    No formula notes recorded for this guest.
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-border/60 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Gender:</span>
                    <span className="font-semibold text-text-primary capitalize">{client.gender || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Date of Birth:</span>
                    <span className="font-semibold text-text-primary">{client.dateOfBirth || client.birthday || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Client Since:</span>
                    <span className="font-semibold text-text-primary tabular-nums">{client.createdAt}</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* TAB: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Appointment Bookings</h3>
                <p className="text-xs text-text-muted">Upcoming visits and completed appointments</p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={openNewAppointmentModal}
                leftIcon={<Plus className="h-3.5 w-3.5" />}
              >
                Schedule New Appointment
              </Button>
            </div>

            {appointments.length === 0 ? (
              <div className="py-12 text-center text-text-muted text-xs">
                No active appointments scheduled for this guest.
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {appointments.map((appt) => (
                  <div key={appt.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center w-14 py-1.5 rounded-xl bg-surface-subtle border border-border text-center">
                        <Clock className="h-3.5 w-3.5 text-primary mb-0.5" aria-hidden="true" />
                        <span className="text-[11px] font-bold tabular-nums text-text-primary">{appt.startTime}</span>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-primary">{appt.serviceName}</span>
                          {appt.tokenNumber && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-primary/10 text-primary font-sans">
                              {appt.tokenNumber}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-text-muted">
                          {appt.date} • with {appt.staffName}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-text-primary tabular-nums">
                        {formatCurrency(appt.totalAmount, currency)}
                      </span>
                      <StatusBadge status={appt.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* TAB: SERVICES */}
        {activeTab === 'services' && (
          <Card className="p-5 space-y-4">
            <h3 className="text-sm font-bold text-text-primary">Service Treatment History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/80 text-[11px] font-bold text-text-muted uppercase">
                    <th className="py-2.5 px-3">Service Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Frequency</th>
                    <th className="py-2.5 px-3">Last Enjoyed</th>
                    <th className="py-2.5 px-3 text-right">Approx Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-text-primary">
                      {client.favoriteService || 'Hair Cut & Styling'}
                    </td>
                    <td className="py-3 px-3 text-text-muted">Hair Care & Styling</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-surface-subtle font-bold tabular-nums">
                        {Math.max(1, Math.floor(client.totalVisits * 0.6))}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-text-secondary tabular-nums">
                      {client.lastVisitDate ? formatDate(client.lastVisitDate) : 'Recent'}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-text-primary tabular-nums">
                      {formatCurrency(Math.floor(client.totalSpent * 0.6), currency)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-semibold text-text-primary">Hair Spa & Conditioning Masque</td>
                    <td className="py-3 px-3 text-text-muted">Spa Rituals</td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-surface-subtle font-bold tabular-nums">
                        {Math.max(1, Math.floor(client.totalVisits * 0.4))}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-text-secondary tabular-nums">28 Aug 2026</td>
                    <td className="py-3 px-3 text-right font-bold text-text-primary tabular-nums">
                      {formatCurrency(Math.floor(client.totalSpent * 0.4), currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* TAB: PAYMENTS */}
        {activeTab === 'payments' && (
          <Card className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Payments & Billing</h3>
                <p className="text-xs text-text-muted">Invoices generated, settled payments, and customer credit ledger</p>
              </div>
              <Link to={`/sales/billing?clientId=${client.id}`}>
                <Button variant="primary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
                  + New Bill for Guest
                </Button>
              </Link>
            </div>

            {clientBills.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Receipt className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">No Invoices on Record</p>
                  <p className="text-xs text-text-muted max-w-sm mx-auto mt-0.5">
                    This client has no recorded billing transactions yet. Create a bill during checkout or initiate a quick bill.
                  </p>
                </div>
                <Link to={`/sales/billing?clientId=${client.id}`}>
                  <Button variant="outline" size="sm">
                    Start Checkout
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {clientBills.map((bill) => {
                  const billDate = new Date(bill.createdAt).toLocaleDateString([], {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                  return (
                    <div
                      key={bill.id}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-subtle/50 px-2 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Receipt className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-text-primary font-mono">
                              {bill.invoiceNumber}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                                bill.paymentStatus === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                  : bill.paymentStatus === 'PARTIAL'
                                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                  : bill.paymentStatus === 'REFUNDED'
                                  ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              )}
                            >
                              {bill.paymentStatus}
                            </span>
                          </div>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            {billDate} • {bill.paymentMethod} • {bill.items.length} items ({bill.items.map((i) => i.name).slice(0, 2).join(', ')}{bill.items.length > 2 ? '…' : ''})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pl-12 sm:pl-0">
                        <div className="text-right">
                          <span className="text-xs font-bold text-text-primary tabular-nums block">
                            {formatCurrency(bill.grandTotal, currency)}
                          </span>
                          {bill.dueAmount > 0 ? (
                            <span className="text-[10px] font-bold text-rose-500 tabular-nums block">
                              Due: {formatCurrency(bill.dueAmount, currency)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-medium block">
                              Paid in full
                            </span>
                          )}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedInvoice(bill)}
                          leftIcon={<Eye className="h-3.5 w-3.5" />}
                          className="text-xs"
                        >
                          Invoice Slip
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        )}

        {/* TAB: MEMBERSHIP */}
        {activeTab === 'membership' && (
          <div className="space-y-6">
            {clientMembership ? (
              <div className="space-y-6">
                {/* Expiry Warning Alert if status is EXPIRING */}
                {clientMembership.status === 'EXPIRING' && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-800 dark:text-amber-300 text-xs">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-bold text-sm">Membership Expiring Soon</p>
                      <p className="mt-0.5 text-amber-700/90 dark:text-amber-400/90 leading-relaxed">
                        This {clientMembership.tier} Membership expires on{' '}
                        {new Date(
                          clientMembership.endDate || clientMembership.expiryDate
                        ).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                        . Remind client to renew to maintain VIP benefits and priority styling station reservations.
                      </p>
                    </div>
                  </div>
                )}

                {/* Current Plan Overview Card */}
                <Card className="p-6 relative overflow-hidden">
                  <div
                    className="absolute -right-12 -top-12 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"
                    aria-hidden="true"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Crown className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-extrabold text-text-primary">
                            {clientMembership.tier} Membership
                          </h3>
                          <Badge
                            variant={
                              clientMembership.status === 'ACTIVE'
                                ? 'success'
                                : clientMembership.status === 'EXPIRING'
                                ? 'warning'
                                : 'default'
                            }
                            size="sm"
                            className="uppercase text-[10px] font-black"
                          >
                            {clientMembership.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-muted mt-0.5">
                          Member ID: <span className="font-mono">{clientMembership.id}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs text-text-muted">Investment</p>
                      <p className="text-lg font-black text-text-primary tabular-nums">
                        {formatCurrency(clientMembership.price || clientMembership.pricePaid || 0)}
                      </p>
                    </div>
                  </div>

                  {/* 4 Stat Counters Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
                    <div className="p-3 rounded-xl bg-surface-subtle border border-border">
                      <p className="text-[11px] font-semibold text-text-muted">Start Date</p>
                      <p className="text-xs font-bold text-text-primary mt-1">
                        {new Date(clientMembership.startDate).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-subtle border border-border">
                      <p className="text-[11px] font-semibold text-text-muted">Expiry Date</p>
                      <p className="text-xs font-bold text-text-primary mt-1">
                        {new Date(
                          clientMembership.endDate || clientMembership.expiryDate
                        ).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-subtle border border-border">
                      <p className="text-[11px] font-semibold text-text-muted">Salon Visits</p>
                      <p className="text-xs font-black text-primary mt-1 tabular-nums">
                        {clientMembership.totalVisits} visits logged
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-subtle border border-border">
                      <p className="text-[11px] font-semibold text-text-muted">Benefits Used</p>
                      <p className="text-xs font-black text-emerald-600 mt-1 tabular-nums">
                        {clientMembership.benefitsUsedCount} / {clientMembership.totalBenefitsCount} benefits
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Privileges & Benefits Breakdown */}
                <Card className="p-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">
                      Active Privileges & Benefit Rule Allowances
                    </h4>
                    <p className="text-xs text-text-muted mt-0.5">
                      Live rules evaluated dynamically during checkout & online booking
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {clientMembership.benefits.map((benefit) => (
                      <div
                        key={benefit.id}
                        className="p-3.5 rounded-xl border border-border bg-surface-subtle/40 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-text-primary flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                            {benefit.name}
                          </p>
                          <p className="text-[11px] text-text-muted leading-relaxed">
                            {benefit.description}
                          </p>
                        </div>
                        {benefit.limit ? (
                          <span className="shrink-0 px-2 py-0.5 rounded-md bg-surface border border-border text-[10px] font-black text-primary tabular-nums">
                            {benefit.usedCount || 0} / {benefit.limit} used
                          </span>
                        ) : (
                          <span className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 text-[10px] font-black uppercase">
                            Unlimited
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Membership Purchase History */}
                <Card className="p-6 space-y-3">
                  <h4 className="text-sm font-bold text-text-primary">
                    Membership Purchase & Renewal History
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border text-[11px] text-text-muted uppercase">
                          <th className="py-2.5 px-3">Plan Tier</th>
                          <th className="py-2.5 px-3">Valid Range</th>
                          <th className="py-2.5 px-3">Amount</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        <tr>
                          <td className="py-3 px-3 font-bold text-text-primary">
                            {clientMembership.tier} Membership
                          </td>
                          <td className="py-3 px-3 text-text-muted tabular-nums">
                            {new Date(clientMembership.startDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            –{' '}
                            {new Date(
                              clientMembership.endDate || clientMembership.expiryDate
                            ).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-3 font-black text-text-primary tabular-nums">
                            {formatCurrency(clientMembership.price || clientMembership.pricePaid || 0)}
                          </td>
                          <td className="py-3 px-3">
                            <Badge variant="success" size="sm">
                              Active
                            </Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            ) : (
              <Card className="p-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                  <Crown className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">No Active Membership</h4>
                  <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                    {client.fullName} is not currently enrolled in a membership program. Enroll in Gold or Platinum to enable automatic discounts and free perks.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/memberships')}
                  leftIcon={<Crown className="h-3.5 w-3.5" />}
                >
                  Manage Memberships
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* TAB: PACKAGES */}
        {activeTab === 'packages' && (
          <div className="space-y-6">
            {clientWallets.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">
                      Prepaid Package Wallets & Passes ({clientWallets.length})
                    </h3>
                    <p className="text-xs text-text-muted">
                      Multi-session bundled treatment passes with live balance tracking
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/packages')}
                    leftIcon={<Plus className="h-3.5 w-3.5" />}
                  >
                    Sell Package Pass
                  </Button>
                </div>

                {/* Wallets Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clientWallets.map((wallet) => {
                    const totalRemaining = wallet.items.reduce(
                      (acc, i) => acc + i.remainingQuantity,
                      0
                    )
                    const totalAllowed = wallet.items.reduce(
                      (acc, i) => acc + i.totalQuantity,
                      0
                    )

                    return (
                      <Card key={wallet.id} className="p-5 space-y-4 border border-teal-500/20">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                              <Package className="h-5 w-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-text-primary">
                                {wallet.packageName}
                              </h4>
                              <p className="text-[11px] text-text-muted">
                                Wallet ID: <span className="font-mono">{wallet.id}</span>
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={wallet.status === 'active' ? 'success' : 'default'}
                            size="sm"
                            className="uppercase text-[9px] font-black"
                          >
                            {wallet.status}
                          </Badge>
                        </div>

                        {/* Sessions Breakdown */}
                        <div className="space-y-2.5 pt-2 border-t border-border">
                          <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                            <span>Included Treatments</span>
                            <span className="font-black tabular-nums text-teal-600">
                              {totalRemaining} / {totalAllowed} sessions remaining
                            </span>
                          </div>

                          <div className="space-y-2">
                            {wallet.items.map((item) => {
                              const pct = Math.round(
                                (item.remainingQuantity / item.totalQuantity) * 100
                              )
                              return (
                                <div
                                  key={item.serviceName}
                                  className="p-2.5 rounded-xl bg-surface-subtle border border-border text-xs space-y-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-bold text-text-primary">
                                      {item.serviceName}
                                    </span>
                                    <span className="font-black text-text-primary tabular-nums">
                                      {item.remainingQuantity} / {item.totalQuantity}
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                                    <div
                                      className="h-full bg-teal-500 transition-all rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
                          <span>
                            Purchased:{' '}
                            {new Date(wallet.purchaseDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                          <span>
                            Expires:{' '}
                            {new Date(wallet.expiryDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ) : (
              <Card className="p-10 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center mx-auto">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text-primary">No Service Packages</h4>
                  <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                    {client.fullName} has no active package passes. You can sell a multi-session bundle like Hair Care Pack or Glow Makeover.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/packages')}
                  leftIcon={<Package className="h-3.5 w-3.5" />}
                >
                  Manage Service Packages
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* TAB: LOYALTY & REFERRALS */}
        {activeTab === 'loyalty' && (
          <div className="space-y-6">
            {/* Top Cards: Balance & Referrals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Balance Card */}
              <Card className="p-5 space-y-4 bg-gradient-to-br from-pink-500/10 via-surface to-surface border-pink-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-600 dark:text-pink-400 flex items-center justify-center">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">Loyalty Points Balance</h4>
                      <p className="text-xs text-text-muted">Available salon rewards currency</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setIsAdjustModalOpen(true)}
                    className="text-xs bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    + Adjust Balance
                  </Button>
                </div>

                <div className="p-4 rounded-xl bg-surface-subtle border border-border flex items-baseline justify-between">
                  <div>
                    <span className="text-3xl font-extrabold text-pink-600 dark:text-pink-300 tabular-nums font-sans">
                      {loyaltyPoints}
                    </span>
                    <span className="text-xs font-bold text-text-muted ml-1.5">POINTS</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-text-muted block">Estimated Cash Value</span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ≈ ₹{Math.floor(loyaltyPoints / 2)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-text-muted leading-relaxed">
                  Earns 10 pts per ₹100 spent automatically on salon checkouts. Balances are never modified silently—all manual edits require documented operational justifications.
                </p>
              </Card>

              {/* Referral Profile Card */}
              <Card className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">Referral Program</h4>
                      <p className="text-xs text-text-muted">Give 200 pts, Get 500 pts on 1st visit</p>
                    </div>
                  </div>
                  <Badge variant="accent" size="sm" className="font-mono font-bold">
                    {referralCode || 'ACTIVE'}
                  </Badge>
                </div>

                <div className="p-3 rounded-xl bg-surface-subtle border border-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-text-muted uppercase font-mono tracking-wider block">
                      CLIENT&apos;S REFERRAL CODE
                    </span>
                    <span className="font-mono text-lg font-black text-primary tracking-widest">
                      {referralCode || 'N/A'}
                    </span>
                  </div>
                  {referralCode && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(referralCode)
                        setCopiedCode(true)
                        setTimeout(() => setCopiedCode(false), 2000)
                        addToast({
                          title: 'Code Copied',
                          message: `Referral code "${referralCode}" copied.`,
                          type: 'info',
                        })
                      }}
                      className="text-xs"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                      <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-surface-subtle border border-border text-center">
                    <span className="text-[10px] text-text-muted uppercase block">Total Referrals</span>
                    <span className="text-base font-bold text-text-primary">{clientReferrals.length}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-surface-subtle border border-border text-center">
                    <span className="text-[10px] text-text-muted uppercase block">Completed (Visited)</span>
                    <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      {clientReferrals.filter(r => r.status === 'COMPLETED').length}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Referred Friends Table */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span>Referred Friends &amp; Status ({clientReferrals.length})</span>
                </h4>
                <span className="text-xs text-text-muted">
                  Referrer earns 500 pts after first completed visit
                </span>
              </div>

              {clientReferrals.length === 0 ? (
                <p className="text-xs text-text-muted py-4 text-center">No referrals tracked yet for this customer.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border/80 text-[11px] text-text-muted font-semibold">
                        <th className="pb-2">Referred Friend</th>
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2 text-right">Referral Reward</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {clientReferrals.map((ref) => (
                        <tr key={ref.id} className="py-2.5">
                          <td className="py-2 font-bold text-text-primary">{ref.referredClientName}</td>
                          <td className="py-2 text-text-muted">{formatDate(ref.referralDate)}</td>
                          <td className="py-2">
                            <Badge
                              variant={ref.status === 'COMPLETED' ? 'success' : 'warning'}
                              size="sm"
                              className="text-[10px]"
                            >
                              {ref.status === 'COMPLETED' ? 'Completed & Paid' : 'Pending 1st Visit'}
                            </Badge>
                          </td>
                          <td className="py-2 text-right font-black tabular-nums text-amber-500">
                            {ref.status === 'COMPLETED' ? `+${ref.rewardPointsReferrer} pts` : 'Pending'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Immutable Points Ledger */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Clock className="w-4 h-4 text-pink-500" />
                  <span>Immutable Points Transaction Ledger</span>
                </h4>
                <span className="text-xs text-text-muted">
                  {clientTransactions.length} Transactions
                </span>
              </div>

              {clientTransactions.length === 0 ? (
                <p className="text-xs text-text-muted py-6 text-center">No points transactions recorded yet.</p>
              ) : (
                <div className="divide-y divide-border/60">
                  {clientTransactions.map((tx) => (
                    <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              tx.type === 'EARNED'
                                ? 'success'
                                : tx.type === 'REDEEMED'
                                ? 'primary'
                                : tx.type === 'BONUS'
                                ? 'accent'
                                : tx.type === 'EXPIRED'
                                ? 'danger'
                                : 'default'
                            }
                            size="sm"
                            className="text-[10px] uppercase font-bold"
                          >
                            {tx.type}
                          </Badge>
                          <span className="font-semibold text-text-primary">{tx.reason}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-text-muted">
                          <span>{formatDate(tx.createdAt)}</span>
                          {tx.referenceId && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-text-muted">Ref: {tx.referenceId}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={cn(
                            'text-base font-black tabular-nums',
                            tx.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          )}
                        >
                          {tx.points > 0 ? `+${tx.points}` : tx.points}
                        </span>
                        <span className="text-xs text-text-muted block font-medium">pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* TAB: NOTES */}
        {activeTab === 'notes' && (
          <div className="space-y-4">
            {/* Add note card */}
            <Card className="p-4 sm:p-5">
              <form onSubmit={handleAddNote} className="space-y-3">
                <label className="text-xs font-bold text-text-primary block">
                  Add Private Salon Note
                </label>
                <textarea
                  rows={2}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Record hair color codes, allergy warnings, product feedback, or guest preferences…"
                  className="w-full rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!newNoteText.trim() || isAddingNote}
                    isLoading={isAddingNote}
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                  >
                    Save Note
                  </Button>
                </div>
              </form>
            </Card>

            {/* Existing notes list */}
            <div className="space-y-3">
              {client.clientNotes && client.clientNotes.length > 0 ? (
                client.clientNotes.map((note) => (
                  <Card key={note.id} className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-text-muted">
                      <span className="font-bold text-text-primary">{note.authorName}</span>
                      <span className="tabular-nums">{formatDate(note.createdAt)}</span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      {note.content}
                    </p>
                  </Card>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-text-muted">
                  No private notes added yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: COMMUNICATIONS */}
        {activeTab === 'communications' && (
          <div className="space-y-6">
            {/* 1. Consent & Privacy Policy Card */}
            <Card className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">
                      Client Communication Consent & Preferences
                    </h3>
                    <p className="text-xs text-text-muted">
                      Architectural separation of transactional alerts vs promotional campaigns
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={handleSaveConsent}
                  isLoading={isSavingConsent}
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                >
                  Save Consent Settings
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Transactional Consent */}
                <div className="p-4 rounded-2xl bg-surface-subtle border border-border flex flex-col justify-between space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-text-primary">
                        Transactional Messages
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Operational
                      </span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transactionalOptIn}
                        onChange={(e) => setTransactionalOptIn(e.target.checked)}
                        className="sr-only peer"
                        aria-label="Toggle transactional notifications"
                      />
                      <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-[transform,background-color] peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Booking confirmations, appointment reminders (24h/2h before), rescheduling alerts, and tax invoices.
                  </p>
                  <span className="text-[11px] font-medium text-text-secondary">
                    Status: {transactionalOptIn ? '✓ Active & Authorized' : '⚠️ Paused by Client Request'}
                  </span>
                </div>

                {/* Marketing Consent */}
                <div className="p-4 rounded-2xl bg-surface-subtle border border-border flex flex-col justify-between space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <span className="text-xs font-bold text-text-primary">
                        Promotional & Marketing
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                        Promotional
                      </span>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={marketingOptIn}
                        onChange={(e) => setMarketingOptIn(e.target.checked)}
                        className="sr-only peer"
                        aria-label="Toggle marketing campaigns"
                      />
                      <div className="w-9 h-5 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-[transform,background-color] peer-checked:bg-violet-600"></div>
                    </label>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Birthday surprises, festival offers, double-point VIP events, and loyalty discount vouchers.
                  </p>
                  <span className="text-[11px] font-medium text-text-secondary">
                    Status: {marketingOptIn ? '✓ Opted In for Offers' : '🚫 Do Not Disturb (DND Active - System Suppressed)'}
                  </span>
                </div>
              </div>

              {/* Preferred Channel */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs font-bold text-text-secondary">
                  Primary Delivery Channel:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(['WHATSAPP', 'SMS', 'EMAIL', 'IN_APP'] as CommunicationChannel[]).map((ch) => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setPreferredChannel(ch)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all',
                        preferredChannel === ch
                          ? 'bg-primary text-white border-primary shadow-xs'
                          : 'bg-surface border-border text-text-secondary hover:text-text-primary'
                      )}
                    >
                      {ch === 'WHATSAPP' && 'WhatsApp'}
                      {ch === 'SMS' && 'SMS Carrier'}
                      {ch === 'EMAIL' && 'Email'}
                      {ch === 'IN_APP' && 'In-App Portal'}
                    </button>
                  ))}
                </div>
              </div>
            </Card>

            {/* 2. Communication History & Audit Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  Communication History & Delivery Audit
                </h3>
                <p className="text-xs text-text-muted">
                  Full trail of automated reminders, receipts and outbound messages
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => setIsSendMessageModalOpen(true)}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Send Direct Message
                </Button>
              </div>
            </div>

            {/* Channel filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {['ALL', 'WHATSAPP', 'SMS', 'EMAIL', 'IN_APP'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setLogFilterChannel(f)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap',
                    logFilterChannel === f
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-surface border-border text-text-muted hover:text-text-primary'
                  )}
                >
                  {f === 'ALL' ? 'All Channels' : f}
                </button>
              ))}
            </div>

            {/* 3. Communication Logs List */}
            {(() => {
              const filtered = clientLogs.filter(
                (l) => logFilterChannel === 'ALL' || l.channel === logFilterChannel
              )

              if (filtered.length === 0) {
                return (
                  <Card className="p-10 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-surface-subtle text-text-muted mx-auto flex items-center justify-center">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-primary">
                        No Message History Found
                      </h4>
                      <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                        No notifications or direct messages have been dispatched to this client yet.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsSendMessageModalOpen(true)}
                      leftIcon={<Send className="w-3.5 h-3.5" />}
                    >
                      Send First Message
                    </Button>
                  </Card>
                )
              }

              return (
                <div className="space-y-3">
                  {filtered.map((log) => {
                    const isFailed = log.status === 'FAILED'
                    return (
                      <Card key={log.id} className="p-4 sm:p-5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border/70">
                          <div className="flex flex-wrap items-center gap-2">
                            {/* Channel Badge */}
                            <span
                              className={cn(
                                'px-2.5 py-0.5 rounded-lg text-xs font-bold flex items-center gap-1.5',
                                log.channel === 'WHATSAPP' && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
                                log.channel === 'SMS' && 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
                                log.channel === 'EMAIL' && 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
                                log.channel === 'IN_APP' && 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20'
                              )}
                            >
                              <Smartphone className="w-3 h-3" />
                              <span>{log.channel}</span>
                            </span>

                            {/* Category Badge */}
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider',
                                log.category === 'TRANSACTIONAL'
                                  ? 'bg-surface-subtle text-text-secondary border border-border'
                                  : 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20'
                              )}
                            >
                              {log.category}
                            </span>

                            {/* Status Badge */}
                            <span
                              className={cn(
                                'px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide',
                                log.status === 'DELIVERED' && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
                                log.status === 'SENT' && 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
                                log.status === 'READ' && 'bg-teal-500/15 text-teal-700 dark:text-teal-400',
                                log.status === 'QUEUED' && 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
                                log.status === 'FAILED' && 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                              )}
                            >
                              {log.status}
                            </span>

                            {log.templateName && (
                              <span className="text-xs font-semibold text-text-primary">
                                • {log.templateName}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-xs text-text-muted tabular-nums">
                            <span>{formatDate(log.sentAt)}</span>
                            <span>•</span>
                            <span className="font-mono text-[11px]">{log.recipient}</span>
                          </div>
                        </div>

                        {/* Message Subject & Body */}
                        <div className="space-y-1">
                          {log.subject && (
                            <h4 className="text-xs font-bold text-text-primary">
                              Subject: {log.subject}
                            </h4>
                          )}
                          <p className="text-xs text-text-secondary whitespace-pre-wrap leading-relaxed font-sans bg-surface-subtle/50 p-3 rounded-xl border border-border/50">
                            {log.body}
                          </p>
                        </div>

                        {/* Error Diagnostics & Retry Block */}
                        {isFailed && (
                          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
                              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                              <div>
                                <span className="font-bold block">Delivery Failure Reason:</span>
                                <span>{log.error || 'Carrier transmission error.'}</span>
                                <span className="text-[10px] text-text-muted block mt-0.5">
                                  Retry Count: {log.retryCount} of {log.maxRetries} allowed
                                </span>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetryMessage(log.id)}
                              isLoading={retryingLogId === log.id}
                              disabled={log.retryCount >= log.maxRetries}
                              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                              className="border-rose-500/30 hover:border-rose-500 text-rose-700 dark:text-rose-300 self-start sm:self-auto shrink-0"
                            >
                              {log.retryCount >= log.maxRetries ? 'Max Retries Exceeded' : 'Retry Delivery'}
                            </Button>
                          </div>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* Send Direct Communication Modal */}
      {isSendMessageModalOpen && (
        <Modal
          isOpen={isSendMessageModalOpen}
          onClose={() => setIsSendMessageModalOpen(false)}
          title={`Send Message to ${client.fullName}`}
          size="lg"
        >
          <form onSubmit={handleDispatchDirectMessage} className="space-y-4">
            {/* Quick Template Picker */}
            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Use Pre-Configured Template (Optional)
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleSelectTemplate(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Custom One-Off Message --</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    [{tpl.channel}] {tpl.name} ({tpl.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Channel */}
              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Delivery Channel
                </label>
                <select
                  value={sendChannel}
                  onChange={(e) => setSendChannel(e.target.value as CommunicationChannel)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="SMS">SMS Carrier</option>
                  <option value="EMAIL">Email</option>
                  <option value="IN_APP">In-App Notification</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Message Category
                </label>
                <select
                  value={sendCategory}
                  onChange={(e) => setSendCategory(e.target.value as MessageCategory)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="TRANSACTIONAL">Transactional (Booking / Reminder / Invoice)</option>
                  <option value="MARKETING">Marketing (Promotional / Offers / Discount)</option>
                </select>
              </div>
            </div>

            {/* Recipient info & DND Notice */}
            <div className="p-3 rounded-xl bg-surface-subtle text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-text-muted">Target Destination:</span>
                <span className="font-mono font-bold text-text-primary">
                  {sendChannel === 'EMAIL' ? client.email || 'No email on file' : client.phone || 'No phone on file'}
                </span>
              </div>
              {sendCategory === 'MARKETING' && !marketingOptIn && (
                <div className="pt-2 text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5 border-t border-border mt-1">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>
                    Warning: Client has opted OUT of marketing messages. Sending under Marketing category will be blocked by DND compliance rules.
                  </span>
                </div>
              )}
            </div>

            {/* Email Subject */}
            {sendChannel === 'EMAIL' && (
              <div>
                <label className="text-xs font-bold text-text-primary block mb-1">
                  Email Subject
                </label>
                <Input
                  value={sendSubject}
                  onChange={(e) => setSendSubject(e.target.value)}
                  placeholder="e.g. Appointment Confirmation - SALORA Luxe"
                  required
                />
              </div>
            )}

            {/* Message Body */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-text-primary">
                  Message Content
                </label>
                <span className="text-[10px] text-text-muted">
                  {sendMessageText.length} characters
                </span>
              </div>
              <textarea
                rows={4}
                value={sendMessageText}
                onChange={(e) => setSendMessageText(e.target.value)}
                placeholder="Type your message text here…"
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsSendMessageModalOpen(false)}
                disabled={isSendingMessage}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isSendingMessage}
                disabled={!sendMessageText.trim() || isSendingMessage}
                leftIcon={<Send className="w-3.5 h-3.5" />}
              >
                Dispatch Message
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Invoice Slip Preview Modal */}
      {selectedInvoice && (
        <BillInvoicePreviewModal
          bill={selectedInvoice}
          isOpen={true}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      {/* Manual Loyalty Points Adjustment Modal */}
      {isAdjustModalOpen && (
        <Modal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          title="Manual Loyalty Point Adjustment"
          size="md"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
              <strong className="block font-bold mb-0.5">Strict Audit Compliance:</strong>
              Points are never silently modified. Every credit or debit is permanently logged in the
              immutable transaction ledger with mandatory justification.
            </div>

            <div className="flex items-center gap-2 p-1 rounded-xl bg-surface-subtle border border-border">
              <button
                type="button"
                onClick={() => setAdjustType('credit')}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-xs font-bold transition-all',
                  adjustType === 'credit'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                + Credit Points (Add)
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('debit')}
                className={cn(
                  'flex-1 py-1.5 rounded-lg text-xs font-bold transition-all',
                  adjustType === 'debit'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                - Debit Points (Deduct)
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Point Amount
              </label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 150"
                value={adjustPoints}
                onChange={(e) => setAdjustPoints(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-text-primary block mb-1">
                Justification Reason (Mandatory)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Compensation for service wait time, promotional grant, or correction…"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-surface-subtle">
              <span className="text-text-muted">Current Balance:</span>
              <span className="font-bold text-text-primary tabular-nums">{loyaltyPoints} pts</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAdjustModalOpen(false)}
                disabled={isAdjusting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAdjustPoints}
                disabled={isAdjusting || !adjustPoints || !adjustReason.trim()}
                className={adjustType === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
              >
                {isAdjusting ? 'Recording Transaction…' : `Confirm ${adjustType === 'credit' ? 'Credit' : 'Debit'}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
