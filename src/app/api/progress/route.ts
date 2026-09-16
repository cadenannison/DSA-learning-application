import { NextRequest, NextResponse } from "next/server"
import { container } from "@/server/container"
import { recordAttemptRequestSchema } from "@/server/models/schemas"

export async function GET() {
  const progress = await container.progressService.listProgress()
  return NextResponse.json(progress)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = recordAttemptRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const attempt = await container.progressService.recordAttempt(parsed.data)
  return NextResponse.json(attempt, { status: 201 })
}
