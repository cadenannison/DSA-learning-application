"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

interface NavItem {
  href: string
  label: string
  description: string
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Library", description: "Practice problems" },
  { href: "/blind", label: "Blind Test", description: "Sets + random testing" },
  { href: "/oa", label: "Mock OA", description: "Timed sessions" },
  { href: "/patterns", label: "Learning Patterns", description: "Interactive walkthroughs" },
  { href: "/study-plan", label: "Study Plan", description: "Interview prep tracker" },
]

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/" || pathname.startsWith("/problems")
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex h-full w-56 shrink-0 flex-col border-r border-border bg-surface px-3 py-4">
      <div className="mb-6 px-2 text-sm font-semibold tracking-tight">DSA Practice</div>

      <ul className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                  active
                    ? "bg-accent text-white"
                    : "text-foreground hover:bg-border/50"
                }`}
              >
                <div className="font-medium">{item.label}</div>
                <div
                  className={`text-xs ${active ? "text-white/80" : "text-muted"}`}
                >
                  {item.description}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>

      <div className="mt-4 px-2">
        <ThemeToggle />
      </div>
    </nav>
  )
}
