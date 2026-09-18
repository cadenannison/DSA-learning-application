import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import {
  submitStudyProblemRequestSchema,
  submitStudyProblemResponseSchema,
} from "@/server/models/schemas"
import { tallyTestCases } from "@/server/services/execution-result-view"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string; id: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const { planId, id } = await params
  const plan = await container.studyPlanService.getPlanForUser(user.id, planId)
  if (!plan) {
    return NextResponse.json({ error: "Study plan not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const parsed = submitStudyProblemRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await container.studyPlanService.submitEmbeddedProblem(
    planId,
    id,
    parsed.data.submission,
    parsed.data.timeTakenMinutes
  )

  if (!result) {
    return NextResponse.json(
      { error: "Study problem not found or not embeddable" },
      { status: 404 }
    )
  }

  // Same uniform stats contribution as the main practice flow (src/app/api/progress/route.ts)
  // so study-plan solves show up in lifetime profile stats too — keyed on the underlying
  // library Problem id since that's what user_stat_events keys on, with studyProblemId kept
  // alongside so this specific workbook entry stays distinguishable from other entries that
  // link to the same library problem.
  const { testsPassed, testsTotal } = tallyTestCases(result.execution)
  await container.statsService.recordEvent({
    userId: user.id,
    type: "attempt",
    problemId: result.linkedProblemId,
    studyProblemId: result.studyProblemId,
    mode: "practice",
    passed: result.execution.allPassed,
    durationMs: parsed.data.stats.durationMs,
    linesOfCode: parsed.data.stats.linesOfCode,
    testsPassed,
    testsTotal,
    difficulty: result.difficulty,
  })

  return NextResponse.json(submitStudyProblemResponseSchema.parse(result))
}
