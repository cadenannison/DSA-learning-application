"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { apiClient } from "@/lib/api-client"
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
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-semibold">Mock OA Mode</h1>
      <p className="mt-2 text-sm text-muted">
        A timed, multi-problem session that simulates a Google-style online assessment.
        Pattern tags and difficulty labels stay hidden during the session, same as Blind Test
        Mode — solve cold, against the clock.
      </p>

      <div className="mt-6 space-y-2">
        {PRESETS.map((preset, index) => (
          <label
            key={preset.label}
            className={`flex cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-sm ${
              presetIndex === index ? "border-accent bg-accent/10" : "border-border"
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

      {error && <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        onClick={startSession}
        disabled={starting}
        className="mt-6 rounded-md bg-accent px-4 py-2 text-sm text-white disabled:opacity-50"
      >
        {starting ? "Starting..." : "Start session"}
      </button>

      <p className="mt-4 text-xs text-muted">
        Difficulty labels above ({DIFFICULTY_OPTIONS.join(", ")}) select which problems are
        eligible for the session — they are not shown once the session starts.
      </p>
    </main>
  )
}
