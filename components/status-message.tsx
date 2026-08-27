'use client'

import { Info, CircleAlert, SearchX, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StatusVariant = 'loading' | 'error' | 'hint' | 'empty'

const VARIANT_STYLE: Record<
  StatusVariant,
  { box: string; icon: typeof Info; iconColor?: string }
> = {
  loading: {
    box: 'bg-secondary text-secondary-foreground border-transparent',
    icon: Loader2,
  },
  error: {
    box: 'border-destructive/30 text-destructive',
    icon: CircleAlert,
  },
  hint: {
    box: 'border-transparent',
    icon: Info,
  },
  empty: {
    box: 'bg-muted text-muted-foreground border-transparent',
    icon: SearchX,
  },
}

export function StatusMessage({
  variant,
  message,
  suggestions,
  onSuggestion,
}: {
  variant: StatusVariant
  message: string
  suggestions?: string[]
  onSuggestion?: (value: string) => void
}) {
  const style = VARIANT_STYLE[variant]
  const Icon = style.icon

  const inlineStyle =
    variant === 'error'
      ? { backgroundColor: 'color-mix(in oklab, var(--destructive) 8%, var(--card))' }
      : variant === 'hint'
        ? {
            backgroundColor: 'var(--warning-bg)',
            color: 'var(--warning-foreground)',
          }
        : undefined

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'animate-in fade-in slide-in-from-top-1 rounded-lg border px-4 py-3 text-sm duration-300',
        style.box,
      )}
      style={inlineStyle}
    >
      <div className="flex items-start gap-2.5">
        <Icon
          className={cn('mt-0.5 size-4 shrink-0', variant === 'loading' && 'animate-spin text-[#0066FF]')}
          style={variant === 'hint' ? { color: 'var(--warning)' } : undefined}
        />
        <span className="font-medium leading-relaxed text-pretty">{message}</span>
      </div>

      {suggestions && suggestions.length > 0 && onSuggestion && (
        <div className="mt-2.5 flex flex-wrap gap-1.5 pl-6">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggestion(s)}
              className="rounded-lg border border-current/30 bg-white px-3 py-1 text-xs font-semibold shadow-xs transition-all hover:bg-slate-50 active:scale-95"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
