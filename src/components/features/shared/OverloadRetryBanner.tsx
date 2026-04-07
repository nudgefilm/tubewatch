"use client"

import { useState, useEffect, useRef } from "react"
import { AlertCircle } from "lucide-react"

const OVERLOAD_KEYWORDS = ["high demand", "폭주", "UNAVAILABLE", "503", "overloaded"]
const AUTO_RETRY_SEC = 60

export function isOverloadError(msg: string): boolean {
  return OVERLOAD_KEYWORDS.some((k) => msg.includes(k))
}

interface OverloadRetryBannerProps {
  message: string
  isRequesting: boolean
  onRetry: () => void
}

export function OverloadRetryBanner({ message, isRequesting, onRetry }: OverloadRetryBannerProps) {
  const overload = isOverloadError(message)
  const [sec, setSec] = useState(overload ? AUTO_RETRY_SEC : 0)
  const firedRef = useRef(false)

  useEffect(() => {
    if (!overload) return
    firedRef.current = false
    setSec(AUTO_RETRY_SEC)
    const id = setInterval(() => {
      setSec((prev) => {
        if (prev <= 1) {
          clearInterval(id)
          if (!firedRef.current) { firedRef.current = true; onRetry() }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message])

  if (!overload) {
    return <p className="text-xs text-destructive">{message}</p>
  }

  return (
    <div className="rounded-md border border-amber-300/60 bg-amber-50/60 px-3 py-2.5 space-y-1.5 dark:bg-amber-950/20 dark:border-amber-700/40">
      <div className="flex items-start gap-2">
        <AlertCircle className="size-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{message}</p>
      </div>
      <div className="flex items-center gap-2 pl-5">
        <span className="text-xs text-amber-700 dark:text-amber-400 tabular-nums">
          {sec > 0 ? `${sec}초 후 자동 재시도` : "재시도 중…"}
        </span>
        <button
          onClick={() => { firedRef.current = true; onRetry() }}
          disabled={isRequesting || sec === 0}
          className="text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900 disabled:opacity-50 dark:text-amber-400"
        >
          지금 재시도
        </button>
      </div>
    </div>
  )
}
