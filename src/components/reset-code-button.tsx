"use client"

import { useState } from "react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

interface ResetCodeButtonProps {
  onReset: () => void
}

export function ResetCodeButton({ onReset }: ResetCodeButtonProps) {
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="min-h-[44px] rounded-control border border-border px-4 text-sm text-text-2 hover:bg-surface-2 hover:text-text-1"
      >
        Reset
      </button>

      {confirming && (
        <ConfirmDialog
          message="Are you sure you want to reset?"
          confirmLabel="Yes"
          cancelLabel="No"
          onConfirm={() => {
            onReset()
            setConfirming(false)
          }}
          onCancel={() => setConfirming(false)}
        />
      )}
    </>
  )
}
