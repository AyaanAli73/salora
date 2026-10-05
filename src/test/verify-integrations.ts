import type { IntegrationCategory, Role } from '../types'

// In-memory localStorage and window mock for Node.js test environment
const store = new Map<string, string>()
const mockStorage = {
  getItem: (key: string) => store.get(key) || null,
  setItem: (key: string, val: string) => store.set(key, String(val)),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
  key: (i: number) => Array.from(store.keys())[i] || null,
  length: 0,
}
;(globalThis as any).localStorage = mockStorage
;(globalThis as any).window = globalThis

async function runIntegrationsVerification() {
  const { integrationsService } = await import('../services/integrationsService')
  const { canAccessPath } = await import('../utils/permissions')
  console.log('=================================================================')
  console.log('SALORA SALON MANAGEMENT SYSTEM: PHASE 5 PART 6 INTEGRATIONS HUB')
  console.log('=================================================================\n')

  let passed = 0
  let failed = 0

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`[PASS] ${desc}`)
      passed++
    } else {
      console.error(`[FAIL] ${desc}`)
      failed++
    }
  }

  // 1. Check all 8 categories
  const allIntegrations = integrationsService.getIntegrations()
  const categories: IntegrationCategory[] = [
    'payments',
    'whatsapp',
    'sms',
    'email',
    'calendar',
    'printing',
    'storage',
    'analytics',
  ]

  console.log('--- 1. VERIFYING 8 INTEGRATION CATEGORIES ---')
  for (const cat of categories) {
    const itemsInCat = allIntegrations.filter((i) => i.category === cat)
    assert(itemsInCat.length > 0, `Category '${cat}' has ${itemsInCat.length} service(s) configured`)
  }

  // 2. Test Connection & Disconnection lifecycle
  console.log('\n--- 2. VERIFYING CONNECT / DISCONNECT LIFECYCLE ---')
  const stripe = integrationsService.getIntegrationById('int-stripe')
  assert(stripe?.status === 'not_connected', 'Stripe starts as not_connected')

  const connectedStripe = integrationsService.connectIntegration('int-stripe', {
    publishableKey: 'pk_live_test123',
    currency: 'USD',
  })
  assert(connectedStripe.status === 'connected', 'Stripe connected successfully')
  assert(connectedStripe.config.publishableKey === 'pk_live_test123', 'Stripe config updated')

  const disconnectedStripe = integrationsService.disconnectIntegration('int-stripe')
  assert(disconnectedStripe.status === 'not_connected', 'Stripe decoupled back to not_connected')

  // 3. Test Diagnostics for WhatsApp, Email, SMS, Printer, Payments
  console.log('\n--- 3. VERIFYING LIVE TESTS & DIAGNOSTICS ---')

  // WhatsApp
  const waTest = await integrationsService.testIntegration('int-whatsapp', { recipient: '+91 98290 11223' })
  assert(waTest.success && waTest.latencyMs > 0, `WhatsApp test dispatch succeeded in ${waTest.latencyMs}ms`)

  // Email
  const emailTest = await integrationsService.testIntegration('int-resend', { recipient: 'salon@salora.in' })
  assert(emailTest.success && emailTest.latencyMs > 0, `Email delivery test succeeded in ${emailTest.latencyMs}ms`)

  // SMS
  const smsTest = await integrationsService.testIntegration('int-msg91', { recipient: '+91 98290 11223' })
  assert(smsTest.success && smsTest.latencyMs > 0, `SMS Gateway test accepted in ${smsTest.latencyMs}ms`)

  // Payment
  const payTest = await integrationsService.testIntegration('int-razorpay')
  assert(payTest.success && payTest.latencyMs > 0, `Razorpay payment gateway ping passed in ${payTest.latencyMs}ms`)

  // Printer Token & Invoice
  const printTokenTest = await integrationsService.testIntegration('int-printer', { testType: 'token', paperSize: '58mm' })
  assert(printTokenTest.success, 'Printer 58mm queue token test executed')

  const printInvoiceTest = await integrationsService.testIntegration('int-printer', { testType: 'invoice', paperSize: '80mm' })
  assert(printInvoiceTest.success, 'Printer 80mm tax invoice test executed')

  // 4. Outgoing Webhooks Management & Secret Protection
  console.log('\n--- 4. VERIFYING WEBHOOKS & SENSITIVE SECRET ISOLATION ---')
  const { webhook: newWh, rawSecret } = integrationsService.createWebhook({
    name: 'Automation Test Webhook',
    url: 'https://webhook.site/test-endpoint',
    events: ['appointment.created', 'invoice.paid'],
  })

  assert(rawSecret.startsWith('whsec_'), 'One-time raw secret generated for immediate copy')
  assert(newWh.signingSecret.includes('••••••••'), 'Stored secret is permanently masked in client storage')
  assert(!newWh.signingSecret.includes(rawSecret), 'Raw secret is never stored in unmasked plaintext')

  // Toggle status
  const toggled = integrationsService.toggleWebhookStatus(newWh.id)
  assert(toggled.status === 'INACTIVE', 'Webhook toggled to INACTIVE')
  const reToggled = integrationsService.toggleWebhookStatus(newWh.id)
  assert(reToggled.status === 'ACTIVE', 'Webhook toggled back to ACTIVE')

  // Test webhook ping
  const whPing = await integrationsService.testWebhook(newWh.id)
  assert(whPing.success && whPing.statusCode === 200, `Webhook test delivery succeeded with HTTP ${whPing.statusCode}`)

  // Delete webhook
  const deleted = integrationsService.deleteWebhook(newWh.id)
  assert(deleted, 'Webhook endpoint deleted')

  // 5. Integration Logs & Safe Retries
  console.log('\n--- 5. VERIFYING INTEGRATION LOGS & SAFE RETRIES ---')
  const logs = integrationsService.getLogs()
  assert(logs.length > 0, `Retrieved ${logs.length} integration execution logs`)

  const failedLog = logs.find((l) => l.status === 'FAILED' && l.isRetryable)
  assert(Boolean(failedLog), `Identified failed retryable log (${failedLog?.id}: ${failedLog?.error})`)

  if (failedLog) {
    const retriedLog = await integrationsService.retryLog(failedLog.id)
    assert(retriedLog.status === 'SUCCESS', `Failed log transitioned to SUCCESS upon retry`)
    assert(retriedLog.statusCode === 200, `Status code resolved to 200`)
    assert((retriedLog.retryCount || 0) > 0, `Retry count incremented to ${retriedLog.retryCount}`)
  }

  // 6. Permissions check for routes
  console.log('\n--- 6. VERIFYING ROLE-BASED ACCESS CONTROL ---')
  const roles: Role[] = ['owner', 'admin', 'manager', 'staff']
  for (const role of roles) {
    const canAccessIntegrations = canAccessPath(role, '/settings/integrations')
    const canAccessWebhooks = canAccessPath(role, '/settings/integrations/webhooks')
    if (role === 'owner' || role === 'admin') {
      assert(canAccessIntegrations && canAccessWebhooks, `${role} has access to Integrations Hub & Webhooks`)
    } else {
      assert(!canAccessIntegrations && !canAccessWebhooks, `${role} is restricted from Integrations Hub`)
    }
  }

  console.log('\n=================================================================')
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('=================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runIntegrationsVerification().catch((err) => {
  console.error('Test runner fatal error:', err)
  process.exit(1)
})
