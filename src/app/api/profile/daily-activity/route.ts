import { NextResponse } from "next/server"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import { dailyActivityOverviewSchema } from "@/server/models/schemas"

export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const daysParam = new URL(request.url).searchParams.get("days")
  const days = daysParam ? Math.min(365, Math.max(1, Number(daysParam))) : 14

  const overview = await container.statsService.getDailyActivity(user.id, days)
  return NextResponse.json(dailyActivityOverviewSchema.parse(overview))
}
