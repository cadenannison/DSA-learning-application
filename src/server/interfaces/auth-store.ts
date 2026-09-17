import type { User } from "@/server/models/domain"

export interface StoredUser extends User {
  passwordHash: string
  passwordSalt: string
}

export interface SessionRecord {
  id: string
  userId: string
  expiresAt: string
}

export interface AuthStore {
  createUser(user: Omit<StoredUser, "id" | "createdAt">): Promise<User>
  getUserByUsername(username: string): Promise<StoredUser | null>
  getUserById(id: string): Promise<User | null>

  createAuthSession(session: SessionRecord): Promise<void>
  getAuthSession(id: string): Promise<SessionRecord | null>
  deleteAuthSession(id: string): Promise<void>
}
