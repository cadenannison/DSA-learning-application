export type StatusTone = "accent" | "success" | "warning" | "danger" | "neutral"

const TONE_CLASSES: Record<StatusTone, string> = {
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-surface-2 text-text-2",
}

interface StatusPillProps {
  label: string
  tone?: StatusTone
}

export function StatusPill({ label, tone = "neutral" }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center rounded-chip px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide ${TONE_CLASSES[tone]}`}
    >
      {label}
    </span>
  )
}
