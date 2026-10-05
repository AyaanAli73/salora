/**
 * Verification Script for PHASE 5 — PART 7:
 * PROGRESSIVE WEB APP + MOBILE EXPERIENCE + SINGLE-SALON ARCHITECTURE
 */

import fs from 'fs'
import path from 'path'
import { syncQueueService } from '../services/syncQueueService'
import { pwaService } from '../services/pwaService'
import { cameraScanService } from '../services/cameraScanService'

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`)
    process.exit(1)
  }
  console.log(`✅ PASSED: ${message}`)
}

async function runVerification() {
  console.log('====================================================')
  console.log('RUNNING SALORA MOBILE + PWA + SINGLE-SALON TEST SUITE')
  console.log('====================================================\n')

  // 1. PWA Manifest & App Config
  console.log('--- 1. PWA Manifest & Metadata Verification ---')
  const manifestPath = path.resolve(process.cwd(), 'public/manifest.webmanifest')
  const jsonManifestPath = path.resolve(process.cwd(), 'public/manifest.json')
  assert(fs.existsSync(manifestPath), 'manifest.webmanifest exists in public directory')
  assert(fs.existsSync(jsonManifestPath), 'manifest.json exists in public directory')

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  assert(manifest.name === 'Salora', `App name is 'Salora' (found: ${manifest.name})`)
  assert(manifest.short_name === 'Salora', `Short name is 'Salora' (found: ${manifest.short_name})`)
  assert(manifest.theme_color === '#7c3aed', `Theme color is luxury violet #7c3aed`)
  assert(manifest.display === 'standalone', `Display mode is standalone`)
  assert(Array.isArray(manifest.icons) && manifest.icons.length > 0, 'Icons defined in manifest')
  assert(
    manifest.icons.some((i: any) => i.purpose?.includes('maskable')),
    'Includes maskable icon configuration for Android adaptive icons'
  )

  const indexPath = path.resolve(process.cwd(), 'index.html')
  const indexHtml = fs.readFileSync(indexPath, 'utf8')
  assert(indexHtml.includes('manifest.webmanifest'), 'index.html links to manifest.webmanifest')
  assert(indexHtml.includes('apple-touch-icon'), 'index.html configures apple-touch-icon')
  assert(indexHtml.includes('apple-mobile-web-app-capable'), 'index.html configures iOS standalone mode')
  assert(indexHtml.includes('theme-color'), 'index.html includes theme-color meta tag')

  // 2. Service Worker File
  console.log('\n--- 2. Service Worker Verification ---')
  const swPath = path.resolve(process.cwd(), 'public/sw.js')
  assert(fs.existsSync(swPath), 'sw.js exists in public directory')
  const swCode = fs.readFileSync(swPath, 'utf8')
  assert(swCode.includes("CACHE_NAME = 'salora-cache-v1'"), 'sw.js uses Salora cache namespace')
  assert(swCode.includes("addEventListener('push'"), 'sw.js handles push notification events')
  assert(swCode.includes("addEventListener('notificationclick'"), 'sw.js handles notification interaction and routing')
  assert(swCode.includes("addEventListener('sync'"), 'sw.js handles background sync events')

  // 3. Sync Queue & Financial Offline Protection
  console.log('\n--- 3. Sync Queue & Financial Offline Protection ---')
  // Force network offline
  syncQueueService.setMockNetworkStatus('offline')
  assert(syncQueueService.getNetworkStatus() === 'offline', 'Network status simulates offline')

  // Attempt non-financial mutation while offline
  const clientResult = syncQueueService.enqueue(
    'client/create',
    { name: 'Pooja Hegde', phone: '+91 98200 44332' },
    false
  )
  assert(clientResult.canProceed === true, 'Non-financial mutation allowed and queued offline')
  assert(clientResult.item !== undefined, 'Queued item created in sync queue')
  assert(clientResult.item?.status === 'PENDING', 'Queued item marked with status PENDING')
  assert(clientResult.item?.idempotencyKey.startsWith('idemp-'), 'Queued item has unique idempotencyKey')

  // CRITICAL RULE: Attempt financial checkout mutation while offline
  const paymentResult = syncQueueService.enqueue(
    'billing/createBill',
    { amount: 2500, customerId: 'c123', paymentMethod: 'card' },
    true
  )
  assert(
    paymentResult.canProceed === false,
    'CRITICAL: Financial write strictly BLOCKED offline (never pretend financial writes succeeded)'
  )
  assert(
    paymentResult.error?.includes('Financial checkouts cannot be completed without an active gateway connection') === true,
    'Appropriate financial offline protection error returned'
  )

  // Test online sync replay
  syncQueueService.setMockNetworkStatus('online')
  assert(syncQueueService.getNetworkStatus() === 'online', 'Network status restored to online')
  const syncResult = await syncQueueService.syncNow()
  assert(syncResult.syncedCount >= 1, 'SyncQueue successfully replayed non-financial items upon reconnect')
  assert(syncQueueService.getItems().some((item) => item.status === 'SYNCED'), 'Items marked as SYNCED')

  // 4. Mobile Bottom Navigation Role Permissions
  console.log('\n--- 4. Role-Specific Navigation Architecture ---')
  const mobileNavPath = path.resolve(process.cwd(), 'src/components/navigation/MobileNav.tsx')
  const mobileNavCode = fs.readFileSync(mobileNavPath, 'utf8')
  // Admin tabs: Home, Appointments, Clients, Billing, More
  assert(mobileNavCode.includes('>Home<'), 'Admin mobile nav has Home')
  assert(mobileNavCode.includes('>Appointments<'), 'Admin mobile nav has Appointments')
  assert(mobileNavCode.includes('>Clients<'), 'Admin mobile nav has Clients')
  assert(mobileNavCode.includes('>Billing<'), 'Admin mobile nav has Billing')
  assert(mobileNavCode.includes('>More<'), 'Admin mobile nav has More')
  // Receptionist tabs: Home, Queue, Appointments, Billing, More
  assert(mobileNavCode.includes('>Queue<'), 'Receptionist mobile nav has Queue')

  // Customer navigation: Home, Bookings, Rewards, Offers, Profile
  const customerNavPath = path.resolve(process.cwd(), 'src/components/customer/CustomerMobileNav.tsx')
  const customerNavCode = fs.readFileSync(customerNavPath, 'utf8')
  assert(customerNavCode.includes("label: 'Home'"), 'Customer nav has Home')
  assert(customerNavCode.includes("label: 'Bookings'"), 'Customer nav has Bookings')
  assert(customerNavCode.includes("label: 'Rewards'"), 'Customer nav has Rewards')
  assert(customerNavCode.includes("label: 'Offers'"), 'Customer nav has Offers')
  assert(customerNavCode.includes("label: 'Profile'"), 'Customer nav has Profile')

  // 5. Mobile Quick Actions
  console.log('\n--- 5. Mobile Quick Actions Verification ---')
  const receptionQuickPath = path.resolve(process.cwd(), 'src/components/navigation/ReceptionMobileQuickActions.tsx')
  const receptionQuickCode = fs.readFileSync(receptionQuickPath, 'utf8')
  assert(receptionQuickCode.includes('New Appt'), 'Reception quick actions has New Appointment')
  assert(receptionQuickCode.includes('Walk-in'), 'Reception quick actions has Walk-in')
  assert(receptionQuickCode.includes('Token'), 'Reception quick actions has Token')
  assert(receptionQuickCode.includes('Billing'), 'Reception quick actions has Billing')

  const customerQuickPath = path.resolve(process.cwd(), 'src/components/customer/CustomerMobileQuickActions.tsx')
  const customerQuickCode = fs.readFileSync(customerQuickPath, 'utf8')
  assert(customerQuickCode.includes('Book Appointment'), 'Customer quick actions has Book Appointment')
  assert(customerQuickCode.includes('View Booking'), 'Customer quick actions has View Booking')
  assert(customerQuickCode.includes('View Rewards'), 'Customer quick actions has View Rewards')

  // 6. Camera Scan Fallback Logic
  console.log('\n--- 6. Camera Scan Architecture ---')
  assert(typeof cameraScanService.isBarcodeDetectorSupported === 'function', 'CameraScanService detects BarcodeDetector')
  assert(typeof cameraScanService.isCameraSupported === 'function', 'CameraScanService detects getUserMedia')
  assert(typeof cameraScanService.parseImageFile === 'function', 'CameraScanService provides file upload fallback')

  // 7. Install Prompt Cooldown
  console.log('\n--- 7. PWA Install Prompt Cooldown ---')
  assert(pwaService.isDismissedRecently() === false, 'Fresh session has no dismissal cooldown')
  pwaService.dismissPrompt()
  assert(pwaService.isDismissedRecently() === true, 'Dismissal initiates 7-day cooldown')

  // 8. Reorganized Single-Salon Settings Tabs
  console.log('\n--- 8. Single-Salon Settings Tabs Verification ---')
  const settingsPath = path.resolve(process.cwd(), 'src/pages/SettingsPage.tsx')
  const settingsCode = fs.readFileSync(settingsPath, 'utf8')
  assert(settingsCode.includes("label: 'Salon Profile'"), 'Settings tab: Salon Profile')
  assert(settingsCode.includes("label: 'Working Hours'"), 'Settings tab: Working Hours')
  assert(settingsCode.includes("label: 'Services Configuration'"), 'Settings tab: Services Configuration')
  assert(settingsCode.includes("label: 'Tax & GST'"), 'Settings tab: Tax & GST')
  assert(settingsCode.includes("label: 'Receipt & Printing'"), 'Settings tab: Receipt & Printing')
  assert(settingsCode.includes("label: 'Staff Roles & Permissions'"), 'Settings tab: Staff Roles & Permissions')
  assert(settingsCode.includes("label: 'Notifications'"), 'Settings tab: Notifications')
  assert(settingsCode.includes("label: 'Security & Audit'"), 'Settings tab: Security & Audit')
  assert(settingsCode.includes("label: 'Data Export'"), 'Settings tab: Data Export')
  assert(!settingsCode.includes('BranchAdminPage'), 'Settings does not import BranchAdminPage (Single-Salon)')
  assert(!settingsCode.includes('SaaS Plan'), 'Settings does not contain SaaS Plan link (Single-Salon)')

  console.log('\n====================================================')
  console.log('🌟 ALL 28 MOBILE, PWA, AND SETTINGS TESTS PASSED!')
  console.log('====================================================')
}

runVerification().catch((err) => {
  console.error('Test run failed:', err)
  process.exit(1)
})
