import { NextResponse } from "next/server"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import { profileStatsOverviewSchema } from "@/server/models/schemas"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const overview = await container.statsService.getOverview(user.id)
  return NextResponse.json(profileStatsOverviewSchema.parse(overview))
}
