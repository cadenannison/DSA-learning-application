import { NextRequest, NextResponse } from "next/server"
import { container } from "@/server/container"
import { executeRequestSchema } from "@/server/models/schemas"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = executeRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await container.executionService.execute(
      parsed.data.problemId,
      parsed.data.submission
    )

    const results = result.results.map((testResult) =>
      testResult.isHidden
        ? { ...testResult, input: [], expected: undefined, actual: undefined }
        : testResult
    )

    return NextResponse.json({ ...result, results })
  } catch {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 })
  }
}
