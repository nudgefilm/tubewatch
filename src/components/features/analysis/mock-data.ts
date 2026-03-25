// Mock data for Channel Analysis page

export interface ChannelData {
  id: string
  name: string
  thumbnail: string
  subscribers: number
  totalVideos: number
  recentUploads: number
  channelDiagnosis: string
  statusSummary: string
  statusBadge: "초기 성장" | "정체 구간" | "회복 필요" | "구조 재정비 필요" | "성장세"
  lastAnalyzedAt: string
}

export interface KpiData {
  uploadFrequency: {
    value: number
    status: "양호" | "보통" | "부족"
    interpretation: string
  }
  viewTrend: {
    value: number
    trend: "상승" | "유지" | "하락"
    interpretation: string
  }
  contentStability: {
    titleLengthVariance: number
    videoLengthVariance: number
    keywordClusterVariance: number
    status: "안정" | "불안정"
    interpretation: string
  }
  baselinePerformance: {
    averageViews: number
    interpretation: string
  }
  auxiliaryBaseline: {
    medianViews: number
    top20Threshold: number
    interpretation: string
  }
}

export interface VideoData {
  id: string
  thumbnail: string
  title: string
  uploadDate: string
  views: number
  duration: string
  performanceBadge: "상위" | "평균권" | "하위" | "관찰 필요"
  patternTags: string[]
}

export interface ComparisonData {
  topGroup: {
    avgTitleLength: number
    avgVideoDuration: string
    avgViews: number
    uploadInterval: number
    commonPatterns: string[]
  }
  bottomGroup: {
    avgTitleLength: number
    avgVideoDuration: string
    avgViews: number
    uploadInterval: number
    commonPatterns: string[]
  }
  differencePoints: string[]
}

export interface SummaryData {
  strengths: string[]
  improvements: string[]
  evidenceSummary: string
  keyBottleneck: string
  nextStepLinks: {
    label: string
    description: string
  }[]
}

export const mockChannelData: ChannelData = {
  id: "UC_sample_channel",
  name: "테크 인사이트 TV",
  thumbnail: "/placeholder.svg",
  subscribers: 245000,
  totalVideos: 387,
  recentUploads: 12,
  channelDiagnosis: "최근 30일간 안정적인 업로드 유지, 조회 흐름 상승세 진입",
  statusSummary: "구독자 대비 최근 조회 성과가 평균 이상을 유지하고 있으며, 콘텐츠 구조의 반복 패턴이 형성되고 있습니다.",
  statusBadge: "성장세",
  lastAnalyzedAt: "2024-01-15 14:32",
}

export const mockKpiData: KpiData = {
  uploadFrequency: {
    value: 3.0,
    status: "양호",
    interpretation: "주 3회 업로드로 일관된 빈도 유지 중",
  },
  viewTrend: {
    value: 12.5,
    trend: "상승",
    interpretation: "최근 10개 영상 평균 조회수 12.5% 상승",
  },
  contentStability: {
    titleLengthVariance: 0.15,
    videoLengthVariance: 0.22,
    keywordClusterVariance: 0.18,
    status: "안정",
    interpretation: "제목/길이/주제 구성이 일관된 패턴 유지",
  },
  baselinePerformance: {
    averageViews: 45200,
    interpretation: "채널 내부 기준선: 최근 20개 영상 평균",
  },
  auxiliaryBaseline: {
    medianViews: 38500,
    top20Threshold: 72000,
    interpretation: "평균 왜곡 보정 시 실제 기대치 38.5K",
  },
}

export const mockViewTrendData = [
  { index: 1, views: 32000, date: "12/20" },
  { index: 2, views: 41000, date: "12/23" },
  { index: 3, views: 38000, date: "12/26" },
  { index: 4, views: 52000, date: "12/29" },
  { index: 5, views: 48000, date: "01/01" },
  { index: 6, views: 61000, date: "01/04" },
  { index: 7, views: 55000, date: "01/07" },
  { index: 8, views: 72000, date: "01/10" },
  { index: 9, views: 68000, date: "01/13" },
  { index: 10, views: 58000, date: "01/15" },
]

export const mockVideosData: VideoData[] = [
  {
    id: "v1",
    thumbnail: "/placeholder.svg",
    title: "2024년 AI 트렌드 총정리 - 개발자가 알아야 할 10가지",
    uploadDate: "2024-01-15",
    views: 72000,
    duration: "18:42",
    performanceBadge: "상위",
    patternTags: ["긴 호흡", "리스트형"],
  },
  {
    id: "v2",
    thumbnail: "/placeholder.svg",
    title: "ChatGPT vs Claude 실사용 비교",
    uploadDate: "2024-01-13",
    views: 68000,
    duration: "12:15",
    performanceBadge: "상위",
    patternTags: ["비교형", "반복 포맷"],
  },
  {
    id: "v3",
    thumbnail: "/placeholder.svg",
    title: "React 19 새 기능 3분 정리",
    uploadDate: "2024-01-10",
    views: 55000,
    duration: "3:28",
    performanceBadge: "평균권",
    patternTags: ["짧은 제목", "숏폼"],
  },
  {
    id: "v4",
    thumbnail: "/placeholder.svg",
    title: "개발자 생산성 200% 올리는 VSCode 설정",
    uploadDate: "2024-01-07",
    views: 61000,
    duration: "15:20",
    performanceBadge: "상위",
    patternTags: ["실용형", "긴 호흡"],
  },
  {
    id: "v5",
    thumbnail: "/placeholder.svg",
    title: "Next.js 15 마이그레이션 가이드",
    uploadDate: "2024-01-04",
    views: 48000,
    duration: "22:10",
    performanceBadge: "평균권",
    patternTags: ["긴 호흡", "튜토리얼"],
  },
  {
    id: "v6",
    thumbnail: "/placeholder.svg",
    title: "2024 개발자 연봉 현실",
    uploadDate: "2024-01-01",
    views: 52000,
    duration: "8:45",
    performanceBadge: "평균권",
    patternTags: ["이슈형"],
  },
  {
    id: "v7",
    thumbnail: "/placeholder.svg",
    title: "TypeScript 5.3 주요 변경점",
    uploadDate: "2023-12-29",
    views: 38000,
    duration: "10:30",
    performanceBadge: "평균권",
    patternTags: ["반복 포맷"],
  },
  {
    id: "v8",
    thumbnail: "/placeholder.svg",
    title: "면접 질문 모음 - 시니어편",
    uploadDate: "2023-12-26",
    views: 41000,
    duration: "25:00",
    performanceBadge: "평균권",
    patternTags: ["긴 호흡", "리스트형"],
  },
  {
    id: "v9",
    thumbnail: "/placeholder.svg",
    title: "Rust 입문 1화",
    uploadDate: "2023-12-23",
    views: 28000,
    duration: "35:12",
    performanceBadge: "하위",
    patternTags: ["실험형", "시리즈"],
  },
  {
    id: "v10",
    thumbnail: "/placeholder.svg",
    title: "개발 브이로그 #12",
    uploadDate: "2023-12-20",
    views: 32000,
    duration: "12:00",
    performanceBadge: "하위",
    patternTags: ["실험형"],
  },
]

export const mockComparisonData: ComparisonData = {
  topGroup: {
    avgTitleLength: 28,
    avgVideoDuration: "15:25",
    avgViews: 67000,
    uploadInterval: 3,
    commonPatterns: ["비교형/리스트형 포맷", "실용 정보 중심", "10~20분 영상"],
  },
  bottomGroup: {
    avgTitleLength: 12,
    avgVideoDuration: "23:36",
    avgViews: 30000,
    uploadInterval: 4,
    commonPatterns: ["실험형 콘텐츠", "시리즈/브이로그", "긴 러닝타임"],
  },
  differencePoints: [
    "상위 그룹은 제목이 2배 이상 길고 구체적",
    "상위 그룹은 10~20분 내 영상이 집중",
    "하위 그룹은 실험형/비정형 콘텐츠 비중 높음",
    "상위 그룹은 반복 포맷 활용도가 높음",
  ],
}

export const mockSummaryData: SummaryData = {
  strengths: [
    "일관된 주 3회 업로드 빈도 유지",
    "비교형/리스트형 포맷에서 반복적 성과",
    "10~20분 영상 구간에서 시청 유지율 최적화",
  ],
  improvements: [
    "실험형 콘텐츠 비중 조정 필요",
    "긴 러닝타임 영상의 초반 구성 점검",
    "제목 구체성 강화로 클릭률 개선 가능",
  ],
  evidenceSummary: "최근 20개 영상 중 상위 성과 영상의 공통 패턴 기반 분석",
  keyBottleneck: "실험형 콘텐츠와 주력 포맷 간 성과 격차가 2배 이상 발생",
  nextStepLinks: [
    {
      label: "Channel DNA",
      description: "반복 성과 패턴을 구조화하여 확인",
    },
    {
      label: "Action Plan",
      description: "실행 우선순위를 정리하여 확인",
    },
  ],
}

export const mockOverallScore = 76
