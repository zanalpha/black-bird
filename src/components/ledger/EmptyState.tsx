import { Bird, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyState({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string
  body: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="grid justify-items-center rounded-3xl border border-dashed border-foreground/15 px-6 py-16 text-center">
      <Bird className="size-10 text-muted-foreground" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      {actionLabel && onAction ? (
        <Button type="button" className="mt-6 h-10" onClick={onAction}>
          <Plus />
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
