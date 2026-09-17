"use client"

import Link from "next/link"

export type PlanTab = "today" | "board" | "roadmap" | "readiness"

const TABS: { value: PlanTab; label: string; href: (planId: string) => string }[] = [
  { value: "today", label: "Today", href: (planId) => `/study-plan/${planId}` },
  { value: "board", label: "Full Plan", href: (planId) => `/study-plan/${planId}/board` },
  { value: "roadmap", label: "Roadmap", href: (planId) => `/study-plan/${planId}/roadmap` },
  { value: "readiness", label: "Readiness", href: (planId) => `/study-plan/${planId}/readiness` },
]

export function PlanNav({ planId, active }: { planId: string; active: PlanTab }) {
  return (
    <div className="mb-6 flex gap-6 border-b border-border" role="tablist">
      {TABS.map((tab) => (
        <Link
          key={tab.value}
          href={tab.href(planId)}
          role="tab"
          aria-selected={active === tab.value}
          className={`min-h-[44px] border-b-2 px-1 text-sm font-medium transition-colors ${
            active === tab.value
              ? "border-accent text-text-1"
              : "border-transparent text-text-2 hover:text-text-1"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
