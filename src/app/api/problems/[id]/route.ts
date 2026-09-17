import { NextResponse } from "next/server"
import { container } from "@/server/container"
import { problemSchema } from "@/server/models/schemas"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const problem = await container.problemService.getById(id)

  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 })
  }

  return NextResponse.json(problemSchema.parse(problem))
}
