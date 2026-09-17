"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { apiClient } from "@/lib/api-client"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import type { Difficulty } from "@/types"

const DIFFICULTY_OPTIONS: Difficulty[] = ["easy", "medium", "hard"]

const PRESETS: { label: string; problemCount: number; timeBudgetMinutes: number; mix: Partial<Record<Difficulty, number>> }[] = [
  { label: "Quick check (1 easy, 15 min)", problemCount: 1, timeBudgetMinutes: 15, mix: { easy: 1 } },
  { label: "Standard OA (2 medium, 45 min)", problemCount: 2, timeBudgetMinutes: 45, mix: { medium: 2 } },
  { label: "Full loop (1 easy, 2 medium, 1 hard, 60 min)", problemCount: 4, timeBudgetMinutes: 60, mix: { easy: 1, medium: 2, hard: 1 } },
]

export default function OASetupPage() {
  const router = useRouter()
  const [presetIndex, setPresetIndex] = useState(1)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startSession() {
    setStarting(true)
    setError(null)

    const preset = PRESETS[presetIndex]

    try {
      const session = await apiClient.startOASession({
        difficulty: preset.mix,
        problemCount: preset.problemCount,
        timeBudgetMs: preset.timeBudgetMinutes * 60 * 1000,
      })
      router.push(`/oa/session/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start session")
      setStarting(false)
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Mock Interviews"
        context="A timed, multi-problem session that simulates a Google-style online assessment"
      />

      <p className="mb-6 max-w-2xl text-sm text-text-2">
        Pattern tags and difficulty labels stay hidden during the session, same as Workbook blind
        mode — solve cold, against the clock.
      </p>

      <div className="mb-6 max-w-2xl space-y-2">
        {PRESETS.map((preset, index) => (
          <label
            key={preset.label}
            className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-card border px-4 py-3 text-sm ${
              presetIndex === index ? "border-accent bg-accent-soft text-text-1" : "border-border text-text-1"
            }`}
          >
            <input
              type="radio"
              name="preset"
              checked={presetIndex === index}
              onChange={() => setPresetIndex(index)}
            />
            {preset.label}
          </label>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <button
        onClick={startSession}
        disabled={starting}
        className="min-h-[44px] rounded-control bg-accent px-4 text-sm font-semibold text-bg disabled:opacity-50"
      >
        {starting ? "Starting..." : "Start session"}
      </button>

      <p className="mt-4 max-w-2xl text-xs text-text-2">
        Difficulty labels above ({DIFFICULTY_OPTIONS.join(", ")}) select which problems are
        eligible for the session — they are not shown once the session starts.
      </p>
    </PageShell>
  )
}
