import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import type { AuthStore } from "@/server/interfaces/auth-store"
import type { User } from "@/server/models/domain"

const scryptAsync = promisify(scrypt)

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days — local personal-use tool, long-lived login
const KEY_LENGTH = 64

async function hashPassword(password: string, salt: string): Promise<string> {
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer
  return derived.toString("hex")
}

export class UsernameTakenError extends Error {
  constructor() {
    super("Username is already taken")
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid username or password")
  }
}

/** Simple local-account auth: scrypt-hashed passwords (Node's built-in crypto, no new
 * dependency), opaque random session tokens stored server-side in `sessions` — no JWTs, no
 * external provider. Fits a local-first tool that runs via `npm run dev`, not a hosted
 * multi-tenant service. */
export class AuthService {
  constructor(private readonly store: AuthStore) {}

  async register(username: string, password: string): Promise<User> {
    const existing = await this.store.getUserByUsername(username)
    if (existing) throw new UsernameTakenError()

    const salt = randomBytes(16).toString("hex")
    const passwordHash = await hashPassword(password, salt)

    return this.store.createUser({ username, passwordHash, passwordSalt: salt })
  }

  async login(username: string, password: string): Promise<{ user: User; sessionId: string }> {
    const stored = await this.store.getUserByUsername(username)
    if (!stored) throw new InvalidCredentialsError()

    const candidateHash = await hashPassword(password, stored.passwordSalt)
    const candidateBuf = Buffer.from(candidateHash, "hex")
    const storedBuf = Buffer.from(stored.passwordHash, "hex")

    if (candidateBuf.length !== storedBuf.length || !timingSafeEqual(candidateBuf, storedBuf)) {
      throw new InvalidCredentialsError()
    }

    const sessionId = randomUUID()
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
    await this.store.createAuthSession({ id: sessionId, userId: stored.id, expiresAt })

    return { user: { id: stored.id, username: stored.username, createdAt: stored.createdAt }, sessionId }
  }

  async logout(sessionId: string): Promise<void> {
    await this.store.deleteAuthSession(sessionId)
  }

  async getUserForSession(sessionId: string): Promise<User | null> {
    const session = await this.store.getAuthSession(sessionId)
    if (!session) return null

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      await this.store.deleteAuthSession(sessionId)
      return null
    }

    return this.store.getUserById(session.userId)
  }
}
