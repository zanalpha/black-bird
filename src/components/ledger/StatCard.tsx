import { cn } from '@/lib/utils'

export function StatCard({
  label,
  value,
  detail,
  tone = 'default',
  className,
}: {
  label: string
  value: string
  detail?: string
  tone?: 'default' | 'inverse'
  className?: string
}) {
  const inverse = tone === 'inverse'
  return (
    <article
      className={cn(
        'rounded-2xl p-4 ring-1 ring-foreground/10 sm:p-5',
        inverse ? 'bg-foreground text-background' : 'bg-card text-card-foreground',
        className,
      )}
    >
      <p className={cn('text-sm', inverse ? 'text-background/70' : 'text-muted-foreground')}>
        {label}
      </p>
      <p className="mt-3 text-2xl leading-tight font-semibold tracking-tight break-words tabular-nums sm:text-3xl">
        {value}
      </p>
      {detail ? (
        <p
          className={cn(
            'mt-2 text-sm',
            inverse ? 'text-background/70' : 'text-muted-foreground',
          )}
        >
          {detail}
        </p>
      ) : null}
    </article>
  )
}
