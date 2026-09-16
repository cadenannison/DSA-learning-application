import { NextRequest, NextResponse } from "next/server"
import { container } from "@/server/container"
import { problemFilterSchema } from "@/server/models/schemas"
import type { ProblemSummary } from "@/server/models/domain"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const parsed = problemFilterSchema.safeParse({
    pattern: searchParams.get("pattern") ?? undefined,
    difficulty: searchParams.get("difficulty") ?? undefined,
    query: searchParams.get("query") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const [problems, progressList] = await Promise.all([
    container.problemService.list(parsed.data),
    container.progressService.listProgress(),
  ])

  const progressByProblem = new Map(progressList.map((progress) => [progress.problemId, progress]))

  const summaries: ProblemSummary[] = problems.map((problem) => ({
    id: problem.id,
    title: problem.title,
    pattern: problem.pattern,
    difficulty: problem.difficulty,
    progressStatus: progressByProblem.get(problem.id)?.status ?? "not_started",
  }))

  return NextResponse.json(summaries)
}
