// Next Trend Mock Data

export interface TrendCandidate {
  id: string
  topic: string
  reason: string
  signal: string
  priority: "high" | "medium" | "low"
  feasibility: number
  source: "dna" | "seo" | "action"
  status: "executable" | "observe" | "hold"
  signalStrength: "clear" | "medium" | "low"
  /** ViewModel에서 생성된 근거 항목 — 없으면 빈 배열 */
  evidence?: { label: string; value: string }[]
  /** 이 시도가 어떤 지표 방향에 도움이 되는지 — 1문장 */
  expectedEffect?: string
}

export interface FormatRecommendation {
  id: string
  format: string
  seriesPotential: boolean
  recommendedLength: string
  approach: string
  internalFit: number
  basedOn: string
}

export interface RiskMemo {
  id: string
  topic: string
  confidence: number
  reason: string
  churnRisk: "high" | "medium" | "low"
  warningPoints: string[]
}

export interface ExecutionHint {
  id: string
  type: "title" | "hook" | "thumbnail" | "angle" | "start"
  label: string
  content: string
  linkedTo: string
}

export interface ExecutionAction {
  id: string
  videoTitle: string
  thumbnailDirection: string
  openingHook: string
  scriptOutline: string
  contentPlan: string
  experimentPriority: number
}

export interface SourceSplit {
  internal: {
    candidates: string[]
    strength: number
  }
  expansion: {
    candidates: string[]
    strength: number
    seasonPotential: boolean
  }
}

export interface VisualizationData {
  priorityList: {
    topic: string
    score: number
    status: "executable" | "observe" | "hold"
  }[]
  internalVsExpansion: {
    internal: number
    expansion: number
  }
}

// Mock Data
export const trendCandidates: TrendCandidate[] = [
  {
    id: "1",
    topic: "AI 도구 활용 실무 팁",
    reason: "표본 내 AI 관련 편이 평균 대비 2.3배 조회를 기록했습니다. 이 포맷과 주제 축을 유지하며 다음 1편을 이어 제작하세요.",
    signal: "DNA: 반복 성공 패턴 / SEO: 상위 키워드 클러스터",
    priority: "high",
    feasibility: 85,
    source: "dna",
    status: "executable",
    signalStrength: "clear",
    evidence: [
      { label: "발생 신호", value: "DNA: 반복 성공 패턴" },
      { label: "신호 강도", value: "반복 신호 확인됨" },
    ],
    expectedEffect: "확인된 패턴 반복은 평균 조회수 유지력과 주제 재현성을 높이는 방향으로 작용합니다.",
  },
  {
    id: "2",
    topic: "초보자 가이드 시리즈",
    reason: "입문 콘텐츠가 표본 내 참여율 상위 20%에 지속적으로 위치합니다. 이 시리즈를 회차 명시화해 연속 제작하세요.",
    signal: "DNA: 안정 성과 패턴 / Action: 실행 우선순위 P1",
    priority: "high",
    feasibility: 90,
    source: "action",
    status: "executable",
    signalStrength: "clear",
    evidence: [
      { label: "발생 신호", value: "DNA: 안정 성과 패턴" },
      { label: "신호 강도", value: "반복 신호 확인됨" },
    ],
    expectedEffect: "시리즈 연속성은 반복 시청 가능성과 주제 재현성을 동시에 높이는 방향으로 작용합니다.",
  },
  {
    id: "3",
    topic: "실시간 작업 과정 공개",
    reason: "표본 내 과정 공개 포맷이 미활용 상태로 남아 있습니다. 숏폼 1편으로 반응을 먼저 측정하세요.",
    signal: "DNA: 미활용 패턴",
    priority: "medium",
    feasibility: 70,
    source: "seo",
    status: "observe",
    signalStrength: "medium",
    evidence: [
      { label: "발생 신호", value: "DNA: 미활용 포맷" },
      { label: "신호 강도", value: "신호 감지 중" },
    ],
    expectedEffect: "짧은 포맷 실험은 초반 클릭 유도력과 반복 시청 가능성 확인에 유리한 구조입니다.",
  },
  {
    id: "4",
    topic: "업계 뉴스 요약 콘텐츠",
    reason: "표본 내 짧은 정보성 포맷의 조회 성과가 안정적으로 유지되고 있습니다. 이 조합을 다음 편에서 이어가세요.",
    signal: "DNA: 반복 시도 가능",
    priority: "medium",
    feasibility: 75,
    source: "dna",
    status: "observe",
    signalStrength: "medium",
    evidence: [
      { label: "발생 신호", value: "DNA: 짧은 정보성 포맷 반복" },
      { label: "신호 강도", value: "신호 감지 중" },
    ],
    expectedEffect: "반복 패턴 유지는 평균 조회수 유지력과 초반 클릭 유도력 보강에 유리한 구조입니다.",
  },
  {
    id: "5",
    topic: "협업 콘텐츠 (게스트 출연)",
    reason: "채널 표본 내 검증되지 않은 포맷 영역입니다. 1편 소규모 실험 후 반응 수치를 직접 비교하세요.",
    signal: "Action: 성장 전략 연계 / DNA: 미검증 영역",
    priority: "low",
    feasibility: 55,
    source: "action",
    status: "hold",
    signalStrength: "low",
    evidence: [],
    expectedEffect: "소규모 실험으로 CTR과 반복 시청 가능성을 직접 확인하면 재현 패턴을 좁혀나갈 수 있습니다.",
  },
]

export const formatRecommendations: FormatRecommendation[] = [
  {
    id: "1",
    format: "튜토리얼 (단계별 설명)",
    seriesPotential: true,
    recommendedLength: "10-15분",
    approach: "문제 제시 → 해결 과정 → 요약",
    internalFit: 92,
    basedOn: "최근 6개월 상위 성과 영상의 78%가 튜토리얼 포맷",
  },
  {
    id: "2",
    format: "비교 분석 (A vs B)",
    seriesPotential: true,
    recommendedLength: "8-12분",
    approach: "양측 소개 → 비교 기준 → 결론",
    internalFit: 78,
    basedOn: "비교 콘텐츠 평균 CTR 12% 상회",
  },
  {
    id: "3",
    format: "퀵 팁 (Short-form)",
    seriesPotential: false,
    recommendedLength: "1-3분",
    approach: "핵심만 빠르게 전달",
    internalFit: 65,
    basedOn: "짧은 포맷 실험 시 참여율 상승 신호",
  },
]

export const riskMemos: RiskMemo[] = [
  {
    id: "1",
    topic: "정치/사회 이슈 관련 콘텐츠",
    confidence: 85,
    reason: "채널 톤과 불일치, 기존 시청자 이탈 가능성",
    churnRisk: "high",
    warningPoints: [
      "기존 구독자 기대와 충돌",
      "댓글 관리 부담 증가",
      "알고리즘 추천 불확실성",
    ],
  },
  {
    id: "2",
    topic: "과도한 트렌드 추종",
    confidence: 70,
    reason: "채널 정체성 희석 우려",
    churnRisk: "medium",
    warningPoints: [
      "일관성 저하로 인한 구독 유지율 하락",
      "경쟁 채널과 차별화 약화",
    ],
  },
  {
    id: "3",
    topic: "장시간 포맷 (30분 이상)",
    confidence: 60,
    reason: "현재 채널 평균 시청 시간 대비 과다",
    churnRisk: "medium",
    warningPoints: [
      "이탈률 상승 가능",
      "제작 비용 대비 효율 불확실",
    ],
  },
]

export const executionHints: ExecutionHint[] = [
  {
    id: "1",
    type: "title",
    label: "제목 방향",
    content: "숫자 + 구체적 결과 조합 (예: '5분 만에 ~하는 법')",
    linkedTo: "SEO: 상위 CTR 제목 패턴",
  },
  {
    id: "2",
    type: "hook",
    label: "훅 아이디어",
    content: "문제 상황 → 해결책 암시 → 본론 진입",
    linkedTo: "DNA: 상위 성과 영상 도입부 구조",
  },
  {
    id: "3",
    type: "thumbnail",
    label: "썸네일 방향",
    content: "얼굴 + 텍스트 3단어 이내 + 대비 색상",
    linkedTo: "DNA: CTR 상위 20% 영상 분석",
  },
  {
    id: "4",
    type: "angle",
    label: "콘텐츠 각도",
    content: "시청자 문제 해결 관점 유지",
    linkedTo: "Action: P1 전략 방향",
  },
  {
    id: "5",
    type: "start",
    label: "시작 포인트",
    content: "기존 성과 콘텐츠의 후속 주제로 시작",
    linkedTo: "DNA: 시리즈 연결 패턴",
  },
]

export const executionActions: ExecutionAction[] = [
  {
    id: "1",
    videoTitle: "주제: AI 도구 활용 실무 팁\n트렌드 요약: 표본 내 AI 관련 편이 평균 대비 2.3배 조회를 기록했습니다.\n포맷 방향: 실전 적용 중심의 단계별 튜토리얼",
    thumbnailDirection: "[제목] 반복 확인된 키워드 'AI 도구'를 앞부분에 배치하고 구체적인 숫자(예: '50% 절약', '3배 빠르게')를 함께 쓰세요.\n  → 표본에서 반복된 표현: 'AI 도구 활용'\n[썸네일] 채널의 기존 색·구도를 유지하면서 작업 전후 비교 이미지 + 짧은 라벨 텍스트를 배치하세요.\n  → 클릭베이트는 시청 완료율을 낮춥니다. 기대값과 내용을 일치시키세요.",
    openingHook: "[첫 15초 훅 전략]\n결론·핵심 숫자·변화 포인트를 오프닝에서 먼저 공개하세요. 시청자가 '끝까지 봐야 할 이유'를 즉시 파악하게 만드는 것이 목표입니다.\n  → 예시: 'AI 도구 하나로 제 업무 시간이 절반으로 줄었습니다. 오늘 바로 따라할 수 있게 보여드릴게요.'\n초반 15초 이탈률이 낮아지면 알고리즘 추천 가중치도 함께 올라갑니다.",
    scriptOutline: "① 오프닝 (0~15초)  — 핵심 결과(시간 절감 수치) 선공개, 시청 유지 유도\n② 본론 전반  — 도구 소개 및 설치·설정 단계별 설명\n③ 본론 후반  — 실전 적용 사례 시연. 시청자 공감 포인트(흔한 실수·해결법)를 중심으로 전개하세요.\n④ 클로징 (마지막 30초)  — 핵심 내용 한 줄 요약 + 다음 편 예고 또는 구독·댓글 CTA\n· 권장 길이: 표본 평균 기준 8~12분 내외",
    contentPlan: "단계별 튜토리얼 포맷\n표본 평균 재생 길이 기준 8~12분 내외를 목표로 하세요.\n추가 포맷 신호: 짧은 요약 클립(1분 이내 Shorts)을 병행하면 유입 경로가 넓어집니다.",
    experimentPriority: 1,
  },
]

export const sourceSplit: SourceSplit = {
  internal: {
    candidates: [
      "기존 시리즈 후속편",
      "상위 성과 주제 변형",
      "미완료 콘텐츠 마무리",
      "인기 영상 업데이트 버전",
    ],
    strength: 85,
  },
  expansion: {
    candidates: [
      "인접 분야 입문 콘텐츠",
      "관련 도구 리뷰",
      "협업 가능성 탐색",
    ],
    strength: 45,
    seasonPotential: true,
  },
}

export const visualizationData: VisualizationData = {
  priorityList: [
    { topic: "AI 도구 활용 실무 팁", score: 92, status: "executable" },
    { topic: "초보자 가이드 시리즈", score: 88, status: "executable" },
    { topic: "업계 뉴스 요약 콘텐츠", score: 72, status: "observe" },
    { topic: "실시간 작업 과정 공개", score: 68, status: "observe" },
    { topic: "협업 콘텐츠", score: 45, status: "hold" },
  ],
  internalVsExpansion: {
    internal: 85,
    expansion: 45,
  },
}
