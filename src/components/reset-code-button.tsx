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
        className="min-h-[44px] rounded-control border border-danger/40 px-4 text-sm font-medium text-danger hover:bg-danger-soft"
      >
        Reset code
      </button>

      {confirming && (
        <ConfirmDialog
          message="Are you sure you want to reset? Code will be reverted to its initial state."
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
