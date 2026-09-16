import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { container } from "@/server/container"
import {
  attemptRecordSchema,
  problemProgressSchema,
  recordAttemptRequestSchema,
} from "@/server/models/schemas"

export async function GET() {
  const progress = await container.progressService.listProgress()
  return NextResponse.json(z.array(problemProgressSchema).parse(progress))
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = recordAttemptRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const attempt = await container.progressService.recordAttempt(parsed.data)
  return NextResponse.json(attemptRecordSchema.parse(attempt), { status: 201 })
}
