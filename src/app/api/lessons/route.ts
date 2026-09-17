import { NextResponse } from "next/server"
import { container } from "@/server/container"
import { patternLessonSummarySchema } from "@/server/models/schemas"
import { z } from "zod"

export async function GET() {
  const lessons = await container.patternLessonService.list()
  return NextResponse.json(z.array(patternLessonSummarySchema).parse(lessons))
}
