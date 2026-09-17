import { NextResponse } from "next/server"
import { getSessionUser } from "@/server/auth-context"
import { userSchema } from "@/server/models/schemas"

export async function GET() {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 })
  }

  return NextResponse.json(userSchema.parse(user))
}
