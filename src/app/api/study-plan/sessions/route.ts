import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import { createStudySessionRequestSchema, studySessionSchema } from "@/server/models/schemas"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const sessions = await container.studyPlanService.listSessions(user.id)
  return NextResponse.json(z.array(studySessionSchema).parse(sessions))
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = createStudySessionRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const session = await container.studyPlanService.logSession(user.id, parsed.data)
  return NextResponse.json(studySessionSchema.parse(session), { status: 201 })
}
