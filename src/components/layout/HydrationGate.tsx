"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"

type HydrationGateProps = {
  children: ReactNode
}

export function HydrationGate({ children }: HydrationGateProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const frame = window.requestAnimationFrame(() => {
      document.documentElement.classList.add("hydrated")
    })

    return () => {
      window.cancelAnimationFrame(frame)
      document.documentElement.classList.remove("hydrated")
    }
  }, [])

  return <div data-hydrated={mounted ? "true" : "false"}>{children}</div>
}
