"use client"

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react"
import { ActionCallModal } from "@/components/features/shared/ActionCallModal"

const STORAGE_KEY = "tubewatch-actioncall-dismissed"

interface ActionCallContextValue {
  /** 분석 페이지에서 호출 — 세션당 1회, 오늘 그만보기 체크 전까지 유지 */
  trigger: (sentence: string, channelTitle?: string | null) => void
}

const ActionCallContext = createContext<ActionCallContextValue>({
  trigger: () => {},
})

export function useActionCall() {
  return useContext(ActionCallContext)
}

export function ActionCallProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [sentence, setSentence] = useState<string | null>(null)
  const [channelTitle, setChannelTitle] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  // 이번 세션에서 이미 표시된 경우 재표시 방지
  const shownRef = useRef(false)

  const trigger = useCallback((s: string, ct?: string | null) => {
    if (shownRef.current) return
    const today = new Date().toISOString().slice(0, 10)
    if (localStorage.getItem(STORAGE_KEY) === today) return

    shownRef.current = true
    setSentence(s)
    setChannelTitle(ct ?? null)
    setOpen(true)
  }, [])

  function handleClose() {
    setOpen(false)
    // shownRef는 true 유지 → 이번 세션에서 다시 뜨지 않음
  }

  function handleDismissToday() {
    const today = new Date().toISOString().slice(0, 10)
    localStorage.setItem(STORAGE_KEY, today)
    setOpen(false)
  }

  return (
    <ActionCallContext.Provider value={{ trigger }}>
      {children}
      {open && sentence && (
        <ActionCallModal
          sentence={sentence}
          channelTitle={channelTitle}
          onClose={handleClose}
          onDismissToday={handleDismissToday}
        />
      )}
    </ActionCallContext.Provider>
  )
}
