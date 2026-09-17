import { NextResponse } from "next/server"
import { container } from "@/server/container"
import { strippedProblemSchema } from "@/server/models/schemas"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const problem = await container.problemService.getForBlindTest(id)

  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 })
  }

  // .strict() below is what mechanically guarantees pattern/difficulty/hints/solution
  // never leak into a Blind Test response, rather than relying on StrippedProblem's
  // Pick<> staying correct by convention.
  return NextResponse.json(strippedProblemSchema.parse(problem))
}
