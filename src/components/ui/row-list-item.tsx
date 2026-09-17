import Link from "next/link"
import type { ReactNode } from "react"

interface RowListItemProps {
  href: string
  rank?: ReactNode
  title: string
  subtitle?: string
  progress?: ReactNode
  trailing?: ReactNode
}

export function RowListItem({ href, rank, title, subtitle, progress, trailing }: RowListItemProps) {
  return (
    <Link
      href={href}
      className="flex min-h-[44px] items-center gap-4 border-b border-border-soft px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-2"
    >
      {rank !== undefined && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-chip bg-surface-2 font-mono text-xs text-text-2">
          {rank}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-text-1">{title}</div>
        {subtitle && <div className="truncate text-xs text-text-2">{subtitle}</div>}
      </div>
      {progress && <div className="hidden w-32 shrink-0 sm:block">{progress}</div>}
      {trailing && <div className="flex shrink-0 items-center gap-3">{trailing}</div>}
    </Link>
  )
}
