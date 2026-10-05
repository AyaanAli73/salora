export type Role = 'owner' | 'admin' | 'manager' | 'receptionist' | 'staff' | 'stylist'

export type Permission =
  | 'view:dashboard'
  | 'manage:clients'
  | 'manage:appointments'
  | 'manage:services'
  | 'manage:staff'
  | 'manage:inventory'
  | 'manage:billing'
  | 'manage:expenses'
  | 'view:reports'
  | 'manage:settings'

export interface User {
  id: string
  name: string
  username?: string
  email: string
  role: Role
  avatarUrl?: string
  salonId: string
  phone?: string
  branchIds?: string[] // Accessible branch IDs
  primaryBranchId?: string // Default branch
  tenantId?: string // Current active organization/tenant ID
  tenantIds?: string[] // All organizations the user belongs to
  isSuperAdmin?: boolean // True if user is a platform super administrator
}

export interface AuthSession {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isOnboarded: boolean
}

export interface LoginCredentials {
  email?: string
  username?: string
  emailOrPhone?: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  fullName: string
  email: string
  phone: string
  password: string
  salonName?: string
  salonAddress?: string
  role?: Role
}

export interface SalonOnboardingData {
  salonName: string
  salonTagline?: string
  logoUrl?: string
  city: string
  state: string
  postalCode: string
  phone: string
  openingTime: string
  closingTime: string
  workingDays: string[]
  services: {
    name: string
    duration: number
    price: number
    category: string
  }[]
  firstStaff: {
    name: string
    email: string
    phone: string
    role: string
  }
}

export type DepositType = 'none' | 'fixed' | 'percentage'

export interface BookingSettings {
  onlineBookingEnabled: boolean
  advanceBookingDays: number
  minimumNoticeHours: number
  cancellationWindowHours: number
  rescheduleWindowHours: number
  depositType: DepositType
  depositAmount: number
  allowStaffSelection: boolean
  allowPreferredStaff: boolean
  showPricing: boolean
  showServiceDuration: boolean
  bufferTimeMinutes: number
}

export interface Salon {
  id: string
  name: string
  tagline?: string
  logo?: string
  phone: string
  email: string
  address: string
  city: string
  state: string
  pincode: string
  postalCode?: string // backward compatibility alias
  website?: string
  currency?: string
  timezone?: string
  taxInformation?: {
    gstin?: string
    panNumber?: string
    taxRatePercent?: number
    isGstRegistered?: boolean
    legalBusinessName?: string
  }
  businessHours?: {
    open: string
    close: string
  }
  workingDays?: string[]
  openHours: {
    day: string
    open: string
    close: string
    closed: boolean
  }[]
  bookingSettings?: BookingSettings
  printingSettings?: {
    receiptHeader?: string
    receiptFooter?: string
    showGstNumber?: boolean
    paperWidth?: '58mm' | '80mm' | 'A4'
    autoPrintReceipts?: boolean
    tokenPrefix?: string
  }
  notificationSettings?: {
    sendAppointmentSms?: boolean
    sendAppointmentWhatsapp?: boolean
    sendEmailReceipts?: boolean
    sendMarketingPromos?: boolean
    senderId?: string
  }
  createdAt?: string
  updatedAt?: string
}

export type ClientStatus = 'active' | 'vip' | 'inactive' | 'new'

export type ClientGender = 'female' | 'male' | 'non-binary' | 'other' | 'prefer-not-to-say'

export interface ClientAddress {
  street?: string
  city?: string
  state?: string
  postalCode?: string
}

export interface ClientTimelineItem {
  id: string
  date: string
  fullDate?: string
  serviceName: string
  price: number
  status: 'completed' | 'in-progress' | 'scheduled' | 'cancelled'
  staffName?: string
  notes?: string
}

export interface ClientNote {
  id: string
  content: string
  authorName: string
  createdAt: string
  text?: string
  category?: string
}

export interface ClientServiceHistory {
  id: string
  serviceName: string
  category: string
  frequency: number
  lastDate: string
  totalSpent: number
}

export interface Client {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string
  avatarUrl?: string
  totalVisits: number
  totalSpent: number
  lastVisitDate?: string
  lastVisit?: string
  nextAppointmentDate?: string
  preferredStaffId?: string
  tags: string[]
  notes?: string
  status: ClientStatus
  birthday?: string
  dateOfBirth?: string
  gender?: ClientGender
  address?: ClientAddress | string
  favoriteService?: string
  outstandingBalance?: number
  isVip?: boolean
  timeline?: ClientTimelineItem[]
  clientNotes?: ClientNote[]
  membership?: ClientMembership
  packageWallets?: ClientPackageWallet[]
  loyaltyPoints?: number
  referralCode?: string
  referredByCode?: string
  referralCount?: number
  communicationPreferences?: {
    marketingOptIn: boolean
    transactionalOptIn: boolean
    preferredChannel?: 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP'
  }
  primaryBranchId?: string
  favoriteBranchId?: string
  homeBranchName?: string
  branchHistory?: string[]
  tenantId?: string
  vip?: boolean
  city?: string
  createdAt: string
  updatedAt?: string
}

export interface ClientStatsSummary {
  totalClients: number
  totalClientsChange: string
  totalClientsChangePositive: boolean
  newClients: number
  newClientsChange: string
  newClientsChangePositive: boolean
  returningClients: number
  returningClientsChange: string
  returningClientsChangePositive: boolean
  vipClients: number
  vipClientsChange: string
  vipClientsChangePositive: boolean
  newThisMonth?: number
  churnRisk?: number
  statusDistribution: {
    name: string
    value: number
    color: string
  }[]
}

export type AppointmentStatus =
  | 'requested'
  | 'pending'
  | 'confirmed'
  | 'checked-in'
  | 'waiting'
  | 'called'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'no-show'
  | 'scheduled'

export type AppointmentType = 'APPOINTMENT' | 'WALK_IN'

export type TokenStatus =
  | 'WAITING'
  | 'CALLED'
  | 'IN_SERVICE'
  | 'COMPLETED'
  | 'SKIPPED'
  | 'CANCELLED'
  | 'HOLD'

export type TokenPriority = 'NORMAL' | 'VIP' | 'EMERGENCY'

export interface Token {
  id: string
  tokenNumber: string // e.g. "T001"
  displayNumber: string // e.g. "#001"
  sequence: number
  appointmentId: string
  appointmentType: AppointmentType
  clientId: string
  clientName: string
  clientPhone?: string
  clientAvatar?: string
  isVip?: boolean
  serviceId: string
  serviceName: string
  serviceDuration: number // minutes
  servicePrice: number
  staffId: string
  staffName: string
  staffAvatar?: string
  date: string // YYYY-MM-DD
  status: TokenStatus
  priority: TokenPriority
  estimatedWaitMinutes?: number
  notes?: string
  createdAt: string
  updatedAt?: string
  checkedInAt: string
  checkInTime?: string
  calledAt?: string
  calledTime?: string
  startedAt?: string
  startTime?: string
  completedAt?: string
  completedTime?: string
  skippedAt?: string
  holdAt?: string
  cancelledAt?: string
}

export type PrintPaperSize = '58mm' | '80mm' | 'a4'
export type PrintTemplateType = 'a4' | 'thermal_80mm' | 'thermal_58mm'
export type PrintJobType = 'invoice' | 'receipt' | 'token'
export type PrintJobStatus = 'QUEUED' | 'PRINTING' | 'COMPLETED' | 'FAILED'

export interface PrinterSettings {
  paperSize: '58mm' | '80mm'
  defaultInvoiceSize: '58mm' | '80mm' | 'a4'
  defaultTokenSize: '58mm' | '80mm'
  autoPrint: boolean
  autoPrintInvoice: boolean
  autoPrintToken: boolean
  copies: 1 | 2 | 3
  showLogo: boolean
  showCustomerName: boolean
  showStaffName: boolean
  showService: boolean
  showTime: boolean
  showTokenNumber: boolean
  showPaymentMethod: boolean
  showGstTax: boolean
  customFooterText?: string
  salonGstin?: string
}

export interface PrintJob {
  id: string
  type: PrintJobType
  documentId: string
  template: PrintTemplateType
  paperSize: PrintPaperSize
  copies: number
  status: PrintJobStatus
  createdAt: string
  completedAt?: string
  error?: string
}

export interface QueueStats {
  waiting: number
  called: number
  inService: number
  completed: number
  averageWaitMinutes: number
  totalServed?: number
  totalTokens?: number
}

export type BookingSource = 'ADMIN' | 'WALK_IN' | 'ONLINE' | 'PHONE' | 'SOCIAL' | 'OTHER'

export interface Appointment {
  id: string
  appointmentId?: string
  appointmentType?: AppointmentType
  clientId: string
  clientName: string
  clientPhone: string
  clientAvatar?: string
  serviceId: string
  serviceName: string
  serviceDuration: number // minutes
  servicePrice: number
  staffId: string
  staffName: string
  staffAvatar?: string
  date: string // YYYY-MM-DD
  startTime: string // HH:mm
  endTime: string // HH:mm
  duration?: number // minutes
  status: AppointmentStatus
  price: number // Base price in INR
  discount?: number
  tax?: number
  totalAmount: number
  paymentStatus: 'paid' | 'unpaid' | 'partial' | 'refunded'
  tokenNumber?: string // Sequential token number e.g. "#027"
  tokenId?: string
  queueStatus?: 'waiting' | 'in_chair' | 'completed' | 'skipped' | 'called' | 'hold'
  priority?: TokenPriority
  serviceCategory?: string
  billId?: string
  notes?: string
  customerRequest?: string
  internalNote?: string
  roomOrStation?: string
  bookingSource?: BookingSource
  depositPaid?: number
  depositRequired?: number
  depositStatus?: 'none' | 'paid' | 'pending' | 'refunded'
  branchId?: string
  branchName?: string
  createdAt: string
  updatedAt?: string
}

export interface AppointmentStatsSummary {
  totalAppointments: number
  completed: number
  pending: number
  cancelled: number
  confirmedAppointments?: number
  inProgressAppointments?: number
  completedAppointments?: number
  cancelledAppointments?: number
}

export interface TimeSlot {
  time: string
  endTime: string
  isAvailable: boolean
  reason?: string
  staffId?: string
  staffName?: string
}

export type ServiceCategoryType =
  | 'Hair'
  | 'Skin'
  | 'Nails'
  | 'Makeup'
  | 'Spa'
  | 'Beard'
  | 'Bridal'
  | 'Packages'

export interface ServiceCategory {
  id: string
  name: ServiceCategoryType
  description?: string
  color: string
  iconName?: string
}

export interface ServiceProductConsumption {
  productId: string
  productName: string
  quantity: number
  unit: string
  cost: number
}

export interface ServicePopularityTrend {
  month: string
  bookings: number
  revenue: number
}

export interface ServiceReviewItem {
  id: string
  clientName: string
  avatarUrl?: string
  rating: number
  comment: string
  date: string
}

export interface ServicePackageItem {
  serviceId: string
  serviceName: string
  duration: number
  individualPrice: number
}

export interface Service {
  id: string
  name: string
  categoryId: string
  categoryName: ServiceCategoryType
  category?: string
  description: string
  duration: number // minutes
  price: number // Base price in INR (e.g. ₹499)
  discountPrice?: number // Optional special rate
  bufferTime?: number // Minutes before/after
  taxRate?: number // e.g. 18% GST
  imageUrl?: string
  assignedStaffIds: string[]
  isActive: boolean
  isOnlineBookingEnabled: boolean
  requireDeposit: boolean
  depositAmount?: number
  depositType?: 'fixed' | 'percentage'
  allowWalkIns: boolean
  showOnWebsite: boolean
  commissionRate?: number
  isPackage?: boolean
  packageServices?: ServicePackageItem[]
  consumedProducts?: ServiceProductConsumption[]
  popularityCount: number
  totalBookings: number
  totalRevenue: number
  averageRating: number
  reviewCount: number
  cancellationRate: number // percentage e.g. 2.5
  popularityTrend?: ServicePopularityTrend[]
  reviews?: ServiceReviewItem[]
  branchIds?: string[]
  allBranches?: boolean
  createdAt: string
  updatedAt?: string
}

export interface ServiceFilterParams {
  search?: string
  category?: string
  priceRange?: 'all' | 'under-500' | '500-1500' | 'above-1500'
  duration?: 'all' | 'under-30' | '30-60' | 'above-60'
  status?: 'all' | 'active' | 'inactive'
  onlineBooking?: 'all' | 'online' | 'offline'
  sortBy?: 'name' | 'price' | 'duration' | 'popularity' | 'latest'
  sortOrder?: 'asc' | 'desc'
}

export type StaffRole =
  | 'Master Stylist'
  | 'Senior Colorist'
  | 'Nail Artist'
  | 'Esthetician'
  | 'Massage Therapist'
  | 'Salon Manager'

export type StaffStatus = 'available' | 'busy' | 'on-leave' | 'off-duty' | 'active' | 'inactive'

export interface StaffBreak {
  name?: string
  startTime: string // HH:mm e.g. "13:00"
  endTime: string // HH:mm e.g. "14:00"
}

export interface StaffScheduleDay {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun' | string
  isWorking: boolean
  startTime: string // HH:mm e.g. "09:00"
  endTime: string // HH:mm e.g. "18:00"
  breakTime?: StaffBreak
}

export interface Staff {
  id: string
  userId?: string
  name: string
  email: string
  phone: string
  role: StaffRole
  avatarUrl?: string
  specialties: string[]
  serviceIds?: string[]
  services?: string[]
  rating: number
  reviewCount: number
  hourlyRate?: number
  commissionRate: number // percentage
  status: StaffStatus
  todayStatus?: 'available' | 'busy' | 'on-leave' | 'off-duty'
  appointmentsToday?: number
  joiningDate?: string
  workingDays?: string[]
  startTime?: string
  endTime?: string
  breakTime?: StaffBreak
  bio?: string
  emergencyContact?: {
    name: string
    relationship: string
    phone: string
  }
  weeklySchedule: StaffScheduleDay[]
  monthlyRevenue: number
  appointmentsCompleted: number
  branchIds?: string[]
  primaryBranchId?: string
  photoUrl?: string
  createdAt?: string
  updatedAt?: string
}

export interface StaffStatsSummary {
  totalStaff: number
  workingToday: number
  onLeave: number
  topPerformer: {
    id: string
    name: string
    rating: number
    monthlyRevenue: number
    role: string
    avatarUrl?: string
  }
}

export interface Product {
  id: string
  name: string
  category: string
  sku: string
  barcode?: string
  unit: string
  purchasePrice: number
  sellingPrice: number
  currentStock: number
  minimumStock: number
  supplierId?: string
  supplierName?: string
  batchNumber?: string
  expiryDate?: string
  active: boolean

  // Compatibility fields for existing views & mock data
  brand?: string
  price: number // alias of sellingPrice
  costPrice?: number // alias of purchasePrice
  stockQuantity: number // alias of currentStock
  lowStockThreshold?: number // alias of minimumStock
  status: 'in-stock' | 'low-stock' | 'out-of-stock'
  supplier?: string // alias of supplierName
  branchStock?: Record<string, number> // Branch-specific quantity breakdown: { [branchId: string]: number }
  branchId?: string
  priceHistory?: ProductPriceHistoryEntry[]
  avgMonthlyUsage?: number
  maxStock?: number
  reorderQuantity?: number
}

export interface LegacyPayment {
  id: string
  invoiceId: string
  appointmentId?: string
  clientId: string
  clientName: string
  amount: number
  tipAmount: number
  totalAmount: number
  method: 'credit_card' | 'apple_pay' | 'cash' | 'gift_card'
  status: 'completed' | 'refunded' | 'failed'
  createdAt: string
  transactionRef: string
}

export interface InvoiceItem {
  id: string
  type: 'service' | 'product'
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  clientName: string
  items: InvoiceItem[]
  subtotal: number
  discount: number
  tax: number
  tip: number
  total: number
  status: 'paid' | 'pending' | 'overdue' | 'void'
  issueDate: string
  dueDate: string
  paymentMethod?: string
}

export type NotificationType =
  | 'INFO'
  | 'SUCCESS'
  | 'WARNING'
  | 'ERROR'
  | 'APPOINTMENT'
  | 'QUEUE'
  | 'PAYMENT'
  | 'INVENTORY'
  | 'SYSTEM'
  | 'appointment'
  | 'system'
  | 'client'
  | 'inventory'
  | 'payment'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'queue'

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent'
export type NotificationRole = 'all' | 'receptionist' | 'manager' | 'owner' | 'stylist'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  read?: boolean
  isRead?: boolean // compatibility alias
  priority?: NotificationPriority
  relatedId?: string
  targetRole?: NotificationRole
  createdAt: string
  actionUrl?: string
}

export type AppNotification = Notification

export interface GlobalSearchResultItem {
  id: string
  type: 'client' | 'appointment' | 'service' | 'staff' | 'invoice' | 'product'
  title: string
  subtitle: string
  badgeText?: string
  badgeVariant?: 'primary' | 'accent' | 'success' | 'warning' | 'default'
  url: string
}

export interface DashboardMetric {
  id: string
  label: string
  value: string | number
  changePercent: number
  isPositive: boolean
  timeframe: string
  description?: string
  iconName: string
}

export interface RevenueDataPoint {
  date: string
  services: number
  products: number
  total: number
}

export interface AppointmentsTrendPoint {
  day: string
  scheduled: number
  completed: number
  cancelled: number
}

export type ReviewStatus = 'PENDING' | 'PUBLISHED' | 'HIDDEN' | 'FLAGGED'

export interface ReviewCategories {
  serviceQuality?: number
  staff?: number
  cleanliness?: number
  value?: number
}

export interface ReviewReply {
  text: string
  repliedAt: string
  staffName?: string
}

export interface Review {
  id: string
  clientId: string
  clientName?: string
  avatarUrl?: string
  appointmentId?: string
  serviceId?: string
  serviceName: string
  staffId?: string
  staffName?: string
  rating: number // 1 to 5
  comment: string
  categories?: ReviewCategories
  status: ReviewStatus
  createdAt: string
  date?: string
  moderatedBy?: string
  moderatedAt?: string
  moderationReason?: string
  reply?: ReviewReply
  verifiedVisit?: boolean
}

export type ReviewRequestStatus = 'PENDING' | 'SENT' | 'OPENED' | 'COMPLETED'
export type ReviewRequestChannel = 'WHATSAPP' | 'SMS' | 'EMAIL'

export interface ReviewRequest {
  id: string
  appointmentId: string
  clientId: string
  clientName?: string
  clientPhone?: string
  clientEmail?: string
  serviceName?: string
  staffName?: string
  appointmentDate?: string
  sentAt?: string
  openedAt?: string
  completedAt?: string
  status: ReviewRequestStatus
  channel?: ReviewRequestChannel
}

export interface CustomerExperienceScore {
  overall: number
  serviceQuality: number
  staff: number
  cleanliness: number
  value: number
  totalReviews: number
}

export interface RatingStarItem {
  count: number
  percentage: number
}

export interface RatingDistribution {
  star5: RatingStarItem
  star4: RatingStarItem
  star3: RatingStarItem
  star2: RatingStarItem
  star1: RatingStarItem
}

export interface ReviewDashboardStats {
  averageRating: number
  totalReviews: number
  publishedCount: number
  pendingCount: number
  hiddenCount: number
  flaggedCount: number
  distribution: RatingDistribution
  experienceScore: CustomerExperienceScore
}

export interface PopularService {
  id: string
  name: string
  category: string
  bookingCount: number
  percentage: number
  revenue: number
}

export interface ClientGrowthPoint {
  month: string
  newClients: number
  returningClients: number
  total: number
}

export type TimeframeFilter = 'today' | 'week' | 'month' | 'custom'

export interface DashboardStats {
  todayAppointments: number
  appointmentsChange: string
  appointmentsChangePositive: boolean
  totalClients: number
  clientsChange: string
  clientsChangePositive: boolean
  revenue: number
  revenueChange: string
  revenueChangePositive: boolean
  rating: number
  ratingChange: string
  ratingCount: number
}

export type DashboardStatsByTimeframe = Record<TimeframeFilter, DashboardStats>

// ==========================================
// PHASE 2 PART 2: BILLING & POS TYPES
// ==========================================

export type BillItemType = 'service' | 'product'

export type BillPaymentStatus =
  | 'UNPAID'
  | 'PARTIAL'
  | 'PAID'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED'

export type BillPaymentMethod =
  | 'cash'
  | 'upi'
  | 'card'
  | 'netbanking'
  | 'bank_transfer'
  | 'wallet'
  | 'other'
  | 'split'

export type RoundingMode = 'none' | 'nearest_1' | 'nearest_5'

export type DiscountType = 'percentage' | 'fixed' | 'coupon'

export interface BillItem {
  id: string
  type: BillItemType
  serviceId?: string
  productId?: string
  name: string
  quantity: number
  unitPrice: number
  duration?: number
  discount: number
  discountType?: 'percentage' | 'fixed'
  discountValue?: number
  taxRate?: number
  tax: number
  total: number
  staffId?: string
  staffName?: string
  availableStock?: number
  appliedBenefit?: {
    type: 'MEMBERSHIP' | 'PACKAGE'
    title: string
    description: string
    membershipId?: string
    benefitId?: string
    walletId?: string
    discountAmount: number
    isFreeService: boolean
    remainingSessions?: number
  }
}

export interface Bill {
  id: string
  invoiceNumber: string
  billNumber?: string
  clientId: string
  clientName: string
  clientPhone?: string
  clientEmail?: string
  isWalkInClient?: boolean
  appointmentId?: string
  tokenId?: string
  staffId: string
  staffName: string
  items: BillItem[]
  subtotal: number
  discount: number
  discountType?: DiscountType
  discountValue?: number
  couponCode?: string
  taxableAmount: number
  tax: number
  taxRate: number
  rounding: number
  roundingMode: RoundingMode
  grandTotal: number
  paidAmount: number
  dueAmount: number
  balanceAmount?: number
  paymentMethod: BillPaymentMethod
  paymentMode?: string
  paymentStatus: BillPaymentStatus
  status: 'draft' | 'held' | 'completed' | 'cancelled'
  notes?: string
  printCount?: number
  reprintCount?: number
  lastPrintedAt?: string
  payments?: Payment[]
  refunds?: Refund[]
  refundedAmount?: number
  branchId?: string
  branchName?: string
  branchCode?: string
  branchAddress?: string
  branchPhone?: string
  branchGstin?: string
  createdAt: string
  updatedAt?: string
  paidAt?: string
}

export interface HeldBill {
  id: string
  draftBill: Bill
  heldAt: string
  note?: string
  clientName: string
  itemsCount: number
  estimatedTotal: number
}

export interface SalesSummaryStats {
  todayRevenue: number
  todayRevenueChange: number
  todayBillsCount: number
  paidAmount: number
  dueAmount: number
  refundAmount: number
  heldBillsCount: number
}

// ==========================================
// PHASE 2 PART 4: PAYMENTS, REFUNDS, CASH REGISTER & AUDIT
// ==========================================

export type PaymentStatus = 'COMPLETED' | 'PENDING' | 'FAILED'

export interface Payment {
  id: string
  billId: string
  invoiceNumber: string
  clientId?: string
  clientName: string
  method: BillPaymentMethod
  amount: number
  reference?: string
  cardLast4?: string
  cardType?: string
  upiId?: string
  status: PaymentStatus
  paidAt: string
  recordedBy?: string
  notes?: string
}

export interface Refund {
  id: string
  invoiceId: string
  invoiceNumber: string
  paymentId?: string
  amount: number
  originalAmount: number
  reason: string
  method: BillPaymentMethod
  processedBy: string
  createdAt: string
  notes?: string
}

export type CashAdjustmentType = 'CASH_IN' | 'CASH_OUT'

export interface CashAdjustment {
  id: string
  registerSessionId: string
  type: CashAdjustmentType
  amount: number
  reason: string
  performedBy: string
  createdAt: string
}

export type RegisterSessionStatus = 'OPEN' | 'CLOSED'

export interface RegisterSession {
  id: string
  date: string // YYYY-MM-DD
  openedAt: string
  closedAt?: string
  openedBy: string
  closedBy?: string
  openingCash: number
  cashSales: number
  cardSales: number
  upiSales: number
  bankSales: number
  otherSales: number
  cashRefunds: number
  digitalRefunds: number
  cashInAdjustments: number
  cashOutAdjustments: number
  expectedCash: number
  actualCash?: number
  difference?: number
  status: RegisterSessionStatus
  closingNotes?: string
  adjustments: CashAdjustment[]
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'SETTINGS_UPDATED'
  | 'APPOINTMENT_STATUS_CHANGE'
  | 'TOKEN_GENERATED'
  | 'TOKEN_CREATED'
  | 'TOKEN_CALLED'
  | 'TOKEN_STATUS_CHANGE'
  | 'BILL_CREATED'
  | 'PAYMENT_CREATED'
  | 'PAYMENT_EDITED'
  | 'REFUND_CREATED'
  | 'INVENTORY_ADJUSTMENT'
  | 'REGISTER_OPENED'
  | 'REGISTER_CLOSED'
  | 'CASH_ADJUSTMENT'
  | 'BUSINESS_DAY_CLOSED'
  | 'BUSINESS_DAY_OPENED'
  | 'MEMBERSHIP_CREATED'
  | 'MEMBERSHIP_PURCHASED'
  | 'PACKAGE_CREATED'
  | 'PACKAGE_PURCHASED'
  | 'EXPENSE_CREATED'
  | 'EXPENSE_EDITED'
  | 'EXPENSE_APPROVED'
  | 'EXPENSE_PAID'
  | 'EXPENSE_CANCELLED'
  | 'EXPENSE_REJECTED'
  | 'STAFF_CLOCK_IN'
  | 'STAFF_CLOCK_OUT'
  | 'STAFF_BREAK_START'
  | 'STAFF_BREAK_END'
  | 'LEAVE_REQUESTED'
  | 'LEAVE_APPROVED'
  | 'LEAVE_REJECTED'
  | 'SHIFT_ASSIGNED'
  | 'PAYROLL_CALCULATED'
  | 'PAYROLL_APPROVED'
  | 'PAYROLL_PAID'
  | 'PAYROLL_VOIDED'
  | 'ADVANCE_GRANTED'
  | 'ADVANCE_REPAID'
  | 'COMMISSION_RULE_CREATED'
  | 'COMPENSATION_UPDATED'

export interface AuditLogEntry {
  id: string
  timestamp: string
  action: AuditAction
  entityType: 'payment' | 'invoice' | 'refund' | 'register' | 'appointment' | 'token' | 'inventory' | 'auth' | 'business_day' | string
  entity?: string // alias of entityType
  entityId: string
  module?: 'Billing' | 'Inventory' | 'Payroll' | 'Appointments' | 'Auth' | 'Settings' | 'Staff' | 'Expenses' | 'Clients' | string
  performedBy: string
  userRole: string
  branchId?: string
  branchName?: string
  details: string
  amount?: number
  beforeState?: Record<string, any>
  afterState?: Record<string, any>
  ipAddress?: string
  deviceInfo?: string
  result?: 'SUCCESS' | 'FAILURE' | 'WARNING'
  metadata?: Record<string, any>
}

// ==========================================
// PHASE 4 PART 7: BUSINESS INTELLIGENCE & AUDIT
// ==========================================

export type TimeGranularity = 'daily' | 'weekly' | 'monthly' | 'quarterly'

export interface BusinessKPI {
  key: string
  label: string
  currentValue: number
  previousValue: number
  changePercentage: number
  dateRange: string
  sourceMetric: string
  format: 'currency' | 'number' | 'percentage'
  trend: 'up' | 'down' | 'neutral'
}

export interface BusinessTrendPoint {
  period: string
  revenue: number
  appointments: number
  newClients: number
  returningClients: number
  expenses: number
  averageBillValue: number
  operatingResult: number
}

export interface RetentionSegment {
  id: 'new' | 'returning' | 'at_risk' | 'inactive'
  label: string
  clientCount: number
  percentage: number
  thresholdDescription: string
  revenueContributed: number
  averageVisitFrequency: number
}

export interface CustomerValueMetrics {
  averageVisitValue: number
  visitFrequency: number // average visits per client per year
  totalCustomerSpend: number
  estimatedLifetimeValue: number
  retentionRatePercentage: number
  calculationNotice: string
}

export interface ServiceBusinessMetric {
  serviceId: string
  serviceName: string
  category: string
  bookingVolume: number
  revenue: number
  averageTicket: number
  averageBill?: number
  repeatUsagePercent: number
  cancellationRatePercent: number
  cancellationRate?: number
  averageRating: number
}

export interface StaffBusinessMetric {
  staffId: string
  staffName: string
  role: string
  appointments: number
  revenueGenerated: number
  completionRate: number
  averageRating: number
  attendanceRate: number
  totalCommission: number
}

export interface RuleBasedAlert {
  id: string
  type: 'warning' | 'info' | 'critical'
  title: string
  description: string
  module: string
  actionRoute: string
  actionLabel: string
  timestamp: string
}

export interface OwnerActionItem {
  id: string
  category:
    | 'approvals'
    | 'unpaid_bills'
    | 'supplier_dues'
    | 'low_stock'
    | 'membership_renewals'
    | 'leave_requests'
    | 'register_sessions'
    | 'refunds'
  title: string
  count: number
  amount?: number
  urgency: 'critical' | 'high' | 'medium'
  route: string
  actionLabel: string
}

export interface ActiveSession {
  id: string
  device: string
  browser: string
  ipAddress: string
  location: string
  lastActive: string
  isCurrent: boolean
}

export interface SecuritySettings {
  sessionTimeoutMinutes: number
  minPasswordLength: number
  requireSpecialChars: boolean
  requireNumbers: boolean
  passwordExpiryDays: number
  maxFailedLogins: number
  lockoutDurationMinutes: number
  twoFactorEnforced: boolean
  twoFactorMethod: 'authenticator' | 'sms'
  activeSessions: ActiveSession[]
}

export interface SystemStatusItem {
  id: string
  component: string
  category: 'database' | 'notifications' | 'printer' | 'payments' | 'messaging' | 'storage'
  status: 'ONLINE' | 'OFFLINE' | 'CONFIGURED' | 'NOT_CONFIGURED' | 'MOCK' | 'Connected' | 'Available'
  serviceName?: string
  lastHeartbeat?: string
  latencyMs?: number
  lastChecked: string
  details: string
}

// ==========================================
// PHASE 2 PART 5: INVENTORY, MOVEMENTS, SUPPLIERS, PURCHASES & CONSUMPTION
// ==========================================

export type StockMovementType =
  | 'stock_in'
  | 'stock_out'
  | 'adjustment'
  | 'damaged'
  | 'expired'
  | 'returned'
  | 'sale'
  | 'service_consumption'

export interface StockMovement {
  id: string
  productId: string
  productName: string
  sku: string
  type: StockMovementType
  quantity: number // positive for addition, negative for deduction
  reason: string
  referenceId?: string // e.g. INV-000101, PO-2026-001, APPT-123
  createdBy: string
  createdAt: string
  previousStock: number
  newStock: number
}

// ==========================================
// PHASE 4 PART 6: SUPPLIER & PROCUREMENT TYPES
// ==========================================

export type SupplierStatus = 'ACTIVE' | 'INACTIVE'

export interface SupplierDocument {
  id: string
  supplierId: string
  poId?: string
  title: string
  type: 'INVOICE' | 'QUOTATION' | 'RECEIPT' | 'CONTRACT' | 'OTHER'
  fileUrl: string
  fileName: string
  fileSize: string
  uploadedAt: string
  uploadedBy: string
}

export interface SupplierBankDetails {
  bankName: string
  accountNumber: string
  ifscCode: string
  branchName?: string
  accountHolderName?: string
}

export interface Supplier {
  id: string
  name: string
  code?: string
  phone: string
  email: string
  address: string
  city?: string
  state?: string
  pincode?: string
  gstNumber?: string
  pan?: string
  notes?: string
  contactPerson?: string
  status?: SupplierStatus
  active: boolean
  createdAt: string
  updatedAt?: string
  paymentTermsDays?: number
  bankDetails?: SupplierBankDetails
  documents?: SupplierDocument[]

  // Statistics
  productCount?: number
  productsSuppliedCount?: number
  totalPurchases?: number
  pendingAmount?: number
  paidAmount?: number
  ordersCount?: number
}

export interface PurchaseOrderItem {
  productId: string
  productName: string
  sku: string
  quantity: number // alias of orderedQuantity
  orderedQuantity?: number
  receivedQuantity?: number
  remainingQuantity?: number
  purchasePrice: number
  taxRate: number
  discountPercent?: number
  subtotal?: number
  taxAmount?: number
  total: number
  batchNumber?: string
  expiryDate?: string
  previousPurchasePrice?: number
}

export interface GoodsReceiptItem {
  productId: string
  productName: string
  sku?: string
  quantityOrdered: number
  quantityReceived: number
  batchNumber?: string
  expiryDate?: string
  notes?: string
}

export interface GoodsReceiptRecord {
  id: string
  receiptNumber: string // e.g. GRN-2026-0045
  poId: string
  poNumber: string
  branchId: string
  branchName: string
  receivedDate: string
  receivedBy: string
  items: GoodsReceiptItem[]
  notes?: string
  createdAt: string
}

export interface SupplierInvoiceDetails {
  supplierInvoiceNumber: string
  invoiceDate: string
  amount: number
  tax: number
  attachmentUrl?: string
  attachmentName?: string
  notes?: string
  recordedAt: string
  recordedBy?: string
}

export type SupplierPaymentMethod = 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'CASH'

export interface SupplierPaymentRecord {
  id: string
  paymentNumber: string // e.g. PAY-SUP-2026-0012
  poId: string
  poNumber: string
  supplierId: string
  supplierName: string
  branchId: string
  branchName: string
  amount: number
  paymentDate: string
  paymentMethod: SupplierPaymentMethod
  referenceNumber?: string
  notes?: string
  expenseId?: string // Linked directly to Expense in expenseService
  paidBy: string
  createdAt: string
}

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED'

export type PurchasePaymentStatus =
  | 'UNPAID'
  | 'PARTIALLY_PAID'
  | 'PAID'

export interface PurchaseOrder {
  id: string
  poNumber: string // e.g. PO-2026-001
  purchaseNumber?: string // backward compat alias
  supplierId: string
  supplierName: string
  branchId?: string
  branchName?: string
  orderDate: string
  expectedDeliveryDate?: string
  status: PurchaseOrderStatus | 'PENDING' // backward compat allows 'PENDING'
  paymentStatus: PurchasePaymentStatus
  items: PurchaseOrderItem[]
  subtotal: number
  discount?: number
  tax: number
  total: number
  paidAmount?: number
  outstandingAmount?: number
  invoiceNumber?: string // Supplier invoice # (backward compat)
  invoiceDetails?: SupplierInvoiceDetails
  receipts?: GoodsReceiptRecord[]
  payments?: SupplierPaymentRecord[]
  attachments?: SupplierDocument[]
  date?: string // backward compat alias of orderDate
  receivedAt?: string
  receivedBy?: string
  notes?: string
  createdByName?: string
  createdAt?: string
  updatedAt?: string
}

export interface ProductPriceHistoryEntry {
  id: string
  productId: string
  productName: string
  poId: string
  poNumber: string
  supplierId: string
  supplierName: string
  purchasePrice: number
  date: string
  monthLabel: string // e.g. "July 2026", "August 2026", "September 2026"
}

export interface SuggestedReorder {
  productId: string
  productName: string
  sku: string
  category: string
  branchId: string
  branchName: string
  currentStock: number
  minimumStock: number
  maxStock: number
  avgMonthlyUsage: number
  suggestedQuantity: number
  estimatedUnitCost: number
  estimatedTotalCost: number
  supplierId?: string
  supplierName?: string
  urgency: 'HIGH' | 'MEDIUM' | 'NORMAL'
}

export interface ProcurementAnalyticsSummary {
  totalPurchasesThisMonth: number
  purchasesLastMonth: number
  monthGrowthPercentage: number
  totalOutstandingPayable: number
  activeSuppliersCount: number
  topSuppliers: {
    supplierId: string
    supplierName: string
    totalSpend: number
    ordersCount: number
  }[]
  topPurchasedProducts: {
    productId: string
    productName: string
    sku: string
    totalQuantity: number
    totalSpend: number
  }[]
  monthlyTrends: {
    month: string
    spend: number
    ordersCount: number
  }[]
  averagePurchasePriceTrend: {
    month: string
    avgPrice: number
  }[]
}

export interface ServiceIngredient {
  id: string
  serviceId: string
  serviceName: string
  productId: string
  productName: string
  quantity: number
  unit: string // 'ml', 'g', 'drops', 'pcs', 'capsule'
}

export interface InventoryStats {
  totalProducts: number
  lowStockCount: number
  outOfStockCount: number
  totalInventoryValue: number
  expiringCount: number
}

// ==========================================
// PHASE 2 PART 6: DAILY CLOSING & BUSINESS DAY
// ==========================================

export type BusinessDayStatus = 'OPEN' | 'CLOSED'

export interface DailyClosingSummary {
  date: string // e.g. "25 Sep 2026" or YYYY-MM-DD
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  noShowAppointments: number
  inProgressAppointments?: number
  revenue: number
  cash: number
  upi: number
  card: number
  other: number
  billsCount: number
  refundsCount: number
  refundsAmount: number
  discountsAmount: number
  taxAmount: number
  newClients: number
  returningClients: number
  productsSold: number
  stockAlertsCount: number
  expensesTotal?: number
  cashExpensesTotal?: number
  netOperatingResult?: number
}

export interface BusinessDay {
  id: string
  date: string // YYYY-MM-DD
  status: BusinessDayStatus
  openedAt: string
  closedAt?: string
  openedBy: string
  closedBy?: string
  notes?: string
  summary: DailyClosingSummary
}

export interface ClosingChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  required: boolean
  count?: number
  actionUrl?: string
  actionLabel?: string
}

export interface NotificationPreferences {
  appointmentReminders: boolean
  queueAlerts: boolean
  paymentAlerts: boolean
  inventoryAlerts: boolean
  dailySummary: boolean
  channels: {
    inApp: boolean
    email: boolean
    sms: boolean
    whatsapp: boolean
  }
}

// ==========================================
// PHASE 3 PART 1: CUSTOMER PORTAL & AUTH
// ==========================================

export interface CustomerUser {
  id: string // maps to Client.id (e.g. 'cli-priya')
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string
  avatarUrl?: string
  gender?: ClientGender
  dateOfBirth?: string
  address?: string | ClientAddress
  rewardPoints: number
  membershipTier: 'Standard' | 'Silver' | 'Gold' | 'Platinum' | 'VIP Club'
  membershipExpiry?: string
  totalVisits: number
  totalSpent: number
  preferredStaffId?: string
  preferredStaffName?: string
  preferredServices?: string[]
  communicationPrefs: {
    email: boolean
    sms: boolean
    whatsapp: boolean
    marketingOptIn?: boolean
    transactionalOptIn?: boolean
  }
  membership?: ClientMembership
  packageWallets?: ClientPackageWallet[]
  referralCode?: string
  referralCount?: number
  createdAt: string
}

export type CustomerNotificationType =
  | 'APPOINTMENT'
  | 'REMINDER'
  | 'CANCELLATION'
  | 'PAYMENT'
  | 'MEMBERSHIP'
  | 'REWARDS'
  | 'OFFER'
  | 'REVIEW'

export interface CustomerNotification {
  id: string
  customerId: string
  type: CustomerNotificationType
  title: string
  message: string
  read: boolean
  createdAt: string
  actionUrl?: string
}

export interface CustomerReview {
  id: string
  customerId: string
  customerName: string
  customerAvatar?: string
  serviceId?: string
  serviceName: string
  staffId?: string
  staffName: string
  rating: number // 1 to 5
  comment: string
  verifiedVisit?: boolean
  createdAt: string
  appointmentId?: string
}

export interface CustomerOffer {
  id: string
  code: string
  title: string
  description: string
  discountPercent?: number
  discountAmount?: number
  minimumSpend?: number
  validUntil: string
  category?: string
  imageUrl?: string
  isFeatured?: boolean
}

export interface CustomerMembershipPlan {
  id: string
  name: string
  tier: 'Silver' | 'Gold' | 'Platinum'
  price: number
  durationMonths: number
  benefits: string[]
  discountOnServicesPercent: number
  discountOnProductsPercent: number
  freeTreatmentsCount: number
  popular?: boolean
}

export interface CustomerServicePackage {
  id: string
  name: string
  category: string
  totalSessions: number
  completedSessions: number
  price: number
  savingsAmount: number
  validUntil: string
  description?: string
  sessionsCount?: number
  validityDays?: number
  includedServices?: string[]
  services: {
    serviceName: string
    quantity: number
  }[]
}

// ==========================================
// PHASE 3 PART 3: MEMBERSHIPS + PACKAGES
// ==========================================

export type MembershipDuration =
  | '1_month'
  | '3_months'
  | '6_months'
  | '12_months'
  | 'custom'

export type MembershipBenefitType =
  | 'SERVICE_DISCOUNT'
  | 'PRODUCT_DISCOUNT'
  | 'FREE_SERVICE'
  | 'MONTHLY_CREDIT'
  | 'PRIORITY_BOOKING'
  | 'REWARD_MULTIPLIER'
  | 'BIRTHDAY_OFFER'
  | 'CUSTOM'

export interface MembershipBenefit {
  id: string
  type: MembershipBenefitType
  name: string
  description?: string
  value: number // discount percentage, free units, or credit amount
  serviceId?: string
  serviceName?: string
  categoryId?: string
  limit?: number // total redemption limit per billing cycle
  validFrom?: string
  validUntil?: string
}

export type MembershipStatus =
  | 'ACTIVE'
  | 'EXPIRING'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'PAUSED'

export interface MembershipPlan {
  id: string
  name: string
  tier: string
  description: string
  price: number
  duration: MembershipDuration
  durationMonths: number
  benefits: MembershipBenefit[]
  popular?: boolean
  status: 'active' | 'inactive'
  color?: string
  badge?: string
  createdAt: string
}

export interface ClientMembershipBenefitUsage extends MembershipBenefit {
  usedCount: number
}

export interface ClientMembership {
  id: string
  clientId: string
  clientName: string
  clientPhone?: string
  planId: string
  planName: string
  tier: string
  pricePaid: number
  price?: number
  startDate: string
  expiryDate: string
  endDate?: string
  status: MembershipStatus
  visitsCount: number
  totalVisits?: number
  benefits: ClientMembershipBenefitUsage[]
  benefitsUsedCount?: number
  totalBenefitsCount?: number
  paymentMethod?: string
  invoiceId?: string
  autoRenew?: boolean
  createdAt: string
}

export interface PackageItem {
  serviceId: string
  serviceName: string
  quantity: number
  discount?: number
  usageLimit?: number | 'unlimited'
}

export interface ServicePackage {
  id: string
  name: string
  description: string
  category: string
  items: PackageItem[]
  normalPrice: number
  packagePrice: number
  savingsAmount: number
  validityDays: number
  status: 'active' | 'inactive'
  popular?: boolean
  createdAt: string
}

export interface ClientPackageWalletItem {
  serviceId: string
  serviceName: string
  totalQuantity: number
  remainingQuantity: number
  usedQuantity: number
}

export interface ClientPackageWallet {
  id: string
  clientId: string
  clientName: string
  packageId: string
  packageName: string
  purchaseDate: string
  expiryDate: string
  status: 'active' | 'exhausted' | 'expired'
  pricePaid: number
  items: ClientPackageWalletItem[]
  invoiceId?: string
  createdAt: string
}

export interface MembershipDashboardStats {
  activeMembers: number
  expiringSoon: number
  newMembersThisMonth: number
  membershipRevenue: number
  growthRate?: number
}

export interface PackageDashboardStats {
  activePackages: number
  totalBundlesSold: number
  sessionsRemaining: number
  packageRevenue: number
}

// ==========================================
// PHASE 3 PART 4: LOYALTY, REWARDS & REFERRALS
// ==========================================

export type LoyaltyTransactionType =
  | 'EARNED'
  | 'REDEEMED'
  | 'EXPIRED'
  | 'ADJUSTED'
  | 'BONUS'

export interface LoyaltyTransaction {
  id: string
  clientId: string
  clientName: string
  type: LoyaltyTransactionType
  points: number // Positive for additions, negative for deductions
  reason: string
  referenceId?: string
  createdAt: string
}

export interface LoyaltyRuleConfig {
  pointsPerRupee: number // e.g. 0.1 = ₹100 gives 10 points
  bookingRewardPoints: number // e.g. 50
  birthdayRewardPoints: number // e.g. 250
  referralRewardReferrer: number // e.g. 500
  referralRewardReferred: number // e.g. 200
  reviewRewardPoints: number // e.g. 100
  tierMultipliers: Record<string, number> // e.g. Standard: 1, Silver: 1.25, Gold: 1.5, Platinum: 2
  campaignBonusPoints: number // e.g. 150
  campaignActive: boolean
  campaignName?: string
}

export type RewardType = 'DISCOUNT_VOUCHER' | 'FREE_SERVICE' | 'FREE_PRODUCT'

export interface Reward {
  id: string
  name: string
  description: string
  type: RewardType
  value: number // Discount ₹ amount or 1 for complimentary service
  serviceId?: string
  serviceName?: string
  pointsRequired: number
  validDays: number
  usageLimit?: number
  active: boolean
  popular?: boolean
  createdAt: string
}

export interface RewardRedemption {
  id: string
  clientId: string
  clientName: string
  rewardId: string
  rewardName: string
  code: string // e.g. "RWD-8823"
  type: RewardType
  value: number
  pointsSpent: number
  serviceId?: string
  serviceName?: string
  status: 'ACTIVE' | 'USED' | 'EXPIRED'
  expiresAt: string
  usedAt?: string
  billId?: string
  createdAt: string
}

export type ReferralStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED'

export interface Referral {
  id: string
  referrerId: string
  referrerName: string
  referrerCode: string
  referredClientId: string
  referredClientName: string
  referredClientPhone?: string
  referralDate: string
  status: ReferralStatus
  rewardIssued: boolean
  rewardPointsReferrer: number
  rewardPointsReferred: number
  completedAt?: string
  firstAppointmentId?: string
}

export interface LoyaltyDashboardStats {
  totalPointsIssued: number
  pointsRedeemed: number
  activeMembers: number
  rewardRedemptions: number
  totalReferrals: number
  completedReferrals: number
  pendingReferrals: number
}

// ========================================================
// PHASE 3 — PART 6: COMMUNICATION & NOTIFICATION AUTOMATION
// ========================================================

export type CommunicationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP'

export type MessageCategory = 'TRANSACTIONAL' | 'MARKETING'

export type TemplateStatus = 'ACTIVE' | 'INACTIVE'

export interface MessageTemplate {
  id: string
  name: string
  channel: CommunicationChannel
  category: MessageCategory
  subject?: string
  message: string
  variables: string[]
  status: TemplateStatus
  isSystem?: boolean
  createdAt: string
  updatedAt: string
}

export type AutomationTrigger =
  | 'BOOKING_CONFIRMED'
  | 'APPOINTMENT_REMINDER'
  | 'APPOINTMENT_RESCHEDULED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_COMPLETED'
  | 'PAYMENT_RECEIVED'
  | 'INVOICE_GENERATED'
  | 'REVIEW_REQUEST'
  | 'BIRTHDAY_GREETING'
  | 'MEMBERSHIP_EXPIRY'
  | 'LOYALTY_POINTS_EARNED'
  | 'LOYALTY_POINTS_EXPIRING'

export interface AutomationRule {
  id: string
  name: string
  trigger: AutomationTrigger
  category: MessageCategory
  templateId: string
  channel: CommunicationChannel
  isActive: boolean
  timingOffsetMinutes?: number // negative = before event, positive = after event
  timingDescription: string // e.g. "24 hours before appointment"
  customConfig?: {
    discountPercent?: number
    promoCode?: string
    validityDays?: number
    waitPeriodMinutes?: number
    noticeDays?: number[]
  }
}

export type CommunicationLogStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED'

export interface CommunicationLog {
  id: string
  customerId: string
  customerName: string
  recipient: string // phone, email, or customer user ID
  channel: CommunicationChannel
  category: MessageCategory
  templateId?: string
  templateName?: string
  status: CommunicationLogStatus
  subject?: string
  body: string
  sentAt: string
  deliveredAt?: string
  openedAt?: string
  error?: string
  referenceId?: string // e.g. appointmentId, billId
  retryCount: number
  maxRetries: number
  providerName?: string
}

export interface CommunicationPreferences {
  marketingOptIn: boolean
  transactionalOptIn: boolean
  preferredChannel?: CommunicationChannel
}

export interface ProviderConfig {
  channel: CommunicationChannel
  providerName: string
  senderId?: string
  senderPhone?: string
  senderEmail?: string
  senderName?: string
  apiKeyMasked: string
  isEnabled: boolean
  isTestMode: boolean
  lastTestedAt?: string
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR'
}

export interface CommunicationSettings {
  channelPriority: CommunicationChannel[]
  providers: Record<CommunicationChannel, ProviderConfig>
  reminderTiming: {
    defaultReminderHours: number // 24
    secondReminderHours?: number // 2
    oneHourReminderEnabled: boolean // true
    customOffsetMinutes?: number
  }
  reviewPromptWaitMinutes: number // 60
  birthdayOffer: {
    daysBefore: number // 7
    discountPercent: number // 20
    promoCode: string // BDAYGLOW20
    validityDays: number // 14
  }
  membershipExpiryNoticeDays: number[] // [30, 7, 1]
  retryPolicy: {
    maxRetries: number // 3
    backoffMinutes: number // 5
    autoRetryFailed: boolean // false
  }
}

// ========================================================
// PHASE 3 — PART 7: OFFERS, SEGMENTATION & MARKETING CAMPAIGNS
// ========================================================

export type SegmentConditionField =
  | 'lastVisitDays'
  | 'totalVisits'
  | 'totalSpending'
  | 'age'
  | 'gender'
  | 'membershipTier'
  | 'serviceCategory'
  | 'favoriteService'
  | 'rewardPoints'
  | 'birthdayMonth'
  | 'appointmentCount'

export type SegmentOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'in'
  | 'contains'

export interface SegmentCondition {
  id: string
  field: SegmentConditionField
  operator: SegmentOperator
  value: string | number | string[]
}

export type SegmentCombinator = 'AND' | 'OR'

export interface CustomerSegment {
  id: string
  name: string
  description: string
  isPreset?: boolean
  combinator: SegmentCombinator
  conditions: SegmentCondition[]
  customerCount: number
  matchingClientIds?: string[]
  createdAt: string
  updatedAt: string
}

export type OfferType =
  | 'PERCENTAGE_DISCOUNT'
  | 'FIXED_DISCOUNT'
  | 'SERVICE_DISCOUNT'
  | 'PRODUCT_DISCOUNT'
  | 'BUY_ONE_GET_ONE'
  | 'FREE_SERVICE'
  | 'BONUS_POINTS'

export interface MarketingOffer {
  id: string
  name: string
  code: string // e.g. WELCOME20, GLOW25, BIRTHDAY15
  type: OfferType
  value: number // percentage (e.g. 20) or fixed amount (e.g. 500) or points
  minimumSpend?: number
  maximumDiscount?: number
  applicableServices?: string[] // service names or IDs, or ['ALL']
  applicableProducts?: string[] // product names or IDs, or ['ALL']
  customerSegmentId?: string // 'ALL' or specific segment ID
  startDate: string
  endDate: string
  usageLimit?: number
  usedCount: number
  terms?: string
  canStackWithLoyalty?: boolean
  canStackWithMembershipDiscount?: boolean
  isActive: boolean
  isPersonalized?: boolean
  personalizationRule?: string
  createdAt: string
  updatedAt: string
}

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'PAUSED'

export interface MarketingCampaign {
  id: string
  name: string
  segmentId: string
  segmentName: string
  channel: CommunicationChannel
  templateId?: string
  offerId?: string
  offerCode?: string
  status: CampaignStatus
  startDate: string
  endDate: string
  audienceSize: number
  subject?: string
  message: string
  metrics: {
    sent: number
    delivered: number
    read: number
    clicked?: number
    redemptions: number
    revenue: number
    conversionRate: number
  }
  isSimulatedAnalytics?: boolean
  createdAt: string
  updatedAt: string
}

export interface PersonalizedRecommendation {
  offer: MarketingOffer
  reason: string
  badge: string
  ctaText: string
  score?: number
}

export interface MarketingDashboardStats {
  activeCampaigns: number
  messagesSent: number
  delivered: number
  opened: number
  conversions: number
  revenueFromCampaigns: number
  campaignPerformanceChart: {
    campaignName: string
    sent: number
    redemptions: number
    revenue: number
  }[]
  engagementChart: {
    channel: string
    deliveryRate: number
    openRate: number
    conversionRate: number
  }[]
}

// ==========================================
// PHASE 4 PART 1: EXPENSE MANAGEMENT & FINANCIAL CONTROLS
// ==========================================

export type ExpenseStatus = 'PENDING' | 'PAID' | 'CANCELLED'

export type ExpenseApprovalStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PAID' | 'REJECTED'

export type ExpensePaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Bank Transfer' | 'Other'

export type RecurringFrequency = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY'

export interface ExpenseCategory {
  id: string
  name: string
  description?: string
  isDefault: boolean
  color: string
  icon: string
  monthlyBudget?: number
  active: boolean
  createdAt: string
}

export interface ExpenseReceiptAttachment {
  id: string
  fileName: string
  fileSize: number
  fileType: string
  url: string
  uploadedAt: string
  storageProvider: 'local_base64' | 's3' | 'gcs' | 'azure'
}

export interface RecurringExpense {
  id: string
  expenseName: string
  categoryId: string
  categoryName: string
  amount: number
  paymentMethod: ExpensePaymentMethod
  supplierId?: string
  supplierName?: string
  frequency: RecurringFrequency
  startDate: string
  nextDueDate: string
  endDate?: string
  autoGenerate: boolean
  lastGeneratedDate?: string
  active: boolean
  description?: string
  referenceNumber?: string
  createdAt: string
}

export interface Expense {
  id: string
  name: string
  categoryId: string
  categoryName: string
  amount: number
  date: string // YYYY-MM-DD
  paymentMethod: ExpensePaymentMethod
  supplierId?: string
  supplierName?: string
  referenceNumber?: string
  description?: string
  status: ExpenseStatus
  approvalStatus: ExpenseApprovalStatus
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  paidAt?: string
  paidBy?: string
  isRecurring: boolean
  recurringExpenseId?: string
  recurringFrequency?: RecurringFrequency
  attachments: ExpenseReceiptAttachment[]
  createdBy: string
  createdById?: string
  createdAt: string
  updatedAt: string
  registerSessionId?: string
  branchId?: string
  branchName?: string
  cancelReason?: string
  cancelledAt?: string
  cancelledBy?: string
}

export interface ExpenseFilter {
  search?: string
  startDate?: string
  endDate?: string
  categoryId?: string
  paymentMethod?: ExpensePaymentMethod | 'ALL'
  status?: ExpenseStatus | 'ALL'
  approvalStatus?: ExpenseApprovalStatus | 'ALL'
  supplierId?: string
}

export interface ExpenseDashboardStats {
  todayExpenses: number
  todayCount: number
  thisMonthExpenses: number
  thisMonthCount: number
  pendingExpensesAmount: number
  pendingCount: number
  largestCategoryName: string
  largestCategoryAmount: number
  previousPeriodExpenses: number
  monthOverMonthChange: number
  cashExpensesThisMonth: number
  nonCashExpensesThisMonth: number
  totalExpenses: number
}

// ==========================================
// PHASE 4 PART 2: STAFF ATTENDANCE, SHIFTS & LEAVE MANAGEMENT
// ==========================================

export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'HALF_DAY'
  | 'LEAVE'
  | 'OFF_DAY'

export interface StaffAttendanceBreak {
  id: string
  breakStartTime: string // HH:mm or ISO string
  breakEndTime?: string // HH:mm or ISO string
  durationMinutes?: number
  reason?: string
  isUnpaid: boolean
}

export interface StaffAttendanceRecord {
  id: string // e.g. att-2026-001
  staffId: string
  staffName: string
  staffRole: string
  avatarUrl?: string
  date: string // YYYY-MM-DD
  clockIn?: string // ISO string or HH:mm
  clockOut?: string // ISO string or HH:mm
  workingHours?: number // in decimal hours e.g. 7.5
  status: AttendanceStatus
  shiftId?: string
  shiftName?: string
  lateMinutes?: number // calculated difference from shift start
  breaks: StaffAttendanceBreak[]
  notes?: string
  locationDeviceMetadata?: {
    device: string // e.g. "Front Desk iPad Station #1"
    ipAddress?: string
    verifiedBy?: string
  }
  createdAt: string
  updatedAt: string
}

export interface StaffShift {
  id: string // e.g. shift-morning, shift-evening
  name: string // "Morning Shift"
  code: string // "MS"
  startTime: string // "09:00"
  endTime: string // "17:00"
  color: string
  unpaidBreakMinutes: number // e.g. 45
  description?: string
  isDefault?: boolean
  active: boolean
}

export type ShiftAssignmentType = 'PERMANENT' | 'TEMPORARY' | 'SPECIFIC_DATE'

export interface StaffShiftAssignment {
  id: string
  staffId: string
  staffName: string
  shiftId: string
  shiftName: string
  assignmentType: ShiftAssignmentType
  daysOfWeek?: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun' | string)[]
  specificDate?: string // YYYY-MM-DD
  startDate?: string
  endDate?: string
  notes?: string
  assignedBy?: string
  assignedAt: string
}

export type LeaveType = 'Casual' | 'Sick' | 'Personal' | 'Emergency' | 'Other'

export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface StaffLeaveRequest {
  id: string // e.g. leave-2026-001
  staffId: string
  staffName: string
  staffRole: string
  avatarUrl?: string
  leaveType: LeaveType
  fromDate: string // YYYY-MM-DD
  toDate: string // YYYY-MM-DD
  daysCount: number
  reason: string
  status: LeaveRequestStatus
  requestedAt: string
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  auditNotes?: string
}

export interface StaffAttendanceSummary {
  staffId: string
  daysPresent: number
  daysAbsent: number
  lateCount: number
  totalHours: number
  leaveUsed: number
  halfDays: number
  offDays: number
  currentStatus: AttendanceStatus
}

export interface AttendanceDashboardStats {
  presentToday: number
  absentToday: number
  lateToday: number
  onLeaveToday: number
  totalStaff: number
  attendanceRate: number // percentage
}

export interface StaffScheduleCalendarEvent {
  id: string
  staffId: string
  staffName: string
  date: string // YYYY-MM-DD
  type: 'SHIFT' | 'APPOINTMENT' | 'LEAVE' | 'OFF_DAY'
  title: string
  startTime?: string
  endTime?: string
  status?: string
  color?: string
  details?: Record<string, any>
}

// ==========================================
// PHASE 4 PART 3: STAFF SALARY + COMMISSION + PAYROLL
// ==========================================

export type StaffCompensationType =
  | 'FIXED'
  | 'HOURLY'
  | 'COMMISSION_ONLY'
  | 'FIXED_PLUS_COMMISSION'

export interface StaffCompensationConfig {
  staffId: string
  compensationType: StaffCompensationType
  baseSalary: number // monthly fixed salary in INR
  hourlyRate: number // hourly rate in INR
  defaultCommissionRate: number // default percentage e.g. 15
  effectiveFrom: string // YYYY-MM-DD
  bankDetails?: {
    bankName?: string
    accountNumber?: string
    ifscCode?: string
    upiId?: string
  }
  notes?: string
  updatedAt: string
}

export type CommissionRuleType = 'PERCENTAGE' | 'FIXED_PER_SERVICE'

export type CommissionRuleScope =
  | 'STAFF_SPECIFIC'
  | 'SERVICE_SPECIFIC'
  | 'CATEGORY'
  | 'DEFAULT'

export interface CommissionRule {
  id: string
  name: string
  scope: CommissionRuleScope
  ruleType: CommissionRuleType
  value: number // percentage (e.g. 20) or fixed INR amount (e.g. 100)
  staffId?: string
  serviceId?: string
  serviceCategory?: string
  isActive: boolean
  description?: string
  priority: number // 1: STAFF_SPECIFIC, 2: SERVICE_SPECIFIC, 3: CATEGORY, 4: DEFAULT
  createdAt: string
}

export interface StaffCommissionItem {
  id: string
  transactionId: string // Bill ID or Appointment ID
  transactionNumber: string // e.g. INV-000101
  transactionDate: string // YYYY-MM-DD
  staffId: string
  staffName: string
  clientName?: string
  serviceId?: string
  serviceName: string
  serviceCategory?: string
  servicePrice: number
  netEligibleAmount: number
  appliedRuleScope: CommissionRuleScope
  appliedRuleName: string
  ruleType: CommissionRuleType
  ruleValue: number
  commissionAmount: number
  isEligible: boolean
  exclusionReason?: string
}

export interface StaffCommissionSummary {
  staffId: string
  staffName: string
  periodStart: string
  periodEnd: string
  totalEligibleRevenue: number
  totalCommissionEarned: number
  completedServicesCount: number
  items: StaffCommissionItem[]
}

export type AdvanceStatus = 'PENDING_REPAYMENT' | 'PARTIALLY_REPAID' | 'REPAID' | 'WAIVED'

export interface StaffSalaryAdvance {
  id: string
  advanceNumber: string // e.g. ADV-2026-001
  staffId: string
  staffName: string
  amount: number
  date: string // YYYY-MM-DD
  reason: string
  status: AdvanceStatus
  repaidAmount: number
  remainingBalance: number
  approvedBy: string
  createdAt: string
  repayments: {
    id: string
    payrollId?: string
    date: string
    amount: number
    note: string
  }[]
}

export type StaffBonusType = 'PERFORMANCE' | 'FESTIVAL' | 'ATTENDANCE' | 'OTHER'

export interface PayrollBonusItem {
  id: string
  staffId: string
  bonusType: StaffBonusType
  amount: number
  date: string
  reason: string
  awardedBy: string
}

export type PayrollDeductionType =
  | 'UNPAID_LEAVE'
  | 'LATE_PENALTY'
  | 'UNIFORM_KIT'
  | 'ADVANCE_RECOVERY'
  | 'TAX_TDS'
  | 'OTHER_CUSTOM'

export interface PayrollDeductionItem {
  id: string
  staffId: string
  deductionType: PayrollDeductionType
  amount: number
  description: string
  reason: string
}

export type PayrollStatus = 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'VOID'

export type PayrollPaymentMethod = 'BANK_TRANSFER' | 'CASH' | 'CHEQUE' | 'UPI'

export interface PayrollRecord {
  id: string
  payrollNumber: string // e.g. PAY-2026-09-001
  staffId: string
  staffName: string
  staffRole: string
  staffEmail?: string
  staffPhone?: string
  compensationType: StaffCompensationType
  periodStart: string // YYYY-MM-DD
  periodEnd: string // YYYY-MM-DD
  periodName: string // e.g. "September 2026"
  baseSalary: number
  hourlyHoursWorked?: number
  commission: number
  commissionItems?: StaffCommissionItem[]
  bonuses: PayrollBonusItem[]
  totalBonuses: number
  deductions: PayrollDeductionItem[]
  totalDeductions: number
  advances: { advanceId: string; amount: number; note: string }[]
  totalAdvancesDeducted: number
  grossPay: number
  netPay: number
  status: PayrollStatus
  paymentMethod?: PayrollPaymentMethod
  paymentReference?: string
  notes?: string
  createdAt: string
  calculatedAt?: string
  approvedAt?: string
  approvedBy?: string
  paidAt?: string
  paidBy?: string
}

export interface PayrollDashboardStats {
  totalPayroll: number
  pendingPayroll: number
  paidThisMonth: number
  totalCommission: number
  staffCount: number
  currentPeriod: string
}

export interface StaffMonthlyPerformance {
  staffId: string
  staffName: string
  period: string
  appointmentsCount: number
  servicesCompletedCount: number
  totalRevenueGenerated: number
  averageRating: number
  commissionEarned: number
  attendanceRate: number
  baseSalary?: number
  advancesTaken?: number
  remainingAdvanceBalance?: number
}

// ==========================================
// PHASE 4 PART 4: ADVANCED REPORTS + BUSINESS ANALYTICS
// ==========================================

export type ReportCategory =
  | 'sales'
  | 'finance'
  | 'customers'
  | 'appointments'
  | 'staff'
  | 'services'
  | 'inventory'
  | 'marketing'
  | 'builder'

export type DateRangePreset =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'this_month'
  | 'last_month'
  | 'this_quarter'
  | 'this_year'
  | 'custom'

export interface ReportFilter {
  preset: DateRangePreset
  startDate: string
  endDate: string
  branchId?: string
  staffId?: string
  serviceId?: string
  categoryId?: string
}

export interface SalesReportData {
  grossSales: number
  discounts: number
  taxes: number
  refunds: number
  netSales: number
  averageBillValue: number
  totalBillsCount: number
  revenueTrend: { date: string; gross: number; net: number; billsCount: number }[]
  salesByCategory: { category: string; revenue: number; percentage: number; count: number }[]
  salesByService: { serviceName: string; category: string; revenue: number; count: number }[]
  items: {
    billId: string
    billNumber: string
    date: string
    clientName: string
    staffName: string
    grossAmount: number
    discount: number
    tax: number
    netAmount: number
    paymentMethod: string
    status: string
  }[]
}

export interface PaymentReportData {
  cashTotal: number
  upiTotal: number
  cardTotal: number
  bankTotal: number
  otherTotal: number
  totalCollected: number
  distribution: { method: string; label: string; amount: number; percentage: number; count: number }[]
  dailyTrend: { date: string; cash: number; upi: number; card: number; bank: number; other: number }[]
  transactions: {
    id: string
    billNumber: string
    date: string
    clientName: string
    paymentMethod: string
    amount: number
    status: string
  }[]
}

export interface OperatingResultReportData {
  grossRevenue: number
  discounts: number
  refunds: number
  operatingExpenses: number
  operatingResult: number // Gross Revenue - Discounts - Refunds - Operating Expenses
  operatingMarginPercent: number
  expensesByCategory: { category: string; amount: number; percentage: number }[]
  monthlyTrend: { month: string; revenue: number; expenses: number; operatingResult: number }[]
}

export interface CustomerReportData {
  totalClients: number
  newClients: number
  returningClients: number
  inactiveClients: number
  vipClients: number
  visitFrequency: number
  averageSpend: number
  repeatRate: number
  clvApproximation: number
  cohortData: { month: string; newClients: number; returningClients: number }[]
  clientsList: {
    id: string
    name: string
    phone: string
    status: string
    totalVisits: number
    totalSpent: number
    lastVisit: string
    avgTicket: number
  }[]
}

export interface AppointmentReportData {
  totalBookings: number
  completed: number
  cancelled: number
  noShow: number
  rescheduled: number
  completionRate: number
  cancellationRate: number
  noShowRate: number
  dailyTrend: { date: string; completed: number; cancelled: number; noShow: number; total: number }[]
  channelBreakdown: { channel: string; count: number }[]
  items: {
    id: string
    date: string
    time: string
    clientName: string
    serviceName: string
    staffName: string
    status: string
    price: number
  }[]
}

export interface ServiceReportItem {
  serviceId: string
  serviceName: string
  categoryName: string
  bookingsCount: number
  revenue: number
  averagePrice: number
  averageRating: number
  cancellationRate: number
}

export interface ServiceReportData {
  totalServicesTracked: number
  totalServiceRevenue: number
  services: ServiceReportItem[]
}

export interface StaffReportItem {
  staffId: string
  staffName: string
  role: string
  appointmentsCount: number
  completedServices: number
  revenueGenerated: number
  averageRating: number
  attendanceRate: number
  commissionEarned: number
  avgTicket: number
}

export interface StaffReportData {
  staffList: StaffReportItem[]
}

export interface InventoryReportData {
  totalStockValue: number
  purchasesTotal: number
  consumptionTotal: number
  retailSalesTotal: number
  adjustmentsTotal: number
  expiredWasteTotal: number
  lowStockCount: number
  categoryDistribution: { category: string; value: number; itemsCount: number }[]
  lowStockItems: {
    id: string
    name: string
    sku: string
    currentStock: number
    minStock: number
    unit: string
    costPrice: number
    retailPrice: number
  }[]
}

export interface ExpenseReportData {
  totalExpenses: number
  byCategory: { category: string; amount: number; percentage: number }[]
  byPaymentMethod: { method: string; amount: number; percentage: number }[]
  monthlyTrend: { month: string; amount: number; count: number }[]
  items: {
    id: string
    expenseNumber: string
    date: string
    category: string
    title: string
    amount: number
    paymentMethod: string
    status: string
  }[]
}

export interface MarketingReportData {
  totalCampaigns: number
  totalAudienceReached: number
  totalConversions: number
  avgConversionRate: number
  attributedRevenue: number
  estimatedRoi: number
  campaigns: {
    id: string
    name: string
    channel: string
    status: string
    sentCount: number
    clickCount: number
    conversions: number
    revenueGenerated: number
    roi: number
  }[]
}

export type ReportMetric =
  | 'revenue'
  | 'bills_count'
  | 'appointments'
  | 'avg_bill_value'
  | 'discounts'
  | 'expenses'

export type ReportDimension =
  | 'staff'
  | 'service'
  | 'category'
  | 'payment_method'
  | 'date_day'
  | 'date_month'

export interface CustomReportConfig {
  id: string
  title: string
  metric: ReportMetric
  dimension: ReportDimension
  datePreset: DateRangePreset
  startDate: string
  endDate: string
  staffId?: string
  categoryId?: string
  chartType: 'bar' | 'area' | 'pie' | 'table'
}

export interface CustomReportResult {
  config: CustomReportConfig
  data: { label: string; value: number; secondaryValue?: number; count?: number }[]
  totalValue: number
  averageValue: number
}

export interface DashboardWidgetConfig {
  id: string
  title: string
  reportType: ReportCategory
  metric: ReportMetric
  dimension: ReportDimension
  chartType: 'bar' | 'area' | 'pie' | 'kpi'
  enabled: boolean
  order: number
  size: 'small' | 'medium' | 'large'
}

// ==========================================
// PHASE 4 — PART 5: MULTI-BRANCH SALON MODELS
// ==========================================

export type BranchStatus = 'ACTIVE' | 'INACTIVE'

export interface BranchOpeningHours {
  day: string
  open: string
  close: string
  closed: boolean
}

export interface BranchTaxInfo {
  gstin?: string
  taxRegistrationNumber?: string
  taxRate?: number
  pan?: string
}

export interface BranchBookingSettings {
  allowOnlineBooking: boolean
  slotDurationMinutes: number
  advanceBookingDays: number
  autoConfirm: boolean
  bufferTimeMinutes: number
}

export interface Branch {
  id: string
  name: string
  code: string // e.g. "GP-JDH", "GP-JAI", "GP-BIK", "GP-UDR"
  phone: string
  email: string
  address: string
  city: string
  state: string
  pincode: string
  timezone: string
  currency: string
  status: BranchStatus
  openingHours: BranchOpeningHours[]
  workingDays?: string[]
  taxInfo?: BranchTaxInfo
  bookingSettings?: BranchBookingSettings
  managerName?: string
  managerPhone?: string
  isHeadquarters?: boolean
  invoicePrefix?: string
  staffCount?: number
  createdAt: string
  updatedAt?: string
}

export type StockTransferStatus =
  | 'DRAFT'
  | 'APPROVED'
  | 'IN_TRANSIT'
  | 'RECEIVED'
  | 'CANCELLED'

export interface StockTransferItem {
  productId: string
  productName: string
  sku?: string
  quantity: number
  receivedQuantity?: number
  unitCost?: number
}

export interface StockTransfer {
  id: string
  transferNumber: string // e.g. "TRF-2026-001"
  sourceBranchId: string
  sourceBranchName: string
  destinationBranchId: string
  destinationBranchName: string
  items: StockTransferItem[]
  status: StockTransferStatus
  notes?: string
  createdById?: string
  createdByName?: string
  approvedById?: string
  approvedByName?: string
  dispatchedById?: string
  dispatchedByName?: string
  receivedById?: string
  receivedByName?: string
  createdAt: string
  approvedAt?: string
  dispatchedAt?: string
  receivedAt?: string
  cancelledAt?: string
  cancelReason?: string
}

export interface CrossBranchComparisonMetric {
  branchId: string
  branchName: string
  branchCode: string
  revenue: number
  appointments: number
  completedAppointments: number
  completionRate: number
  clients: number
  expenses: number
  operatingResult: number
  staffCount: number
  inventoryStockValue: number
  averageBillValue: number
}

export interface ConsolidatedBusinessSummary {
  totalRevenue: number
  totalAppointments: number
  totalClients: number
  totalExpenses: number
  totalStaff: number
  consolidatedOperatingResult: number
  averageBillValue: number
  branchComparisons: CrossBranchComparisonMetric[]
}

// ==========================================
// PHASE 5 PART 1: AI BUSINESS ASSISTANT
// ==========================================

export type AIProviderType = 'local' | 'openai' | 'anthropic' | 'google'

export interface AISettings {
  enabled: boolean
  provider: AIProviderType
  modelName: string
  dailyQueryLimit: number
  usedQueriesToday: number
  dataAccessScopes: {
    financials: boolean
    appointments: boolean
    clients: boolean
    staff: boolean
    inventory: boolean
  }
}

export interface AIAssistantContext {
  sourcePage?: string
  clientId?: string
  clientName?: string
  appointmentId?: string
  branchId?: string
  branchName?: string
  dateRange?: string
}

export interface AIStructuredItem {
  id?: string
  title: string
  subtitle?: string
  value?: string | number
  badge?: string
  status?: string
}

export interface AIStructuredData {
  title: string
  primaryValue: string | number
  previousValue?: string | number
  difference?: string | number
  percentChange?: number
  dateRange: string
  sourceModule: string
  categoryType: 'actual' | 'calculated' | 'estimate' | 'suggestion'
  displayType?: 'metric' | 'comparison' | 'table' | 'list' | 'client_list' | 'appointment_list' | 'product_list' | 'clarification' | 'proposal'
  breakdown?: { label: string; value: string | number; change?: string }[]
  items?: AIStructuredItem[]
  comparison?: {
    currentLabel: string
    currentValue: string | number
    previousLabel: string
    previousValue: string | number
    difference: string | number
    percentChange: number
  }
  clarificationOptions?: string[]
}

export interface AIPreparedAction {
  id: string
  type: 'create_offer' | 'send_reminder' | 'order_stock' | 'reconcile_register' | 'inspect_item' | 'whatsapp_campaign'
  title: string
  description: string
  details: Record<string, string | number>
  actionRoute: string
  actionLabel: string
  confirmed?: boolean
  audienceCount?: number
  channel?: string
}

export interface AIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  structuredData?: AIStructuredData
  preparedAction?: AIPreparedAction
  toolsUsed?: string[]
  sourceModule?: string
  dateRange?: string
  categoryType?: 'actual' | 'calculated' | 'estimate' | 'suggestion'
  isError?: boolean
  progressLogs?: string[]
  clarificationOptions?: string[]
}

export interface AIConversation {
  id: string
  userId: string
  title: string
  createdAt: string
  updatedAt: string
  messages: AIMessage[]
  context?: AIAssistantContext
}

// ==========================================
// Phase 5 Part 2: AI Business & Customer Insights
// ==========================================

export type InsightCategory =
  | 'customer'
  | 'service'
  | 'staff'
  | 'inventory'
  | 'financial'
  | 'marketing'

export type InsightConfidence =
  | 'data_backed'
  | 'calculated'
  | 'ai_generated'
  | 'estimated'

export interface PotentialRebookingClient {
  clientId: string
  clientName: string
  phone: string
  lastService: string
  lastVisitDate: string
  typicalIntervalDays: number
  daysSinceLastVisit: number
  dueStatus: 'due' | 'overdue'
  recommendedAction: string
}

export interface ServiceMetricInsight {
  serviceId: string
  serviceName: string
  category: string
  bookingVolume: number
  previousVolume: number
  revenue: number
  averageBill: number
  repeatRate: number
  cancellationRate: number
  rating: number
  volumeChangePercent: number
  explanation: string
}

export interface StaffMetricInsight {
  staffId: string
  staffName: string
  role: string
  appointmentsCount: number
  completedServicesCount: number
  revenueGenerated: number
  rating: number
  attendanceRate: number
  commissionEarned: number
  factualSummary: string
}

export interface InventoryMovementInsight {
  productId: string
  productName: string
  category: string
  currentStock: number
  minStock: number
  status: 'low_stock' | 'out_of_stock' | 'fast_moving' | 'slow_moving' | 'expiring'
  consumptionPercentChange: number
  daysUntilStockout?: number
  factualNote: string
}

export interface BusinessInsight {
  id: string
  category: InsightCategory
  confidence: InsightConfidence
  title: string
  description: string
  supportingMetric: {
    label: string
    value: string | number
    change?: string
    trend?: 'up' | 'down' | 'neutral'
  }
  dateRange: string
  sourceModule: string
  action?: {
    label: string
    path: string
  }
  explanation: {
    why: string
    calculationSteps: string[]
    sourceDatasets: string[]
    underlyingDataSample?: { label: string; value: string | number }[]
  }
  severity?: 'info' | 'warning' | 'alert' | 'positive'
}

// ==========================================
// Phase 5 Part 3: Automation & Workflow Engine
// ==========================================

export type AutomationTriggerType =
  | 'appointment_created'
  | 'appointment_confirmed'
  | 'appointment_reminder'
  | 'appointment_completed'
  | 'appointment_cancelled'
  | 'customer_created'
  | 'customer_inactive'
  | 'payment_received'
  | 'payment_due'
  | 'membership_expiring'
  | 'reward_earned'
  | 'product_low_stock'
  | 'birthday'
  | 'campaign_started'

export type AutomationActionType =
  | 'send_notification'
  | 'create_task'
  | 'send_email'
  | 'send_sms'
  | 'send_whatsapp'
  | 'add_loyalty_points'
  | 'create_coupon'
  | 'add_customer_tag'
  | 'create_reminder'

export type DelayUnit = 'immediately' | 'minutes' | 'hours' | 'days'

export interface AutomationDelay {
  value: number
  unit: DelayUnit
}

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'in'

export interface AutomationCondition {
  id: string
  field: string
  operator: ConditionOperator
  value: string | number | boolean
}

export interface ConditionGroup {
  logicalOperator: 'AND' | 'OR'
  conditions: AutomationCondition[]
}

export interface AutomationActionConfig {
  id: string
  type: AutomationActionType
  title: string
  params: Record<string, any>
  requiresApproval?: boolean
}

export interface WorkflowAutomationRule {
  id: string
  name: string
  description: string
  trigger: AutomationTriggerType
  triggerConfig?: Record<string, any>
  conditionGroup: ConditionGroup
  delay: AutomationDelay
  actions: AutomationActionConfig[]
  enabled: boolean
  createdAt: string
  updatedAt: string
  runCount: number
  lastRunAt?: string
  isTemplate?: boolean
  category?: string
}

export type JobExecutionStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export interface AutomationJobLog {
  id: string
  automationId: string
  automationName: string
  idempotencyKey: string
  triggerType: AutomationTriggerType
  entityId: string
  entityType: string
  entityName: string
  customerName?: string
  branchName?: string
  actionType: AutomationActionType
  actionSummary: string
  status: JobExecutionStatus
  triggeredAt: string
  executedAt?: string
  delaySummary: string
  error?: string
  retryCount: number
  maxRetries: number
  payload?: Record<string, any>
}

// ============================================================================
// PHASE 5 — PART 4: MULTI-TENANT SAAS ARCHITECTURE & SUPER ADMIN TYPES
// ============================================================================

export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'CANCELLED'

export type TenantSubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'cancelled'

export type TenantPlanTier = 'starter' | 'professional' | 'business' | 'enterprise'

export interface Tenant {
  id: string
  name: string
  slug: string
  logo?: string
  ownerId: string
  ownerName: string
  ownerEmail: string
  planId: TenantPlanTier
  status: TenantStatus
  createdAt: string
  subscriptionStatus: TenantSubscriptionStatus
  branchesCount: number
  usersCount: number
  primaryCity?: string
  primaryState?: string
  currency?: string
  mrrAmount: number
  billingCycle: 'monthly' | 'annually'
  renewalDate: string
  features: string[]
}

export interface OrganizationMember {
  id: string
  userId: string
  userName: string
  userEmail: string
  userAvatar?: string
  tenantId: string
  tenantName: string
  role: Role
  permissions: Permission[]
  status: 'active' | 'invited' | 'suspended'
  joinedAt: string
}

export interface TenantUsageMetrics {
  tenantId: string
  clients: { current: number; limit: number }
  appointments: { current: number; limit: number }
  staff: { current: number; limit: number }
  branches: { current: number; limit: number }
  storageMb: { current: number; limit: number }
  messagesSent: { current: number; limit: number }
  aiQueries: { current: number; limit: number }
  automations: { current: number; limit: number }
  lastCalculatedAt: string
}

export interface SuperAdminPlan {
  id: TenantPlanTier
  name: string
  priceMonthly: number
  priceYearly: number
  clientLimit: number
  staffLimit: number
  branchLimit: number
  storageLimitMb: number
  messagesLimit: number
  aiQueriesLimit: number
  features: string[]
  isPopular?: boolean
}

export interface SuperAdminAuditLog {
  id: string
  timestamp: string
  superAdminId: string
  superAdminName: string
  action: string
  category: 'impersonation' | 'organization' | 'subscription' | 'security' | 'system'
  targetTenantId?: string
  targetTenantName?: string
  ipAddress?: string
  details: string
  severity: 'info' | 'warning' | 'critical'
}

export interface SupportSession {
  sessionId: string
  superAdminId: string
  superAdminName: string
  tenantId: string
  tenantName: string
  reason: string
  ticketNumber?: string
  startedAt: string
  expiresAt: string
  status: 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
}

// ============================================================================
// PHASE 5 — PART 5: SAAS SUBSCRIPTION & OWNER BILLING TYPES
// ============================================================================

export type SubscriptionState =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'PAUSED'
  | 'CANCELLED'
  | 'EXPIRED'

export type OveragePolicy = 'blocked' | 'soft_limit' | 'paid_overage'

export interface PlanLimits {
  branches: number
  staff: number
  clients: number
  appointments: number
  storageMb: number
  messages: number
  automations: number
  aiUsage: number
}

export interface SaaSPlan {
  id: TenantPlanTier
  name: string
  price: number // monthly fee in INR
  priceYearly: number // annual fee in INR
  billingCycle: 'monthly' | 'yearly' | 'both'
  limits: PlanLimits
  features: string[]
  status: 'ACTIVE' | 'ARCHIVED' | 'DRAFT'
  overagePolicy: OveragePolicy
  isPopular?: boolean
  description: string
}

export interface SaaSPaymentMethod {
  id: string
  tenantId: string
  type: 'card' | 'upi' | 'netbanking'
  brand?: string
  last4?: string
  expMonth?: number
  expYear?: number
  upiId?: string
  isDefault: boolean
}

export interface SaaSInvoice {
  id: string
  invoiceNumber: string
  tenantId: string
  salonName: string
  planId: TenantPlanTier
  planName: string
  billingCycle: 'monthly' | 'annually'
  periodStart: string
  periodEnd: string
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED'
  paymentMethod: string
  issuedAt: string
  paidAt?: string
  billingEmail: string
  gstNumber?: string
}

export interface SalonSubscriptionDetails {
  tenantId: string
  planId: TenantPlanTier
  planName: string
  status: SubscriptionState
  billingCycle: 'monthly' | 'annually'
  currentPeriodStart: string
  currentPeriodEnd: string
  nextBillingDate: string
  trialEndsAt?: string
  daysLeftInTrial?: number
  cancelAtPeriodEnd: boolean
  cancellationReason?: string
  paymentMethod?: SaaSPaymentMethod
}

export type SubscriptionEventType =
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.past_due'
  | 'subscription.cancelled'
  | 'invoice.paid'
  | 'invoice.failed'

export interface SubscriptionWebhookEvent {
  id: string
  event: SubscriptionEventType
  tenantId: string
  tenantName: string
  timestamp: string
  data: Record<string, any>
  delivered: boolean
}

// ============================================================================
// PHASE 5 — PART 6: INTEGRATIONS HUB & WEBHOOKS TYPES
// ============================================================================

export type IntegrationCategory =
  | 'payments'
  | 'whatsapp'
  | 'sms'
  | 'email'
  | 'calendar'
  | 'printing'
  | 'storage'
  | 'analytics'

export type IntegrationStatus = 'connected' | 'not_connected' | 'error'

export interface IntegrationItem {
  id: string
  tenantId?: string
  category: IntegrationCategory
  name: string
  provider: string
  description: string
  iconName: string
  status: IntegrationStatus
  connectedAt?: string
  lastSyncAt?: string
  metrics?: Record<string, string | number>
  config: Record<string, any>
  isProtected?: boolean
}

export interface WebhookEndpoint {
  id: string
  tenantId: string
  name: string
  url: string
  events: string[]
  status: 'ACTIVE' | 'INACTIVE'
  signingSecret: string // masked in UI (e.g. whsec_••••••••4f9a)
  createdAt: string
  lastTriggeredAt?: string
  failureCount: number
}

export interface IntegrationLog {
  id: string
  tenantId?: string
  timestamp: string
  integrationId: string
  integrationName: string
  event: string
  status: 'SUCCESS' | 'FAILED' | 'PENDING'
  statusCode?: number
  responsePayload?: string
  error?: string
  isRetryable?: boolean
  retryCount?: number
}

// ============================================================================
// PHASE 5 PART 7: PWA, MOBILE & OFFLINE SYNC QUEUE TYPES
// ============================================================================

export type SyncItemStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED'
export type NetworkStatus = 'online' | 'offline'
export type SyncState = 'idle' | 'syncing' | 'synced' | 'failed' | 'offline'

export interface SyncQueueItem {
  id: string
  action: string // e.g. 'CREATE_APPOINTMENT_OFFLINE', 'WALK_IN_CHECKIN', 'ISSUE_TOKEN', 'FINANCIAL_TRANSACTION'
  payload: any
  createdAt: string
  status: SyncItemStatus
  retryCount: number
  isFinancial?: boolean // Must not duplicate or pretend to succeed offline
  idempotencyKey: string // Prevents duplicate charges during reconnect
  error?: string
  syncedAt?: string
}



