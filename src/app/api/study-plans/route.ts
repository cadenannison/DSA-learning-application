import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import { createStudyPlanRequestSchema, studyPlanSchema, studyPlanSummarySchema } from "@/server/models/schemas"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const plans = await container.studyPlanService.listPlans(user.id)
  return NextResponse.json(z.array(studyPlanSummarySchema).parse(plans))
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = createStudyPlanRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const plan = await container.studyPlanService.createPlan(user.id, parsed.data.name)
  return NextResponse.json(studyPlanSchema.parse(plan), { status: 201 })
}
