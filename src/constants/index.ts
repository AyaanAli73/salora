export interface NavItem {
  name: string
  href: string
  iconName: string
  badge?: string | number
  badgeColor?: 'primary' | 'accent' | 'success' | 'warning'
}

export const NAVIGATION_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', iconName: 'LayoutDashboard' },
  { name: 'Appointments', href: '/appointments', iconName: 'CalendarCheck2', badge: 4, badgeColor: 'primary' },
  { name: 'Queue', href: '/appointments/queue', iconName: 'Layers', badge: 'Live', badgeColor: 'accent' },
  { name: 'Clients', href: '/clients', iconName: 'Users' },
  { name: 'Services', href: '/services', iconName: 'Sparkles' },
  { name: 'Staff', href: '/staff', iconName: 'UserCheck' },
  { name: 'Sales & Payments', href: '/sales', iconName: 'CreditCard' },
  { name: 'Inventory', href: '/inventory', iconName: 'PackageCheck', badge: 2, badgeColor: 'warning' },
  { name: 'Expenses', href: '/expenses', iconName: 'ReceiptText' },
  { name: 'Payroll', href: '/payroll', iconName: 'Wallet' },
  { name: 'Memberships', href: '/memberships', iconName: 'Crown' },
  { name: 'Packages', href: '/packages', iconName: 'Package' },
  { name: 'Loyalty', href: '/rewards', iconName: 'Gift' },
  { name: 'Marketing', href: '/marketing', iconName: 'Megaphone' },
  { name: 'Reviews', href: '/reviews', iconName: 'Star' },
  { name: 'Reports', href: '/reports', iconName: 'BarChart3' },
  { name: 'AI Assistant', href: '/ai-assistant', iconName: 'Sparkles', badge: 'AI', badgeColor: 'primary' },
  { name: 'Settings', href: '/settings', iconName: 'Sliders' },
]

export const APP_NAME = 'Salora'
export const APP_TAGLINE = 'Luxury Salon & Spa Management'
export const APP_VERSION = 'v3.0.0'

export const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'danger' | 'info' | 'default' | 'primary' | 'accent' }
> = {
  confirmed: { label: 'Confirmed', variant: 'info' },
  scheduled: { label: 'Scheduled', variant: 'primary' },
  'in-progress': { label: 'In Progress', variant: 'accent' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
  'no-show': { label: 'No-Show', variant: 'warning' },
  paid: { label: 'Paid', variant: 'success' },
  unpaid: { label: 'Unpaid', variant: 'warning' },
  partial: { label: 'Partial', variant: 'warning' },
  refunded: { label: 'Refunded', variant: 'danger' },
  'in-stock': { label: 'In Stock', variant: 'success' },
  'low-stock': { label: 'Low Stock', variant: 'warning' },
  'out-of-stock': { label: 'Out of Stock', variant: 'danger' },
  active: { label: 'Active', variant: 'success' },
  vip: { label: 'VIP', variant: 'accent' },
  inactive: { label: 'Inactive', variant: 'default' },
  new: { label: 'New Client', variant: 'primary' },
  'on-leave': { label: 'On Leave', variant: 'warning' },
}
