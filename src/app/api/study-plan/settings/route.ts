import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import { studyPlanSettingsSchema, updateStudyPlanSettingsRequestSchema } from "@/server/models/schemas"

export async function PUT(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = updateStudyPlanSettingsRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const settings = await container.studyPlanService.updateSettings(user.id, parsed.data)
  return NextResponse.json(studyPlanSettingsSchema.parse(settings))
}
