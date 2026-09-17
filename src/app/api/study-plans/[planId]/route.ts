import { NextResponse } from "next/server"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ planId: string }> }
) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const { planId } = await params
  await container.studyPlanService.deletePlan(user.id, planId)
  return NextResponse.json({ ok: true })
}
