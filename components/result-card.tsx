'use client'

import { TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Recommendation } from '@/lib/workout-data'

export function ResultCard({
  item,
  index,
}: {
  item: Recommendation
  index: number
}) {
  const isTop = item.rank === 1

  return (
    <article
      className={cn(
        'animate-in fade-in slide-in-from-bottom-3 rounded-2xl border bg-card p-5 shadow-sm duration-500 fill-mode-both',
        isTop ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border',
      )}
      style={{ animationDelay: `${index * 140}ms` }}
    >
      <header className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
            isTop
              ? 'bg-[--color-rank-gold] text-primary-foreground shadow'
              : 'bg-secondary text-secondary-foreground',
          )}
          style={isTop ? { backgroundColor: 'var(--rank-gold)' } : undefined}
        >
          {item.rank}위
        </span>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-foreground text-balance">{item.name}</h3>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground text-pretty">
            {item.reason}
          </p>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {item.badges.map((badge) => (
          <span
            key={badge}
            className="rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
          >
            {badge}
          </span>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-muted px-3 py-2 text-sm font-medium text-foreground">
        {item.volume}
      </div>

      <div
        className="mt-2 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm leading-relaxed"
        style={{ backgroundColor: 'var(--warning-bg)', color: 'var(--warning-foreground)' }}
      >
        <TriangleAlert className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--warning)' }} />
        <span className="text-pretty">{item.caution}</span>
      </div>

      {item.aiTip && (
        <div className="mt-2 flex items-start gap-2 rounded-xl bg-primary/5 border border-primary/20 px-3 py-2 text-xs leading-relaxed text-primary">
          <span className="font-semibold shrink-0">✨ AI 코칭 팁:</span>
          <span className="text-pretty">{item.aiTip}</span>
        </div>
      )}
    </article>
  )
}
