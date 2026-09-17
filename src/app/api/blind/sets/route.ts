import { NextResponse } from "next/server"
import { container } from "@/server/container"
import { blindTestSetSchema, blindTestSetSummarySchema, createBlindTestSetRequestSchema } from "@/server/models/schemas"
import { z } from "zod"

export async function GET() {
  const sets = await container.blindTestSetService.listSets()
  return NextResponse.json(z.array(blindTestSetSummarySchema).parse(sets))
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = createBlindTestSetRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, problemIds, filter } = parsed.data
  const set = await container.blindTestSetService.createSet(name, problemIds, filter)

  return NextResponse.json(blindTestSetSchema.parse(set), { status: 201 })
}
