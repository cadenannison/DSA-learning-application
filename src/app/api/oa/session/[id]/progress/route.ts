import { NextRequest, NextResponse } from "next/server"
import { container } from "@/server/container"
import { oaSessionSchema, saveOAProgressRequestSchema } from "@/server/models/schemas"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const parsed = saveOAProgressRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const session = await container.oaSessionService.saveProgress(
      id,
      parsed.data.problemId,
      parsed.data.code
    )
    return NextResponse.json(oaSessionSchema.parse(session))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save progress" },
      { status: 400 }
    )
  }
}
