import React from 'react'
import { Link } from 'react-router-dom'
import { Star, MessageSquareHeart, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Review } from '@/types'
import { cn } from '@/utils/cn'

interface RecentReviewsCardProps {
  reviews: Review[]
  className?: string
}

export const RecentReviewsCard: React.FC<RecentReviewsCardProps> = ({
  reviews,
  className,
}) => {
  return (
    <Card className={cn('flex flex-col justify-between', className)}>
      <div>
        <CardHeader className="pb-3 border-b border-border/60">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Recent Reviews</CardTitle>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                    <Star className="h-3 w-3 fill-amber-500 text-amber-500" aria-hidden="true" />
                    <span className="tabular-nums">
                      {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
              <CardDescription>Verified guest feedback & experiences</CardDescription>
            </div>
            <Link
              to="/reports"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              <span>View Reports</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </CardHeader>

        <CardContent className="pt-3 pb-3">
          {reviews.length === 0 ? (
            <div className="py-8 text-center text-xs text-text-muted">
              No reviews collected yet
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {reviews.slice(0, 3).map((rev) => (
                <div
                  key={rev.id}
                  className="py-3 flex flex-col gap-2 group hover:bg-surface-subtle/40 px-2 rounded-xl transition-[background-color]"
                >
                  {/* Reviewer Header: Avatar, Name, Rating, Relative Date */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar name={rev.clientName || 'Guest'} src={rev.avatarUrl} size="sm" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-text-primary truncate">
                          {rev.clientName || 'Valued Guest'}
                        </span>
                        {rev.serviceName && (
                          <span className="text-[11px] text-text-muted truncate">
                            {rev.serviceName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'h-3 w-3',
                            i < Math.floor(rev.rating)
                              ? 'text-amber-500 fill-amber-500'
                              : 'text-border fill-border'
                          )}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-xs text-text-secondary line-clamp-2 italic leading-relaxed pl-1 border-l-2 border-primary/30">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </div>

      <CardFooter className="pt-1 pb-3">
        <Link
          to="/reports"
          className="w-full text-center text-xs font-semibold text-text-secondary hover:text-primary transition-[color] py-1"
        >
          Explore All Guest Reviews & CSAT &rarr;
        </Link>
      </CardFooter>
    </Card>
  )
}
