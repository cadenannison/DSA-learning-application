import { NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import { oaSessionHistoryEntrySchema } from "@/server/models/schemas"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const history = await container.statsService.listOASessionHistory(user.id)
  return NextResponse.json(z.array(oaSessionHistoryEntrySchema).parse(history))
}
