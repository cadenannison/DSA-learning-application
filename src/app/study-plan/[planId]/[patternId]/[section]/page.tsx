"use client"

import { notFound } from "next/navigation"
import { use, useEffect, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import {
  availableSections,
  PatternPageShell,
  type PatternSection,
} from "@/components/study-plan/pattern-page-shell"
import { PatternSectionContent } from "@/components/study-plan/pattern-section-content"
import { PageShell } from "@/components/ui/page-shell"
import { adjacentPatterns } from "@/lib/study-plan-ordering"
import { StudyPlanPresenter } from "@/presenter/study-plan-presenter"
import type { StudyPlanOverview, User } from "@/types"

const VALID_SECTIONS: PatternSection[] = [
  "lesson",
  "worked-example",
  "practice",
  "bug-tracing",
  "concept",
]

export default function PatternSectionPage({
  params,
}: {
  params: Promise<{ planId: string; patternId: string; section: string }>
}) {
  const { planId, patternId, section } = use(params)

  if (!VALID_SECTIONS.includes(section as PatternSection)) notFound()

  return (
    <AuthGate>
      {(user, logout) => (
        <PatternSectionContainer
          planId={planId}
          patternId={patternId}
          section={section as PatternSection}
          user={user}
          logout={logout}
        />
      )}
    </AuthGate>
  )
}

function PatternSectionContainer({
  planId,
  patternId,
  section,
}: {
  planId: string
  patternId: string
  section: PatternSection
  user: User
  logout: () => void
}) {
  const [overview, setOverview] = useState<StudyPlanOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [presenter] = useState(
    () => new StudyPlanPresenter(planId, { setLoading, setOverview, setError })
  )

  useEffect(() => {
    presenter.load()
  }, [presenter])

  if (loading && !overview) {
    return (
      <PageShell>
        <p className="text-sm text-text-2">Loading study plan...</p>
      </PageShell>
    )
  }

  if (error || !overview) {
    return (
      <PageShell>
        <p className="text-sm text-danger">{error ?? "Failed to load"}</p>
      </PageShell>
    )
  }

  const pattern = overview.patterns.find((p) => p.id === patternId)
  if (!pattern) notFound()

  const sections = availableSections(pattern)
  if (!sections.includes(section)) notFound()

  const { prev, next } = adjacentPatterns(overview, patternId)

  return (
    <PatternPageShell
      planId={planId}
      pattern={pattern}
      activeSection={section}
      prev={prev}
      next={next}
      presenter={presenter}
    >
      <PatternSectionContent
        key={`${pattern.id}:${section}`}
        planId={planId}
        pattern={pattern}
        section={section}
        presenter={presenter}
      />
    </PatternPageShell>
  )
}
