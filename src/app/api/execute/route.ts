import { NextRequest, NextResponse } from "next/server"
import { container } from "@/server/container"
import { executeRequestSchema, executionResultSchema } from "@/server/models/schemas"
import { toClientExecutionResult } from "@/server/services/execution-result-view"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const parsed = executeRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await container.executionService.execute(
      parsed.data.problemId,
      parsed.data.submission,
      parsed.data.mode
    )

    // Hidden-test-case stripping below is mode-independent: ExecutionResult/TestCaseResult
    // never carry problem metadata (pattern, difficulty, hints), so this response is safe
    // in both practice and blind mode regardless of which mode was requested. If a future
    // field is added to ExecutionResult, executionResultSchema.parse below will reject
    // anything that isn't in the schema — extend the schema deliberately, not by accident.
    return NextResponse.json(executionResultSchema.parse(toClientExecutionResult(result)))
  } catch {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 })
  }
}
