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
              'rounded-full border px-4 py-2 text-sm font-medium transition-all duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
              'active:scale-[0.97]',
              selected
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-secondary',
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
