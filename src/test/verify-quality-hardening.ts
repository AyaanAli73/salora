import fs from 'fs'
import path from 'path'

// In-memory mock environment for Node.js test
const storageStore = new Map<string, string>()
const mockStorage = {
  getItem: (key: string) => storageStore.get(key) || null,
  setItem: (key: string, val: string) => storageStore.set(key, String(val)),
  removeItem: (key: string) => storageStore.delete(key),
  clear: () => storageStore.clear(),
  key: (i: number) => Array.from(storageStore.keys())[i] || null,
  length: 0,
}
;(globalThis as any).localStorage = mockStorage
;(globalThis as any).window = globalThis
try {
  Object.defineProperty(globalThis, 'navigator', {
    value: { onLine: true, userAgent: 'Node/Test' },
    configurable: true,
  })
} catch {
  // Ignored if immutable
}

async function runProductionHardeningVerification() {
  console.log('========================================================================')
  console.log('SALORA SALON MANAGEMENT SYSTEM: PHASE 5 PART 8 HARDENING & QUALITY TEST')
  console.log('========================================================================\n')

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

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. UNIT TESTS: PRICING, TAX, DISCOUNTS & COMMISSION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('--- 1. UNIT TESTS: PRICING, TAX, DISCOUNTS & COMMISSION ---')
  const { calculateBillSummary } = await import('../utils/billingUtils')
  const { commissionService } = await import('../services/commissionService')

  // Tax and discount unit calculations
  const items = [
    {
      id: 'i-1',
      name: 'Bridal Glow Facial',
      type: 'service' as const,
      quantity: 1,
      unitPrice: 2500,
      discount: 0,
      tax: 0,
      total: 2500,
    },
    {
      id: 'i-2',
      name: 'L\'Oreal Mythic Oil',
      type: 'product' as const,
      quantity: 2,
      unitPrice: 1200,
      discount: 0,
      tax: 0,
      total: 2400,
    },
  ]

  // Subtotal = 2500 + 2400 = 4900
  // Discount: 10% = 490
  // Taxable: 4410
  // 18% GST: 793.8
  // GrandTotal rounded: 5204
  const calculated = calculateBillSummary({
    items,
    billDiscountType: 'percentage',
    billDiscountValue: 10,
    taxRate: 18,
    roundingMode: 'nearest_1',
  })
  assert(calculated.subtotal === 4900, `Pricing: Subtotal computed as ₹${calculated.subtotal} (expected 4900)`)
  assert(calculated.billDiscount === 490, `Discount: 10% discount computed as ₹${calculated.billDiscount} (expected 490)`)
  assert(calculated.taxableAmount === 4410, `Taxable Base: ₹${calculated.taxableAmount} (expected 4410)`)
  assert(calculated.tax === 793.8, `Tax: 18% GST computed as ₹${calculated.tax} (expected 793.8)`)
  assert(calculated.grandTotal === 5204, `Rounding: Grand Total rounded to ₹${calculated.grandTotal} (expected 5204)`)

  // Commission calculations
  const { rule: applicableRule } = commissionService.findApplicableRule('st-01', 'srv-spa', 'Facial')
  const calculatedCommission = commissionService.calculateItemCommission(2500, applicableRule)
  assert(applicableRule !== undefined, `Commission Rule: Selected applicable rule '${applicableRule.name}'`)
  assert(calculatedCommission > 0, `Commission Calculation: ₹2500 service earned commission of ₹${calculatedCommission}`)

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. UNIT TESTS: TOKEN GENERATION & QUEUE SEQUENCING
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. UNIT TESTS: TOKEN GENERATION & QUEUE ORDERING ---')
  const { tokenService } = await import('../services/tokenService')

  const sampleToken = await tokenService.generateToken({
    appointmentId: 'apt-sample-seq',
    clientId: 'cli-sample',
    clientName: 'Sunita Mehra',
    serviceId: 'srv-1',
    serviceName: 'Hair Styling',
    staffId: 'st-01',
    staffName: 'Ananya Roy',
  })
  assert(typeof sampleToken.sequence === 'number' && sampleToken.sequence > 0, `Token generation sequence returned ${sampleToken.sequence}`)
  assert(sampleToken.displayNumber.startsWith('#'), `Token display formatted properly: ${sampleToken.displayNumber}`)

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. UNIT TESTS: REFUND INTEGRITY & NEGATIVE VALUES GUARD
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. UNIT TESTS: REFUND INTEGRITY & FINANCIAL GUARDS ---')
  const { refundService } = await import('../services/refundService')
  const { billingService } = await import('../services/billingService')

  // Test negative total prevention
  let negativeBillBlocked = false
  try {
    await billingService.createBill({
      clientId: 'cli-test',
      clientName: 'Test Client',
      staffId: 'st-test',
      staffName: 'Staff Test',
      items: [],
      subtotal: -500, // Negative amount
      taxableAmount: -500,
      tax: 0,
      taxRate: 18,
      discount: 0,
      rounding: 0,
      roundingMode: 'none',
      grandTotal: -500,
      paidAmount: 0,
      dueAmount: 0,
      paymentMethod: 'cash',
      paymentStatus: 'UNPAID',
      status: 'completed',
    })
  } catch (err: any) {
    negativeBillBlocked = true
  }
  assert(negativeBillBlocked === true, 'Financial Integrity: Negative subtotal / grandTotal is strictly blocked')

  // Test refund validation: refund cannot exceed paid balance or be negative
  const testBill = {
    id: 'bill-test-refund',
    invoiceNumber: 'INV-TEST-001',
    clientId: 'cli-1',
    clientName: 'Rohit Mehta',
    staffId: 'st-1',
    staffName: 'Ayaan',
    items: [],
    subtotal: 1000,
    taxableAmount: 1000,
    tax: 180,
    taxRate: 18,
    discount: 0,
    rounding: 0,
    roundingMode: 'none' as const,
    grandTotal: 1180,
    paidAmount: 1180,
    dueAmount: 0,
    paymentMethod: 'upi' as const,
    paymentStatus: 'PAID' as const,
    status: 'completed' as const,
    createdAt: new Date().toISOString(),
  }

  let negativeRefundBlocked = false
  try {
    await refundService.processRefund({
      bill: testBill,
      amount: -100,
      reason: 'Negative test',
      method: 'upi',
      processedBy: 'Tester',
    })
  } catch {
    negativeRefundBlocked = true
  }
  assert(negativeRefundBlocked === true, 'Financial Integrity: Negative refund amount is strictly rejected')

  let excessRefundBlocked = false
  try {
    await refundService.processRefund({
      bill: testBill,
      amount: 50000, // Exceeds paidAmount
      reason: 'Excess test',
      method: 'upi',
      processedBy: 'Tester',
    })
  } catch {
    excessRefundBlocked = true
  }
  assert(excessRefundBlocked === true, 'Financial Integrity: Refund exceeding invoice paid amount is strictly rejected')

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. UNIT & INTEGRATION: IDEMPOTENCY ENGINE
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. IDEMPOTENCY ENGINE & REPLAY SUPPRESSION ---')
  const { idempotencyService } = await import('../services/idempotencyService')

  let counter = 0
  const idempotencyKey = 'idemp_test_payment_9988'

  // First execution
  const res1 = await idempotencyService.execute('PAYMENT_CREATE', idempotencyKey, async () => {
    counter++
    return { paymentId: 'pay-001', status: 'SUCCESS' }
  })
  assert(res1.wasCached === false, 'First execution of idempotency key runs the operation')
  assert(counter === 1, 'Operation body ran exactly once')

  // Second repeated execution with same key (e.g. user double clicked or reconnected)
  const res2 = await idempotencyService.execute('PAYMENT_CREATE', idempotencyKey, async () => {
    counter++
    return { paymentId: 'pay-DUPLICATE-ERROR', status: 'FAILED' }
  })
  assert(res2.wasCached === true, 'CRITICAL: Repeated request with same idempotency key returned cached result')
  assert(counter === 1, 'CRITICAL: Operation body was NOT re-executed, preventing duplicate payment')
  assert(res2.result.paymentId === 'pay-001', 'Cached result preserved original transaction ID')

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. SECURITY & INPUT SANITIZATION AUDIT
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. SECURITY ARCHITECTURE & XSS PREVENTION ---')
  const { stripHtml, escapeHtml, sanitizeUrl, sanitizeUserNotes, sanitizePhone } = await import('../utils/sanitize')
  const { redactSensitiveData, logger } = await import('../utils/logger')

  // XSS stripping
  const maliciousInput = '<script>alert("XSS")</script><b>Client requested organic henna</b>'
  assert(stripHtml(maliciousInput) === 'Client requested organic henna', 'stripHtml completely eliminates <script> and HTML tags')
  assert(escapeHtml('<script>') === '&lt;script&gt;', 'escapeHtml encodes angle brackets to safe HTML entities')

  const maliciousUrl = 'javascript:stealCredentials()'
  assert(sanitizeUrl(maliciousUrl) === '#', 'sanitizeUrl neutralizes javascript: attack URLs to safe #')

  const cleanNote = sanitizeUserNotes('VIP customer allergic to sulfates. <img src=x onerror=alert(1)>', 100)
  assert(!cleanNote.includes('<img'), 'sanitizeUserNotes strips image onerror exploit payloads')

  // Sensitive data redaction
  const dirtyObject = {
    username: 'admin',
    password: 'superSecretPassword123!',
    apiKey: 'sk_live_992149819284',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy',
    authSession: { bearer: 'Bearer xyz123' },
    creditCard: '4532 8901 2345 6789',
    safeField: 'Salon Revenue',
  }
  const redacted = redactSensitiveData(dirtyObject)
  assert(redacted.password === '[REDACTED]', 'Sensitive Data Redaction: password was masked')
  assert(redacted.apiKey === '[REDACTED]', 'Sensitive Data Redaction: apiKey was masked')
  assert(redacted.token === '[REDACTED]', 'Sensitive Data Redaction: token was masked')
  assert(redacted.authSession === '[REDACTED]', 'Sensitive Data Redaction: authSession was masked')
  assert(redacted.creditCard === '[REDACTED]', 'Sensitive Data Redaction: creditCard was masked')
  assert(redacted.safeField === 'Salon Revenue', 'Sensitive Data Redaction: safe business data was preserved')

  // Verify persistent storage contains NO plaintext secrets
  const rawAuth = localStorage.getItem('SALORA_auth_session')
  if (rawAuth) {
    assert(!rawAuth.includes('password') && !rawAuth.includes('secretKey'), 'Storage Audit: No plaintext passwords in auth session storage')
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. AUDIT LOG REVIEW
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6. OPERATIONAL AUDIT LOG ARCHITECTURE ---')
  const { auditLogService } = await import('../services/auditLogService')

  const logEntry = auditLogService.log({
    action: 'SETTINGS_UPDATED',
    module: 'Settings',
    entityType: 'salon_settings',
    entity: 'operating_hours',
    entityId: 'settings-001',
    performedBy: 'Ayaan (Owner)',
    userRole: 'owner',
    branchId: 'branch-jodhpur',
    branchName: 'Salora Jodhpur',
    details: 'Updated salon weekday closing time from 08:30 PM to 09:00 PM.',
    result: 'SUCCESS',
  })
  assert(logEntry.id.startsWith('aud-'), 'Audit record generated with structured aud- ID')
  assert(logEntry.timestamp !== undefined, 'Audit record signed with ISO timestamp')

  const recentLogs = auditLogService.getAll()
  assert(recentLogs.length >= 10, `Audit log contains ${recentLogs.length} historical operational records`)
  assert(recentLogs.some((l) => l.action === 'LOGIN'), 'Audit log records user authentications')
  assert(recentLogs.some((l) => l.action === 'BILL_CREATED' || l.module === 'Billing'), 'Audit log records sales & billing activity')

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. FEATURE FLAGS ARCHITECTURE
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 7. FEATURE FLAGS ENGINE ---')
  const { featureFlagService } = await import('../services/featureFlagService')

  const allFlags = featureFlagService.getAllFlags()
  const flagKeys = allFlags.map((f) => f.key)
  assert(flagKeys.includes('AI'), 'Feature flag: AI configured')
  assert(flagKeys.includes('WhatsApp'), 'Feature flag: WhatsApp configured')
  assert(flagKeys.includes('MultiBranch'), 'Feature flag: MultiBranch configured')
  assert(flagKeys.includes('Loyalty'), 'Feature flag: Loyalty configured')
  assert(flagKeys.includes('PWA'), 'Feature flag: PWA configured')
  assert(flagKeys.includes('AdvancedReports'), 'Feature flag: AdvancedReports configured')

  // Toggle flag test
  featureFlagService.setFlag('WhatsApp', false)
  assert(featureFlagService.isEnabled('WhatsApp') === false, 'Feature flag set to false confirmed')
  featureFlagService.setFlag('WhatsApp', true)
  assert(featureFlagService.isEnabled('WhatsApp') === true, 'Feature flag re-enabled successfully')

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. HEALTH & SUBSYSTEM TELEMETRY
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 8. SYSTEM HEALTH TELEMETRY AUDIT ---')
  const { INITIAL_SUBSYSTEMS } = await import('../pages/SystemStatusPage')

  const expectedSubsystems = [
    'Database',
    'API',
    'Authentication',
    'Payments',
    'WhatsApp',
    'SMS',
    'Email',
    'Printer',
    'Storage',
    'AI',
  ]
  const presentSubsystems = INITIAL_SUBSYSTEMS.map((s) => s.name)
  for (const exp of expectedSubsystems) {
    assert(presentSubsystems.includes(exp), `System Health: Subsystem '${exp}' configured`)
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. API CLIENT & REPOSITORY ABSTRACTION
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 9. API LAYER & REPOSITORY PATTERN ---')
  const { apiClient, ApiError } = await import('../services/api/apiClient')
  const { BaseRepository } = await import('../services/api/baseRepository')

  assert(typeof apiClient.get === 'function', 'apiClient exposes get()')
  assert(typeof apiClient.post === 'function', 'apiClient exposes post()')
  assert(typeof apiClient.put === 'function', 'apiClient exposes put()')
  assert(typeof apiClient.delete === 'function', 'apiClient exposes delete()')

  // Concrete test repository
  class TestClientRepository extends BaseRepository<{ id: string; name: string }> {
    constructor() {
      super('/clients', 'TEST_clients_repo')
    }
  }
  const testRepo = new TestClientRepository()
  const created = await testRepo.create({ name: 'Meera Rajput' })
  assert(created.id !== undefined && created.name === 'Meera Rajput', 'BaseRepository handles entity creation')
  const fetched = await testRepo.getById(created.id)
  assert(fetched?.name === 'Meera Rajput', 'BaseRepository handles entity retrieval by ID')

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. CROSS-MODULE LIFECYCLE INTEGRATION FLOW
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--- 10. END-TO-END CROSS-MODULE INTEGRATION FLOW ---')
  console.log('Flow: Customer Booking -> Appointment -> Token -> Billing -> Payment -> Invoice -> Audit')

  const { appointmentService } = await import('../services/appointmentService')

  // Step A: Appointment Creation
  const newAppt = await appointmentService.create({
    clientId: 'cli-test-flow',
    clientName: 'Kavita Joshi',
    clientPhone: '+91 98290 88776',
    serviceId: 'srv-spa',
    serviceName: 'Hydra Facial Glow',
    serviceDuration: 45,
    servicePrice: 3200,
    staffId: 'st-01',
    staffName: 'Ananya Roy',
    date: new Date().toISOString().split('T')[0],
    startTime: '02:00 PM',
    endTime: '02:45 PM',
    price: 3200,
    totalAmount: 3200,
    paymentStatus: 'unpaid',
    status: 'scheduled',
  })
  assert(newAppt.id.startsWith('apt-'), `Step A: Appointment created with ID ${newAppt.id}`)

  // Step B: Check-in & Queue Token Issue
  const tokenRecord = await tokenService.generateToken({
    appointmentId: newAppt.id,
    appointmentType: 'APPOINTMENT',
    clientId: newAppt.clientId,
    clientName: newAppt.clientName,
    clientPhone: newAppt.clientPhone,
    serviceId: newAppt.serviceId,
    serviceName: newAppt.serviceName,
    serviceDuration: newAppt.serviceDuration,
    servicePrice: newAppt.price,
    staffId: newAppt.staffId,
    staffName: newAppt.staffName,
    date: newAppt.date,
    priority: 'NORMAL',
  })
  assert(tokenRecord.tokenNumber !== undefined, `Step B: Sequential queue token issued: ${tokenRecord.displayNumber}`)

  // Step C: Service Completion & POS Billing
  const billTax = Math.round(3200 * 0.18)
  const billGrandTotal = 3200 + billTax
  const createdBill = await billingService.createBill(
    {
      appointmentId: newAppt.id,
      clientId: newAppt.clientId,
      clientName: newAppt.clientName,
      clientPhone: newAppt.clientPhone,
      staffId: newAppt.staffId,
      staffName: newAppt.staffName,
      items: [
        {
          id: 'item-flow-1',
          name: newAppt.serviceName,
          type: 'service',
          serviceId: newAppt.serviceId,
          quantity: 1,
          unitPrice: 3200,
          discount: 0,
          tax: billTax,
          total: 3200,
        },
      ],
      subtotal: 3200,
      taxableAmount: 3200,
      tax: billTax,
      taxRate: 18,
      discount: 0,
      rounding: 0,
      roundingMode: 'none',
      grandTotal: billGrandTotal,
      paidAmount: billGrandTotal,
      dueAmount: 0,
      paymentMethod: 'upi',
      paymentStatus: 'PAID',
      status: 'completed',
      notes: 'Customer Lounge checkout',
    },
    `idemp_flow_bill_${Date.now()}`
  )
  assert(createdBill.invoiceNumber.startsWith('INV-'), `Step C: Settled Bill with invoice #${createdBill.invoiceNumber}`)
  assert(createdBill.paymentStatus === 'PAID', 'Step D: Bill payment status marked as PAID')

  console.log('\n========================================================================')
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`)
  console.log('========================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runProductionHardeningVerification().catch((err) => {
  console.error('Fatal testing error:', err)
  process.exit(1)
})
