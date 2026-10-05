import { Role, Permission } from '@/types'

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    'view:dashboard',
    'manage:clients',
    'manage:appointments',
    'manage:services',
    'manage:staff',
    'manage:inventory',
    'manage:billing',
    'manage:expenses',
    'view:reports',
    'manage:settings',
  ],
  admin: [
    'view:dashboard',
    'manage:clients',
    'manage:appointments',
    'manage:services',
    'manage:staff',
    'manage:inventory',
    'manage:billing',
    'manage:expenses',
    'view:reports',
    'manage:settings',
  ],
  manager: [
    'view:dashboard',
    'manage:clients',
    'manage:appointments',
    'manage:services',
    'manage:staff',
    'manage:inventory',
    'manage:billing',
    'manage:expenses',
    'view:reports',
  ],
  receptionist: [
    'view:dashboard',
    'manage:clients',
    'manage:appointments',
    'manage:billing',
    'manage:expenses',
  ],
  staff: [
    'view:dashboard',
    'manage:appointments',
    'manage:clients',
  ],
  stylist: [
    'view:dashboard',
    'manage:appointments',
    'manage:clients',
  ],
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Salon Owner',
  admin: 'Administrator',
  manager: 'Salon Manager',
  receptionist: 'Front Desk / Receptionist',
  staff: 'Stylist / Staff',
  stylist: 'Stylist / Staff',
}

export const ROUTE_PERMISSION_MAP: Record<string, Permission> = {
  '/dashboard': 'view:dashboard',
  '/appointments': 'manage:appointments',
  '/clients': 'manage:clients',
  '/services': 'manage:services',
  '/memberships': 'manage:clients',
  '/packages': 'manage:services',
  '/rewards': 'manage:clients',
  '/reviews': 'manage:clients',
  '/staff': 'manage:staff',
  '/payroll': 'manage:staff',
  '/inventory': 'manage:inventory',
  '/purchases': 'manage:inventory',
  '/suppliers': 'manage:inventory',
  '/sales': 'manage:billing',
  '/expenses': 'manage:expenses',
  '/reports': 'view:reports',
  '/business': 'view:reports',
  '/insights': 'view:reports',
  '/automations': 'manage:settings',
  '/ai-assistant': 'view:dashboard',
  '/marketing': 'manage:settings',
  '/settings': 'manage:settings',
  '/settings/integrations': 'manage:settings',
  '/settings/integrations/webhooks': 'manage:settings',
  '/settings/subscription': 'manage:settings',
  '/settings/branches': 'manage:settings',
  '/settings/audit-log': 'manage:settings',
  '/settings/security': 'manage:settings',
  '/settings/export': 'manage:settings',
  '/settings/status': 'manage:settings',
}

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes(permission)
}

export function canAccessPath(role: Role, path: string): boolean {
  // Find matching route or prefix
  const matchedRoute = Object.keys(ROUTE_PERMISSION_MAP).find(
    (route) => path === route || path.startsWith(`${route}/`)
  )
  if (!matchedRoute) return true
  const requiredPermission = ROUTE_PERMISSION_MAP[matchedRoute]
  return hasPermission(role, requiredPermission)
}

// ==========================================
// Reusable Explicit Role Permissions Checks
// ==========================================

export function canViewFinancials(role: Role): boolean {
  return ['owner', 'admin', 'manager'].includes(role)
}

export function canManageStaff(role: Role): boolean {
  return ['owner', 'admin', 'manager'].includes(role)
}

export function canManagePayroll(role: Role): boolean {
  return ['owner', 'admin'].includes(role)
}

export function canManageBranches(role: Role): boolean {
  return ['owner', 'admin'].includes(role)
}

export function canIssueRefund(role: Role): boolean {
  return ['owner', 'admin', 'manager'].includes(role)
}

export function canCloseRegister(role: Role): boolean {
  return ['owner', 'admin', 'manager', 'receptionist'].includes(role)
}

export function canViewAudit(role: Role): boolean {
  return ['owner', 'admin'].includes(role)
}

export function canExportData(role: Role): boolean {
  return ['owner', 'admin'].includes(role)
}

export function canManageSecurity(role: Role): boolean {
  return ['owner', 'admin'].includes(role)
}
