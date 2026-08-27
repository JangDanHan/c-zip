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
        'animate-in fade-in slide-in-from-bottom-3 rounded-2xl border bg-white p-6 shadow-xs duration-500 fill-mode-both',
        isTop ? 'border-[#0066FF]/40 ring-1 ring-[#0066FF]/20' : 'border-[#CBDBF5]',
      )}
      style={{ animationDelay: `${index * 140}ms` }}
    >
      <header className="flex items-start gap-3.5">
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold',
            isTop
              ? 'bg-[#0066FF] text-white shadow-xs'
              : 'bg-[#E0E7FF] text-[#0066FF]',
          )}
        >
          {item.rank}위
        </span>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-900 text-balance">{item.name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 text-pretty">
            {item.reason}
          </p>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {item.badges.map((badge) => (
          <span
            key={badge}
            className="rounded-md bg-[#E0E7FF] px-2.5 py-1 text-xs font-semibold text-[#0066FF]"
          >
            {badge}
          </span>
        ))}
      </div>

      <div className="mt-4 rounded-lg bg-[#F8F9FF] border border-[#CBDBF5] px-3.5 py-2 text-sm font-medium text-slate-800">
        <span className="text-xs font-bold text-[#0066FF] mr-2">추천 루틴</span>
        {item.volume}
      </div>

      <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed text-[#92400E]">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#D97706]" />
        <span className="text-pretty font-medium">{item.caution}</span>
      </div>

      {item.aiTip && (
        <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-[#E0E7FF]/60 border border-[#0066FF]/20 px-3.5 py-2.5 text-xs leading-relaxed text-[#0066FF]">
          <span className="font-bold shrink-0">✨ AI 임상 팁:</span>
          <span className="text-pretty text-slate-700">{item.aiTip}</span>
        </div>
      )}
    </article>
  )
}
