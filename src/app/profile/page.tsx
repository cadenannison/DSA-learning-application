"use client"

import Link from "next/link"
import { AuthGate } from "@/components/auth-gate"
import { ThemeToggle } from "@/components/theme-toggle"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import type { User } from "@/types"

export default function ProfilePage() {
  return <AuthGate>{(user, logout) => <SettingsContent user={user} logout={logout} />}</AuthGate>
}

function SettingsContent({ user, logout }: { user: User; logout: () => void }) {
  return (
    <PageShell>
      <PageHeader
        title="Profile"
        context="Account and preferences"
        action={
          <Link href="/profile/stats" className="text-xs whitespace-nowrap text-accent hover:underline">
            View stats →
          </Link>
        }
      />

      <div className="max-w-xl space-y-5">
        <section className="rounded-card border border-border bg-surface p-[22px_24px]">
          <h2 className="mb-4 font-display text-[15.5px] font-semibold text-text-1">Account</h2>
          <div className="flex items-center justify-between gap-4 py-1.5">
            <span className="text-sm text-text-2">Username</span>
            <span className="text-sm font-medium text-text-1">{user.username}</span>
          </div>
          <div className="flex items-center justify-between gap-4 py-1.5">
            <span className="text-sm text-text-2">Member since</span>
            <span className="text-sm font-medium text-text-1">
              {new Date(user.createdAt).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </section>

        <section className="rounded-card border border-border bg-surface p-[22px_24px]">
          <h2 className="mb-4 font-display text-[15.5px] font-semibold text-text-1">Preferences</h2>
          <div className="flex items-center justify-between gap-4 py-1.5">
            <span className="text-sm text-text-2">Theme</span>
            <ThemeToggle />
          </div>
        </section>

        <section className="rounded-card border border-border bg-surface p-[22px_24px]">
          <h2 className="mb-4 font-display text-[15.5px] font-semibold text-text-1">Session</h2>
          <button
            onClick={logout}
            className="text-sm font-medium text-danger hover:underline"
          >
            Log out
          </button>
        </section>
      </div>
    </PageShell>
  )
}
