import React, { Suspense } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { CustomerLayout } from '@/layouts/CustomerLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PublicRoute } from '@/components/auth/PublicRoute'
import { CustomerProtectedRoute } from '@/components/customer/CustomerProtectedRoute'
import { CustomerPublicRoute } from '@/components/customer/CustomerPublicRoute'
import { LoadingState } from '@/components/ui/LoadingState'

// Salon Staff / Admin Auth Pages (Fast initial load)
import { LoginPage } from '@/pages/auth/LoginPage'
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { OnboardingPage } from '@/pages/auth/OnboardingPage'

// Core Salon Operational Pages
import { DashboardPage } from '@/pages/DashboardPage'
import { AppointmentsPage } from '@/pages/AppointmentsPage'
import { NewAppointmentPage } from '@/pages/NewAppointmentPage'
import { ClientsPage } from '@/pages/ClientsPage'
import { ClientProfilePage } from '@/pages/ClientProfilePage'
import { ServicesPage } from '@/pages/ServicesPage'
import { ServiceDetailsPage } from '@/pages/ServiceDetailsPage'
import { StaffPage } from '@/pages/StaffPage'
import { StaffProfilePage } from '@/pages/StaffProfilePage'
import { StaffAttendancePage } from '@/pages/StaffAttendancePage'
import { StaffShiftsPage } from '@/pages/StaffShiftsPage'
import { StaffLeavePage } from '@/pages/StaffLeavePage'
import { InventoryPage } from '@/pages/InventoryPage'
import { SalesPage } from '@/pages/SalesPage'
import { POSBillingPage } from '@/pages/POSBillingPage'
import { BillingHistoryPage } from '@/pages/BillingHistoryPage'
import { PaymentHistoryPage } from '@/pages/PaymentHistoryPage'
import { CashRegisterPage } from '@/pages/CashRegisterPage'
import { QueueManagementPage } from '@/pages/QueueManagementPage'
import { QueueDisplayPage } from '@/pages/QueueDisplayPage'
import { TokenHistoryPage } from '@/pages/TokenHistoryPage'
import { DailyClosingPage } from '@/pages/DailyClosingPage'
import { ExpensesPage } from '@/pages/ExpensesPage'
import { PayrollPage } from '@/pages/PayrollPage'
import { MembershipsPage } from '@/pages/MembershipsPage'
import { PackagesPage } from '@/pages/PackagesPage'
import { RewardsPage } from '@/pages/RewardsPage'
import { ReviewsPage } from '@/pages/ReviewsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SecuritySettingsPage } from '@/pages/SecuritySettingsPage'
import { AuditLogPage } from '@/pages/AuditLogPage'
import { SystemStatusPage } from '@/pages/SystemStatusPage'
import { SuppliersPage } from '@/pages/SuppliersPage'
import { SupplierProfilePage } from '@/pages/SupplierProfilePage'
import { PurchasesPage } from '@/pages/PurchasesPage'
import { PurchaseOrderDetailsPage } from '@/pages/PurchaseOrderDetailsPage'
import { DataExportPage } from '@/pages/DataExportPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Phase 3 — Customer Portal & Authentication Pages
import { CustomerLoginPage } from '@/pages/customer/CustomerLoginPage'
import { CustomerRegisterPage } from '@/pages/customer/CustomerRegisterPage'
import { CustomerForgotPasswordPage } from '@/pages/customer/CustomerForgotPasswordPage'
import { CustomerDashboardPage } from '@/pages/customer/CustomerDashboardPage'
import { CustomerAppointmentsPage } from '@/pages/customer/CustomerAppointmentsPage'
import { CustomerAppointmentDetailPage } from '@/pages/customer/CustomerAppointmentDetailPage'
import { CustomerServicesPage } from '@/pages/customer/CustomerServicesPage'
import { CustomerBookingPage } from '@/pages/customer/CustomerBookingPage'
import { CustomerMembershipsPage } from '@/pages/customer/CustomerMembershipsPage'
import { CustomerPackagesPage } from '@/pages/customer/CustomerPackagesPage'
import { CustomerRewardsPage } from '@/pages/customer/CustomerRewardsPage'
import { CustomerInvoicesPage } from '@/pages/customer/CustomerInvoicesPage'
import { CustomerProfilePage } from '@/pages/customer/CustomerProfilePage'
import { CustomerReviewsPage } from '@/pages/customer/CustomerReviewsPage'
import { CustomerNewReviewPage } from '@/pages/customer/CustomerNewReviewPage'
import { CustomerOffersPage } from '@/pages/customer/CustomerOffersPage'

// ============================================================================
// CODE SPLITTING (Lazy-load heavy analytical, marketing, intelligence & admin routes)
// ============================================================================
const ReportsPage = React.lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const MarketingPage = React.lazy(() => import('@/pages/MarketingPage').then((m) => ({ default: m.MarketingPage })))
const CommunicationsPage = React.lazy(() => import('@/pages/CommunicationsPage').then((m) => ({ default: m.CommunicationsPage })))
const InsightsPage = React.lazy(() => import('@/pages/InsightsPage').then((m) => ({ default: m.InsightsPage })))
const AutomationsPage = React.lazy(() => import('@/pages/AutomationsPage').then((m) => ({ default: m.AutomationsPage })))
const AIAssistantPage = React.lazy(() => import('@/pages/AIAssistantPage').then((m) => ({ default: m.AIAssistantPage })))
const IntegrationsPage = React.lazy(() => import('@/pages/settings/IntegrationsPage').then((m) => ({ default: m.IntegrationsPage })))

const SuspenseFallback = (
  <div className="min-h-[50vh] flex items-center justify-center">
    <LoadingState message="Loading module…" minHeight="min-h-[260px]" />
  </div>
)

export const AppRoutes: React.FC = () => {
  return (
    <Suspense fallback={SuspenseFallback}>
      <Routes>
        {/* ======================================================== */}
        {/* 1. PUBLIC ADMIN / STAFF AUTHENTICATION PAGES             */}
        {/* ======================================================== */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* ======================================================== */}
        {/* 2. PROTECTED SALON APP SHELL (MainLayout)               */}
        {/* ======================================================== */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="appointments/new" element={<NewAppointmentPage />} />
          <Route path="appointments/queue" element={<QueueManagementPage />} />
          <Route path="appointments/tokens" element={<TokenHistoryPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:id" element={<ClientProfilePage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/:id" element={<ServiceDetailsPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="staff/attendance" element={<StaffAttendancePage />} />
          <Route path="staff/shifts" element={<StaffShiftsPage />} />
          <Route path="staff/leave" element={<StaffLeavePage />} />
          <Route path="staff/calendar" element={<StaffPage />} />
          <Route path="staff/:id" element={<StaffProfilePage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/products" element={<InventoryPage />} />
          <Route path="inventory/stock" element={<InventoryPage />} />
          <Route path="inventory/purchases" element={<PurchasesPage />} />
          <Route path="inventory/suppliers" element={<SuppliersPage />} />
          <Route path="inventory/transfers" element={<InventoryPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="suppliers/:id" element={<SupplierProfilePage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="purchases/:id" element={<PurchaseOrderDetailsPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="sales/billing" element={<POSBillingPage />} />
          <Route path="sales/payments" element={<PaymentHistoryPage />} />
          <Route path="sales/register" element={<CashRegisterPage />} />
          <Route path="sales/history" element={<BillingHistoryPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="expenses/categories" element={<ExpensesPage />} />
          <Route path="expenses/history" element={<ExpensesPage />} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="payroll/staff" element={<PayrollPage />} />
          <Route path="payroll/history" element={<PayrollPage />} />
          <Route path="memberships" element={<MembershipsPage />} />
          <Route path="packages" element={<PackagesPage />} />
          <Route path="rewards" element={<RewardsPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="reports/daily-closing" element={<DailyClosingPage />} />
          <Route path="marketing" element={<MarketingPage />} />
          <Route path="marketing/communications" element={<CommunicationsPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="automations" element={<AutomationsPage />} />
          <Route path="ai-assistant" element={<AIAssistantPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/integrations" element={<IntegrationsPage />} />
          <Route path="settings/integrations/webhooks" element={<IntegrationsPage />} />
          <Route path="settings/audit-log" element={<AuditLogPage />} />
          <Route path="settings/security" element={<SecuritySettingsPage />} />
          <Route path="settings/export" element={<DataExportPage />} />
          <Route path="settings/status" element={<SystemStatusPage />} />
        </Route>

        {/* ======================================================== */}
        {/* 3. PUBLIC CUSTOMER AUTHENTICATION PAGES                 */}
        {/* ======================================================== */}
        <Route
          path="/customer/login"
          element={
            <CustomerPublicRoute>
              <CustomerLoginPage />
            </CustomerPublicRoute>
          }
        />
        <Route
          path="/customer/register"
          element={
            <CustomerPublicRoute>
              <CustomerRegisterPage />
            </CustomerPublicRoute>
          }
        />
        <Route
          path="/customer/forgot-password"
          element={
            <CustomerPublicRoute>
              <CustomerForgotPasswordPage />
            </CustomerPublicRoute>
          }
        />

        {/* ======================================================== */}
        {/* 4. CUSTOMER PORTAL & LOUNGE (SEPARATE SHELL)             */}
        {/* ======================================================== */}
        <Route path="/customer" element={<CustomerLayout />}>
          {/* Public customer pages: Booking wizard & Service catalogue */}
          <Route path="book" element={<CustomerBookingPage />} />
          <Route path="services" element={<CustomerServicesPage />} />

          {/* Protected customer lounge pages */}
          <Route
            element={
              <CustomerProtectedRoute>
                <Outlet />
              </CustomerProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="dashboard" element={<CustomerDashboardPage />} />
            <Route path="appointments" element={<CustomerAppointmentsPage />} />
            <Route path="appointments/:id" element={<CustomerAppointmentDetailPage />} />
            <Route path="memberships" element={<CustomerMembershipsPage />} />
            <Route path="packages" element={<CustomerPackagesPage />} />
            <Route path="rewards" element={<CustomerRewardsPage />} />
            <Route path="invoices" element={<CustomerInvoicesPage />} />
            <Route path="profile" element={<CustomerProfilePage />} />
            <Route path="reviews" element={<CustomerReviewsPage />} />
            <Route path="reviews/new" element={<CustomerNewReviewPage />} />
            <Route path="offers" element={<CustomerOffersPage />} />
          </Route>
        </Route>

        {/* Customer-Facing TV Display (Full-Screen / Lounge Monitor) */}
        <Route path="/queue-display" element={<QueueDisplayPage />} />

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
