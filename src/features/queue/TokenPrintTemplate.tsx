import React from 'react'
import { Token } from '@/types'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { printService } from '@/services/printService'
import { useToastStore } from '@/store/useToastStore'
import { Printer, Check, Star, AlertCircle, Clock, Sparkles } from 'lucide-react'

interface TokenPrintTemplateProps {
  isOpen: boolean
  onClose: () => void
  token: Token | null
}

export const TokenPrintTemplate: React.FC<TokenPrintTemplateProps> = ({
  isOpen,
  onClose,
  token,
}) => {
  const { addToast } = useToastStore()

  if (!token) return null

  const settings = printService.getSettings()

  const handlePrint = async () => {
    const success = await printService.printToken(token)
    if (success) {
      addToast({
        title: 'Token Printed',
        message: `Token ${token.displayNumber} sent to thermal printer.`,
        type: 'success',
      })
      onClose()
    } else {
      addToast({
        title: 'Printing Failed',
        message: 'Could not send token to printer.',
        type: 'danger',
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Token Print Preview"
      description={`Thermal Paper Output (${settings.paperSize})`}
      size="sm"
    >
      <div className="space-y-4">
        {/* Realistic Thermal Receipt Paper Container */}
        <div className="mx-auto w-full max-w-[280px] bg-white text-zinc-950 p-5 rounded-lg shadow-md border border-zinc-200 font-mono text-center select-none relative overflow-hidden">
          {/* Top Paper Serration */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:6px_6px]" />

          {/* Logo & Header */}
          {settings.showLogo && (
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-base tracking-widest uppercase">SALORA</h3>
              <p className="text-[10px] text-zinc-600 font-sans tracking-tight">
                Salon & Spa Management System
              </p>
            </div>
          )}

          <div className="border-t border-dashed border-zinc-400 my-3" />

          {/* Priority Callout */}
          {token.priority === 'VIP' && (
            <div className="inline-block border border-zinc-900 px-2 py-0.5 text-[10px] font-bold tracking-wider mb-1 uppercase">
              ★ VIP Priority ★
            </div>
          )}
          {token.priority === 'EMERGENCY' && (
            <div className="inline-block border border-zinc-900 px-2 py-0.5 text-[10px] font-bold tracking-wider mb-1 uppercase">
              ● Express Pass ●
            </div>
          )}

          <div className="text-[11px] font-bold tracking-widest uppercase text-zinc-700">
            TOKEN NUMBER
          </div>

          {/* Huge Token Number */}
          <div className="text-5xl font-black tracking-tight text-zinc-950 my-1 font-sans">
            {token.displayNumber}
          </div>

          <div className="border-t border-dashed border-zinc-400 my-3" />

          {/* Client & Service */}
          <div className="space-y-1">
            {settings.showCustomerName && (
              <p className="font-bold text-sm text-zinc-900 font-sans">{token.clientName}</p>
            )}
            {settings.showService && (
              <p className="text-xs font-semibold text-zinc-700">{token.serviceName}</p>
            )}
          </div>

          {/* Details */}
          <div className="mt-3 text-[11px] text-zinc-600 space-y-0.5 font-sans">
            {settings.showTime && (
              <div>
                Time: {new Date(token.checkedInAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </div>
            )}
            {settings.showStaffName && token.staffName && (
              <div>Specialist: <strong className="text-zinc-900">{token.staffName}</strong></div>
            )}
            {token.estimatedWaitMinutes ? (
              <div className="font-semibold text-zinc-800">
                Est. Wait: ~{token.estimatedWaitMinutes} min
              </div>
            ) : null}
          </div>

          <div className="border-t border-dashed border-zinc-400 my-3" />

          {/* Footer instruction */}
          <p className="text-[10px] text-zinc-500 italic">
            {settings.customFooterText || 'Please wait for your turn.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="h-4 w-4" />}
            className="shadow-glow-primary/30"
          >
            Print Thermal Token
          </Button>
        </div>
      </div>
    </Modal>
  )
}
