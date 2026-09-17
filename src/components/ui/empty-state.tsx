import type { ReactNode } from "react"

interface EmptyStateProps {
  icon?: ReactNode
  message: string
}

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-border py-16 text-center">
      {icon && <div className="text-text-3">{icon}</div>}
      <p className="text-sm text-text-2">{message}</p>
    </div>
  )
}
