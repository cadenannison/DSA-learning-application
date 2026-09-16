import { NextRequest, NextResponse } from "next/server"
import { container } from "@/server/container"
import { problemFilterSchema, problemSummarySchema } from "@/server/models/schemas"
import { z } from "zod"
import type { ProblemSummary } from "@/server/models/domain"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const parsed = problemFilterSchema.safeParse({
    pattern: searchParams.get("pattern") ?? undefined,
    difficulty: searchParams.get("difficulty") ?? undefined,
    company: searchParams.get("company") ?? undefined,
    query: searchParams.get("query") ?? undefined,
    favorite: searchParams.get("favorite") ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { favorite, ...repositoryFilter } = parsed.data

  const [problems, progressList, favoriteIds] = await Promise.all([
    container.problemService.list(repositoryFilter),
    container.progressService.listProgress(),
    container.progressService.listFavoriteIds(),
  ])

  const progressByProblem = new Map(progressList.map((progress) => [progress.problemId, progress]))
  const favoriteIdSet = new Set(favoriteIds)

  let summaries: ProblemSummary[] = problems.map((problem) => ({
    id: problem.id,
    title: problem.title,
    pattern: problem.pattern,
    difficulty: problem.difficulty,
    companies: problem.companies,
    progressStatus: progressByProblem.get(problem.id)?.status ?? "not_started",
    favorited: favoriteIdSet.has(problem.id),
  }))

  if (favorite !== undefined) {
    summaries = summaries.filter((summary) => summary.favorited === favorite)
  }

  return NextResponse.json(z.array(problemSummarySchema).parse(summaries))
}
