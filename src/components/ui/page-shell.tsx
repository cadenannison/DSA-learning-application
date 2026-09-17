import type { ReactNode } from "react"

export function PageShell({ children }: { children: ReactNode }) {
  return <div className="flex-1 px-12 py-10">{children}</div>
}
