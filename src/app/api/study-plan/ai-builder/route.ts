import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import {
  aiStudyPlanMetaPromptResponseSchema,
  buildAiStudyPlanRequestSchema,
  buildAiStudyPlanResponseSchema,
} from "@/server/models/schemas"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const prompt = await container.studyPlanService.getAiStudyPlanMetaPrompt()
  return NextResponse.json(aiStudyPlanMetaPromptResponseSchema.parse({ prompt }))
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = buildAiStudyPlanRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const plan = await container.studyPlanService.buildPlanFromAiPayload(
      user.id,
      parsed.data.rawPayload
    )
    return NextResponse.json(buildAiStudyPlanResponseSchema.parse({ planId: plan.id }))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to build study plan"
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
