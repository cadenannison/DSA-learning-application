import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import { readinessChecklistOverviewSchema } from "@/server/models/schemas"

export async function GET(
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

  const checklist = await container.studyPlanService.getReadinessChecklist(planId)
  return NextResponse.json(readinessChecklistOverviewSchema.parse(checklist))
}
