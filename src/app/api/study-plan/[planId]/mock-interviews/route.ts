import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import {
  createMockInterviewResultRequestSchema,
  mockInterviewResultSchema,
} from "@/server/models/schemas"

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

  const results = await container.studyPlanService.listMockInterviewResults(planId)
  return NextResponse.json(z.array(mockInterviewResultSchema).parse(results))
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
  const parsed = createMockInterviewResultRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await container.studyPlanService.logMockInterviewResult(planId, {
    ...parsed.data,
    studyProblemId: parsed.data.studyProblemId ?? null,
    studyPatternId: parsed.data.studyPatternId ?? null,
  })
  return NextResponse.json(mockInterviewResultSchema.parse(result), { status: 201 })
}
