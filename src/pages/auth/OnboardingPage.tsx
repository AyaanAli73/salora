import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Scissors,
  Sparkles,
  Building,
  Image,
  MapPin,
  Clock,
  Calendar,
  Layers,
  UserPlus,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Upload,
  Plus,
  Trash2,
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useSalonStore } from '@/store/useSalonStore'
import { useToastStore } from '@/store/useToastStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/utils/cn'
import { formatCurrency } from '@/utils/formatters'

const TOTAL_STEPS = 8

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const LOGO_PRESETS = [
  { id: 'logo-1', label: 'Teal Elegance', gradient: 'from-primary to-teal-800', icon: 'Scissors' },
  { id: 'logo-2', label: 'Rose Gold', gradient: 'from-accent to-pink-700', icon: 'Sparkles' },
  { id: 'logo-3', label: 'Midnight Glam', gradient: 'from-indigo-600 to-slate-900', icon: 'Building' },
  { id: 'logo-4', label: 'Emerald Luxe', gradient: 'from-emerald-500 to-teal-800', icon: 'Layers' },
]

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate()
  const { completeOnboarding, user } = useAuthStore()
  const { onboardingData, updateOnboardingData, applyOnboardingToSalon } = useSalonStore()
  const { addToast } = useToastStore()

  const [currentStep, setCurrentStep] = useState(1)
  const [selectedLogoPreset, setSelectedLogoPreset] = useState('logo-1')
  const [isFinishing, setIsFinishing] = useState(false)

  // Step 6: new service temporary form
  const [newServiceName, setNewServiceName] = useState('')
  const [newServicePrice, setNewServicePrice] = useState('110')
  const [newServiceDuration, setNewServiceDuration] = useState('60')

  const progressPercent = Math.round((currentStep / TOTAL_STEPS) * 100)

  const handleNext = () => {
    // Basic step validation
    if (currentStep === 1 && !onboardingData.salonName.trim()) {
      addToast({
        title: 'Salon Name Required',
        message: 'Please enter a name for your salon or spa studio.',
        type: 'warning',
      })
      return
    }

    if (currentStep === 3) {
      if (!onboardingData.city.trim() || !onboardingData.phone.trim()) {
        addToast({
          title: 'Location Incomplete',
          message: 'Please provide at least a city and phone number.',
          type: 'warning',
        })
        return
      }
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleFinish = async () => {
    setIsFinishing(true)
    try {
      applyOnboardingToSalon()
      completeOnboarding()
      addToast({
        title: 'Salon Setup Complete!',
        message: `${onboardingData.salonName || 'Your salon'} is now live in SALORA.`,
        type: 'success',
      })
      navigate('/dashboard', { replace: true })
    } catch {
      addToast({
        title: 'Setup Error',
        message: 'Could not complete salon setup. Please review your settings.',
        type: 'danger',
      })
    } finally {
      setIsFinishing(false)
    }
  }

  const toggleDay = (day: string) => {
    const exists = onboardingData.workingDays.includes(day)
    const nextDays = exists
      ? onboardingData.workingDays.filter((d) => d !== day)
      : [...onboardingData.workingDays, day]
    updateOnboardingData({ workingDays: nextDays })
  }

  const addCustomService = () => {
    if (!newServiceName.trim()) return
    const newService = {
      name: newServiceName.trim(),
      price: Number(newServicePrice) || 80,
      duration: Number(newServiceDuration) || 60,
      category: 'Custom Service',
    }
    updateOnboardingData({
      services: [...onboardingData.services, newService],
    })
    setNewServiceName('')
    setNewServicePrice('90')
  }

  const removeService = (index: number) => {
    const updated = onboardingData.services.filter((_, i) => i !== index)
    updateOnboardingData({ services: updated })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between selection:bg-primary-100">
      {/* Top Header & Step Progress Bar */}
      <header className="border-b border-border bg-surface/90 backdrop-blur-md sticky top-0 z-30 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface border border-border shadow-xs p-1 shrink-0">
              <img
                src="/salora.png"
                alt="Salora"
                className="h-7 w-7 object-contain"
                width={28}
                height={28}
              />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-text-primary font-sans" translate="no">
                SALORA
              </span>
              <span className="ml-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                Salon Setup Wizard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-text-secondary tabular-nums">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary dark:bg-primary-950 dark:text-primary-300">
              {progressPercent}% Complete
            </span>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-surface-subtle h-1.5 mt-3 rounded-full overflow-hidden max-w-4xl mx-auto">
          <div
            className="bg-gradient-to-r from-primary to-accent h-full transition-[width] duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Wizard Card */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        <Card className="p-6 sm:p-10 shadow-xl border-border/80 relative overflow-hidden">
          {/* STEP 1: Salon Name */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 1</span>
                <h2 className="text-2xl font-bold tracking-tight text-text-primary">
                  What is your salon or studio name?
                </h2>
                <p className="text-xs text-text-muted leading-relaxed">
                  This brand name will appear on client booking links, appointment reminders, and guest invoices.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <Input
                  label="Salon Business Name"
                  placeholder="e.g. Luxe Sanctuary Hair & Spa Studio…"
                  value={onboardingData.salonName}
                  onChange={(e) => updateOnboardingData({ salonName: e.target.value })}
                  autoFocus
                />

                <Input
                  label="Salon Tagline or Slogan (Optional)"
                  placeholder="e.g. High-end beauty & restorative hair rituals…"
                  value={onboardingData.salonTagline}
                  onChange={(e) => updateOnboardingData({ salonTagline: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* STEP 2: Salon Logo */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 2</span>
                <h2 className="text-2xl font-bold tracking-tight text-text-primary">
                  Choose your salon emblem or upload a logo
                </h2>
                <p className="text-xs text-text-muted leading-relaxed">
                  Select a curated luxury studio monogram emblem or supply an image URL.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                {LOGO_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setSelectedLogoPreset(preset.id)
                      updateOnboardingData({ logoUrl: preset.label })
                    }}
                    className={cn(
                      'p-4 rounded-2xl border flex flex-col items-center gap-3 transition-colors',
                      selectedLogoPreset === preset.id
                        ? 'border-primary ring-2 ring-primary/20 bg-primary-50/50 dark:bg-primary-950/20'
                        : 'border-border hover:border-border-strong bg-surface'
                    )}
                  >
                    <div
                      className={cn(
                        'h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-md bg-gradient-to-tr',
                        preset.gradient
                      )}
                    >
                      <Scissors className="h-6 w-6 -rotate-45" aria-hidden="true" />
                    </div>
                    <span className="text-xs font-semibold text-text-primary">{preset.label}</span>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <Input
                  label="Or enter custom logo image URL"
                  placeholder="https://images.example.com/salon-logo.png…"
                  value={onboardingData.logoUrl}
                  onChange={(e) => updateOnboardingData({ logoUrl: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Address & Phone */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 3</span>
                <h2 className="text-2xl font-bold tracking-tight text-text-primary">
                  Where is your salon located?
                </h2>
                <p className="text-xs text-text-muted leading-relaxed">
                  Provide your studio address and concierge phone number for guest directions and notifications.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="City"
                    placeholder="e.g. Beverly Hills…"
                    value={onboardingData.city}
                    onChange={(e) => updateOnboardingData({ city: e.target.value })}
                  />

                  <Input
                    label="State / Province"
                    placeholder="e.g. CA or NY…"
                    value={onboardingData.state}
                    onChange={(e) => updateOnboardingData({ state: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Postal PIN / Zip Code"
                    placeholder="e.g. 90210…"
                    value={onboardingData.postalCode}
                    onChange={(e) => updateOnboardingData({ postalCode: e.target.value })}
                  />

                  <Input
                    label="Studio Phone Number"
                    placeholder="e.g. (310) 555-8920…"
                    type="tel"
                    value={onboardingData.phone}
                    onChange={(e) => updateOnboardingData({ phone: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Business Hours */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 4</span>
                <h2 className="text-2xl font-bold tracking-tight text-text-primary">
                  Set daily opening and closing hours
                </h2>
                <p className="text-xs text-text-muted leading-relaxed">
                  These hours determine when guests can book online appointments and stylist shifts.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <Input
                  label="Salon Opens At"
                  type="time"
                  value={onboardingData.openingTime}
                  onChange={(e) => updateOnboardingData({ openingTime: e.target.value })}
                />

                <Input
                  label="Salon Closes At"
                  type="time"
                  value={onboardingData.closingTime}
                  onChange={(e) => updateOnboardingData({ closingTime: e.target.value })}
                />
              </div>

              <div className="p-4 rounded-xl bg-surface-subtle border border-border flex items-center gap-3 text-xs text-text-secondary">
                <Clock className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                <span>
                  Default daily operating window: <strong className="text-text-primary">{onboardingData.openingTime}</strong> to{' '}
                  <strong className="text-text-primary">{onboardingData.closingTime}</strong>. You can fine-tune specific day hours anytime in Settings.
                </span>
              </div>
            </div>
          )}

          {/* STEP 5: Working Days */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 5</span>
                <h2 className="text-2xl font-bold tracking-tight text-text-primary">
                  Which days is your salon open?
                </h2>
                <p className="text-xs text-text-muted leading-relaxed">
                  Select your active salon operating days. Unchecked days will show as closed on the booking calendar.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isChecked = onboardingData.workingDays.includes(day)
                  return (
                    <label
                      key={day}
                      onClick={() => toggleDay(day)}
                      className={cn(
                        'flex items-center justify-between p-3.5 rounded-xl border cursor-pointer select-none transition-colors',
                        isChecked
                          ? 'border-primary bg-primary-50/50 dark:bg-primary-950/20 text-text-primary font-bold'
                          : 'border-border bg-surface text-text-secondary hover:border-border-strong'
                      )}
                    >
                      <span className="text-sm">{day}</span>
                      <span
                        className={cn(
                          'text-xs font-bold px-2 py-0.5 rounded-full',
                          isChecked ? 'bg-success-light text-success-fg' : 'bg-surface-subtle text-text-muted'
                        )}
                      >
                        {isChecked ? 'Open' : 'Closed'}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 6: Basic Services Setup */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 6</span>
                <h2 className="text-2xl font-bold tracking-tight text-text-primary">
                  Set up your starting treatment menu
                </h2>
                <p className="text-xs text-text-muted leading-relaxed">
                  Customize your initial service list with prices and chair durations.
                </p>
              </div>

              {/* Service list */}
              <div className="space-y-2 pt-2">
                {onboardingData.services.map((srv, idx) => (
                  <div
                    key={`${srv.name}-${idx}`}
                    className="p-3.5 rounded-xl border border-border bg-surface flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-text-primary text-sm">{srv.name}</span>
                      <p className="text-text-muted mt-0.5">
                        {srv.duration} mins • {srv.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-text-primary tabular-nums text-sm">
                        {formatCurrency(srv.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeService(idx)}
                        aria-label={`Remove service ${srv.name}`}
                        className="p-1 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add custom service form */}
              <div className="p-4 rounded-2xl bg-surface-subtle border border-border space-y-3">
                <span className="text-xs font-bold text-text-secondary uppercase">
                  Add Treatment to Menu
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    placeholder="Treatment name…"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                  />
                  <Input
                    placeholder="Price ($)…"
                    type="number"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                  />
                  <Input
                    placeholder="Duration (mins)…"
                    type="number"
                    value={newServiceDuration}
                    onChange={(e) => setNewServiceDuration(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomService}
                  leftIcon={<Plus className="h-3.5 w-3.5" />}
                >
                  Add to Menu
                </Button>
              </div>
            </div>
          )}

          {/* STEP 7: First Staff Member */}
          {currentStep === 7 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-1">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 7</span>
                <h2 className="text-2xl font-bold tracking-tight text-text-primary">
                  Add your first specialist or team member
                </h2>
                <p className="text-xs text-text-muted leading-relaxed">
                  Assign a key stylist, esthetician, or manager who will be taking client bookings.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <Input
                  label="Specialist Full Name"
                  placeholder="e.g. Camille Dupré…"
                  value={onboardingData.firstStaff.name}
                  onChange={(e) =>
                    updateOnboardingData({
                      firstStaff: { ...onboardingData.firstStaff, name: e.target.value },
                    })
                  }
                  autoFocus
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Specialist Email"
                    type="email"
                    placeholder="camille@salon.com…"
                    value={onboardingData.firstStaff.email}
                    onChange={(e) =>
                      updateOnboardingData({
                        firstStaff: { ...onboardingData.firstStaff, email: e.target.value },
                      })
                    }
                  />

                  <Input
                    label="Contact Phone"
                    type="tel"
                    placeholder="(310) 555-3211…"
                    value={onboardingData.firstStaff.phone}
                    onChange={(e) =>
                      updateOnboardingData({
                        firstStaff: { ...onboardingData.firstStaff, phone: e.target.value },
                      })
                    }
                  />
                </div>

                <Select
                  label="Primary Role / Specialty"
                  value={onboardingData.firstStaff.role}
                  onChange={(e) =>
                    updateOnboardingData({
                      firstStaff: { ...onboardingData.firstStaff, role: e.target.value },
                    })
                  }
                  options={[
                    { value: 'Master Stylist', label: 'Master Stylist' },
                    { value: 'Senior Colorist', label: 'Senior Colorist' },
                    { value: 'Nail Artist', label: 'Nail Artist' },
                    { value: 'Esthetician', label: 'Esthetician' },
                    { value: 'Salon Manager', label: 'Salon Manager' },
                  ]}
                />
              </div>
            </div>
          )}

          {/* STEP 8: Finish Setup & Launch */}
          {currentStep === 8 && (
            <div className="space-y-6 text-center py-4 animate-in fade-in duration-200">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-primary to-accent text-white flex items-center justify-center mx-auto shadow-glow-primary/40">
                <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
              </div>

              <div>
                <span className="text-xs font-bold text-accent uppercase tracking-wider">Step 8: Ready to Launch</span>
                <h2 className="text-3xl font-extrabold tracking-tight text-text-primary font-sans mt-1">
                  Your salon is configured!
                </h2>
                <p className="text-xs text-text-muted max-w-md mx-auto mt-2 leading-relaxed">
                  Congratulations <span className="font-bold text-text-primary">{user?.name}</span>. Everything is in place to begin scheduling appointments, checking in guests, and tracking revenue.
                </p>
              </div>

              {/* Summary Card */}
              <div className="p-5 rounded-2xl bg-surface-subtle border border-border text-left max-w-lg mx-auto space-y-3 text-xs">
                <div className="flex justify-between border-b border-border/80 pb-2">
                  <span className="text-text-muted">Salon Name</span>
                  <span className="font-bold text-text-primary">{onboardingData.salonName || 'Luxe Aura Studio'}</span>
                </div>
                <div className="flex justify-between border-b border-border/80 pb-2">
                  <span className="text-text-muted">Location</span>
                  <span className="font-medium text-text-primary">
                    {onboardingData.city || 'Beverly Hills'}, {onboardingData.state || 'CA'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/80 pb-2">
                  <span className="text-text-muted">Hours</span>
                  <span className="font-medium text-text-primary tabular-nums">
                    {onboardingData.openingTime} - {onboardingData.closingTime} ({onboardingData.workingDays.length} days/wk)
                  </span>
                </div>
                <div className="flex justify-between border-b border-border/80 pb-2">
                  <span className="text-text-muted">Treatment Menu</span>
                  <span className="font-medium text-text-primary">
                    {onboardingData.services.length} services configured
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">Lead Specialist</span>
                  <span className="font-medium text-text-primary">
                    {onboardingData.firstStaff.name || 'Camille Dupré'} ({onboardingData.firstStaff.role})
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleFinish}
                  isLoading={isFinishing}
                  className="shadow-glow-primary/40 px-8"
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                >
                  Launch My Salon Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* Wizard Footer Controls */}
          {currentStep < TOTAL_STEPS && (
            <div className="flex items-center justify-between pt-8 border-t border-border mt-8">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleBack}
                disabled={currentStep === 1}
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Previous
              </Button>

              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNext}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Continue
              </Button>
            </div>
          )}
        </Card>
      </main>

      {/* Footer Branding */}
      <footer className="py-4 text-center text-[11px] text-text-muted border-t border-border/50">
        SALORA Salon Suite &copy; 2026 &bull; Secure Encrypted Onboarding
      </footer>
    </div>
  )
}
