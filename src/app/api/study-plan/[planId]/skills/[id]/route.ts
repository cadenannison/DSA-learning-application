import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import { skillSchema, updateSkillRequestSchema } from "@/server/models/schemas"

export async function PATCH(
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
  const parsed = updateSkillRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const skill = await container.studyPlanService.updateSkill(planId, id, parsed.data.done)
  if (!skill) {
    return NextResponse.json({ error: "Skill not found" }, { status: 404 })
  }

  return NextResponse.json(skillSchema.parse(skill))
}
