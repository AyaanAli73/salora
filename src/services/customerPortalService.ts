import {
  Appointment,
  Bill,
  CustomerOffer,
  CustomerReview,
  CustomerMembershipPlan,
  CustomerServicePackage,
  Service,
} from '@/types'
import { appointmentService } from '@/services/appointmentService'
import { billingService } from '@/services/billingService'
import { serviceService } from '@/services/serviceService'
import { staffService } from '@/services/staffService'
import { tokenService } from '@/services/tokenService'
import { auditLogService } from '@/services/auditLogService'
import { useCustomerNotificationStore } from '@/store/useCustomerNotificationStore'
import { useToastStore } from '@/store/useToastStore'
import { isSlotAvailable, calculateEndTime } from '@/utils/availability'

// Customer Portal Entities
const MOCK_OFFERS: CustomerOffer[] = []
const MOCK_MEMBERSHIPS: CustomerMembershipPlan[] = []
const MOCK_PACKAGES: CustomerServicePackage[] = []
let mockReviewsStore: CustomerReview[] = []

export const customerPortalService = {
  /**
   * Retrieves next upcoming appointment for customer
   */
  async getNextAppointment(customerId: string): Promise<Appointment | null> {
    const all = await appointmentService.getAll()
    const customerAppts = all.filter(
      (a) =>
        a.clientId === customerId &&
        (a.status === 'confirmed' ||
          a.status === 'scheduled' ||
          a.status === 'checked-in' ||
          a.status === 'waiting' ||
          a.status === 'in-progress')
    )
    return customerAppts[0] || null
  },

  /**
   * Retrieves all appointments for customer
   */
  async getAppointmentHistory(customerId: string): Promise<Appointment[]> {
    const all = await appointmentService.getAll()
    return all.filter((a) => a.clientId === customerId)
  },

  /**
   * Retrieves single appointment by ID
   */
  async getAppointmentById(id: string): Promise<Appointment | undefined> {
    const all = await appointmentService.getAll()
    return all.find((a) => a.id === id || a.appointmentId === id)
  },

  /**
   * Cancels appointment
   */
  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    const updated = await appointmentService.updateStatus(id, 'cancelled')
    useCustomerNotificationStore.getState().addNotification({
      customerId: updated.clientId,
      type: 'CANCELLATION',
      title: 'Appointment Cancelled',
      message: `Your booking for ${updated.serviceName} on ${updated.date} has been cancelled.`,
    })

    useToastStore.getState().addToast({
      title: 'Appointment Cancelled',
      message: 'Your booking has been cancelled.',
      type: 'info',
    })

    return updated
  },

  /**
   * Retrieves sanitized customer invoices
   */
  async getCustomerInvoices(customerId: string): Promise<Bill[]> {
    const allBills = await billingService.getAll()
    return allBills.filter((b) => b.clientId === customerId)
  },

  /**
   * Retrieves offers and discount vouchers
   */
  getOffers(): CustomerOffer[] {
    return MOCK_OFFERS
  },

  /**
   * Retrieves memberships
   */
  getMemberships(): CustomerMembershipPlan[] {
    return MOCK_MEMBERSHIPS
  },

  /**
   * Retrieves packages
   */
  getPackages(): CustomerServicePackage[] {
    return MOCK_PACKAGES
  },

  /**
   * Retrieves reviews
   */
  getReviews(): CustomerReview[] {
    return mockReviewsStore
  },

  /**
   * Submits a customer review
   */
  async submitReview(review: Omit<CustomerReview, 'id' | 'createdAt'>): Promise<CustomerReview> {
    await new Promise((res) => setTimeout(res, 250))
    const newRev: CustomerReview = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    mockReviewsStore = [newRev, ...mockReviewsStore]

    useToastStore.getState().addToast({
      title: 'Review Submitted',
      message: 'Thank you for your feedback! Your review has been shared with the salon team.',
      type: 'success',
    })

    return newRev
  },

  /**
   * Retrieves public services
   */
  async getPublicServices(): Promise<Service[]> {
    const list = await serviceService.getAll()
    return list.filter((s) => s.isActive !== false)
  },

  /**
   * Retrieves recommended services
   */
  async getRecommendedServices(): Promise<Service[]> {
    const list = await serviceService.getAll()
    return list.filter((s) => s.averageRating >= 4.5 || s.popularityCount > 10).slice(0, 4)
  },

  /**
   * Books a new appointment from customer self-service portal / online booking
   */
  async bookAppointment(params: {
    customerId?: string
    customerName: string
    customerPhone: string
    customerEmail?: string
    serviceId: string
    staffId: string
    date: string
    startTime: string
    notes?: string
    price?: number
    discount?: number
    totalAmount?: number
    depositPaid?: number
    depositRequired?: number
    depositStatus?: 'none' | 'paid' | 'pending' | 'refunded'
  }): Promise<Appointment> {
    await new Promise((res) => setTimeout(res, 350))

    const service = await serviceService.getById(params.serviceId)
    const allStaff = await staffService.getAll()

    let designatedStaff = params.staffId !== 'any' && params.staffId
      ? allStaff.find((s) => s.id === params.staffId)
      : undefined

    // If 'any' was selected, assign the first available active staff member
    if (!designatedStaff) {
      const activeStaff = allStaff.filter((s) => s.status === 'active' || s.status === undefined)
      const existingAppts = await appointmentService.getAll()
      const dur = service?.duration || 45

      const freeStaff = activeStaff.find((s) => {
        const check = isSlotAvailable(s, params.date, params.startTime, dur, existingAppts)
        return check.available
      })

      designatedStaff = freeStaff || activeStaff[0]
    }

    const serviceName = service?.name || 'Hair Spa Ritual'
    const servicePrice = service?.price || 1475
    const serviceDuration = service?.duration || 45
    const staffName = designatedStaff?.name || 'Aesthetic Professional'
    const calculatedEndTime = calculateEndTime(params.startTime, serviceDuration)

    const clientId = params.customerId || `cli-guest-${Date.now()}`

    const newAppt = await appointmentService.create({
      appointmentId: `SLR-${Math.floor(1000 + Math.random() * 9000)}`,
      clientId,
      clientName: params.customerName,
      clientPhone: params.customerPhone,
      serviceId: params.serviceId,
      serviceName,
      serviceCategory: service?.categoryName || 'Hair Care',
      serviceDuration,
      price: params.price !== undefined ? params.price : servicePrice,
      servicePrice,
      discount: params.discount || 0,
      totalAmount: params.totalAmount !== undefined ? params.totalAmount : servicePrice,
      staffId: designatedStaff?.id || 'staff-1',
      staffName,
      staffAvatar: designatedStaff?.avatarUrl,
      date: params.date,
      startTime: params.startTime,
      endTime: calculatedEndTime,
      status: 'confirmed',
      queueStatus: 'waiting',
      appointmentType: 'APPOINTMENT',
      paymentStatus: params.depositPaid && params.depositPaid >= servicePrice ? 'paid' : params.depositPaid ? 'partial' : 'unpaid',
      bookingSource: 'ONLINE',
      depositPaid: params.depositPaid || 0,
      depositRequired: params.depositRequired || 0,
      depositStatus: params.depositStatus || 'none',
      notes: params.notes,
    })

    // Log to salon operational audit
    auditLogService.log({
      action: 'APPOINTMENT_STATUS_CHANGE',
      entityType: 'appointment',
      entityId: newAppt.id,
      performedBy: params.customerName,
      userRole: 'customer',
      details: `Online booking created for ${serviceName} with ${staffName} on ${params.date} at ${params.startTime}.`,
      amount: servicePrice,
    })

    // Customer Notification
    useCustomerNotificationStore.getState().addNotification({
      customerId: clientId,
      type: 'APPOINTMENT',
      title: 'Appointment Booked Successfully',
      message: `Your appointment for ${serviceName} with ${staffName} is confirmed for ${params.date} at ${params.startTime}.`,
      actionUrl: '/customer/appointments',
    })

    useToastStore.getState().addToast({
      title: 'Booking Confirmed',
      message: `Appointment scheduled for ${params.date} at ${params.startTime} with ${staffName}.`,
      type: 'success',
      duration: 5000,
    })

    return newAppt
  },

  /**
   * Reschedules an existing appointment for customer with availability validation
   */
  async rescheduleAppointment(params: {
    appointmentId: string
    date: string
    startTime: string
    staffId?: string
    notes?: string
  }): Promise<Appointment> {
    await new Promise((res) => setTimeout(res, 350))

    const current = await appointmentService.getById(params.appointmentId)
    if (!current) throw new Error('Appointment not found')

    const allStaff = await staffService.getAll()
    const targetStaffId = params.staffId || current.staffId
    const staff = allStaff.find((s) => s.id === targetStaffId)
    const dur = current.duration || current.serviceDuration || 60

    if (staff) {
      const allAppts = await appointmentService.getAll()
      const check = isSlotAvailable(staff, params.date, params.startTime, dur, allAppts, current.id)
      if (!check.available) {
        throw new Error(check.conflictReason || 'Selected time slot is unavailable.')
      }
    }

    const calculatedEndTime = calculateEndTime(params.startTime, dur)
    const updated = await appointmentService.update(current.id, {
      date: params.date,
      startTime: params.startTime,
      endTime: calculatedEndTime,
      staffId: targetStaffId,
      staffName: staff?.name || current.staffName,
      staffAvatar: staff?.avatarUrl || current.staffAvatar,
      status: 'confirmed',
      notes: params.notes || current.notes,
    })

    auditLogService.log({
      action: 'APPOINTMENT_STATUS_CHANGE',
      entityType: 'appointment',
      entityId: updated.id,
      performedBy: current.clientName,
      userRole: 'customer',
      details: `Customer rescheduled booking to ${params.date} at ${params.startTime} with ${updated.staffName}.`,
      amount: updated.price,
    })

    useCustomerNotificationStore.getState().addNotification({
      customerId: current.clientId,
      type: 'APPOINTMENT',
      title: 'Appointment Rescheduled',
      message: `Your booking for ${updated.serviceName} is now set for ${params.date} at ${params.startTime}.`,
      actionUrl: '/customer/appointments',
    })

    useToastStore.getState().addToast({
      title: 'Appointment Rescheduled',
      message: `Your appointment is now confirmed for ${params.date} at ${params.startTime}.`,
      type: 'success',
    })

    return updated
  },
}
