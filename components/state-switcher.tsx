'use client'

import { useState } from 'react'
import { FlaskConical, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PreviewKey =
  | 'initial'
  | 'loading'
  | 'result'
  | 'err-missing'
  | 'err-broad'
  | 'err-narrow'
  | 'empty'

const ITEMS: { key: PreviewKey; label: string }[] = [
  { key: 'initial', label: '초기' },
  { key: 'loading', label: '로딩' },
  { key: 'result', label: '결과' },
  { key: 'err-missing', label: '미입력' },
  { key: 'err-broad', label: '범위 넓음' },
  { key: 'err-narrow', label: '범위 좁음' },
  { key: 'empty', label: '결과 없음' },
]

export function StateSwitcher({
  active,
  onSelect,
}: {
  active: PreviewKey | null
  onSelect: (key: PreviewKey) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(15rem,calc(100vw-2rem))]">
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-foreground"
        >
          <FlaskConical className="size-4 text-primary" />
          UI 상태 미리보기
          <ChevronDown
            className={cn('ml-auto size-4 text-muted-foreground transition-transform', open && 'rotate-180')}
          />
        </button>
        {open && (
          <div className="grid grid-cols-2 gap-1.5 border-t border-border p-2">
            {ITEMS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onSelect(item.key)}
                className={cn(
                  'rounded-lg px-2 py-2 text-xs font-medium transition-colors',
                  active === item.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent',
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
