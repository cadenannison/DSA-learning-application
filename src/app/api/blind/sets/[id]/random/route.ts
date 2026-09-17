import { NextResponse } from "next/server"
import { container } from "@/server/container"
import { strippedProblemSchema } from "@/server/models/schemas"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const problem = await container.blindTestSetService.getRandomStrippedProblem(id)

  if (!problem) {
    return NextResponse.json({ error: "Set not found or has no problems" }, { status: 404 })
  }

  return NextResponse.json(strippedProblemSchema.parse(problem))
}
