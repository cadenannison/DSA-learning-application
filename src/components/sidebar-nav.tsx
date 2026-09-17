"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState, type ReactNode } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { apiClient } from "@/lib/api-client"
import type { User } from "@/types"

interface NavItem {
  href: string
  label: string
  icon: ReactNode
}

function iconProps() {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-[18px] w-[18px] shrink-0",
    "aria-hidden": true,
  }
}

const DashboardIcon = () => (
  <svg {...iconProps()}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
)

const LibraryIcon = () => (
  <svg {...iconProps()}>
    <path d="M4 4h6v16H4z" />
    <path d="M14 4h6v16h-6z" />
  </svg>
)

const StudyPlanIcon = () => (
  <svg {...iconProps()}>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h10" />
  </svg>
)

const WorkbookIcon = () => (
  <svg {...iconProps()}>
    <path d="m9 18-6-6 6-6" />
    <path d="m15 6 6 6-6 6" />
  </svg>
)

const MockInterviewsIcon = () => (
  <svg {...iconProps()}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
)

const ProgressIcon = () => (
  <svg {...iconProps()}>
    <path d="M4 20V10" />
    <path d="M11 20V4" />
    <path d="M18 20v-7" />
  </svg>
)

const ProfileIcon = () => (
  <svg {...iconProps()}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" />
  </svg>
)

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/", label: "Library", icon: <LibraryIcon /> },
  { href: "/study-plan", label: "Study Plan", icon: <StudyPlanIcon /> },
  { href: "/blind", label: "Workbook", icon: <WorkbookIcon /> },
  { href: "/oa", label: "Mock Interviews", icon: <MockInterviewsIcon /> },
  { href: "/profile/stats", label: "Progress", icon: <ProgressIcon /> },
]

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname.startsWith("/problems")
  if (href === "/profile") return pathname === "/profile"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SidebarNav() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    apiClient
      .getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
  }, [])

  return (
    <nav className="flex h-full w-[232px] shrink-0 flex-col gap-7 border-r border-border bg-surface px-4 py-6">
      <div className="flex items-center gap-2.5 px-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] bg-accent">
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-bg" aria-hidden="true">
            <path
              d="M4 15 L10 9 L14 13 L20 5"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="font-display text-[16px] font-bold text-text-1">DSA Practice</span>
      </div>

      <ul className="flex-1 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex min-h-[40px] items-center gap-3 rounded-[8px] px-3.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent-soft text-text-1"
                    : "text-text-2 hover:bg-surface-2 hover:text-text-1"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="space-y-3 border-t border-border-soft px-2 pt-4">
        <ThemeToggle />
        <Link
          href="/profile"
          className={`flex min-h-[40px] items-center gap-3 rounded-[8px] px-1.5 text-sm font-medium transition-colors ${
            isActive(pathname, "/profile")
              ? "bg-accent-soft text-text-1"
              : "text-text-2 hover:bg-surface-2 hover:text-text-1"
          }`}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft font-display text-xs font-bold text-accent">
            {user ? user.username.charAt(0).toUpperCase() : <ProfileIcon />}
          </span>
          {user ? user.username : "Profile"}
        </Link>
      </div>
    </nav>
  )
}
