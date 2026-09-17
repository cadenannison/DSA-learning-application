import { NextResponse } from "next/server"
import { container } from "@/server/container"
import { dsaPatternSchema, patternLessonSchema } from "@/server/models/schemas"

export async function GET(_request: Request, { params }: { params: Promise<{ pattern: string }> }) {
  const { pattern } = await params
  const parsed = dsaPatternSchema.safeParse(pattern)

  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown pattern" }, { status: 400 })
  }

  const lesson = await container.patternLessonService.getByPattern(parsed.data)

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
  }

  return NextResponse.json(patternLessonSchema.parse(lesson))
}
