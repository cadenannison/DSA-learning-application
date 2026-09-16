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
  const [theme, setTheme] = useState<ThemePreference | null>(readStoredTheme)

  useEffect(() => {
    if (theme) applyTheme(theme)

    apiClient
      .getTheme()
      .then((serverTheme) => {
        setTheme(serverTheme)
        applyTheme(serverTheme)
        localStorage.setItem("dsa-theme", serverTheme)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function toggle() {
    const next: ThemePreference = theme === "dark" ? "light" : "dark"
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
      className="rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-surface"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  )
}
