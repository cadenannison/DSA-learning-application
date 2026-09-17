"use client"

import { notFound, redirect } from "next/navigation"
import { use, useEffect, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { defaultSectionFor } from "@/components/study-plan/pattern-page-shell"
import { PageShell } from "@/components/ui/page-shell"
import { StudyPlanPresenter } from "@/presenter/study-plan-presenter"
import type { StudyPlanOverview } from "@/types"

/** Bare /study-plan/[planId]/[patternId] has no section of its own — it immediately redirects
 * to the pattern's default section (lesson for workbook patterns, concept otherwise) so every
 * visible URL is unambiguous about which section is showing. */
export default function PatternIndexPage({
  params,
}: {
  params: Promise<{ planId: string; patternId: string }>
}) {
  const { planId, patternId } = use(params)
  return <AuthGate>{() => <PatternIndexRedirect planId={planId} patternId={patternId} />}</AuthGate>
}

function PatternIndexRedirect({ planId, patternId }: { planId: string; patternId: string }) {
  const [overview, setOverview] = useState<StudyPlanOverview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [presenter] = useState(
    () =>
      new StudyPlanPresenter(planId, {
        setLoading: () => {},
        setOverview,
        setError,
      })
  )

  useEffect(() => {
    presenter.load()
  }, [presenter])

  if (error) {
    return (
      <PageShell>
        <p className="text-sm text-danger">{error}</p>
      </PageShell>
    )
  }

  if (!overview) {
    return (
      <PageShell>
        <p className="text-sm text-text-2">Loading study plan...</p>
      </PageShell>
    )
  }

  const pattern = overview.patterns.find((p) => p.id === patternId)
  if (!pattern) notFound()

  redirect(`/study-plan/${planId}/${patternId}/${defaultSectionFor(pattern)}`)
}
