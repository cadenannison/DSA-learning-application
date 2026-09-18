import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import { oaSessionSchema, submitOAProblemRequestSchema } from "@/server/models/schemas"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const parsed = submitOAProblemRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    // Mock OA sessions stay usable while logged out, same as Practice/Blind — this is a
    // best-effort contribution to the logged-in user's profile stats, not an auth requirement.
    const user = await getSessionUser()

    const session = await container.oaSessionService.submitProblem(
      id,
      parsed.data.problemId,
      parsed.data.submission,
      user?.id ?? null
    )
    return NextResponse.json(oaSessionSchema.parse(session))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit problem" },
      { status: 400 }
    )
  }
}
