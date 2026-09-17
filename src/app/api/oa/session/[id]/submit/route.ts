import { NextRequest, NextResponse } from "next/server"
import { container } from "@/server/container"
import { oaSessionSchema, submitOAProblemRequestSchema } from "@/server/models/schemas"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const parsed = submitOAProblemRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const session = await container.oaSessionService.submitProblem(
      id,
      parsed.data.problemId,
      parsed.data.submission
    )
    return NextResponse.json(oaSessionSchema.parse(session))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit problem" },
      { status: 400 }
    )
  }
}
