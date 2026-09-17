import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import {
  readinessChecklistOverviewSchema,
  updateReadinessChecklistItemRequestSchema,
} from "@/server/models/schemas"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string; itemId: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const { planId, itemId } = await params
  const plan = await container.studyPlanService.getPlanForUser(user.id, planId)
  if (!plan) {
    return NextResponse.json({ error: "Study plan not found" }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const parsed = updateReadinessChecklistItemRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const checklist = await container.studyPlanService.updateReadinessChecklistItem(
    planId,
    itemId,
    parsed.data
  )
  return NextResponse.json(readinessChecklistOverviewSchema.parse(checklist))
}
