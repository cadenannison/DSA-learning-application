import { NextResponse } from "next/server"
import { container } from "@/server/container"
import { blindTestSetSchema } from "@/server/models/schemas"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const set = await container.blindTestSetService.getSet(id)

  if (!set) {
    return NextResponse.json({ error: "Set not found" }, { status: 404 })
  }

  return NextResponse.json(blindTestSetSchema.parse(set))
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await container.blindTestSetService.deleteSet(id)
  return NextResponse.json({ ok: true })
}
