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
          'flex flex-wrap items-center gap-2 rounded-lg border bg-white px-3.5 py-2.5 transition-all duration-200',
          'focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
          invalid ? 'border-destructive ring-2 ring-destructive/40' : 'border-[#E0E0E0]',
        )}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-lg bg-[#E0E7FF] py-1 pl-2.5 pr-1.5 text-xs font-semibold text-[#0066FF]"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`${tag} 삭제`}
              className="flex size-4 items-center justify-center rounded-md text-[#0066FF]/70 transition-colors hover:bg-primary/20 hover:text-[#0066FF] active:scale-90"
            >
              <X className="size-3" />
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
          className="min-w-[7rem] flex-1 bg-transparent py-1 text-sm text-foreground outline-none placeholder:text-[#94A3B8]"
        />
      </div>

      {openSuggestions.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">자주 선택하는 제약:</span>
          {openSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTag(s)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#CBDBF5] bg-white py-1 px-2.5 text-xs font-medium text-slate-600 transition-all duration-150 hover:border-primary hover:text-primary hover:bg-[#F8F9FF] active:scale-95"
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
