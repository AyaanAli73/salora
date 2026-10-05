import { GlobalSearchResultItem } from '@/types'
import { clientService } from './clientService'
import { appointmentService } from './appointmentService'
import { serviceService } from './serviceService'
import { staffService } from './staffService'
import { inventoryService } from './inventoryService'
import { billingService } from './billingService'
import { formatCurrency } from '@/utils/formatters'

export const searchService = {
  async searchAll(query: string): Promise<GlobalSearchResultItem[]> {
    const q = query.toLowerCase().trim()
    if (!q) {
      return []
    }

    const results: GlobalSearchResultItem[] = []

    try {
      // 1. Search clients (name, phone, email)
      const allClients = await clientService.getAll()
      const clients = allClients.filter(
        (c) =>
          c.fullName?.toLowerCase().includes(q) ||
          c.firstName?.toLowerCase().includes(q) ||
          c.lastName?.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.email?.toLowerCase().includes(q)
      )
      clients.slice(0, 5).forEach((client) => {
        results.push({
          id: client.id,
          type: 'client',
          title: client.fullName || `${client.firstName} ${client.lastName || ''}`.trim(),
          subtitle: `${client.phone || ''}${client.email ? ' • ' + client.email : ''}`,
          badgeText: client.status ? client.status.toUpperCase() : 'CLIENT',
          badgeVariant: client.status === 'vip' ? 'accent' : 'primary',
          url: '/clients',
        })
      })
    } catch (e) {
      console.warn('[searchService] Client search warning:', e)
    }

    try {
      // 2. Search appointments (client, date, status)
      const appointments = await appointmentService.getAll()
      appointments
        .filter(
          (appt) =>
            appt.clientName?.toLowerCase().includes(q) ||
            appt.serviceName?.toLowerCase().includes(q) ||
            appt.date?.includes(q) ||
            appt.status?.toLowerCase().includes(q)
        )
        .slice(0, 5)
        .forEach((appt) => {
          results.push({
            id: appt.id,
            type: 'appointment',
            title: `${appt.serviceName} - ${appt.clientName}`,
            subtitle: `${appt.date} at ${appt.startTime} with ${appt.staffName || 'Specialist'}`,
            badgeText: (appt.status || 'SCHEDULED').toUpperCase(),
            badgeVariant: appt.status === 'completed' ? 'success' : 'primary',
            url: '/appointments',
          })
        })
    } catch (e) {
      console.warn('[searchService] Appointment search warning:', e)
    }

    try {
      // 3. Search services (name, category)
      const services = await serviceService.getAll()
      services
        .filter(
          (service) =>
            service.name?.toLowerCase().includes(q) ||
            service.categoryName?.toLowerCase().includes(q)
        )
        .slice(0, 4)
        .forEach((service) => {
          results.push({
            id: service.id,
            type: 'service',
            title: service.name,
            subtitle: `${service.categoryName || 'Service'} • ${service.duration} mins • ${formatCurrency(service.price)}`,
            badgeText: 'Service',
            badgeVariant: 'default',
            url: '/services',
          })
        })
    } catch (e) {
      console.warn('[searchService] Service search warning:', e)
    }

    try {
      // 4. Search staff (name, specialties)
      const staffList = await staffService.getAll()
      staffList
        .filter(
          (staff) =>
            staff.name?.toLowerCase().includes(q) ||
            staff.role?.toLowerCase().includes(q)
        )
        .slice(0, 3)
        .forEach((staff) => {
          results.push({
            id: staff.id,
            type: 'staff',
            title: staff.name,
            subtitle: `${staff.role || 'Stylist'} • ${staff.specialties?.join(', ') || ''}`,
            badgeText: 'Staff',
            badgeVariant: 'primary',
            url: '/staff',
          })
        })
    } catch (e) {
      console.warn('[searchService] Staff search warning:', e)
    }

    try {
      // 5. Search products (name, SKU, barcode)
      const products = await inventoryService.getAll()
      products
        .filter(
          (prod) =>
            prod.name?.toLowerCase().includes(q) ||
            prod.sku?.toLowerCase().includes(q) ||
            (prod.barcode && prod.barcode.toLowerCase().includes(q))
        )
        .slice(0, 4)
        .forEach((prod) => {
          results.push({
            id: prod.id,
            type: 'product',
            title: prod.name,
            subtitle: `SKU: ${prod.sku} • Stock: ${prod.currentStock ?? 0}`,
            badgeText: prod.status || 'in-stock',
            badgeVariant: prod.currentStock > 0 ? 'success' : 'warning',
            url: '/inventory',
          })
        })
    } catch (e) {
      console.warn('[searchService] Product search warning:', e)
    }

    try {
      // 6. Search invoices (invoice number, customer)
      const bills = await billingService.getAll()
      bills
        .filter(
          (b) =>
            b.invoiceNumber?.toLowerCase().includes(q) ||
            b.clientName?.toLowerCase().includes(q)
        )
        .slice(0, 4)
        .forEach((b) => {
          results.push({
            id: b.id,
            type: 'invoice',
            title: `${b.invoiceNumber} • ${b.clientName}`,
            subtitle: `Total: ${formatCurrency(b.grandTotal)} • ${b.createdAt.split('T')[0]}`,
            badgeText: (b.paymentStatus || 'PAID').toUpperCase(),
            badgeVariant: b.paymentStatus === 'PAID' ? 'success' : 'warning',
            url: '/billing/history',
          })
        })
    } catch (e) {
      console.warn('[searchService] Invoice search warning:', e)
    }

    return results
  },
}
