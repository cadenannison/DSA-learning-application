import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE_NAME } from "@/server/auth-context"
import { container } from "@/server/container"
import { registerRequestSchema, userSchema } from "@/server/models/schemas"
import { UsernameTakenError } from "@/server/services/auth-service"

const SESSION_COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = registerRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const user = await container.authService.register(parsed.data.username, parsed.data.password)
    const { sessionId } = await container.authService.login(
      parsed.data.username,
      parsed.data.password
    )

    const response = NextResponse.json(userSchema.parse(user), { status: 201 })
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    })
    return response
  } catch (error) {
    if (error instanceof UsernameTakenError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    throw error
  }
}
