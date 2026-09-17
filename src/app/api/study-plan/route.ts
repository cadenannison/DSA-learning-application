import { NextResponse } from "next/server"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import { studyPlanOverviewSchema } from "@/server/models/schemas"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const overview = await container.studyPlanService.getOverview(user.id)
  return NextResponse.json(studyPlanOverviewSchema.parse(overview))
}
