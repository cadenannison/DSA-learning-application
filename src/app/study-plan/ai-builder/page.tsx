"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AuthGate } from "@/components/auth-gate"
import { PageShell } from "@/components/ui/page-shell"
import { PageHeader } from "@/components/ui/page-header"
import { apiClient, ApiClientError } from "@/lib/api-client"

export default function AiStudyPlanBuilderPage() {
  return <AuthGate>{() => <AiStudyPlanBuilderContent />}</AuthGate>
}

function AiStudyPlanBuilderContent() {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [promptLoading, setPromptLoading] = useState(true)
  const [promptError, setPromptError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const [payload, setPayload] = useState("")
  const [compiling, setCompiling] = useState(false)
  const [compileError, setCompileError] = useState<string | null>(null)

  useEffect(() => {
    apiClient
      .getAiStudyPlanMetaPrompt()
      .then(setPrompt)
      .catch((error) => {
        setPromptError(error instanceof Error ? error.message : "Failed to load prompt")
      })
      .finally(() => setPromptLoading(false))
  }, [])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setPromptError("Couldn't copy automatically — select the text and copy manually.")
    }
  }

  async function handleCompile() {
    if (!payload.trim()) {
      setCompileError("Paste the JSON payload your AI agent gave you first")
      return
    }

    setCompiling(true)
    setCompileError(null)

    try {
      const { planId } = await apiClient.buildAiStudyPlan(payload)
      router.push(`/study-plan/${planId}`)
    } catch (error) {
      setCompileError(error instanceof ApiClientError ? error.message : "Failed to build plan")
      setCompiling(false)
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Create with AI"
        context="Build a study plan by interviewing an AI agent about your background, then let Gemini turn that into a ready-to-go plan"
      />

      <section className="mb-8 rounded-card border border-border bg-surface p-5">
        <h2 className="mb-1 font-display text-lg font-semibold text-text-1">
          Step 1 — Interview yourself with an AI agent
        </h2>
        <p className="mb-4 text-sm text-text-2">
          Copy this prompt into ChatGPT, Claude, Cursor, or any capable LLM. It will ask you
          questions about your background and self-assessed skill level, then hand back a JSON
          payload for Step 2.
        </p>

        {promptLoading && <p className="text-sm text-text-2">Loading prompt...</p>}
        {promptError && <p className="text-sm text-danger">{promptError}</p>}

        {!promptLoading && !promptError && (
          <>
            <textarea
              readOnly
              value={prompt}
              rows={12}
              className="mb-3 w-full rounded-control border border-border bg-surface-2 p-3 font-mono text-xs text-text-1 focus:border-accent focus:outline-none"
            />
            <button
              onClick={handleCopy}
              className="min-h-[44px] rounded-control bg-accent px-4 text-sm font-semibold text-bg"
            >
              {copied ? "Copied!" : "Copy prompt"}
            </button>
          </>
        )}
      </section>

      <section className="rounded-card border border-border bg-surface p-5">
        <h2 className="mb-1 font-display text-lg font-semibold text-text-1">
          Step 2 — Paste the result and generate your plan
        </h2>
        <p className="mb-4 text-sm text-text-2">
          Paste whatever your AI agent gave you back — Gemini will normalize it and build the
          plan. It doesn&apos;t need to be perfectly formatted JSON.
        </p>

        <textarea
          value={payload}
          onChange={(e) => setPayload(e.target.value)}
          placeholder="Paste the JSON payload from your AI agent here..."
          rows={10}
          className="mb-3 w-full rounded-control border border-border bg-surface-2 p-3 font-mono text-xs text-text-1 placeholder:text-text-3 focus:border-accent focus:outline-none"
        />

        {compileError && <p className="mb-3 text-sm text-danger">{compileError}</p>}

        <button
          onClick={handleCompile}
          disabled={compiling}
          className="min-h-[44px] rounded-control bg-accent px-4 text-sm font-semibold text-bg disabled:opacity-50"
        >
          {compiling ? "Compiling..." : "Compile & Generate"}
        </button>
      </section>
    </PageShell>
  )
}
