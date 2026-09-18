"use client"

import { useEffect, useState } from "react"

const VISIBLE_MS = 3000
const EXIT_ANIMATION_MS = 220

/** A green confirmation bar that rises from the bottom of the viewport and slides back down on
 * its own after a few seconds — used to confirm a passing test case or submit without blocking
 * the results panel above it. `toastKey` should change on every trigger (e.g. a counter or
 * `Date.now()` bumped alongside `message`) so consecutive submissions with identical text each
 * get their own fresh enter/exit cycle instead of the second one being a no-op remount. */
export function SubmitToast({ message, toastKey }: { message: string | null; toastKey: string | number }) {
  if (!message) return null
  return <ToastBanner key={toastKey} message={message} />
}

function ToastBanner({ message }: { message: string }) {
  const [exiting, setExiting] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const dismissTimer = setTimeout(() => setExiting(true), VISIBLE_MS)
    return () => clearTimeout(dismissTimer)
  }, [])

  useEffect(() => {
    if (!exiting) return
    const timeout = setTimeout(() => setVisible(false), EXIT_ANIMATION_MS)
    return () => clearTimeout(timeout)
  }, [exiting])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-1/2 z-50 flex min-h-[44px] items-center gap-2 rounded-control bg-success px-4 py-2.5 text-sm font-semibold text-bg shadow-lg ${
        exiting ? "toast-exit" : "toast-enter"
      }`}
    >
      {message}
    </div>
  )
}
