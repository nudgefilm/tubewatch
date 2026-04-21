"use client"

import { useRef, useState } from "react"
import { X, Download, Zap } from "lucide-react"
import type { ActionCallContent } from "@/lib/next-trend/buildActionCallContent"

export interface ActionCallModalProps {
  content: ActionCallContent
  channelTitle?: string | null
  onClose: () => void
  onDismissToday: () => void
}

export function ActionCallModal({
  content,
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
        backgroundColor: "#fafafa",
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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* close */}
        <button
          onClick={onClose}
          aria-label="닫기"
          className="absolute -top-3 -right-3 z-10 rounded-full bg-white border border-gray-200 p-1.5 text-gray-400 hover:text-gray-700 shadow-md transition-colors"
        >
          <X className="size-3" />
        </button>

        {/* ── card — html2canvas capture target ─────────────────── */}
        <div
          ref={cardRef}
          style={{
            backgroundColor: "#fafafa",
            backgroundImage:
              "radial-gradient(circle, rgba(0,0,0,0.035) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
          className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg"
        >
          {/* header */}
          <div
            className="px-5 pt-5 pb-0 flex items-center gap-1.5"
          >
            <Zap
              className="size-3 shrink-0"
              style={{ color: "#f97316" }}
              fill="#f97316"
            />
            <span
              className="text-[10px] font-bold tracking-widest uppercase"
              style={{ color: "#f97316" }}
            >
              지금 바로 실행하세요
            </span>
          </div>

          {/* timing + action */}
          <div className="px-5 pt-3 pb-0">
            {content.timing && (
              <p
                className="text-[18px] font-black leading-tight tracking-tight"
                style={{ color: "#09090b" }}
              >
                {content.timing}
              </p>
            )}
            <p
              className="text-[18px] font-black leading-tight tracking-tight"
              style={{ color: "#09090b" }}
            >
              올리세요.
            </p>
          </div>

          {/* spec chips */}
          {content.specs.length > 0 && (
            <div className="px-5 pt-3 pb-0 flex flex-wrap gap-1.5">
              {content.specs.map((spec) => (
                <span
                  key={spec}
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: "rgba(249,115,22,0.1)",
                    color: "#ea580c",
                  }}
                >
                  {spec}
                </span>
              ))}
            </div>
          )}

          {/* title candidates */}
          {content.titles.length > 0 && (
            <div className="px-5 pt-4 pb-0">
              <p
                className="text-[9px] font-bold uppercase tracking-widest mb-2"
                style={{ color: "#9ca3af" }}
              >
                제목 후보
              </p>
              <div className="space-y-2">
                {content.titles.map((title, i) => (
                  <p
                    key={i}
                    className="text-[12px] font-semibold leading-snug"
                    style={{ color: "#111827" }}
                  >
                    &ldquo;{title}&rdquo;
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* footer */}
          <div
            className="px-5 pt-4 pb-4 mt-2 border-t text-center"
            style={{ borderColor: "#f3f4f6" }}
          >
            {channelTitle && (
              <p
                className="text-[9px]"
                style={{ color: "#9ca3af" }}
              >
                {channelTitle} 분석 기반
              </p>
            )}
            <p className="text-[9px]" style={{ color: "#d1d5db" }}>
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
            className="rounded-xl border border-gray-300 px-3 py-2.5 text-xs text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-colors"
          >
            오늘은 그만보기
          </button>
        </div>
      </div>
    </div>
  )
}
