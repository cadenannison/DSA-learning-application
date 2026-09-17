import { apiClient } from "@/lib/api-client"
import type { User } from "@/types"

export interface AuthView {
  setLoading(loading: boolean): void
  setUser(user: User | null): void
  setError(message: string | null): void
}

export class AuthPresenter {
  constructor(private readonly view: AuthView) {}

  async loadCurrentUser(): Promise<void> {
    this.view.setLoading(true)
    try {
      const user = await apiClient.getCurrentUser()
      this.view.setUser(user)
    } finally {
      this.view.setLoading(false)
    }
  }

  async register(username: string, password: string): Promise<void> {
    this.view.setError(null)
    try {
      const user = await apiClient.register(username, password)
      this.view.setUser(user)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to register")
      throw error
    }
  }

  async login(username: string, password: string): Promise<void> {
    this.view.setError(null)
    try {
      const user = await apiClient.login(username, password)
      this.view.setUser(user)
    } catch (error) {
      this.view.setError(error instanceof Error ? error.message : "Failed to log in")
      throw error
    }
  }

  async logout(): Promise<void> {
    await apiClient.logout()
    this.view.setUser(null)
  }
}
