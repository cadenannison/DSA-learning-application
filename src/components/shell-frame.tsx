"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"
import { SidebarNav } from "@/components/sidebar-nav"

// Full-bleed, no-sidebar routes: split-pane code workbenches and solve views. Everything not
// matched here gets the sidebar shell. Order-independent; each pattern matches a full segment
// so "/blind" (list) doesn't match "/blind/[id]" (solve view).
const WORKBENCH_PATTERNS: RegExp[] = [
  /^\/blind\/[^/]+$/,
  /^\/blind\/sets\/[^/]+\/play$/,
  /^\/problems\/[^/]+$/,
  /^\/oa\/session\/[^/]+$/,
  /^\/study-plan\/[^/]+\/[^/]+\/[^/]+$/,
]

function isWorkbenchRoute(pathname: string): boolean {
  return WORKBENCH_PATTERNS.some((pattern) => pattern.test(pathname))
}

export function ShellFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  if (isWorkbenchRoute(pathname)) {
    return <div className="h-full min-h-0 flex-1">{children}</div>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarNav />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
    </div>
  )
}
