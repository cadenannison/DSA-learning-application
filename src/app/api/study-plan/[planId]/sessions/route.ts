import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import { createStudySessionRequestSchema, studySessionSchema } from "@/server/models/schemas"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const { planId } = await params
  const plan = await container.studyPlanService.getPlanForUser(user.id, planId)
  if (!plan) {
    return NextResponse.json({ error: "Study plan not found" }, { status: 404 })
  }

  const sessions = await container.studyPlanService.listSessions(planId)
  return NextResponse.json(z.array(studySessionSchema).parse(sessions))
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const { planId } = await params
  const plan = await container.studyPlanService.getPlanForUser(user.id, planId)
  if (!plan) {
    return NextResponse.json({ error: "Study plan not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const parsed = createStudySessionRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const session = await container.studyPlanService.logSession(planId, parsed.data)
  return NextResponse.json(studySessionSchema.parse(session), { status: 201 })
}
