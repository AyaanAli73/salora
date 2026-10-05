import React, { useState } from 'react'
import {
  Zap,
  Clock,
  Filter,
  CheckCircle2,
  Plus,
  Trash2,
  Calendar,
  MessageSquare,
  Gift,
  AlertTriangle,
  Layers,
  ArrowRight,
  Shield,
  HelpCircle,
  Tag,
  UserCheck,
  Check,
} from 'lucide-react'
import {
  WorkflowAutomationRule,
  AutomationTriggerType,
  AutomationActionType,
  AutomationCondition,
  DelayUnit,
} from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'

interface AutomationBuilderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (rule: Omit<WorkflowAutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'runCount'>) => void
  initialRule?: WorkflowAutomationRule | null
}

const TRIGGER_OPTIONS: { id: AutomationTriggerType; label: string; desc: string }[] = [
  { id: 'appointment_created', label: 'Appointment Created', desc: 'When a new booking is scheduled' },
  { id: 'appointment_confirmed', label: 'Appointment Confirmed', desc: 'When guest or staff confirms appointment' },
  { id: 'appointment_reminder', label: 'Appointment Reminder', desc: 'Scheduled pre-visit reminder slot' },
  { id: 'appointment_completed', label: 'Appointment Completed', desc: 'When appointment checkout completes' },
  { id: 'appointment_cancelled', label: 'Appointment Cancelled', desc: 'When booking is marked cancelled or no-show' },
  { id: 'customer_created', label: 'Customer Created', desc: 'When new guest is registered in directory' },
  { id: 'customer_inactive', label: 'Customer Inactive', desc: 'When guest visits lapse beyond safety threshold' },
  { id: 'payment_received', label: 'Payment Received', desc: 'When bill settlement is verified' },
  { id: 'payment_due', label: 'Payment Due', desc: 'When unpaid bill crosses payment terms' },
  { id: 'membership_expiring', label: 'Membership Expiring', desc: 'When active membership plan nears end date' },
  { id: 'reward_earned', label: 'Reward Earned', desc: 'When loyalty points threshold is achieved' },
  { id: 'product_low_stock', label: 'Product Low Stock', desc: 'When product inventory drops below safety units' },
  { id: 'birthday', label: 'Birthday', desc: 'On guest birthday anniversary' },
  { id: 'campaign_started', label: 'Campaign Started', desc: 'When marketing outreach is launched' },
]

const ACTION_OPTIONS: { id: AutomationActionType; label: string; desc: string }[] = [
  { id: 'send_whatsapp', label: 'Send WhatsApp', desc: 'Deliver interactive template via WhatsApp' },
  { id: 'send_sms', label: 'Send SMS', desc: 'Broadcast text message via SMS gateway' },
  { id: 'send_email', label: 'Send Email', desc: 'Transmit formatted digital HTML invoice or note' },
  { id: 'send_notification', label: 'Send Notification', desc: 'In-app notification toast to salon team' },
  { id: 'create_task', label: 'Create Task', desc: 'Assign task to stylist or receptionist' },
  { id: 'create_reminder', label: 'Create Reminder', desc: 'Schedule follow-up calendar reminder' },
  { id: 'create_coupon', label: 'Create Coupon', desc: 'Generate unique promotional coupon code' },
  { id: 'add_customer_tag', label: 'Add Customer Tag', desc: 'Assign cohort tag to customer profile' },
  { id: 'add_loyalty_points', label: 'Add Loyalty Points', desc: 'Credit customer loyalty points wallet' },
]

const FIELD_OPTIONS = [
  { id: 'client.isVip', label: 'Customer Type (VIP)' },
  { id: 'client.totalSpent', label: 'Customer Lifetime Spend (₹)' },
  { id: 'client.daysSinceLastVisit', label: 'Days Since Last Visit' },
  { id: 'appointment.serviceName', label: 'Service Name' },
  { id: 'bill.grandTotal', label: 'Invoice Amount (₹)' },
  { id: 'membership.daysUntilExpiry', label: 'Days Until Membership Expiry' },
  { id: 'branch.name', label: 'Salon Branch' },
  { id: 'product.currentStock', label: 'Product On-Hand Stock' },
]

export const AutomationBuilderModal: React.FC<AutomationBuilderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRule,
}) => {
  const [name, setName] = useState(initialRule?.name || '')
  const [description, setDescription] = useState(initialRule?.description || '')
  const [trigger, setTrigger] = useState<AutomationTriggerType>(
    initialRule?.trigger || 'appointment_completed'
  )
  const [delayValue, setDelayValue] = useState<number>(initialRule?.delay.value ?? 2)
  const [delayUnit, setDelayUnit] = useState<DelayUnit>(
    initialRule?.delay.unit || 'hours'
  )
  const [logicalOperator, setLogicalOperator] = useState<'AND' | 'OR'>(
    initialRule?.conditionGroup.logicalOperator || 'AND'
  )
  const [conditions, setConditions] = useState<AutomationCondition[]>(
    initialRule?.conditionGroup.conditions || []
  )
  const [actions, setActions] = useState<WorkflowAutomationRule['actions']>(
    initialRule?.actions || [
      {
        id: 'act-1',
        type: 'send_whatsapp',
        title: 'Send Review Request WhatsApp',
        params: {
          message: 'Hi {{client.name}}, thank you for visiting Salora Salon! How was your service?',
        },
      },
    ]
  )

  const handleAddCondition = () => {
    setConditions([
      ...conditions,
      {
        id: `cond-${Date.now()}`,
        field: 'client.isVip',
        operator: 'equals',
        value: 'true',
      },
    ])
  }

  const handleRemoveCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id))
  }

  const handleAddAction = () => {
    setActions([
      ...actions,
      {
        id: `act-${Date.now()}`,
        type: 'send_notification',
        title: 'Team Notification',
        params: {
          title: 'Automated workflow notification',
        },
      },
    ])
  }

  const handleRemoveAction = (id: string) => {
    setActions(actions.filter((a) => a.id !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onSave({
      name: name.trim(),
      description: description.trim(),
      trigger,
      conditionGroup: {
        logicalOperator,
        conditions,
      },
      delay: {
        value: delayUnit === 'immediately' ? 0 : Number(delayValue),
        unit: delayUnit,
      },
      actions,
      enabled: initialRule ? initialRule.enabled : true,
    })
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialRule ? 'Edit Automation Workflow' : 'Build Custom Automation Workflow'}
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6 text-text-primary">
        {/* Visual Breadcrumb Workflow Progress Bar (Section 2) */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/5 to-surface border border-primary/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted block mb-2">
            Visual Step Sequence
          </span>
          <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold py-1">
            <span className="px-3 py-1 rounded-xl bg-primary text-white shadow-2xs whitespace-nowrap">
              1. TRIGGER: {trigger.replace('_', ' ').toUpperCase()}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="px-3 py-1 rounded-xl bg-surface border border-border text-text-primary whitespace-nowrap">
              2. DELAY: {delayUnit === 'immediately' ? 'Immediately' : `${delayValue} ${delayUnit}`}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="px-3 py-1 rounded-xl bg-surface border border-border text-text-primary whitespace-nowrap">
              3. CONDITIONS ({conditions.length})
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
            <span className="px-3 py-1 rounded-xl bg-emerald-600 text-white shadow-2xs whitespace-nowrap">
              4. ACTIONS ({actions.length})
            </span>
          </div>
        </div>

        {/* Name & Purpose */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-text-primary block mb-1">
              Workflow Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. VIP Post-Haircut Review Request"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs rounded-xl border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-text-primary block mb-1">
              Description / Business Intent
            </label>
            <input
              type="text"
              placeholder="e.g. Sends review link 2 hours post checkout"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs rounded-xl border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* STEP 1: TRIGGER */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary text-white font-bold text-[11px] flex items-center justify-center">
              1
            </span>
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Select Trigger Event
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto p-1">
            {TRIGGER_OPTIONS.map((t) => {
              const isSelected = trigger === t.id
              return (
                <div
                  key={t.id}
                  onClick={() => setTrigger(t.id)}
                  className={cn(
                    'p-2.5 rounded-xl border text-left cursor-pointer transition-all',
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary/40'
                      : 'border-border bg-surface hover:border-text-secondary/40'
                  )}
                >
                  <span className="text-xs font-bold block">{t.label}</span>
                  <span className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
                    {t.desc}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* STEP 2: DELAY */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary text-white font-bold text-[11px] flex items-center justify-center">
              2
            </span>
            <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Execution Timing / Delay
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-surface-subtle border border-border">
            <div>
              <span className="text-xs font-bold text-text-secondary block mb-1">
                Delay Mode
              </span>
              <select
                value={delayUnit}
                onChange={(e) => setDelayUnit(e.target.value as DelayUnit)}
                className="w-full text-xs font-semibold rounded-xl border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="immediately">Execute Immediately</option>
                <option value="minutes">Wait Minutes</option>
                <option value="hours">Wait Hours</option>
                <option value="days">Wait Days</option>
              </select>
            </div>

            {delayUnit !== 'immediately' && (
              <div className="sm:col-span-2">
                <span className="text-xs font-bold text-text-secondary block mb-1">
                  Wait Duration ({delayUnit})
                </span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={delayValue}
                  onChange={(e) => setDelayValue(Number(e.target.value))}
                  className="w-full text-xs font-bold rounded-xl border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            )}
          </div>
        </div>

        {/* STEP 3: CONDITIONS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-white font-bold text-[11px] flex items-center justify-center">
                3
              </span>
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Filter Conditions ({logicalOperator})
              </label>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-surface border border-border rounded-lg p-0.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setLogicalOperator('AND')}
                  className={cn(
                    'px-2 py-0.5 rounded',
                    logicalOperator === 'AND' ? 'bg-primary text-white' : 'text-text-muted'
                  )}
                >
                  AND
                </button>
                <button
                  type="button"
                  onClick={() => setLogicalOperator('OR')}
                  className={cn(
                    'px-2 py-0.5 rounded',
                    logicalOperator === 'OR' ? 'bg-primary text-white' : 'text-text-muted'
                  )}
                >
                  OR
                </button>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCondition}
                className="text-xs h-7"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Condition
              </Button>
            </div>
          </div>

          {conditions.length === 0 ? (
            <div className="p-3.5 rounded-xl border border-dashed border-border text-center text-xs text-text-muted">
              No conditions configured. Workflow executes for all triggering events.
            </div>
          ) : (
            <div className="space-y-2">
              {conditions.map((cond, index) => (
                <div
                  key={cond.id}
                  className="p-3 rounded-xl bg-surface-subtle border border-border grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-center text-xs"
                >
                  <div>
                    <select
                      value={cond.field}
                      onChange={(e) => {
                        const updated = [...conditions]
                        updated[index].field = e.target.value
                        setConditions(updated)
                      }}
                      className="w-full text-xs font-medium rounded-lg border border-border bg-surface px-2 py-1.5 text-text-primary focus:outline-none"
                    >
                      {FIELD_OPTIONS.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={cond.operator}
                      onChange={(e) => {
                        const updated = [...conditions]
                        updated[index].operator = e.target.value as any
                        setConditions(updated)
                      }}
                      className="w-full text-xs font-medium rounded-lg border border-border bg-surface px-2 py-1.5 text-text-primary focus:outline-none"
                    >
                      <option value="equals">equals</option>
                      <option value="not_equals">not equals</option>
                      <option value="greater_than">greater than</option>
                      <option value="less_than">less than</option>
                      <option value="contains">contains</option>
                      <option value="in">in list</option>
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={String(cond.value)}
                      placeholder="Comparison value"
                      onChange={(e) => {
                        const updated = [...conditions]
                        updated[index].value = e.target.value
                        setConditions(updated)
                      }}
                      className="w-full text-xs rounded-lg border border-border bg-surface px-2 py-1.5 text-text-primary focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(cond.id)}
                      className="text-text-muted hover:text-rose-600 p-1 transition-colors"
                      title="Remove condition"
                      aria-label="Remove condition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* STEP 4: ACTIONS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-white font-bold text-[11px] flex items-center justify-center">
                4
              </span>
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Configured Actions ({actions.length})
              </label>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAction}
              className="text-xs h-7"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Action
            </Button>
          </div>

          <div className="space-y-3">
            {actions.map((act, index) => (
              <div
                key={act.id}
                className="p-3.5 rounded-xl border border-border bg-surface space-y-2.5 text-xs shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <select
                      value={act.type}
                      onChange={(e) => {
                        const updated = [...actions]
                        updated[index].type = e.target.value as AutomationActionType
                        updated[index].title =
                          ACTION_OPTIONS.find((a) => a.id === e.target.value)?.label || 'Action'
                        setActions(updated)
                      }}
                      className="text-xs font-bold rounded-lg border border-border bg-surface px-2 py-1 text-primary focus:outline-none"
                    >
                      {ACTION_OPTIONS.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={act.title}
                      onChange={(e) => {
                        const updated = [...actions]
                        updated[index].title = e.target.value
                        setActions(updated)
                      }}
                      placeholder="Action label"
                      className="text-xs font-medium rounded-lg border border-border bg-surface px-2 py-1 text-text-primary"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveAction(act.id)}
                    className="text-text-muted hover:text-rose-600 p-1"
                    title="Remove action"
                    aria-label="Remove action"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Message or Parameters Template Input */}
                <div>
                  <label className="text-[11px] font-bold text-text-muted block mb-1">
                    Template / Parameters Body:
                  </label>
                  <textarea
                    rows={2}
                    value={act.params.message || act.params.title || JSON.stringify(act.params)}
                    onChange={(e) => {
                      const updated = [...actions]
                      updated[index].params = {
                        ...updated[index].params,
                        message: e.target.value,
                        title: e.target.value,
                      }
                      setActions(updated)
                    }}
                    placeholder="Enter dynamic placeholders: {{client.name}}, {{service.name}}, etc."
                    className="w-full text-xs font-mono rounded-lg border border-border bg-surface p-2 text-text-primary focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safe Actions Notice (Section 11) */}
        <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-2.5 text-xs">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-text-muted leading-relaxed">
            <span className="font-bold text-text-primary">Controlled Approval Protection:</span>{' '}
            Automations cannot automatically issue refunds, delete records, or close register drawers. Destructive operations require explicit operator confirmation.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>

          <Button type="submit" variant="primary" size="sm" className="shadow-xs">
            <Check className="w-3.5 h-3.5 mr-1.5" />
            {initialRule ? 'Save Changes' : 'Create Automation'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
