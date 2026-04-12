"use client"

import { useState, useEffect, useRef } from "react"

/**
 * 페이크 프로그레스 바 — 분석 진행 중 심리적 안정감 제공
 * 0→90% 점진(~25s), 완료 시 100% 점프 후 fade out
 */
export function AnalysisProgressBar({ isActive }: { isActive: boolean }) {
  const [progress, setProgress] = useState(0)
  const [completing, setCompleting] = useState(false)
  const hasStartedRef = useRef(false)

  useEffect(() => {
    if (isActive) {
      hasStartedRef.current = true
      setCompleting(false)
      setProgress(0)
      // 0→90% 목표 ~25s: 초반 빠르게, 후반 느리게
      const id = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev
          const inc = prev < 45 ? 3 : prev < 82 ? 1.5 : 0.2
          return Math.min(prev + inc, 90)
        })
      }, 300)
      return () => clearInterval(id)
    } else if (hasStartedRef.current) {
      // 완료 → 100% 점프 후 fade out
      setProgress(100)
      setCompleting(true)
      const timer = setTimeout(() => {
        setCompleting(false)
        setProgress(0)
        hasStartedRef.current = false
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [isActive])

  if (!isActive && !completing) return null

  return (
    <div
      className={`w-full h-[3px] rounded-full bg-primary/15 overflow-hidden transition-opacity duration-500 ${completing ? "opacity-0" : "opacity-100"}`}
    >
      <div
        className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
