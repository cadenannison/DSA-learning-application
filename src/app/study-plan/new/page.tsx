"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import { StudyPlanListPresenter, type StudyPlanListView } from "@/presenter/study-plan-list-presenter"

export default function NewStudyPlanPage() {
  return <AuthGate>{() => <NewStudyPlanForm />}</AuthGate>
}

function NewStudyPlanForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [presenter] = useState(() => {
    const view: StudyPlanListView = { setLoading: () => {}, setPlans: () => {}, setError }
    return new StudyPlanListPresenter(view)
  })

  async function handleCreate() {
    if (!name.trim()) {
      setError("Give this plan a name")
      return
    }

    setCreating(true)
    setError(null)

    const plan = await presenter.createPlan(name)
    if (plan) {
      router.push(`/study-plan/${plan.id}`)
    } else {
      setCreating(false)
    }
  }

  return (
    <PageShell>
      <PageHeader title="New Study Plan" />

      <input
        type="text"
        placeholder="e.g. Google SWE prep"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-4 min-h-[44px] w-full max-w-sm rounded-control border border-border bg-surface px-3 text-sm text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
      />

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={creating}
        className="min-h-[44px] rounded-control bg-accent px-4 text-sm font-semibold text-bg disabled:opacity-50"
      >
        {creating ? "Creating..." : "Create plan"}
      </button>
    </PageShell>
  )
}
