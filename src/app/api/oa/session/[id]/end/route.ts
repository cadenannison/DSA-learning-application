import { NextResponse } from "next/server"
import { container } from "@/server/container"
import { oaSessionSummarySchema } from "@/server/models/schemas"

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const summary = await container.oaSessionService.endSession(id)
    return NextResponse.json(oaSessionSummarySchema.parse(summary))
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to end session" },
      { status: 404 }
    )
  }
}
