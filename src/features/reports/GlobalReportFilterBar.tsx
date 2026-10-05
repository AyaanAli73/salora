import React from 'react'
import {
  Calendar,
  Filter,
  Download,
  Printer,
  FileSpreadsheet,
  Building,
  User,
  Scissors,
  Layers,
  ChevronDown,
} from 'lucide-react'
import { ReportFilter, DateRangePreset, Staff, ServiceCategory } from '@/types'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useBranchStore } from '@/store/useBranchStore'

interface GlobalReportFilterBarProps {
  filter: ReportFilter
  onChange: (updated: ReportFilter) => void
  staffList?: Staff[]
  categories?: ServiceCategory[]
  onExportCSV: () => void
  onExportExcel: () => void
  onPrint: () => void
  reportTitle?: string
}

const PRESET_OPTIONS: { value: DateRangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
]

export const GlobalReportFilterBar: React.FC<GlobalReportFilterBarProps> = ({
  filter,
  onChange,
  staffList = [],
  categories = [],
  onExportCSV,
  onExportExcel,
  onPrint,
  reportTitle = 'Report',
}) => {
  const { branches } = useBranchStore()

  const handlePresetChange = (preset: DateRangePreset) => {
    onChange({
      ...filter,
      preset,
    })
  }

  return (
    <div className="bg-surface rounded-2xl border border-border p-4 shadow-xs space-y-4 print:hidden">
      {/* Top Row: Presets & Export Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Preset Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5 mr-1 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>Period:</span>
          </span>
          {PRESET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handlePresetChange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                filter.preset === opt.value
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-surface-hover/50 text-text-muted hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Action Buttons: Export & Print */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            className="text-xs h-8 flex items-center gap-1.5"
            title="Export standard CSV"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>CSV</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onExportExcel}
            className="text-xs h-8 flex items-center gap-1.5"
            title="Export Excel-formatted CSV with UTF-8 BOM"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
            <span>Excel</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onPrint}
            className="text-xs h-8 flex items-center gap-1.5"
            title="Print or Save as PDF"
          >
            <Printer className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>Print / PDF</span>
          </Button>
        </div>
      </div>

      {/* Bottom Row: Custom Date Inputs & Dimensional Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border">
        {/* Custom Start Date */}
        {filter.preset === 'custom' && (
          <>
            <div>
              <label htmlFor="filter-start-date" className="block text-[11px] font-semibold text-text-muted mb-1">
                Start Date
              </label>
              <input
                id="filter-start-date"
                type="date"
                value={filter.startDate}
                onChange={(e) => onChange({ ...filter, startDate: e.target.value })}
                className="w-full h-8 px-2.5 rounded-lg border border-border bg-surface text-text-primary text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="filter-end-date" className="block text-[11px] font-semibold text-text-muted mb-1">
                End Date
              </label>
              <input
                id="filter-end-date"
                type="date"
                value={filter.endDate}
                onChange={(e) => onChange({ ...filter, endDate: e.target.value })}
                className="w-full h-8 px-2.5 rounded-lg border border-border bg-surface text-text-primary text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
          </>
        )}

        {/* Branch Filter */}
        <div>
          <label htmlFor="filter-branch" className="block text-[11px] font-semibold text-text-muted mb-1">
            Salon Location
          </label>
          <select
            id="filter-branch"
            value={filter.branchId || 'all'}
            onChange={(e) => onChange({ ...filter, branchId: e.target.value })}
            className="w-full h-8 px-2.5 rounded-lg border border-border bg-surface text-text-primary text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="all">All Locations (Consolidated)</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        {/* Staff Filter */}
        <div>
          <label htmlFor="filter-staff" className="block text-[11px] font-semibold text-text-muted mb-1">
            Specialist
          </label>
          <select
            id="filter-staff"
            value={filter.staffId || 'all'}
            onChange={(e) => onChange({ ...filter, staffId: e.target.value })}
            className="w-full h-8 px-2.5 rounded-lg border border-border bg-surface text-text-primary text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="all">All Specialists</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.role})
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label htmlFor="filter-category" className="block text-[11px] font-semibold text-text-muted mb-1">
            Service Category
          </label>
          <select
            id="filter-category"
            value={filter.categoryId || 'all'}
            onChange={(e) => onChange({ ...filter, categoryId: e.target.value })}
            className="w-full h-8 px-2.5 rounded-lg border border-border bg-surface text-text-primary text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <option value="all">All Service Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
