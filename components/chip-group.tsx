'use client'

import { cn } from '@/lib/utils'

type ChipGroupProps<T extends string> = {
  options: readonly T[]
  value: T | null
  onChange: (value: T) => void
  invalid?: boolean
  ariaLabel: string
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  invalid,
  ariaLabel,
}: ChipGroupProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'flex flex-wrap gap-2 rounded-xl',
        invalid && 'p-2 ring-2 ring-destructive/70 ring-offset-2 ring-offset-card',
      )}
    >
      {options.map((option) => {
        const selected = option === value
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option)}
            className={cn(
              'rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              'active:scale-[0.98]',
              selected
                ? 'border-primary bg-primary text-primary-foreground shadow-xs font-semibold'
                : 'border-[#E0E0E0] bg-white text-foreground hover:border-primary/50 hover:bg-[#F8F9FF]',
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
