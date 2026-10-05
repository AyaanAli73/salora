import {
  WorkflowAutomationRule,
  AutomationJobLog,
  AutomationTriggerType,
  AutomationActionType,
  ConditionGroup,
  JobExecutionStatus,
} from '@/types'

const STORAGE_KEYS = {
  RULES: 'salora_automation_rules_v1',
  LOGS: 'salora_automation_logs_v1',
}

// 7 Prebuilt Templates as per Section 7 of specification
export const AUTOMATION_TEMPLATES: WorkflowAutomationRule[] = [
  {
    id: 'tmpl-post-visit-review',
    name: 'Post Visit Review Request',
    description: 'Sends automated WhatsApp message 2 hours after appointment completion requesting feedback and rating.',
    trigger: 'appointment_completed',
    conditionGroup: {
      logicalOperator: 'AND',
      conditions: [],
    },
    delay: {
      value: 2,
      unit: 'hours',
    },
    actions: [
      {
        id: 'act-review-wa',
        type: 'send_whatsapp',
        title: 'Send Review Request WhatsApp',
        params: {
          template: 'post_service_review_v1',
          message: 'Hi {{client.name}}, thank you for visiting Salora Salon! How was your {{service.name}} with {{staff.name}}? Tap here to review us: https://salora.salon/review',
        },
      },
    ],
    enabled: true,
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    runCount: 142,
    lastRunAt: '2026-09-27T11:45:00Z',
    isTemplate: true,
    category: 'Retention',
  },
  {
    id: 'tmpl-appt-reminder',
    name: 'Appointment 24-Hour Reminder',
    description: 'Notifies customers via WhatsApp 24 hours prior to scheduled appointment slot with confirmation link.',
    trigger: 'appointment_reminder',
    conditionGroup: {
      logicalOperator: 'AND',
      conditions: [],
    },
    delay: {
      value: 0,
      unit: 'immediately',
    },
    actions: [
      {
        id: 'act-reminder-wa',
        type: 'send_whatsapp',
        title: 'Send WhatsApp Reminder',
        params: {
          message: 'Reminder: Your appointment for {{service.name}} is tomorrow at {{appointment.time}} with {{staff.name}} at Salora Salon.',
        },
      },
      {
        id: 'act-reminder-task',
        type: 'create_reminder',
        title: 'Frontdesk Schedule Check',
        params: {
          title: 'Confirm slot with {{client.name}} if unacknowledged',
        },
      },
    ],
    enabled: true,
    createdAt: '2026-09-01T10:00:00Z',
    updatedAt: '2026-09-01T10:00:00Z',
    runCount: 289,
    lastRunAt: '2026-09-27T09:15:00Z',
    isTemplate: true,
    category: 'Operations',
  },
  {
    id: 'tmpl-birthday-offer',
    name: 'VIP Birthday Celebration Offer',
    description: 'Generates a 20% discount coupon and WhatsApp greeting on client birthday for VIP and returning guests.',
    trigger: 'birthday',
    conditionGroup: {
      logicalOperator: 'AND',
      conditions: [
        {
          id: 'c-bday-vip',
          field: 'client.isVip',
          operator: 'equals',
          value: 'true',
        },
      ],
    },
    delay: {
      value: 0,
      unit: 'immediately',
    },
    actions: [
      {
        id: 'act-bday-coupon',
        type: 'create_coupon',
        title: 'Generate BDAY20 Coupon',
        params: {
          code: 'BDAY20-{{client.id}}',
          discount: 20,
          type: 'percentage',
          validDays: 14,
        },
      },
      {
        id: 'act-bday-wa',
        type: 'send_whatsapp',
        title: 'Send Birthday Wish WhatsApp',
        params: {
          message: 'Happy Birthday {{client.name}}! 🎉 Salora wishes you radiance and joy. Enjoy a complimentary 20% OFF using coupon BDAY20 on your next visit.',
        },
      },
    ],
    enabled: true,
    createdAt: '2026-09-02T11:00:00Z',
    updatedAt: '2026-09-02T11:00:00Z',
    runCount: 23,
    lastRunAt: '2026-09-26T08:00:00Z',
    isTemplate: true,
    category: 'Marketing',
  },
  {
    id: 'tmpl-membership-expiry',
    name: 'Membership Expiry 7-Day Renewal Alert',
    description: 'Alerts members when their active membership plan enters its final 7 days and prepares renewal task for frontdesk.',
    trigger: 'membership_expiring',
    conditionGroup: {
      logicalOperator: 'AND',
      conditions: [
        {
          id: 'c-mem-days',
          field: 'membership.daysUntilExpiry',
          operator: 'less_than',
          value: 8,
        },
      ],
    },
    delay: {
      value: 0,
      unit: 'immediately',
    },
    actions: [
      {
        id: 'act-mem-sms',
        type: 'send_sms',
        title: 'Send Renewal SMS',
        params: {
          message: 'Dear {{client.name}}, your {{membership.planName}} expires in {{membership.daysUntilExpiry}} days. Renew now to keep your complimentary benefits.',
        },
      },
      {
        id: 'act-mem-task',
        type: 'create_task',
        title: 'Reception Renewal Outreach',
        params: {
          assignedTo: 'Reception Desk',
          taskTitle: 'Follow up on {{membership.planName}} renewal for {{client.name}}',
        },
      },
    ],
    enabled: true,
    createdAt: '2026-09-03T14:00:00Z',
    updatedAt: '2026-09-03T14:00:00Z',
    runCount: 38,
    lastRunAt: '2026-09-25T16:20:00Z',
    isTemplate: true,
    category: 'Retention',
  },
  {
    id: 'tmpl-inactive-reactivation',
    name: 'Inactive Customer 60-Day Reactivation',
    description: 'Identifies clients who have not returned in 60+ days, tags their profile as lapsed, and delivers a ₹500 winback credit.',
    trigger: 'customer_inactive',
    conditionGroup: {
      logicalOperator: 'AND',
      conditions: [
        {
          id: 'c-inact-days',
          field: 'client.daysSinceLastVisit',
          operator: 'greater_than',
          value: 60,
        },
      ],
    },
    delay: {
      value: 0,
      unit: 'immediately',
    },
    actions: [
      {
        id: 'act-tag-lapsed',
        type: 'add_customer_tag',
        title: 'Tag Customer as Lapsed',
        params: {
          tag: 'winback-cohort-60',
        },
      },
      {
        id: 'act-winback-sms',
        type: 'send_sms',
        title: 'Send Winback Voucher SMS',
        params: {
          message: 'We miss you at Salora, {{client.name}}! Here is a special ₹500 credit on any hair or spa service this week. Book: https://salora.salon',
        },
      },
    ],
    enabled: true,
    createdAt: '2026-09-05T09:00:00Z',
    updatedAt: '2026-09-05T09:00:00Z',
    runCount: 56,
    lastRunAt: '2026-09-24T18:00:00Z',
    isTemplate: true,
    category: 'Marketing',
  },
  {
    id: 'tmpl-low-stock-alert',
    name: 'Product Low Stock Warehouse Alert',
    description: 'Triggers immediately when product stock count dips below safety threshold to alert manager and log reorder requisition.',
    trigger: 'product_low_stock',
    conditionGroup: {
      logicalOperator: 'AND',
      conditions: [],
    },
    delay: {
      value: 0,
      unit: 'immediately',
    },
    actions: [
      {
        id: 'act-notify-mgr',
        type: 'send_notification',
        title: 'In-App Manager Alert',
        params: {
          title: 'Stock Alert: {{product.name}} below safety level ({{product.currentStock}} units left)',
        },
      },
      {
        id: 'act-create-po-task',
        type: 'create_task',
        title: 'Create PO Task',
        params: {
          assignedTo: 'Warehouse Manager',
          taskTitle: 'Procure reorder batch for {{product.name}} from supplier',
        },
      },
    ],
    enabled: true,
    createdAt: '2026-09-06T12:00:00Z',
    updatedAt: '2026-09-06T12:00:00Z',
    runCount: 19,
    lastRunAt: '2026-09-27T08:10:00Z',
    isTemplate: true,
    category: 'Inventory',
  },
  {
    id: 'tmpl-payment-reminder',
    name: 'Overdue Invoice Payment Reminder',
    description: 'Sends polite SMS reminder with digital UPI payment link when a guest bill remains unpaid beyond grace period.',
    trigger: 'payment_due',
    conditionGroup: {
      logicalOperator: 'AND',
      conditions: [
        {
          id: 'c-bill-amount',
          field: 'bill.grandTotal',
          operator: 'greater_than',
          value: 1000,
        },
      ],
    },
    delay: {
      value: 1,
      unit: 'days',
    },
    actions: [
      {
        id: 'act-payment-sms',
        type: 'send_sms',
        title: 'Send Payment Reminder SMS',
        params: {
          message: 'Dear {{client.name}}, your pending bill #{{bill.invoiceNumber}} of ₹{{bill.grandTotal}} is due. Pay online conveniently at: https://salora.salon/pay/{{bill.id}}',
        },
      },
    ],
    enabled: true,
    createdAt: '2026-09-07T15:00:00Z',
    updatedAt: '2026-09-07T15:00:00Z',
    runCount: 12,
    lastRunAt: '2026-09-26T14:30:00Z',
    isTemplate: true,
    category: 'Finance',
  },
]

// Initial Activity Logs showcasing all 5 execution statuses
export const INITIAL_ACTIVITY_LOGS: AutomationJobLog[] = [
  {
    id: 'job-101',
    automationId: 'tmpl-post-visit-review',
    automationName: 'Post Visit Review Request',
    idempotencyKey: 'tmpl-post-visit-review_appointment_completed_appt-891_2026-09-27',
    triggerType: 'appointment_completed',
    entityId: 'appt-891',
    entityType: 'appointment',
    entityName: 'Hair Spa & Scalp Detox',
    customerName: 'Priya Sharma',
    branchName: 'Main Flagship',
    actionType: 'send_whatsapp',
    actionSummary: 'Dispatched review request WhatsApp to +91 98765 43210',
    status: 'COMPLETED',
    triggeredAt: '2026-09-27T10:30:00Z',
    executedAt: '2026-09-27T12:30:00Z',
    delaySummary: 'Waited 2 hours',
    retryCount: 0,
    maxRetries: 3,
  },
  {
    id: 'job-102',
    automationId: 'tmpl-low-stock-alert',
    automationName: 'Product Low Stock Warehouse Alert',
    idempotencyKey: 'tmpl-low-stock-alert_product_low_stock_prod-12_2026-09-27',
    triggerType: 'product_low_stock',
    entityId: 'prod-12',
    entityType: 'product',
    entityName: "L'Oreal Serie Expert Shampoo (500ml)",
    customerName: undefined,
    branchName: 'Main Flagship',
    actionType: 'send_notification',
    actionSummary: 'Notified manager & created procurement task in warehouse',
    status: 'COMPLETED',
    triggeredAt: '2026-09-27T08:10:00Z',
    executedAt: '2026-09-27T08:10:02Z',
    delaySummary: 'Immediately',
    retryCount: 0,
    maxRetries: 3,
  },
  {
    id: 'job-103',
    automationId: 'tmpl-appt-reminder',
    automationName: 'Appointment 24-Hour Reminder',
    idempotencyKey: 'tmpl-appt-reminder_appointment_reminder_appt-902_2026-09-27',
    triggerType: 'appointment_reminder',
    entityId: 'appt-902',
    entityType: 'appointment',
    entityName: 'Balayage Color & Gloss',
    customerName: 'Ananya Roy',
    branchName: 'Subhash Nagar',
    actionType: 'send_whatsapp',
    actionSummary: 'WhatsApp slot confirmation dispatched',
    status: 'RUNNING',
    triggeredAt: '2026-09-27T13:45:00Z',
    delaySummary: 'In Progress',
    retryCount: 0,
    maxRetries: 3,
  },
  {
    id: 'job-104',
    automationId: 'tmpl-payment-reminder',
    automationName: 'Overdue Invoice Payment Reminder',
    idempotencyKey: 'tmpl-payment-reminder_payment_due_bill-441_2026-09-27',
    triggerType: 'payment_due',
    entityId: 'bill-441',
    entityType: 'bill',
    entityName: 'INV-2026-0441 (₹2,450)',
    customerName: 'Rohan Mehra',
    branchName: 'Main Flagship',
    actionType: 'send_sms',
    actionSummary: 'Scheduled UPI payment link delivery',
    status: 'QUEUED',
    triggeredAt: '2026-09-27T14:00:00Z',
    delaySummary: 'Scheduled in 1 day',
    retryCount: 0,
    maxRetries: 3,
  },
  {
    id: 'job-105',
    automationId: 'tmpl-inactive-reactivation',
    automationName: 'Inactive Customer 60-Day Reactivation',
    idempotencyKey: 'tmpl-inactive-reactivation_customer_inactive_c-98_2026-09-26',
    triggerType: 'customer_inactive',
    entityId: 'c-98',
    entityType: 'client',
    entityName: 'Inactive 64 days',
    customerName: 'Kavita Joshi',
    branchName: 'Jodhpur Branch',
    actionType: 'send_sms',
    actionSummary: 'SMS Gateway delivery failed: Provider timeout (HTTP 504)',
    status: 'FAILED',
    triggeredAt: '2026-09-26T18:00:00Z',
    executedAt: '2026-09-26T18:00:15Z',
    delaySummary: 'Immediately',
    error: 'Telecom SMS Gateway Gateway Timeout (HTTP 504) - Number unreachable or DND blacklist enabled.',
    retryCount: 1,
    maxRetries: 3,
  },
  {
    id: 'job-106',
    automationId: 'tmpl-membership-expiry',
    automationName: 'Membership Expiry 7-Day Renewal Alert',
    idempotencyKey: 'tmpl-membership-expiry_membership_expiring_mem-33_2026-09-25',
    triggerType: 'membership_expiring',
    entityId: 'mem-33',
    entityType: 'membership',
    entityName: 'Gold Wellness Club Plan',
    customerName: 'Vikram Malhotra',
    branchName: 'Main Flagship',
    actionType: 'send_sms',
    actionSummary: 'Client cancelled membership renewal preference',
    status: 'CANCELLED',
    triggeredAt: '2026-09-25T11:20:00Z',
    executedAt: '2026-09-25T11:21:00Z',
    delaySummary: 'Immediately',
    retryCount: 0,
    maxRetries: 3,
  },
]

class AutomationService {
  private getStoredRules(): WorkflowAutomationRule[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.RULES)
      if (raw) return JSON.parse(raw)
    } catch (e) {
      console.warn('Failed to load automation rules from storage:', e)
    }
    return [...AUTOMATION_TEMPLATES]
  }

  private saveRules(rules: WorkflowAutomationRule[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.RULES, JSON.stringify(rules))
    } catch (e) {
      console.warn('Failed to save automation rules to storage:', e)
    }
  }

  private getStoredLogs(): AutomationJobLog[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LOGS)
      if (raw) return JSON.parse(raw)
    } catch (e) {
      console.warn('Failed to load automation logs from storage:', e)
    }
    return [...INITIAL_ACTIVITY_LOGS]
  }

  private saveLogs(logs: AutomationJobLog[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs))
    } catch (e) {
      console.warn('Failed to save automation logs to storage:', e)
    }
  }

  // ==========================================
  // RULES CRUD
  // ==========================================

  public getAllAutomations(): WorkflowAutomationRule[] {
    return this.getStoredRules()
  }

  public getAutomationById(id: string): WorkflowAutomationRule | undefined {
    return this.getAllAutomations().find((r) => r.id === id)
  }

  public createAutomation(
    data: Omit<WorkflowAutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'runCount'>
  ): WorkflowAutomationRule {
    const rules = this.getAllAutomations()
    const now = new Date().toISOString()
    const newRule: WorkflowAutomationRule = {
      ...data,
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
      runCount: 0,
    }
    this.saveRules([newRule, ...rules])
    return newRule
  }

  public updateAutomation(
    id: string,
    updates: Partial<WorkflowAutomationRule>
  ): WorkflowAutomationRule {
    const rules = this.getAllAutomations()
    let updated: WorkflowAutomationRule | undefined
    const list = rules.map((r) => {
      if (r.id === id) {
        updated = {
          ...r,
          ...updates,
          updatedAt: new Date().toISOString(),
        }
        return updated
      }
      return r
    })
    this.saveRules(list)
    if (!updated) throw new Error(`Automation ${id} not found`)
    return updated
  }

  public toggleAutomation(id: string): WorkflowAutomationRule {
    const rule = this.getAutomationById(id)
    if (!rule) throw new Error(`Automation ${id} not found`)
    return this.updateAutomation(id, { enabled: !rule.enabled })
  }

  public deleteAutomation(id: string): boolean {
    const rules = this.getAllAutomations()
    const filtered = rules.filter((r) => r.id !== id)
    this.saveRules(filtered)
    return true
  }

  // ==========================================
  // TEMPLATES
  // ==========================================

  public getTemplates(): WorkflowAutomationRule[] {
    return AUTOMATION_TEMPLATES
  }

  public createFromTemplate(templateId: string): WorkflowAutomationRule {
    const template = AUTOMATION_TEMPLATES.find((t) => t.id === templateId)
    if (!template) throw new Error(`Template ${templateId} not found`)

    return this.createAutomation({
      name: `${template.name} (Copy)`,
      description: template.description,
      trigger: template.trigger,
      conditionGroup: JSON.parse(JSON.stringify(template.conditionGroup)),
      delay: { ...template.delay },
      actions: JSON.parse(JSON.stringify(template.actions)),
      enabled: true,
      category: template.category,
    })
  }

  // ==========================================
  // CONDITIONS EVALUATION (AND / OR)
  // ==========================================

  public evaluateConditions(
    group: ConditionGroup,
    context: Record<string, any>
  ): boolean {
    if (!group || !group.conditions || group.conditions.length === 0) {
      return true
    }

    const results = group.conditions.map((cond) => {
      // Lookup nested field in context (e.g. "client.isVip")
      const val = cond.field.split('.').reduce((acc, part) => acc?.[part], context)
      const target = cond.value

      switch (cond.operator) {
        case 'equals':
          return String(val).toLowerCase() === String(target).toLowerCase()
        case 'not_equals':
          return String(val).toLowerCase() !== String(target).toLowerCase()
        case 'greater_than':
          return Number(val) > Number(target)
        case 'less_than':
          return Number(val) < Number(target)
        case 'contains':
          return String(val).toLowerCase().includes(String(target).toLowerCase())
        case 'in':
          if (Array.isArray(target)) {
            return target.map(String).includes(String(val))
          }
          return String(target).split(',').map((s) => s.trim().toLowerCase()).includes(String(val).toLowerCase())
        default:
          return true
      }
    })

    if (group.logicalOperator === 'OR') {
      return results.some(Boolean)
    }
    // Default AND
    return results.every(Boolean)
  }

  // ==========================================
  // IDEMPOTENCY & EXECUTION ENGINE
  // ==========================================

  public checkIdempotency(key: string): boolean {
    const logs = this.getStoredLogs()
    // If a job with this exact key is already completed or queued/running, reject duplicate
    const existing = logs.find(
      (l) =>
        l.idempotencyKey === key &&
        (l.status === 'COMPLETED' || l.status === 'QUEUED' || l.status === 'RUNNING')
    )
    return Boolean(existing)
  }

  /**
   * Safe Action Rule (Section 11):
   * Financial or destructive actions cannot execute automatically without explicit controlled approval.
   */
  public isActionRestricted(actionType: string): boolean {
    const RESTRICTED = [
      'refund_money',
      'delete_client',
      'modify_payroll',
      'close_register',
      'wipe_inventory',
    ]
    return RESTRICTED.includes(actionType)
  }

  public async triggerEvent(params: {
    trigger: AutomationTriggerType
    entityId: string
    entityType: string
    entityName: string
    customerName?: string
    branchName?: string
    contextData: Record<string, any>
  }): Promise<AutomationJobLog[]> {
    const rules = this.getAllAutomations().filter(
      (r) => r.enabled && r.trigger === params.trigger
    )
    const logs = this.getStoredLogs()
    const createdLogs: AutomationJobLog[] = []
    const todayStr = new Date().toISOString().split('T')[0]

    for (const rule of rules) {
      // 1. Idempotency Check
      const idempotencyKey = `${rule.id}_${params.trigger}_${params.entityId}_${todayStr}`
      if (this.checkIdempotency(idempotencyKey)) {
        console.info(`[Automation Engine] Skipped duplicate event due to idempotency: ${idempotencyKey}`)
        continue
      }

      // 2. Condition Evaluation
      const passed = this.evaluateConditions(rule.conditionGroup, params.contextData)
      if (!passed) continue

      // 3. Process each configured action
      for (const action of rule.actions) {
        // Safe check
        const requiresApproval = action.requiresApproval || this.isActionRestricted(action.type)
        const hasDelay = rule.delay.value > 0 && rule.delay.unit !== 'immediately'

        const status: JobExecutionStatus = requiresApproval
          ? 'QUEUED'
          : hasDelay
          ? 'QUEUED'
          : 'COMPLETED'

        const delaySummary =
          rule.delay.value === 0 || rule.delay.unit === 'immediately'
            ? 'Immediately'
            : `Wait ${rule.delay.value} ${rule.delay.unit}`

        const job: AutomationJobLog = {
          id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          automationId: rule.id,
          automationName: rule.name,
          idempotencyKey,
          triggerType: params.trigger,
          entityId: params.entityId,
          entityType: params.entityType,
          entityName: params.entityName,
          customerName: params.customerName,
          branchName: params.branchName || 'Main Flagship',
          actionType: action.type,
          actionSummary: `${action.title}: ${JSON.stringify(action.params)}`,
          status,
          triggeredAt: new Date().toISOString(),
          executedAt: status === 'COMPLETED' ? new Date().toISOString() : undefined,
          delaySummary,
          retryCount: 0,
          maxRetries: 3,
          payload: params.contextData,
        }

        createdLogs.push(job)
      }

      // Increment run count on rule
      this.updateAutomation(rule.id, {
        runCount: rule.runCount + 1,
        lastRunAt: new Date().toISOString(),
      })
    }

    if (createdLogs.length > 0) {
      this.saveLogs([...createdLogs, ...logs])
    }

    return createdLogs
  }

  // ==========================================
  // RETRY & FAILED JOB ACTIONS
  // ==========================================

  public async retryJob(jobId: string): Promise<AutomationJobLog> {
    const logs = this.getStoredLogs()
    let updated: AutomationJobLog | undefined

    const list = logs.map((l) => {
      if (l.id === jobId) {
        const nextRetry = l.retryCount + 1
        if (nextRetry > l.maxRetries) {
          updated = {
            ...l,
            status: 'FAILED',
            retryCount: nextRetry,
            error: `Exceeded maximum retry limit of ${l.maxRetries}.`,
          }
        } else {
          // Simulate successful retry execution
          updated = {
            ...l,
            status: 'COMPLETED',
            retryCount: nextRetry,
            error: undefined,
            executedAt: new Date().toISOString(),
            actionSummary: `${l.actionSummary} (Recovered on retry #${nextRetry})`,
          }
        }
        return updated
      }
      return l
    })

    this.saveLogs(list)
    if (!updated) throw new Error(`Job ${jobId} not found`)
    return updated
  }

  public cancelJob(jobId: string): AutomationJobLog {
    const logs = this.getStoredLogs()
    let updated: AutomationJobLog | undefined

    const list = logs.map((l) => {
      if (l.id === jobId) {
        updated = {
          ...l,
          status: 'CANCELLED',
        }
        return updated
      }
      return l
    })

    this.saveLogs(list)
    if (!updated) throw new Error(`Job ${jobId} not found`)
    return updated
  }

  public getActivityLogs(filters?: {
    automationId?: string
    status?: JobExecutionStatus | 'ALL'
    search?: string
    branch?: string
  }): AutomationJobLog[] {
    let list = this.getStoredLogs()

    if (!filters) return list

    if (filters.automationId && filters.automationId !== 'all') {
      list = list.filter((l) => l.automationId === filters.automationId)
    }

    if (filters.status && filters.status !== 'ALL') {
      list = list.filter((l) => l.status === filters.status)
    }

    if (filters.branch && filters.branch !== 'all') {
      list = list.filter((l) => l.branchName === filters.branch)
    }

    if (filters.search?.trim()) {
      const q = filters.search.toLowerCase().trim()
      list = list.filter(
        (l) =>
          l.automationName.toLowerCase().includes(q) ||
          l.entityName.toLowerCase().includes(q) ||
          l.customerName?.toLowerCase().includes(q) ||
          l.actionSummary.toLowerCase().includes(q)
      )
    }

    return list
  }

  public getFailedJobs(): AutomationJobLog[] {
    return this.getStoredLogs().filter((l) => l.status === 'FAILED')
  }
}

export const automationService = new AutomationService()
