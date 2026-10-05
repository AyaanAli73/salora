import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  Clock,
  User,
  Scissors,
  ArrowRight,
  Info,
  Phone,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import { PotentialRebookingClient } from '@/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatDate } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface RebookingListTableProps {
  clients: PotentialRebookingClient[]
  onOpenClientProfile?: (clientId: string) => void
}

export const RebookingListTable: React.FC<RebookingListTableProps> = ({
  clients,
  onOpenClientProfile,
}) => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'overdue'>('all')

  const filtered = clients.filter((c) => {
    const matchesSearch =
      c.clientName.toLowerCase().includes(search.toLowerCase()) ||
      c.lastService.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
    const matchesStatus = statusFilter === 'all' || c.dueStatus === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <Card id="rebooking" className="space-y-4">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Customer Rebooking Readiness Candidates
              </CardTitle>
              <Badge variant="warning" className="text-[10px]">
                Rule-based Estimate
              </Badge>
            </div>
            <CardDescription className="mt-1">
              Estimated repeat schedule calculated from individual historical visit cadences.
              <span className="font-semibold text-text-secondary ml-1">
                (Does not imply guaranteed customer booking intent.)
              </span>
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-text-muted">
              {filtered.length} candidates
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search candidate by name or service…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs rounded-xl border border-border bg-surface pl-9 pr-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto w-full sm:w-auto">
            {(['all', 'due', 'overdue'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize',
                  statusFilter === st
                    ? 'bg-primary text-white shadow-2xs'
                    : 'bg-surface-subtle text-text-secondary hover:text-text-primary'
                )}
              >
                {st === 'all' ? 'All Candidates' : st}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-text-muted">
            No rebooking candidates match the active search or filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-y border-border bg-surface-subtle text-text-muted font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Last Service</th>
                  <th className="py-3 px-4">Typical Interval</th>
                  <th className="py-3 px-4">Current Elapsed</th>
                  <th className="py-3 px-4">Model Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((item) => (
                  <tr
                    key={item.clientId}
                    className="hover:bg-surface-subtle/60 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {item.clientName.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-text-primary block">
                            {item.clientName}
                          </span>
                          <span className="text-[11px] text-text-muted flex items-center gap-1">
                            <Phone className="w-3 h-3 text-text-muted" />
                            {item.phone}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Scissors className="w-3.5 h-3.5 text-primary shrink-0" />
                        <div>
                          <span className="font-semibold text-text-primary block">
                            {item.lastService}
                          </span>
                          <span className="text-[10px] text-text-muted block">
                            {item.lastVisitDate ? formatDate(item.lastVisitDate) : 'Past visit'}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-text-secondary tabular-nums">
                        {item.typicalIntervalDays} days
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'font-bold tabular-nums',
                            item.dueStatus === 'overdue' ? 'text-rose-600' : 'text-amber-600'
                          )}
                        >
                          {item.daysSinceLastVisit} days
                        </span>
                        <span className="text-[10px] text-text-muted">
                          (+{Math.max(0, item.daysSinceLastVisit - item.typicalIntervalDays)}d)
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <Badge
                        variant={item.dueStatus === 'overdue' ? 'danger' : 'warning'}
                        className="text-[10px] capitalize"
                      >
                        {item.dueStatus}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link to={`/clients/${item.clientId}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7.5 px-2.5 hover:border-primary"
                        >
                          <span>View Client</span>
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
