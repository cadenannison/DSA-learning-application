import { cookies } from "next/headers"
import { container } from "@/server/container"
import type { User } from "@/server/models/domain"

export const SESSION_COOKIE_NAME = "dsa_session"

/** Resolves the logged-in user from the session cookie, or null if there isn't one / it's
 * expired. Route handlers that require auth check this and return 401 themselves — kept as a
 * plain helper rather than Next.js middleware so each route's auth requirement stays visible
 * at the call site, matching this app's "route handlers are thin, no hidden magic" convention. */
export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!sessionId) return null

  return container.authService.getUserForSession(sessionId)
}
