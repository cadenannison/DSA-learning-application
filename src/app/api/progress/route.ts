import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import {
  attemptRecordSchema,
  problemProgressSchema,
  recordAttemptRequestSchema,
} from "@/server/models/schemas"

export async function GET() {
  const progress = await container.progressService.listProgress()
  return NextResponse.json(z.array(problemProgressSchema).parse(progress))
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = recordAttemptRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { stats, ...attemptInput } = parsed.data
  const attempt = await container.progressService.recordAttempt({
    ...attemptInput,
    durationMs: stats.durationMs,
  })

  // Practice/Blind/Mock OA all stay usable while logged out, so profile stats can only be
  // attributed when a session happens to be present — this is a best-effort contribution to
  // the logged-in user's stats, not a requirement to be logged in to submit code.
  const user = await getSessionUser()
  if (user) {
    const problem = await container.problemService.getById(attemptInput.problemId)
    await container.statsService.recordEvent({
      userId: user.id,
      type: "attempt",
      problemId: attemptInput.problemId,
      mode: attemptInput.mode,
      passed: attemptInput.passed,
      durationMs: stats.durationMs,
      linesOfCode: stats.linesOfCode,
      testsPassed: stats.testsPassed,
      testsTotal: stats.testsTotal,
      difficulty: problem?.difficulty ?? null,
    })
  }

  return NextResponse.json(attemptRecordSchema.parse(attempt), { status: 201 })
}
