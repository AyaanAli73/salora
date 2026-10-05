import { Invoice, LegacyPayment, DashboardMetric, RevenueDataPoint, AppointmentsTrendPoint } from '@/types'
import { billingService } from './billingService'
import { appointmentService } from './appointmentService'

export const salesService = {
  async getInvoices(): Promise<Invoice[]> {
    const bills = await billingService.getAll()
    return bills.map((b) => ({
      id: b.id,
      invoiceNumber: b.invoiceNumber,
      clientId: b.clientId || '',
      clientName: b.clientName,
      items: b.items.map((it) => ({
        id: it.id,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.total,
        type: it.type === 'product' ? ('product' as const) : ('service' as const),
      })),
      subtotal: b.subtotal,
      discount: b.discount,
      tax: b.tax,
      tip: 0,
      total: b.grandTotal,
      paidAmount: b.paidAmount,
      balance: b.dueAmount,
      paymentMethod: b.paymentMethod,
      issueDate: b.createdAt.split('T')[0],
      dueDate: b.createdAt.split('T')[0],
      status: b.paymentStatus === 'PAID' ? ('paid' as const) : ('pending' as const),
    }))
  },

  async getPayments(): Promise<LegacyPayment[]> {
    const bills = await billingService.getAll()
    return bills
      .filter((b) => b.paidAmount > 0)
      .map((b) => ({
        id: `pay-${b.id}`,
        invoiceId: b.id,
        appointmentId: b.appointmentId,
        clientId: b.clientId || '',
        clientName: b.clientName,
        amount: b.paidAmount,
        tipAmount: 0,
        totalAmount: b.paidAmount,
        method: 'cash' as const,
        status: 'completed' as const,
        createdAt: b.createdAt,
        transactionRef: b.id,
      }))
  },

  async getDashboardMetrics(): Promise<DashboardMetric[]> {
    const salesSummary = billingService.getTodaySalesSummary()
    const appts = await appointmentService.getTodayAppointments()
    return [
      {
        id: 'metric-rev',
        label: "Today's Revenue",
        value: salesSummary.todayRevenue,
        changePercent: salesSummary.todayRevenueChange,
        isPositive: salesSummary.todayRevenueChange >= 0,
        timeframe: 'today',
        iconName: 'IndianRupee',
        description: 'Total revenue collected today',
      },
      {
        id: 'metric-appts',
        label: "Today's Appointments",
        value: appts.length,
        changePercent: 0,
        isPositive: true,
        timeframe: 'today',
        iconName: 'Calendar',
        description: 'Total appointments scheduled today',
      },
    ]
  },

  async getRevenueTrend(): Promise<RevenueDataPoint[]> {
    return []
  },

  async getAppointmentsTrend(): Promise<AppointmentsTrendPoint[]> {
    return []
  },
}
