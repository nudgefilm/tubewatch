"use client"

import { useRef, useState } from "react"
import { X, Download, Zap } from "lucide-react"

export interface ActionCallModalProps {
  sentence: string
  channelTitle?: string | null
  onClose: () => void
  onDismissToday: () => void
}

export function ActionCallModal({
  sentence,
  channelTitle,
  onClose,
  onDismissToday,
}: ActionCallModalProps) {
  const [downloading, setDownloading] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  async function handleDownload() {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const { default: html2canvas } = await import("html2canvas")
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#09090b",
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const link = document.createElement("a")
      link.download = "tubewatch-action.png"
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch {
      // silent
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* close */}
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute -top-3 -right-3 z-10 rounded-full bg-zinc-900 border border-zinc-700 p-1.5 text-zinc-400 hover:text-white shadow-lg transition-colors"
        >
          <X className="size-3" />
        </button>

        {/* card — html2canvas capture target */}
        <div
          ref={cardRef}
          style={{ backgroundColor: "#09090b" }}
          className="rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl"
        >
          {/* header */}
          <div className="bg-primary px-5 py-2.5 flex items-center gap-2">
            <Zap className="size-3.5 text-primary-foreground" fill="currentColor" />
            <span className="text-[11px] font-bold text-primary-foreground tracking-widest uppercase select-none">
              지금 바로 실행하세요
            </span>
          </div>

          {/* sentence */}
          <div className="px-6 py-8 text-center">
            <p
              className="text-[22px] font-black leading-snug tracking-tight"
              style={{ color: "#ffffff" }}
            >
              {sentence}
            </p>
          </div>

          {/* footer */}
          <div className="px-5 pb-5 text-center space-y-1">
            {channelTitle && (
              <p className="text-xs" style={{ color: "#52525b" }}>
                {channelTitle} 분석 기반
              </p>
            )}
            <p className="text-[10px]" style={{ color: "#3f3f46" }}>
              tubewatch.kr
            </p>
          </div>
        </div>

        {/* action buttons */}
        <div className="mt-3 flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Download className="size-4" />
            {downloading ? "저장 중…" : "이미지로 저장"}
          </button>
          <button
            onClick={onDismissToday}
            className="rounded-xl border border-zinc-700 px-3 py-2.5 text-xs text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"
          >
            오늘은 그만보기
          </button>
        </div>
      </div>
    </div>
  )
}
