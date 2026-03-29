export default function AnalysisLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
        {/* Header skeleton */}
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted/60" />
        </div>

        {/* Channel header skeleton */}
        <div className="flex items-center gap-4 rounded-xl border bg-card p-4">
          <div className="size-12 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-5 w-36 animate-pulse rounded bg-muted" />
            <div className="h-3 w-24 animate-pulse rounded bg-muted/60" />
          </div>
        </div>

        {/* Score + KPI skeleton */}
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <div className="h-40 animate-pulse rounded-xl border bg-muted" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl border bg-muted" />
            ))}
          </div>
        </div>

        {/* Trend chart skeleton */}
        <div className="h-48 animate-pulse rounded-xl border bg-muted" />

        {/* Status text */}
        <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
          <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          분석 데이터를 불러오는 중입니다…
        </div>
      </div>
    </div>
  )
}
