'use client'

import { useState, type KeyboardEvent } from 'react'
import { X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type TagInputProps = {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder: string
  suggestions: string[]
  invalid?: boolean
  ariaLabel: string
}

export function TagInput({
  tags,
  onChange,
  placeholder,
  suggestions,
  invalid,
  ariaLabel,
}: TagInputProps) {
  const [draft, setDraft] = useState('')

  function addTag(raw: string) {
    const value = raw.trim()
    if (!value) return
    if (tags.includes(value)) {
      setDraft('')
      return
    }
    onChange([...tags, value])
    setDraft('')
  }

  function removeTag(target: string) {
    onChange(tags.filter((t) => t !== target))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(draft)
    } else if (e.key === 'Backspace' && !draft && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const openSuggestions = suggestions.filter((s) => !tags.includes(s))

  return (
    <div className="flex flex-col gap-2.5">
      <div
        className={cn(
          'flex flex-wrap items-center gap-2 rounded-xl border bg-card px-3 py-2.5 transition-colors',
          'focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/40',
          invalid ? 'border-destructive ring-2 ring-destructive/40' : 'border-input',
        )}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-accent py-1 pl-3 pr-1.5 text-sm font-medium text-accent-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`${tag} 삭제`}
              className="flex size-5 items-center justify-center rounded-full text-accent-foreground/70 transition-colors hover:bg-primary/20 hover:text-accent-foreground active:scale-90"
            >
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addTag(draft)}
          placeholder={tags.length === 0 ? placeholder : ''}
          aria-label={ariaLabel}
          className="min-w-[7rem] flex-1 bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
        />
      </div>

      {openSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">추천</span>
          {openSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border bg-card py-1 pl-2.5 pr-2 text-xs font-medium text-muted-foreground transition-all hover:border-primary/60 hover:text-primary active:scale-95"
            >
              <Plus className="size-3" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
