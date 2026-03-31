// Action Plan Mock Data

export const actionPlanSummary = {
  coreProblem: "조회수 변동성이 높고 히트 의존도가 과도함 (상위 10%가 전체 조회의 68% 차지)",
  recommendedStrategy: "중간 성과 콘텐츠의 안정성 강화 + 업로드 주기 정규화",
  expectedChange: "평균 조회수 15~20% 상승, 조회 변동성 30% 감소",
  applicationPeriod: "4주 (2주 실험 + 2주 검증)",
  dnaSource: "성과 구조 분석",
  analysisSource: "조회 흐름 진단",
}

export const priorityActions = [
  {
    id: "p1",
    level: "P1",
    title: "썸네일 CTR 최적화",
    impact: ["조회수", "CTR"],
    reason: "현재 CTR 4.2%로 카테고리 평균(5.8%) 대비 -27% 낮음",
    order: 1,
    confidence: 87,
    difficulty: "중",
  },
  {
    id: "p2",
    level: "P2",
    title: "업로드 주기 정규화",
    impact: ["구독자 유지", "알고리즘 노출"],
    reason: "최근 30일 업로드 간격 편차 ±4.2일로 불안정",
    order: 2,
    confidence: 78,
    difficulty: "하",
  },
  {
    id: "p3",
    level: "P3",
    title: "영상 길이 최적화",
    impact: ["시청 지속율", "광고 수익"],
    reason: "평균 시청 지속율 42%로 최적 구간(8~12분) 대비 길이 초과",
    order: 3,
    confidence: 72,
    difficulty: "중",
  },
]

export const actionCards = [
  {
    id: "action-1",
    title: "썸네일 텍스트 구조 변경",
    problemSummary: "현재 썸네일 텍스트가 3줄 이상으로 가독성 저하",
    evidenceData: {
      current: "평균 텍스트 3.2줄",
      benchmark: "고성과 영상 평균 1.8줄",
      sampleSize: 47,
    },
    whyNeeded: "텍스트 과다 썸네일의 CTR이 평균 대비 -34% 낮음",
    howToExecute: [
      "핵심 키워드 1개만 선정",
      "텍스트 2줄 이하로 제한",
      "배경과 대비되는 색상 사용",
    ],
    expectedEffect: "CTR 0.8~1.2%p 상승 예상",
    scenarioBlocks: [
      "썸네일 텍스트 3줄 이상 유지 중, CTR 4.2% 정체",
      "텍스트 압축 후 시각적 여백 확보 → 클릭 유도 강화",
      "노출 대비 클릭률 상승, 알고리즘 추천 빈도 증가",
    ],
    applicationScope: "신규 업로드 + 최근 저성과 영상 5개",
    experimentPeriod: "2주",
    caution: "기존 브랜딩 톤 유지 필요",
    confidence: 87,
    dnaConnection: "고성과 패턴 분석",
    analysisConnection: "CTR 진단",
    priority: "P1",
    performancePrediction: {
      current: "현재 CTR: 4.2%",
      targetRange: "목표: 5.0~5.8%",
      expectedChanges: [
        "노출 클릭 +20~40%",
        "평균 조회수 회복",
      ],
    },
    executionSpec: {
      videoCount: "2~3개",
      targetElement: "썸네일 텍스트 줄 수",
      comparisonBasis: "기존 CTR 4.2% 기준",
    },
  },
  {
    id: "action-2",
    title: "업로드 요일 고정",
    problemSummary: "업로드 요일이 불규칙하여 구독자 기대 형성 실패",
    evidenceData: {
      current: "주 2.3회 (불규칙)",
      benchmark: "성장 채널 평균 주 2회 (고정 요일)",
      sampleSize: 30,
    },
    whyNeeded: "고정 요일 채널의 구독자 재방문율이 +23% 높음",
    howToExecute: [
      "화/금 또는 수/토 고정 선택",
      "업로드 시간 오후 6~8시 고정",
      "최소 4주간 유지",
    ],
    expectedEffect: "구독자 재방문율 15~20% 상승",
    scenarioBlocks: [
      "불규칙 업로드로 구독자 알림 피로 누적, 재방문율 18% 정체",
      "고정 요일 패턴 형성 → 구독자 방문 습관화 → 알고리즘 신호 강화",
      "재방문율 상승 + 초기 조회 속도 증가로 노출 확대",
    ],
    applicationScope: "전체 업로드 일정",
    experimentPeriod: "4주",
    caution: "초기 2주는 조회수 일시 하락 가능",
    confidence: 78,
    dnaConnection: "업로드 패턴 분석",
    analysisConnection: "업로드 빈도 진단",
    priority: "P2",
    performancePrediction: {
      current: "현재 재방문율: 18%",
      targetRange: "목표: 21~23%",
      expectedChanges: [
        "구독자 재방문 +15~20%",
        "알고리즘 노출 안정화",
      ],
    },
    executionSpec: {
      videoCount: "전체 업로드",
      targetElement: "업로드 요일",
      comparisonBasis: "현재 불규칙 패턴 기준",
    },
  },
  {
    id: "action-3",
    title: "영상 길이 10분 내외 조정",
    problemSummary: "평균 영상 길이 18분으로 시청 이탈 구간 발생",
    evidenceData: {
      current: "평균 18.2분",
      benchmark: "최적 구간 8~12분",
      sampleSize: 52,
    },
    whyNeeded: "12분 초과 영상의 완주율이 -28% 낮음",
    howToExecute: [
      "핵심 내용 10분 내 전달",
      "부가 정보는 챕터/고정 댓글로 분리",
      "인트로 30초 이내 유지",
    ],
    expectedEffect: "시청 지속율 8~12%p 상승",
    scenarioBlocks: [
      "평균 18분 영상 유지 중, 완주율 42% — 중반 이후 이탈 집중",
      "10분 내 핵심 전달로 이탈 구간 제거 → 완주율 신호 강화",
      "시청 지속율 상승 → 알고리즘 체류 점수 개선",
    ],
    applicationScope: "신규 업로드",
    experimentPeriod: "3주",
    caution: "콘텐츠 밀도 저하 주의",
    confidence: 72,
    dnaConnection: "콘텐츠 구조 분석",
    analysisConnection: "시청 지속율 진단",
    priority: "P3",
    performancePrediction: {
      current: "현재 완주율: 42%",
      targetRange: "목표: 50~55%",
      expectedChanges: [
        "시청 지속율 +8~12%p",
        "중반 이탈 구간 제거",
      ],
    },
    executionSpec: {
      videoCount: "신규 영상 2개",
      targetElement: "영상 전체 길이",
      comparisonBasis: "기존 18분 평균 기준",
    },
  },
]

export const checklist = {
  changeFirst: [
    { id: "c1", text: "썸네일 텍스트 2줄 이하로 변경", linked: "action-1" },
    { id: "c2", text: "업로드 요일 화/금 고정", linked: "action-2" },
  ],
  maintain: [
    { id: "m1", text: "현재 제목 구조 (숫자 + 키워드) 유지" },
    { id: "m2", text: "영상 초반 훅 구조 유지" },
  ],
  avoid: [
    { id: "a1", text: "3줄 이상 썸네일 텍스트" },
    { id: "a2", text: "15분 이상 영상 (특별 콘텐츠 제외)" },
  ],
  reviewAfter2Weeks: [
    { id: "r1", text: "CTR 변화 확인 (목표: +0.8%p)", linked: "action-1" },
    { id: "r2", text: "구독자 재방문율 확인", linked: "action-2" },
  ],
}

export const trackingKPIs = [
  {
    id: "kpi-1",
    name: "CTR",
    baseline: 4.2,
    target: 5.0,
    current: 4.2,
    unit: "%",
    period: "2주",
    linkedAction: "action-1",
  },
  {
    id: "kpi-2",
    name: "평균 조회수",
    baseline: 12400,
    target: 14500,
    current: 12400,
    unit: "회",
    period: "4주",
    linkedAction: "action-1",
  },
  {
    id: "kpi-3",
    name: "시청 지속율",
    baseline: 42,
    target: 50,
    current: 42,
    unit: "%",
    period: "3주",
    linkedAction: "action-3",
  },
  {
    id: "kpi-4",
    name: "구독자 재방문율",
    baseline: 18,
    target: 22,
    current: 18,
    unit: "%",
    period: "4주",
    linkedAction: "action-2",
  },
]

export const assistContent = {
  thumbnailExample: {
    title: "썸네일 텍스트 예시",
    before: "초보자도 쉽게 따라하는 요리 레시피 완벽 가이드 총정리",
    after: "5분 요리",
    tip: "핵심 숫자 + 키워드 1개로 압축",
  },
  titleTemplate: {
    title: "제목 템플릿",
    templates: [
      "[숫자] + [핵심 키워드] + [결과]",
      "[질문형] + [해결 키워드]",
    ],
    examples: [
      "5분만에 완성하는 초간단 파스타",
      "왜 당신의 영상은 안 뜰까?",
    ],
  },
  promptTemplate: {
    title: "AI 도구 프롬프트 (복사용)",
    prompt: "유튜브 썸네일용 텍스트를 작성해줘. 조건: 1) 2줄 이하 2) 숫자 포함 3) 호기심 유발 키워드. 주제: [영상 주제 입력]",
  },
}

export const visualizationData = {
  priorityMatrix: [
    { action: "썸네일 CTR", impact: 85, difficulty: 50, priority: "P1" },
    { action: "업로드 주기", impact: 65, difficulty: 30, priority: "P2" },
    { action: "영상 길이", impact: 55, difficulty: 60, priority: "P3" },
  ],
  executionFlow: [
    { step: 1, action: "썸네일 변경", duration: "1주차" },
    { step: 2, action: "업로드 주기 고정", duration: "1~2주차" },
    { step: 3, action: "영상 길이 조정", duration: "2~3주차" },
    { step: 4, action: "성과 검증", duration: "4주차" },
  ],
}
