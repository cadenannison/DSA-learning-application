"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import type { ThemePreference } from "@/types"

function applyTheme(theme: ThemePreference) {
  document.documentElement.setAttribute("data-theme", theme)
}

function readStoredTheme(): ThemePreference | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("dsa-theme") as ThemePreference | null
}

export function ThemeToggle() {
  // Start null on every render pass (server and initial client) so hydration always matches;
  // the real stored value is picked up via readStoredTheme() below, after mount.
  const [mounted, setMounted] = useState(false)
  const [theme, setTheme] = useState<ThemePreference | null>(null)

  useEffect(() => {
    setMounted(true)

    apiClient
      .getTheme()
      .then((serverTheme) => {
        setTheme(serverTheme)
        applyTheme(serverTheme)
        localStorage.setItem("dsa-theme", serverTheme)
      })
      .catch(() => {})
  }, [])

  const displayedTheme = mounted ? (theme ?? readStoredTheme()) : null

  async function toggle() {
    const next: ThemePreference = displayedTheme === "dark" ? "light" : "dark"
    setTheme(next)
    applyTheme(next)
    localStorage.setItem("dsa-theme", next)
    try {
      await apiClient.setTheme(next)
    } catch {
      // best-effort persistence; local state already updated
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex min-h-[44px] w-full items-center rounded-control border border-border px-3 text-sm text-text-2 hover:bg-surface-2 hover:text-text-1"
      aria-label="Toggle theme"
    >
      {displayedTheme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  )
}
