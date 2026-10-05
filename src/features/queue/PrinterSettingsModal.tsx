import React, { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { PrinterSettings } from '@/types'
import { printService } from '@/services/printService'
import { useToastStore } from '@/store/useToastStore'
import { Printer, Sliders, CheckCircle2, RotateCcw } from 'lucide-react'

interface PrinterSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

export const PrinterSettingsModal: React.FC<PrinterSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addToast } = useToastStore()
  const [settings, setSettings] = useState<PrinterSettings>(printService.getSettings())
  const [isTesting, setIsTesting] = useState(false)

  const handleToggle = (key: keyof PrinterSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = () => {
    printService.saveSettings(settings)
    addToast({
      title: 'Printer Settings Saved',
      message: `Thermal format set to ${settings.paperSize} with auto-print ${settings.autoPrint ? 'enabled' : 'disabled'}.`,
      type: 'success',
    })
    onClose()
  }

  const handleTestPrint = async () => {
    setIsTesting(true)
    try {
      printService.saveSettings(settings)
      await printService.testPrint()
      addToast({
        title: 'Test Slip Triggered',
        message: 'Sent sample token slip to printer.',
        type: 'info',
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Thermal Printer Settings"
      description="Configure hardware paper roll format, auto-print triggers, and ticket layout fields."
      size="md"
    >
      <div className="space-y-5">
        {/* Paper Size selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
            Receipt Paper Size
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, paperSize: '58mm' }))}
              className={`p-3 rounded-xl border text-xs font-bold transition-all text-left space-y-1 ${
                settings.paperSize === '58mm'
                  ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <p className="text-sm font-bold">58mm (2-inch)</p>
              <p className="text-[11px] font-normal text-text-muted">
                Standard compact thermal roll (POS-58)
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSettings((s) => ({ ...s, paperSize: '80mm' }))}
              className={`p-3 rounded-xl border text-xs font-bold transition-all text-left space-y-1 ${
                settings.paperSize === '80mm'
                  ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                  : 'border-border bg-surface text-text-secondary hover:bg-surface-hover'
              }`}
            >
              <p className="text-sm font-bold">80mm (3-inch)</p>
              <p className="text-[11px] font-normal text-text-muted">
                Wide receipt printer (Epson / Star Micronics)
              </p>
            </button>
          </div>
        </div>

        {/* Auto-print toggle */}
        <div className="p-3.5 rounded-xl border border-border bg-surface-subtle flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-text-primary">
              Auto-Print on Customer Check-In
            </p>
            <p className="text-[11px] text-text-muted">
              Automatically trigger thermal print whenever a token is created
            </p>
          </div>
          <button
            type="button"
            aria-label="Toggle auto-print on check-in"
            onClick={() => handleToggle('autoPrint')}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              settings.autoPrint ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                settings.autoPrint ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Layout Fields checkboxes */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-text-muted">
            Printed Ticket Elements
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { key: 'showLogo', label: 'Salon Logo & Header' },
              { key: 'showCustomerName', label: 'Customer Name' },
              { key: 'showStaffName', label: 'Assigned Specialist' },
              { key: 'showService', label: 'Treatment Service' },
              { key: 'showTime', label: 'Date & Check-in Time' },
              { key: 'showTokenNumber', label: 'Large Token Number' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-surface cursor-pointer hover:bg-surface-hover"
              >
                <input
                  type="checkbox"
                  checked={Boolean((settings as any)[item.key])}
                  onChange={() => handleToggle(item.key as keyof PrinterSettings)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="font-medium text-text-primary text-xs">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Test Print & Action Footer */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTestPrint}
            isLoading={isTesting}
            leftIcon={<Printer className="h-4 w-4" />}
          >
            Test Print Token
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
