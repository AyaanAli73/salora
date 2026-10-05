import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Edit2,
  Copy,
  Power,
  Clock,
  Users,
  Star,
  Package,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Globe,
  IndianRupee,
  Layers,
} from 'lucide-react'
import { serviceService } from '@/services/serviceService'
import { staffService } from '@/services/staffService'
import { reviewService } from '@/services/reviewService'
import { Service, Staff, Review } from '@/types'
import { ServiceStatsSummary, ServiceForm } from '@/features/services'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatCurrency } from '@/utils/formatters'
import { useToastStore } from '@/store/useToastStore'
import { cn } from '@/utils/cn'

export const ServiceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToast } = useToastStore()

  const [service, setService] = useState<Service | null>(null)
  const [assignedStaff, setAssignedStaff] = useState<Staff[]>([])
  const [serviceReviews, setServiceReviews] = useState<Review[]>([])
  const [serviceRatingData, setServiceRatingData] = useState<{ rating: number; reviewCount: number }>({ rating: 4.8, reviewCount: 40 })
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'inventory' | 'reviews'>('overview')

  const loadData = async () => {
    if (!id) return
    setIsLoading(true)
    try {
      const [serviceData, allStaff, ratingCalc, revs] = await Promise.all([
        serviceService.getById(id),
        staffService.getAll(),
        reviewService.getServiceRating(id),
        reviewService.getReviewsByService(id),
      ])

      if (serviceData) {
        setService(serviceData)
        const matchedStaff = allStaff.filter((st) =>
          serviceData.assignedStaffIds.includes(st.id)
        )
        setAssignedStaff(matchedStaff)
        setServiceRatingData(ratingCalc)
        setServiceReviews(revs)
      } else {
        setService(null)
      }
    } catch (err) {
      console.error('Failed to load service:', err)
      addToast({
        title: 'Error',
        message: 'Could not load service details.',
        type: 'danger',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  const handleUpdate = async (updatedData: Partial<Service>) => {
    if (!id) return
    try {
      const updated = await serviceService.update(id, updatedData)
      setService(updated)
      addToast({
        title: 'Service Updated',
        message: `${updated.name} has been updated.`,
        type: 'success',
      })
      loadData()
    } catch {
      addToast({
        title: 'Update Failed',
        message: 'Could not update service.',
        type: 'danger',
      })
    }
  }

  const handleDuplicate = async () => {
    if (!id) return
    try {
      const copy = await serviceService.duplicate(id)
      addToast({
        title: 'Service Duplicated',
        message: `Created duplicate: ${copy.name}.`,
        type: 'success',
      })
      navigate(`/services/${copy.id}`)
    } catch {
      addToast({
        title: 'Error',
        message: 'Could not duplicate service.',
        type: 'danger',
      })
    }
  }

  const handleToggleActive = async () => {
    if (!id) return
    try {
      const updated = await serviceService.toggleActive(id)
      setService(updated)
      addToast({
        title: updated.isActive ? 'Service Activated' : 'Service Deactivated',
        message: `${updated.name} is now ${updated.isActive ? 'active' : 'inactive'}.`,
        type: 'info',
      })
    } catch {
      addToast({
        title: 'Error',
        message: 'Could not change service status.',
        type: 'danger',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="h-8 bg-surface-subtle rounded-md w-36 animate-pulse" />
        <div className="h-44 bg-surface rounded-3xl border border-border animate-pulse p-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-surface rounded-2xl border border-border animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="py-16 text-center flex flex-col items-center justify-center gap-4">
        <div className="h-16 w-16 rounded-full bg-danger-light text-danger-fg flex items-center justify-center">
          <Sparkles className="h-8 w-8" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-text-primary">Treatment Not Found</h2>
          <p className="text-xs text-text-muted">
            The service record you are looking for does not exist or has been removed.
          </p>
        </div>
        <Button
          variant="outline"
          size="md"
          onClick={() => navigate('/services')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Return to Treatment Menu
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <Link
          to="/services"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary transition-[color]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Services</span>
        </Link>
      </div>

      {/* 1. Service Hero Card */}
      <Card className="p-6 sm:p-7 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 min-w-0">
            {/* Service Visual */}
            <div className="h-24 w-32 rounded-2xl overflow-hidden bg-surface-subtle shrink-0 border border-border relative">
              {service.imageUrl ? (
                <img
                  src={service.imageUrl}
                  alt={service.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-primary/40">
                  <Sparkles className="h-8 w-8" aria-hidden="true" />
                </div>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary-50 text-primary dark:bg-primary-950 dark:text-primary-300 border border-primary/20">
                  {service.categoryName}
                </span>
                {service.isPackage && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-accent text-white">
                    Package Bundle
                  </span>
                )}
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[11px] font-bold',
                    service.isActive
                      ? 'bg-success-light text-success-fg'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  )}
                >
                  {service.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-primary font-sans mt-1.5">
                {service.name}
              </h1>

              <p className="text-xs text-text-muted mt-1 max-w-xl leading-relaxed">
                {service.description}
              </p>

              {/* Fast parameters */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-xs text-text-muted font-medium">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  <span className="tabular-nums font-semibold text-text-primary">
                    {service.duration} min duration
                  </span>
                  {service.bufferTime ? `(+${service.bufferTime}m buffer)` : ''}
                </span>

                <span className="flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                  <span className="text-text-primary">
                    {service.isOnlineBookingEnabled ? 'Bookable Online' : 'In-Salon Only'}
                  </span>
                </span>

                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                  <span className="text-text-primary">
                    {assignedStaff.length} Stylists assigned
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto shrink-0">
            <Button
              variant="outline"
              size="md"
              onClick={handleDuplicate}
              leftIcon={<Copy className="h-4 w-4" />}
            >
              Duplicate
            </Button>

            <Button
              variant="outline"
              size="md"
              onClick={handleToggleActive}
              leftIcon={<Power className="h-4 w-4 text-warning" />}
            >
              {service.isActive ? 'Deactivate' : 'Activate'}
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => setIsEditDrawerOpen(true)}
              leftIcon={<Edit2 className="h-4 w-4" />}
              className="shadow-glow-primary/40 font-semibold"
            >
              Edit Treatment
            </Button>
          </div>
        </div>
      </Card>

      {/* 2. Service Statistics & Popularity Trend Chart */}
      <ServiceStatsSummary service={service} currency="INR" />

      {/* 3. Navigation Tabs */}
      <div className="border-b border-border/80">
        <div className="flex items-center gap-2 overflow-x-auto pb-px">
          {[
            { id: 'overview', label: 'Pricing & Rules' },
            { id: 'staff', label: 'Assigned Specialists', count: assignedStaff.length },
            {
              id: 'inventory',
              label: 'Inventory Consumed',
              count: service.consumedProducts?.length || 0,
            },
            { id: 'reviews', label: 'Guest Reviews', count: service.reviews?.length || 0 },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
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
                      isActive
                        ? 'bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300'
                        : 'bg-surface-subtle text-text-muted'
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
        {/* TAB 1: PRICING & RULES */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-text-primary">Pricing Structure</h3>
              <div className="divide-y divide-border/60 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-text-muted">Base Treatment Price:</span>
                  <span className="font-extrabold text-text-primary tabular-nums">
                    {formatCurrency(service.price, 'INR')}
                  </span>
                </div>
                {service.discountPrice && (
                  <div className="py-2.5 flex justify-between">
                    <span className="text-text-muted">Promotional Discount Price:</span>
                    <span className="font-bold text-accent tabular-nums">
                      {formatCurrency(service.discountPrice, 'INR')}
                    </span>
                  </div>
                )}
                <div className="py-2.5 flex justify-between">
                  <span className="text-text-muted">GST Rate Applied:</span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    {service.taxRate || 18}%
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-text-muted">Stylist Commission:</span>
                  <span className="font-semibold text-text-primary tabular-nums">
                    {service.commissionRate || 40}%
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-bold text-text-primary">Booking & Salon Rules</h3>
              <div className="divide-y divide-border/60 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-text-muted">Online Guest Booking:</span>
                  <span className="font-semibold text-text-primary">
                    {service.isOnlineBookingEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-text-muted">Deposit Required:</span>
                  <span className="font-semibold text-text-primary">
                    {service.requireDeposit
                      ? `Yes (${formatCurrency(service.depositAmount || 0, 'INR')})`
                      : 'None required'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-text-muted">Walk-ins Permitted:</span>
                  <span className="font-semibold text-text-primary">
                    {service.allowWalkIns ? 'Yes' : 'Reservation Only'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-text-muted">Public Website Visibility:</span>
                  <span className="font-semibold text-text-primary">
                    {service.showOnWebsite ? 'Visible on Website' : 'Hidden'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* TAB 2: ASSIGNED STAFF */}
        {activeTab === 'staff' && (
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  Assigned Treatment Specialists
                </h3>
                <p className="text-xs text-text-muted">
                  Stylists qualified and scheduled to execute this service
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDrawerOpen(true)}
              >
                Modify Specialists
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {assignedStaff.map((st) => (
                <div
                  key={st.id}
                  className="p-4 rounded-2xl bg-surface-subtle border border-border flex items-center gap-3.5"
                >
                  <Avatar name={st.name} src={st.avatarUrl} size="md" status="online" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-text-primary truncate">
                      {st.name}
                    </span>
                    <span className="text-[11px] text-text-muted truncate">
                      {st.role}
                    </span>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-text-muted">
                      <span className="font-bold text-amber-500 tabular-nums">
                        {st.rating} ★
                      </span>
                      <span>•</span>
                      <span>{st.appointmentsCompleted} appts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* TAB 3: INVENTORY CONSUMPTION */}
        {activeTab === 'inventory' && (
          <Card className="p-5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-text-primary">
                Product Consumption (Inventory Depletion)
              </h3>
              <p className="text-xs text-text-muted">
                Standard formula supplies automatically deducted from inventory per appointment
              </p>
            </div>

            {service.consumedProducts && service.consumedProducts.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-surface-subtle font-bold text-text-muted">
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3 text-center">Standard Quantity</th>
                      <th className="py-2.5 px-3 text-right">Approx Product Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {service.consumedProducts.map((prod, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-semibold text-text-primary">
                          {prod.productName}
                        </td>
                        <td className="py-2.5 px-3 text-center tabular-nums font-medium text-text-secondary">
                          {prod.quantity} {prod.unit}
                        </td>
                        <td className="py-2.5 px-3 text-right tabular-nums font-bold text-text-primary">
                          {formatCurrency(prod.cost, 'INR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-text-muted">
                No inventory consumption configured for this service.
              </div>
            )}
          </Card>
        )}

        {/* TAB 4: REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-4 rounded-2xl border border-border">
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  Guest Feedback & Ratings for {service.name}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Verified client reviews and quality ratings for this salon treatment
                </p>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 self-start sm:self-auto">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>
                  {serviceRatingData.rating.toFixed(1)} ★ ({serviceRatingData.reviewCount} Reviews)
                </span>
              </span>
            </div>

            {serviceReviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviceReviews.map((rev) => (
                  <ReviewCard key={rev.id} review={rev} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center text-xs text-text-muted space-y-2 border border-border">
                <Star className="w-8 h-8 text-amber-400 mx-auto" />
                <p className="font-semibold text-text-primary">No specific reviews recorded yet</p>
                <p>Guest feedback for {service.name} will appear here once submitted.</p>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Edit Service Drawer */}
      <ServiceForm
        isOpen={isEditDrawerOpen}
        onClose={() => setIsEditDrawerOpen(false)}
        onSubmit={handleUpdate}
        initialData={service}
      />
    </div>
  )
}
