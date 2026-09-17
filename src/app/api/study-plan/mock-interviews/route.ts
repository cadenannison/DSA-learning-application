import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import {
  createMockInterviewResultRequestSchema,
  mockInterviewResultSchema,
} from "@/server/models/schemas"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const results = await container.studyPlanService.listMockInterviewResults(user.id)
  return NextResponse.json(z.array(mockInterviewResultSchema).parse(results))
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = createMockInterviewResultRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const result = await container.studyPlanService.logMockInterviewResult(user.id, {
    ...parsed.data,
    studyProblemId: parsed.data.studyProblemId ?? null,
    studyPatternId: parsed.data.studyPatternId ?? null,
  })
  return NextResponse.json(mockInterviewResultSchema.parse(result), { status: 201 })
}
