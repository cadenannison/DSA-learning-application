import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import { logProblemSessionRequestSchema } from "@/server/models/schemas"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = logProblemSessionRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  await container.studyPlanService.recordUnsubmittedSession(
    user.id,
    id,
    parsed.data.minutesSpent
  )

  return NextResponse.json({ ok: true })
}
