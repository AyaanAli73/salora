import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, ArrowRight, Clock, Crown } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Client } from '@/types'
import { formatDate } from '@/utils/formatters'
import { cn } from '@/utils/cn'

interface RecentClientsWidgetProps {
  clients: Client[]
  className?: string
}

export const RecentClientsWidget: React.FC<RecentClientsWidgetProps> = ({
  clients,
  className,
}) => {
  const navigate = useNavigate()

  return (
    <Card className={cn('flex flex-col justify-between', className)}>
      <div>
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Clients</CardTitle>
              <CardDescription>Recently checked-in salon patrons</CardDescription>
            </div>
            <Link
              to="/clients"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pt-3 pb-3">
          {clients.length === 0 ? (
            <div className="py-6 text-center text-xs text-text-muted">
              No recent clients found.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {clients.slice(0, 5).map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/clients/${c.id}`)}
                  className="py-2.5 flex items-center justify-between gap-3 group hover:bg-surface-subtle/50 px-2 rounded-xl transition-[background-color] cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar name={c.fullName} src={c.avatarUrl} size="sm" />
                      {c.isVip && (
                        <div
                          className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-accent text-white flex items-center justify-center text-[8px]"
                          title="VIP"
                        >
                          ★
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-text-primary group-hover:text-primary transition-[color] truncate">
                        {c.fullName}
                      </span>
                      <span className="text-[11px] text-text-muted truncate">
                        {c.favoriteService || c.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[10px] text-text-muted tabular-nums">
                      {c.lastVisitDate ? formatDate(c.lastVisitDate) : 'New'}
                    </span>
                    <span className="text-[10px] font-semibold text-text-secondary mt-0.5">
                      {c.totalVisits} visits
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="pt-1 pb-3">
        <Link
          to="/clients"
          className="w-full text-center text-xs font-semibold text-text-secondary hover:text-primary transition-[color] py-1"
        >
          Explore Client Directory &rarr;
        </Link>
      </CardFooter>
    </Card>
  )
}
