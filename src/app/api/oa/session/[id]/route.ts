import { NextResponse } from "next/server"
import { container } from "@/server/container"
import { oaSessionSchema } from "@/server/models/schemas"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await container.oaSessionService.getSession(id)

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 })
  }

  return NextResponse.json(oaSessionSchema.parse(session))
}
