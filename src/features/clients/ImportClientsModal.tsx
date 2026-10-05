import React, { useState } from 'react'
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Download,
  Check,
  RefreshCw,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Client } from '@/types'
import { clientService } from '@/services/clientService'
import { cn } from '@/utils/cn'

interface ImportClientsModalProps {
  isOpen: boolean
  onClose: () => void
  onImportComplete: () => void
}

type Step = 'upload' | 'preview' | 'mapping' | 'validation' | 'importing' | 'success'

interface SampleImportRow {
  name: string
  phone: string
  email: string
  gender: string
  notes: string
}

const mockParsedRows: SampleImportRow[] = [
  {
    name: 'Kavita Chawla',
    phone: '+91 98200 44101',
    email: 'kavita.c@gmail.com',
    gender: 'female',
    notes: 'Prefers ammonia-free hair dyes, regular customer.',
  },
  {
    name: 'Arjun Singhal',
    phone: '+91 97110 99823',
    email: 'arjun.singhal@capital.in',
    gender: 'male',
    notes: 'Beard trim & skin hydration every month.',
  },
  {
    name: 'Meera Nair',
    phone: '+91 99401 55210',
    email: 'meera.nair@voyage.org',
    gender: 'female',
    notes: 'Bridal package consultation attendee.',
  },
  {
    name: 'David Wilson',
    phone: '+91 98450 12099',
    email: 'david.w@glamour.com',
    gender: 'male',
    notes: 'Expat client, prefers English consultations.',
  },
]

export const ImportClientsModal: React.FC<ImportClientsModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [step, setStep] = useState<Step>('upload')
  const [fileName, setFileName] = useState('clients_export_sample.csv')
  const [fileSize, setFileSize] = useState('24 KB')
  const [isDragging, setIsDragging] = useState(false)
  const [importProgress, setImportProgress] = useState(0)

  // Column mapping state
  const [mapping, setMapping] = useState({
    name: 'Full Name',
    phone: 'Phone Number',
    email: 'Email Address',
    gender: 'Gender',
    notes: 'Stylist Notes',
  })

  const resetModal = () => {
    setStep('upload')
    setImportProgress(0)
  }

  const handleClose = () => {
    resetModal()
    onClose()
  }

  const handleSimulateUpload = () => {
    setStep('preview')
  }

  const handleStartImport = async () => {
    setStep('importing')
    setImportProgress(15)

    const timer1 = setTimeout(() => setImportProgress(55), 300)
    const timer2 = setTimeout(() => setImportProgress(85), 600)
    const timer3 = setTimeout(async () => {
      setImportProgress(100)
      // Call service layer to actually import clients
      const clientsToCreate: Partial<Client>[] = mockParsedRows.map((row) => ({
        fullName: row.name,
        firstName: row.name.split(' ')[0],
        lastName: row.name.split(' ').slice(1).join(' '),
        phone: row.phone,
        email: row.email,
        gender: row.gender as any,
        notes: row.notes,
        status: 'new',
        tags: ['CSV Import'],
      }))

      await clientService.importClients(clientsToCreate)
      setStep('success')
      onImportComplete()
    }, 1000)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Clients Database"
      description="Batch upload clients via CSV or Excel spreadsheet into SALORA."
      size="lg"
    >
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          {[
            { id: 'upload', label: '1. Upload' },
            { id: 'preview', label: '2. Preview' },
            { id: 'mapping', label: '3. Mapping' },
            { id: 'validation', label: '4. Validate' },
            { id: 'success', label: '5. Success' },
          ].map((s) => {
            const isDone =
              (s.id === 'upload' && step !== 'upload') ||
              (s.id === 'preview' && ['mapping', 'validation', 'importing', 'success'].includes(step)) ||
              (s.id === 'mapping' && ['validation', 'importing', 'success'].includes(step)) ||
              (s.id === 'validation' && ['importing', 'success'].includes(step)) ||
              (s.id === 'success' && step === 'success')

            const isCurrent = step === s.id || (step === 'importing' && s.id === 'validation')

            return (
              <span
                key={s.id}
                className={cn(
                  'text-xs font-bold transition-[color]',
                  isCurrent
                    ? 'text-primary'
                    : isDone
                    ? 'text-text-primary'
                    : 'text-text-muted'
                )}
              >
                {s.label}
              </span>
            )
          })}
        </div>

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                handleSimulateUpload()
              }}
              onClick={handleSimulateUpload}
              className={cn(
                'border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-3',
                isDragging
                  ? 'border-primary bg-primary-50/20'
                  : 'border-border hover:border-primary/50 hover:bg-surface-subtle/50'
              )}
            >
              <div className="h-14 w-14 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary flex items-center justify-center shadow-xs">
                <FileSpreadsheet className="h-7 w-7" aria-hidden="true" />
              </div>

              <div className="flex flex-col gap-1 max-w-sm">
                <span className="text-sm font-bold text-text-primary">
                  Click or drag CSV / Excel file to upload
                </span>
                <span className="text-xs text-text-muted">
                  Supports .csv, .xlsx, .xls formatted customer contact spreadsheets
                </span>
              </div>

              <Button variant="outline" size="sm" className="mt-2">
                Browse Files
              </Button>
            </div>

            {/* Template Download Prompt */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-subtle border border-border text-xs">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                <span className="text-text-secondary font-medium">
                  Need the standard format? Download the sample client template.
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const csv = clientService.exportToCsv()
                  const blob = new Blob([csv], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'SALORA_Client_Template.csv'
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="text-primary font-bold shrink-0"
              >
                Download Template
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-text-muted">
                Detected File: <strong className="text-text-primary">{fileName}</strong> ({fileSize})
              </span>
              <span className="font-bold text-success flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>4 rows ready for mapping</span>
              </span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border/80 bg-surface-subtle font-bold text-text-muted">
                    <th className="py-2.5 px-3">Name</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Gender</th>
                    <th className="py-2.5 px-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {mockParsedRows.map((r, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3 font-semibold text-text-primary">{r.name}</td>
                      <td className="py-2.5 px-3 tabular-nums text-text-secondary">{r.phone}</td>
                      <td className="py-2.5 px-3 text-text-secondary">{r.email}</td>
                      <td className="py-2.5 px-3 capitalize text-text-muted">{r.gender}</td>
                      <td className="py-2.5 px-3 truncate max-w-xs text-text-muted">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep('mapping')}
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Proceed to Column Mapping
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: COLUMN MAPPING */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <p className="text-xs text-text-muted">
              Map the columns from your uploaded spreadsheet to the required SALORA client fields.
            </p>

            <div className="space-y-3">
              {[
                { SALORAField: 'Full Name *', mappedTo: 'Full Name' },
                { SALORAField: 'Phone Number *', mappedTo: 'Phone Number' },
                { SALORAField: 'Email Address *', mappedTo: 'Email Address' },
                { SALORAField: 'Gender', mappedTo: 'Gender' },
                { SALORAField: 'Notes & Preferences', mappedTo: 'Stylist Notes' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-text-primary">{item.SALORAField}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-muted">maps to &rarr;</span>
                    <span className="font-semibold text-primary px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/60 border border-primary/20">
                      {item.mappedTo}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep('preview')}>
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep('validation')}
                rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
              >
                Validate Records
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: VALIDATION & IMPORTING */}
        {(step === 'validation' || step === 'importing') && (
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-success-light/30 border border-success/30 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" aria-hidden="true" />
              <div className="text-xs">
                <span className="font-bold text-text-primary block">
                  Validation Succeeded — 4 Records Ready
                </span>
                <span className="text-text-muted">
                  All required columns have valid values. No duplicates or formatted errors found.
                </span>
              </div>
            </div>

            {step === 'importing' ? (
              <div className="space-y-2 py-4 text-center">
                <div className="flex justify-between text-xs font-semibold text-text-primary">
                  <span>Importing clients to salon database…</span>
                  <span className="tabular-nums">{importProgress}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-surface-subtle overflow-hidden border border-border/60">
                  <div
                    className="h-full bg-primary transition-[width] duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-2">
                <Button variant="outline" size="sm" onClick={() => setStep('mapping')}>
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleStartImport}
                  leftIcon={<Check className="h-3.5 w-3.5" />}
                >
                  Import 4 Clients Now
                </Button>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: SUCCESS */}
        {step === 'success' && (
          <div className="py-6 text-center flex flex-col items-center justify-center gap-3">
            <div className="h-14 w-14 rounded-full bg-success-light text-success flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="text-base font-bold text-text-primary">
                Clients Successfully Imported!
              </h3>
              <p className="text-xs text-text-muted">
                4 client records have been added to your SALORA database with tags and profile details.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleClose}
              className="mt-2"
            >
              Done & View All Clients
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
