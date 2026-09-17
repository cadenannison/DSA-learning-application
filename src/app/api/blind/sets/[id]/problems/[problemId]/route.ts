import { NextResponse } from "next/server"
import { container } from "@/server/container"
import { blindTestSetSchema } from "@/server/models/schemas"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; problemId: string }> }
) {
  const { id, problemId } = await params
  const set = await container.blindTestSetService.removeProblem(id, problemId)

  if (!set) {
    return NextResponse.json({ error: "Set not found" }, { status: 404 })
  }

  return NextResponse.json(blindTestSetSchema.parse(set))
}
