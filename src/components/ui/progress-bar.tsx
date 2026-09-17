interface ProgressBarProps {
  value: number
  max?: number
  complete?: boolean
  className?: string
}

export function ProgressBar({ value, max = 100, complete = false, className = "" }: ProgressBarProps) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div
      className={`h-1.5 w-full overflow-hidden rounded-full bg-surface-2 ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={`h-full rounded-full ${complete ? "bg-success" : "bg-accent"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
