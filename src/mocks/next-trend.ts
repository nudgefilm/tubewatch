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

export interface ViewingPointGauge {
  label: string
  score: number // 1–5
}

export interface ExecutionAction {
  id: string
  videoTitle: string
  thumbnailDirection: string
  openingHook: string
  scriptOutline: string
  contentPlan: string
  whyThisTopic: string
  painPoint: string
  titleCandidates: string[]
  recommendedTags: string[]
  exitPrevention: string
  expectedReaction: string
  viewingPoints: ViewingPointGauge[]
  experimentPriority: number
  /** AI 전략 리포트 전문 (마크다운). 있으면 개별 섹션 대신 이 문서를 렌더링. */
  videoPlanDocument?: string
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
    videoTitle: "**컨셉** — AI 도구 활용 실무 팁: 시청자가 영상 한 편으로 바로 실행할 수 있는 수준의 가이드\n**핵심 장면 ①** — 오프닝: «AI 노션 자동화 완전 정복» 구조를 참고해 결과 장면부터 시작하세요.\n**핵심 장면 ②** — 과정 시연: 텍스트 설명 없이 화면을 직접 보여주세요. 각 단계마다 \"Step N\" 자막을 붙이세요.\n**핵심 장면 ③** — 전후 비교: \"도입 전 8시간 → 도입 후 1시간\" 같은 수치로 마무리하세요.\n**흐름** — Hook(0~15초) → 단계별 시연(15초~중반) → 결론·CTA(말미 30초)",
    thumbnailDirection: "**텍스트 문구** — \"AI 도구 활용\"\n**이미지 구성** — 채널 최고 성과 영상과 동일한 색·구도 유지. 얼굴 표정(확신 또는 놀람) + \"2.3배\" 수치 텍스트를 대비 구성으로 배치하세요.\n  → 채널 반복 노출 패턴: 'AI 도구 활용' 관련 장면이 클릭율이 높습니다.",
    openingHook: "**1문장 훅** — \"AI 도구 활용, 이것만 바꿨는데 조회수가 2.3배가 됐습니다. 지금 바로 보여드릴게요.\"\n  → 첫 3초 안에 \"이 영상이 나에게 필요하다\"는 신호를 줘야 이탈이 멈춥니다.",
    scriptOutline: "**① 오프닝** (0~15초)\n  대사: \"AI 도구 활용, 결론부터 드릴게요. [핵심 수치 or 결과]. 처음부터 바로 따라할 수 있게 보여드립니다.\"\n**② 본론 전반** — 도구 소개 및 설치·설정을 단계별로 진행\n  각 단계 시작에 \"Step N\" 자막을 붙이고, 텍스트 설명보다 화면 직접 시연으로 구성하세요.\n**③ 본론 후반** — 실전 적용 + 댓글 참여 유도\n  중간 자막: \"여러분은 어떤 AI 도구를 쓰고 계신가요? 댓글로 알려주세요!\"\n**④ 클로징** (마지막 30초)\n  대사: \"오늘 핵심은 딱 하나입니다. [1줄 요약]. 다음 편은 [예고 주제]로 돌아오겠습니다.\"\n  → 권장 길이: 8~12분 내외 (채널 표본 평균 기준)",
    contentPlan: "업로드 직후 **핀 댓글**로 시청자 질문을 남기세요. 초반 댓글 활성화가 알고리즘 노출을 높입니다.\n업로드 후 **48시간** 안에 CTR을 확인하세요. 4% 미만이면 썸네일부터 교체하세요.\n제목을 2개 준비해 **A/B 테스트**하세요. 24시간 CTR이 높은 쪽으로 고정하세요.",
    whyThisTopic: "이 영상의 역할: **AI 도구 활용 실무 팁**으로 신규 검색 유입과 기존 구독자 재방문을 동시에 잡는 것.\n지금 해야 하는 이유: 이 방향의 영상이 채널 평균 대비 **2.3배** 조회를 기록했습니다. 이 흐름을 지금 이어가세요.\n기대 효과: 채널 강점 **'실용적인 도구 소개와 단계별 설명'** 을 전면에 내세워 이탈을 최소화하면서 신규 구독자를 확보하세요.",
    painPoint: "**문제** — 실제 비용·시간 절감 수치를 직접 보여주는 영상이 부족합니다.\n**원인** — 초보자를 위한 단계별 실패 사례 분석이 없어 시청자가 '나도 할 수 있다'는 확신을 얻지 못하고 있습니다.\n**해결** — 이 영상 중반에 댓글 유도 질문(\"여러분은 어떤 AI 도구를 쓰고 계신가요?\")을 자막으로 삽입하세요. 참여율이 오르면 알고리즘 노출도 함께 올라갑니다.\n  → SEO 최적화 점수 **61점** / 100점 — 제목 첫 어절에 검색 키워드를 배치해 점수를 올리세요.",
    titleCandidates: [
      "조회수 2.3배 차이 만든 — AI 도구 활용 실무 팁 핵심만 정리 (바로 따라하기)",
      "이걸 모르면 손해 — AI 도구 활용 실무 팁, 지금 안 하면 늦는 이유",
      "직접 해봤습니다 — AI 도구 도입 전vs후, 결과가 이렇게 달라요",
    ],
    recommendedTags: ["AI 도구", "업무 자동화", "생산성", "튜토리얼", "실전 팁"],
    exitPrevention: "**도입부 30초** — 결론이나 완성 장면을 먼저 보여주세요. 시청자는 이 구간에서 끝까지 볼지를 결정합니다.\n**중반 (40~60%)** — \"다음 파트 예고\" 자막 또는 댓글 유도 질문을 넣어 이탈을 막으세요.\n**전문 용어** — 즉시 1줄 설명을 붙이세요. '이해 실패' 느낌이 오면 시청자는 바로 나갑니다.",
    expectedReaction: "**업무 효율화에 관심 있는 직장인·프리랜서** 중심으로 '써먹을 수 있었다'는 댓글 반응이 예상됩니다.\n초반 24시간 **CTR**과 **시청 유지율**을 확인하세요. 채널 평균 이상이면 후속편을 바로 기획하세요.\n  → 2~3편 테스트 후 반응이 좋은 포맷을 시리즈로 확장하세요.",
    viewingPoints: [
      { label: "대중성",   score: 4 },
      { label: "전문성",   score: 3 },
      { label: "자극도",   score: 4 },
      { label: "정보성",   score: 3 },
      { label: "팬서비스", score: 3 },
    ],
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
