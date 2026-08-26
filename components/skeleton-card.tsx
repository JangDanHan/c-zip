export function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5" aria-hidden="true">
      <div className="flex items-start gap-3">
        <div className="size-9 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-2/5 animate-pulse rounded-md bg-muted" />
          <div className="h-4 w-4/5 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
      <div className="mt-4 flex gap-1.5">
        <div className="h-6 w-20 animate-pulse rounded-md bg-muted" />
        <div className="h-6 w-16 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="mt-4 h-9 w-full animate-pulse rounded-xl bg-muted" />
      <div className="mt-2 h-12 w-full animate-pulse rounded-xl bg-muted" />
    </div>
  )
}
