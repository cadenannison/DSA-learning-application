import type { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  context?: string
  action?: ReactNode
}

export function PageHeader({ title, context, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-[26px] font-semibold text-text-1">{title}</h1>
        {context && <p className="mt-1 text-sm text-text-2">{context}</p>}
      </div>
      {action}
    </div>
  )
}
