import { NextResponse } from "next/server"
import { container } from "@/server/container"
import {
  addProblemsToSetRequestSchema,
  blindTestSetSchema,
  difficultySchema,
  dsaPatternSchema,
} from "@/server/models/schemas"
import { z } from "zod"

const addByFilterRequestSchema = z.object({
  filter: z.object({
    patterns: z.array(dsaPatternSchema).optional(),
    difficulties: z.array(difficultySchema).optional(),
  }),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json().catch(() => null)

  const byIds = addProblemsToSetRequestSchema.safeParse(body)

  if (byIds.success) {
    const set = await container.blindTestSetService.addProblems(id, byIds.data.problemIds)
    if (!set) return NextResponse.json({ error: "Set not found" }, { status: 404 })
    return NextResponse.json(blindTestSetSchema.parse(set))
  }

  const byFilter = addByFilterRequestSchema.safeParse(body)

  if (!byFilter.success) {
    return NextResponse.json({ error: "Provide either problemIds or filter" }, { status: 400 })
  }

  const set = await container.blindTestSetService.addByFilter(id, byFilter.data.filter)
  if (!set) return NextResponse.json({ error: "Set not found" }, { status: 404 })
  return NextResponse.json(blindTestSetSchema.parse(set))
}
