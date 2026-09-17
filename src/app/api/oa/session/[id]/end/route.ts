import { NextResponse } from "next/server"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import { oaSessionSummarySchema } from "@/server/models/schemas"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const summary = await container.oaSessionService.endSession(id)

    // Mock OA sessions stay usable while logged out, same as Practice/Blind — this is a
    // best-effort contribution to the logged-in user's profile stats, not an auth requirement.
    const user = await getSessionUser()
    if (user) {
      const totalTimeSpentMs = summary.perProblem.reduce((sum, p) => sum + p.timeSpentMs, 0)
      await container.statsService.recordEvent({
        userId: user.id,
        type: "oa_session_completed",
        durationMs: totalTimeSpentMs,
      })
    }

    return NextResponse.json(oaSessionSummarySchema.parse(summary))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to end session" },
      { status: 404 }
    )
  }
}
