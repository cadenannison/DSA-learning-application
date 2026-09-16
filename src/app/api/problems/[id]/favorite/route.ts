import { NextRequest, NextResponse } from "next/server"
import { container } from "@/server/container"
import { setFavoriteRequestSchema } from "@/server/models/schemas"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = setFavoriteRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const problem = await container.problemService.getById(id)
  if (!problem) {
    return NextResponse.json({ error: "Problem not found" }, { status: 404 })
  }

  await container.progressService.setFavorite(id, parsed.data.favorited)
  return NextResponse.json({ favorited: parsed.data.favorited })
}
