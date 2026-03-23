/**
 * (app) 라우트용 최소 로딩 UI.
 * - 인위 지연·과장 문구·전역 오버레이 없음
 * - pulse/shimmer 없이 정적 톤만 사용
 * - channel-dna / next-trend: loading.tsx에서 variant만 추가하면 동일 패턴 재사용
 */
export type AppRouteLoadingVariant =
  | "analysis"
  | "action-plan"
  | "seo-lab"
  | "channel-dna"
  | "next-trend";

const COPY: Record<AppRouteLoadingVariant, string> = {
  analysis: "채널 데이터를 준비하는 중입니다",
  "action-plan": "데이터를 불러오는 중입니다",
  "seo-lab": "데이터를 불러오는 중입니다",
  "channel-dna": "데이터를 불러오는 중입니다",
  "next-trend": "데이터를 불러오는 중입니다",
};

export function AppRouteLoading({ variant }: { variant: AppRouteLoadingVariant }) {
  const message = COPY[variant];

  return (
    <div
      className="min-h-[50vh] bg-background flex flex-col items-center justify-center px-6 py-16"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="sr-only">{message}</p>
      <p className="text-sm text-muted-foreground text-center mb-6">{message}</p>

      {/* 실제 레이아웃을 흉내 내지 않는 최소 줄 3개 */}
      <div className="w-full max-w-sm space-y-2 mb-8" aria-hidden="true">
        <div className="h-2 rounded-full bg-muted/50 w-full" />
        <div className="h-2 rounded-full bg-muted/50 w-[85%] mx-auto" />
        <div className="h-2 rounded-full bg-muted/50 w-[60%] mx-auto" />
      </div>

      {/* 빈 카드 형태 3개 (내용 없음, 데이터 위장 없음) */}
      <div
        className="w-full max-w-md grid grid-cols-1 sm:grid-cols-3 gap-3"
        aria-hidden="true"
      >
        <div className="h-14 rounded-lg border border-border bg-muted/20" />
        <div className="h-14 rounded-lg border border-border bg-muted/20" />
        <div className="h-14 rounded-lg border border-border bg-muted/20" />
      </div>
    </div>
  );
}
