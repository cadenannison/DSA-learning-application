import { NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUser } from "@/server/auth-context"
import { container } from "@/server/container"
import { solvedProblemEntrySchema } from "@/server/models/schemas"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  const solvedProblems = await container.statsService.listSolvedProblems(user.id)
  return NextResponse.json(z.array(solvedProblemEntrySchema).parse(solvedProblems))
}
