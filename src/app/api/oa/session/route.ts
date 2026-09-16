import { NextRequest, NextResponse } from "next/server"
import { container } from "@/server/container"
import { oaSessionSchema, startOASessionRequestSchema } from "@/server/models/schemas"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = startOASessionRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const session = await container.oaSessionService.startSession(parsed.data.config)
    return NextResponse.json(oaSessionSchema.parse(session), { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start session" },
      { status: 400 }
    )
  }
}
