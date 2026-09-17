import type { ReactNode } from "react"

interface StatCardProps {
  label: string
  value: ReactNode
  pill?: ReactNode
}

export function StatCard({ label, value, pill }: StatCardProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[12.5px] font-medium text-text-2">{label}</div>
        {pill}
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold text-text-1">{value}</div>
    </div>
  )
}
