import React from 'react'
import {
  CreditCard,
  QrCode,
  MessageSquare,
  Smartphone,
  Mail,
  Calendar,
  Printer,
  HardDrive,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Settings,
  Play,
  Unplug,
  ShieldCheck,
  FileText,
  Ticket,
} from 'lucide-react'
import { IntegrationItem, IntegrationStatus } from '@/types'
import { cn } from '@/utils/cn'

interface IntegrationCardProps {
  integration: IntegrationItem
  onConnect: (item: IntegrationItem) => void
  onConfigure: (item: IntegrationItem) => void
  onTest: (item: IntegrationItem, mode?: 'token' | 'invoice') => void
  onDisconnect: (item: IntegrationItem) => void
}

const ICON_MAP: Record<string, React.ReactNode> = {
  CreditCard: <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />,
  QrCode: <QrCode className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />,
  MessageSquare: <MessageSquare className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />,
  Smartphone: <Smartphone className="h-5 w-5 text-sky-600 dark:text-sky-400" aria-hidden="true" />,
  Mail: <Mail className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />,
  Calendar: <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />,
  Printer: <Printer className="h-5 w-5 text-violet-600 dark:text-violet-400" aria-hidden="true" />,
  HardDrive: <HardDrive className="h-5 w-5 text-teal-600 dark:text-teal-400" aria-hidden="true" />,
  Activity: <Activity className="h-5 w-5 text-rose-600 dark:text-rose-400" aria-hidden="true" />,
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  payments: { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-100 dark:border-indigo-800/40' },
  whatsapp: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-100 dark:border-emerald-800/40' },
  sms: { bg: 'bg-sky-50 dark:bg-sky-950/40', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-100 dark:border-sky-800/40' },
  email: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-100 dark:border-amber-800/40' },
  calendar: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-100 dark:border-blue-800/40' },
  printing: { bg: 'bg-violet-50 dark:bg-violet-950/40', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-100 dark:border-violet-800/40' },
  storage: { bg: 'bg-teal-50 dark:bg-teal-950/40', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-100 dark:border-teal-800/40' },
  analytics: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-100 dark:border-rose-800/40' },
}

export const IntegrationCard: React.FC<IntegrationCardProps> = ({
  integration,
  onConnect,
  onConfigure,
  onTest,
  onDisconnect,
}) => {
  const isConnected = integration.status === 'connected'
  const isError = integration.status === 'error'
  const catTheme = CATEGORY_COLORS[integration.category] || CATEGORY_COLORS.payments

  return (
    <article
      className={cn(
        'group relative flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition-all duration-200 hover:shadow-md dark:bg-gray-900',
        isConnected
          ? 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
          : isError
          ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10'
          : 'border-dashed border-gray-200 dark:border-gray-800 opacity-90 hover:opacity-100'
      )}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors',
                catTheme.bg,
                catTheme.border
              )}
            >
              {ICON_MAP[integration.iconName] || <ExternalLink className="h-5 w-5 text-gray-500" aria-hidden="true" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white text-base leading-tight">
                  {integration.name}
                </h3>
                {integration.isProtected && (
                  <span
                    title="Credentials secured by backend vault masking"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded-sm"
                  >
                    <ShieldCheck className="h-3 w-3" aria-hidden="true" />
                    Vaulted
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                {integration.provider} • <span className="capitalize">{integration.category}</span>
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
                Connected
              </span>
            ) : isError ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                Error
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400 dark:bg-gray-500" aria-hidden="true" />
                Not Connected
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="mt-3.5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-2">
          {integration.description}
        </p>

        {/* Dynamic Metrics / Parameters Pills */}
        {integration.metrics && Object.keys(integration.metrics).length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-gray-50/80 p-2.5 text-xs dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
            {Object.entries(integration.metrics).map(([key, val]) => (
              <div key={key} className="min-w-0">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 truncate">
                  {key}
                </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200 truncate block mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {val}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-3.5 border-t border-gray-100 dark:border-gray-800/80 flex flex-wrap items-center justify-between gap-2">
        {!isConnected ? (
          <button
            type="button"
            onClick={() => onConnect(integration)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-colors cursor-pointer"
          >
            <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            Connect {integration.name.split(' ')[0]}
          </button>
        ) : (
          <>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onConfigure(integration)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer"
              >
                <Settings className="h-3.5 w-3.5 text-gray-500 dark:text-gray-400" aria-hidden="true" />
                Configure
              </button>

              {integration.category === 'printing' ? (
                <>
                  <button
                    type="button"
                    onClick={() => onTest(integration, 'token')}
                    title="Test 58mm thermal queue token print"
                    className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-colors cursor-pointer"
                  >
                    <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
                    Test Token
                  </button>
                  <button
                    type="button"
                    onClick={() => onTest(integration, 'invoice')}
                    title="Test 80mm or A4 tax invoice print"
                    className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 dark:border-violet-900/40 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-900/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-colors cursor-pointer"
                  >
                    <FileText className="h-3.5 w-3.5" aria-hidden="true" />
                    Test Invoice
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onTest(integration)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-xs hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors cursor-pointer"
                >
                  <Play className="h-3 w-3 fill-current text-primary" aria-hidden="true" />
                  Test
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDisconnect(integration)}
              aria-label={`Disconnect ${integration.name}`}
              title="Disconnect Integration"
              className="inline-flex items-center gap-1 rounded-lg p-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 transition-colors cursor-pointer"
            >
              <Unplug className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Disconnect</span>
            </button>
          </>
        )}
      </div>
    </article>
  )
}
