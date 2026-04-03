/**
 * Analysis 페이지 엔진.
 * AnalysisPageViewModel → UI 섹션별 렌더 props 변환.
 * UI 컴포넌트는 이 파일의 출력값만 받아 렌더링한다.
 */
import type { AnalysisPageViewModel, AnalysisVideoRow } from "@/lib/analysis/analysisPageViewModel"

// ── 날짜 포맷 유틸 ────────────────────────────────────────────────────────────

/**
 * ISO 날짜 문자열을 'YYYY-MM-DD HH:mm' 형식으로 변환한다.
 * 이 함수는 클라이언트 환경(마운트 이후)에서만 호출해야 한다.
 * 서버 렌더 시 호출하면 타임존 차이로 하이드레이션 에러가 발생할 수 있다.
 */
export function formatAnalysisDate(iso: string | null | undefined): string {
  if (!iso || iso === "—") return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return "—"
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ── 출력 타입 ──────────────────────────────────────────────────────────────────

export type AnalysisSectionScores = Partial<{
  channelActivity: number
  audienceResponse: number
  contentStructure: number
  seoOptimization: number
  growthMomentum: number
  subscriptionConversion: number
}>

// ── 내부 계산 함수 ─────────────────────────────────────────────────────────────

type StatusBadge = "성장세" | "정체 구간" | "회복 필요" | "구조 재정비 필요" | "초기 성장"

function deriveStatusBadge(score: number | undefined): StatusBadge {
  if (score == null) return "초기 성장"
  if (score >= 75) return "성장세"
  if (score >= 55) return "정체 구간"
  if (score >= 40) return "회복 필요"
  return "구조 재정비 필요"
}

function parseNumFromItemValue(value: string): number {
  const n = parseFloat(value.replace(/[^0-9.]/g, ""))
  return Number.isFinite(n) ? n : 0
}

function mapToChannelData(vm: AnalysisPageViewModel) {
  const activityCard = vm.diagnosisCards.find((c) => c.title === "업로드·활동")
  const recentUploadsItem = activityCard?.items.find((i) => i.label.includes("30일"))
  const recentUploads = recentUploadsItem ? parseNumFromItemValue(recentUploadsItem.value) : 0

  return {
    id: vm.selectedChannelId ?? "",
    name: vm.channel?.title ?? "채널 없음",
    thumbnail: vm.channel?.thumbnailUrl ?? "/placeholder.svg",
    subscribers: vm.channel?.subscriberCount ?? 0,
    totalVideos: vm.channel?.videoCount ?? 0,
    recentUploads,
    channelDiagnosis: vm.headlineDiagnosis ?? "분석 결과 없음",
    statusSummary: vm.patternSummaryLine ?? "표본 부족 — 영상을 더 업로드하면 정확도가 높아집니다.",
    statusBadge: deriveStatusBadge(vm.scoreGauge?.score),
    lastAnalyzedAt: vm.lastRunAt ?? "—",
  }
}

function mapToKpiData(vm: AnalysisPageViewModel) {
  const activityCard = vm.diagnosisCards.find((c) => c.title === "업로드·활동")
  const responseCard = vm.diagnosisCards.find((c) => c.title === "조회·반응")
  const structureCard = vm.diagnosisCards.find((c) => c.title === "콘텐츠·구조")

  const FALLBACK_LABEL = "표시 가능한 세부 지표"
  const activityItems = activityCard?.items.filter((i) => i.label !== FALLBACK_LABEL) ?? []
  const responseItems = responseCard?.items.filter((i) => i.label !== FALLBACK_LABEL) ?? []
  const structureItems = structureCard?.items.filter((i) => i.label !== FALLBACK_LABEL) ?? []

  const intervalItem = activityItems.find((i) => i.label.includes("간격"))
  const intervalDays = intervalItem != null ? parseNumFromItemValue(intervalItem.value) : null
  const uploadsPerWeek: number | null =
    intervalDays != null && intervalDays > 0
      ? Math.round((7 / intervalDays) * 10) / 10
      : intervalDays === 0 ? 0 : null

  const avgViewsItem = responseItems.find((i) => i.label.includes("평균 조회수"))
  const avgViews: number | null = avgViewsItem
    ? parseNumFromItemValue(avgViewsItem.value)
    : vm.channel?.avgViews.value ?? null

  const medianViewsItem = responseItems.find((i) => i.label.includes("중앙"))
  const medianViews = medianViewsItem
    ? parseNumFromItemValue(medianViewsItem.value)
    : avgViews != null ? Math.round(avgViews * 0.8) : 0

  const videosWithViews = vm.recentVideos.filter((v) => v.viewCount != null)
  let trendValue = 0
  let trendDir: "상승" | "유지" | "하락" = "유지"
  if (videosWithViews.length >= 2) {
    const oldest = videosWithViews[videosWithViews.length - 1].viewCount ?? 0
    const newest = videosWithViews[0].viewCount ?? 0
    if (oldest > 0) {
      trendValue = Math.round(((newest - oldest) / oldest) * 100)
      trendDir = trendValue > 5 ? "상승" : trendValue < -5 ? "하락" : "유지"
    }
  }

  const structureStatus: "안정" | "불안정" = structureCard?.status === "good" ? "안정" : "불안정"
  const stabilityScore: number | null = structureItems.length > 0
    ? structureCard?.status === "good" ? 75 : 40
    : null

  const structureInterp: string = structureItems.length === 0
    ? "구조 지표 표본이 없어 포맷 일관성 판단이 제한됩니다"
    : structureCard?.status === "good"
      ? "포맷 일관성이 유지되어 시청 지속시간 방어에 유리한 신호입니다"
      : "콘텐츠 구조 편차가 감지되어 초반 이탈이 높아질 수 있는 경향이 읽힙니다"

  const uploadStatus: "양호" | "보통" | "부족" =
    uploadsPerWeek != null && uploadsPerWeek >= 3 ? "양호"
    : uploadsPerWeek != null && uploadsPerWeek >= 1 ? "보통"
    : "부족"

  const uploadInterp: string =
    uploadsPerWeek == null
      ? "발행 간격 데이터가 없어 리듬 판단이 제한됩니다"
      : uploadsPerWeek >= 3
        ? "꾸준한 발행 빈도로 구독자 복귀 기대가 형성되기에 유리한 구조입니다"
        : uploadsPerWeek >= 1
          ? "발행 주기가 다소 불규칙해 구독자 복귀 패턴이 아직 고르게 형성되지 않을 수 있습니다"
          : "업로드 공백이 감지되어 반복 시청 가능성이 낮아질 수 있는 경향이 읽힙니다"

  const viewInterpretation: string =
    videosWithViews.length < 2
      ? "영상 수가 부족해 흐름 방향을 판단하기 어렵습니다"
      : trendDir === "상승"
        ? "최근 조회 흐름이 상승 경향이어서 현재 포맷 방향이 작동하고 있는 신호로 볼 수 있습니다"
        : trendDir === "하락"
          ? "최근 조회 흐름이 내려오고 있어 제목·썸네일·포맷 중 하나를 점검할 필요가 있는 경향이 읽힙니다"
          : "조회 흐름이 일정 수준을 유지하고 있어 안정적인 구조일 수 있습니다"

  const baselineInterp: string =
    avgViews == null
      ? "조회 데이터가 없어 현재 채널의 기대 성과 기준을 설정하기 어렵습니다"
      : vm.channel?.avgViews.lowSampleWarning
        ? "표본이 적어 이 수치가 흔들릴 수 있습니다. 영상이 쌓이면 기준선이 더 안정화됩니다"
        : "이 수치가 현재 채널의 기대 성과 기준선입니다. 이하 영상은 포맷 점검 대상으로 볼 수 있습니다"

  const medRatio = avgViews != null && avgViews > 0 ? medianViews / avgViews : null
  const auxInterp: string =
    medRatio != null && medRatio < 0.7
      ? "평균보다 중앙값이 낮아 일부 고조회 영상에 성과가 집중되어 있는 구조일 수 있습니다"
      : medRatio != null && medRatio >= 0.9
        ? "평균과 중앙값이 가까워 성과가 고르게 분포되어 있는 신호로 볼 수 있습니다"
        : "표본 기반 추정치입니다. 평균과 중앙값 차이가 클수록 성과 집중도가 높은 경향입니다"

  return {
    uploadFrequency: { value: uploadsPerWeek, status: uploadStatus, interpretation: uploadInterp },
    viewTrend: { value: trendValue, trend: trendDir, interpretation: viewInterpretation },
    contentStability: {
      titleLengthVariance: 0.2,
      videoLengthVariance: 0.2,
      keywordClusterVariance: 0.2,
      stabilityScore,
      status: structureStatus,
      interpretation: structureInterp,
    },
    baselinePerformance: { averageViews: avgViews, interpretation: baselineInterp },
    auxiliaryBaseline: {
      medianViews,
      top20Threshold: Math.round((avgViews ?? 0) * 2),
      interpretation: auxInterp,
    },
  }
}

function mapToViewTrendData(videos: AnalysisVideoRow[]) {
  return videos
    .slice(0, 10)
    .reverse()
    .map((v, i) => ({
      index: i + 1,
      views: v.viewCount ?? 0,
      date: v.publishedAt ? v.publishedAt.slice(5, 10).replace("-", "/") : `영상${i + 1}`,
    }))
}

function mapToVideoData(videos: AnalysisVideoRow[]) {
  return videos.map((v, i) => ({
    id: `video-${i}`,
    thumbnail: v.thumbnailUrl ?? "/placeholder.svg",
    title: v.title,
    uploadDate: v.publishedAt ?? "",
    views: v.viewCount ?? 0,
    likeCount: v.likeCount ?? null,
    commentCount: v.commentCount ?? null,
    duration: v.durationLabel ?? "—",
    performanceBadge: (
      v.relativeBadge?.includes("높은") ? "상위" :
      v.relativeBadge?.includes("낮은") ? "하위" : "평균권"
    ) as "상위" | "하위" | "평균권",
    patternTags: [] as string[],
  }))
}

function mapToComparisonData(vm: AnalysisPageViewModel) {
  if (vm.topVideos.length === 0 && vm.weakVideos.length === 0) return null

  const avgV = (vids: AnalysisVideoRow[]) => {
    const withV = vids.filter((v) => v.viewCount != null)
    if (!withV.length) return 0
    return Math.round(withV.reduce((s, v) => s + (v.viewCount ?? 0), 0) / withV.length)
  }
  const avgTitle = (vids: AnalysisVideoRow[]) => {
    if (!vids.length) return 0
    return Math.round(vids.reduce((s, v) => s + v.title.length, 0) / vids.length)
  }

  return {
    topGroup: {
      avgViews: avgV(vm.topVideos),
      avgTitleLength: avgTitle(vm.topVideos),
      avgVideoDuration: vm.topVideos[0]?.durationLabel ?? "—",
      uploadInterval: 0,
      commonPatterns: vm.topVideos.map((v) => v.title.slice(0, 18) + "…").slice(0, 3),
    },
    bottomGroup: {
      avgViews: avgV(vm.weakVideos),
      avgTitleLength: avgTitle(vm.weakVideos),
      avgVideoDuration: vm.weakVideos[0]?.durationLabel ?? "—",
      uploadInterval: 0,
      commonPatterns: vm.weakVideos.map((v) => v.title.slice(0, 18) + "…").slice(0, 3),
    },
    differencePoints: vm.performanceCompareSummary
      ? [vm.performanceCompareSummary]
      : ["상위/하위 영상 조회수 패턴 비교 기반 요약"],
  }
}

function mapToSummaryData(vm: AnalysisPageViewModel) {
  return {
    strengths: vm.strengths.length > 0 ? vm.strengths : ["분석 데이터 부족"],
    improvements: vm.urgentImprovements.length > 0 ? vm.urgentImprovements : ["분석 데이터 부족"],
    evidenceSummary: vm.sampleSizeNote ?? "최근 영상 표본 기준 분석",
    keyBottleneck: vm.patternSummaryLine ?? vm.urgentImprovements[0] ?? "분석 데이터가 부족합니다",
    nextStepLinks: [
      { label: "Channel DNA", description: "강점 패턴이 어떤 포맷과 주제에서 반복되는지 확인" },
      { label: "Action Plan", description: "약한 구간을 개선할 구체적 실행 방향 확인" },
    ],
  }
}

const TITLE_TO_SECTION_KEY: Record<string, keyof AnalysisSectionScores> = {
  "업로드·활동": "channelActivity",
  "조회·반응": "audienceResponse",
  "콘텐츠·구조": "contentStructure",
  "메타·발견성": "seoOptimization",
  "성장 신호": "growthMomentum",
  "채널 활동 패턴": "channelActivity",
  "시청자 반응 구조": "audienceResponse",
  "SEO 최적화 상태": "seoOptimization",
  "성장 모멘텀": "growthMomentum",
  "구독 전환 구조": "subscriptionConversion",
}

function mapToSectionScores(vm: AnalysisPageViewModel): AnalysisSectionScores | undefined {
  if (vm.diagnosisCards.length === 0) return undefined
  const out: AnalysisSectionScores = {}
  for (const card of vm.diagnosisCards) {
    const key = TITLE_TO_SECTION_KEY[card.title]
    if (key != null) out[key] = card.score
  }
  return Object.keys(out).length > 0 ? out : undefined
}

function buildTrendInterpretation(vm: AnalysisPageViewModel, trendValue: number, trendDir: "상승" | "유지" | "하락"): string | undefined {
  const base = vm.growthScenarioLine
  if (!base) return undefined

  // 조회 흐름 % 기반 긍정 접두 문구를 생성해 앞에 붙인다
  let prefix: string | null = null
  if (trendDir === "상승" && trendValue > 0) {
    prefix = `최근 영상 기준 조회 흐름이 ${trendValue}% 상승 중입니다.`
  } else if (trendDir === "유지") {
    prefix = "조회 흐름이 현재 수준을 유지하고 있습니다."
  }

  return prefix ? `${prefix} ${base}` : base
}

// ── 엔진 진입점 ────────────────────────────────────────────────────────────────

export function buildAnalysisPageSections(vm: AnalysisPageViewModel) {
  const kpiData = mapToKpiData(vm)
  return {
    channelData: mapToChannelData(vm),
    score: vm.scoreGauge?.score ?? 0,
    sectionScores: mapToSectionScores(vm),
    kpiData,
    trendData: mapToViewTrendData(vm.recentVideos),
    videosData: mapToVideoData(vm.recentVideos),
    comparisonData: mapToComparisonData(vm),
    summaryData: mapToSummaryData(vm),
    trendInterpretation: buildTrendInterpretation(vm, kpiData.viewTrend.value, kpiData.viewTrend.trend),
  }
}
