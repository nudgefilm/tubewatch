// SEO Lab Mock Data

export const seoDiagnosticData = {
  titleClarity: {
    score: 72,
    status: "warning" as const,
    description: "제목 명확성이 다소 낮음",
    detail: "핵심 키워드가 후반부에 배치된 영상이 많음"
  },
  keywordInclusion: {
    score: 65,
    status: "warning" as const,
    description: "키워드 포함율 개선 필요",
    detail: "상위 성과 영상 대비 키워드 포함율 15% 낮음"
  },
  keywordConsistency: {
    score: 58,
    status: "critical" as const,
    description: "키워드 일관성 부족",
    detail: "주요 키워드가 3개 이상으로 분산됨"
  },
  topicFocus: {
    score: 81,
    status: "good" as const,
    description: "주제 집중도 양호",
    detail: "핵심 주제 클러스터 유지 중"
  },
  representativeKeyword: {
    keyword: "실전 투자",
    strength: 78,
    relatedKeywords: ["주식 분석", "차트 해석", "매매 타이밍"]
  },
  titleStructureStability: {
    score: 69,
    status: "warning" as const,
    description: "제목 구조 안정성 보통",
    patterns: [
      { structure: "주제 + 결과형", usage: 45, performance: "high" },
      { structure: "질문형", usage: 30, performance: "medium" },
      { structure: "리스트형", usage: 25, performance: "low" }
    ]
  }
}

export const keywordAnalysisData = {
  topKeywords: [
    { keyword: "실전 투자", frequency: 34, avgViews: 125000, performance: "high" as const },
    { keyword: "차트 분석", frequency: 28, avgViews: 98000, performance: "high" as const },
    { keyword: "매매 전략", frequency: 22, avgViews: 87000, performance: "medium" as const },
    { keyword: "주식 입문", frequency: 18, avgViews: 112000, performance: "high" as const },
    { keyword: "수익률", frequency: 15, avgViews: 76000, performance: "medium" as const }
  ],
  lowPerformanceKeywords: [
    { keyword: "뉴스 정리", frequency: 12, avgViews: 23000, performance: "low" as const },
    { keyword: "시장 전망", frequency: 10, avgViews: 31000, performance: "low" as const },
    { keyword: "경제 이슈", frequency: 8, avgViews: 19000, performance: "low" as const }
  ],
  unusedKeywords: [
    { keyword: "ETF 투자", potential: "high" as const, reason: "DNA 분석 기반 적합 주제" },
    { keyword: "배당주", potential: "high" as const, reason: "구독자 관심 키워드" },
    { keyword: "장기 투자", potential: "medium" as const, reason: "채널 톤과 부합" }
  ],
  brandVsGeneral: {
    brand: [
      { keyword: "실전투자왕", type: "brand" as const, frequency: 45 },
      { keyword: "투자왕TV", type: "brand" as const, frequency: 38 }
    ],
    general: [
      { keyword: "주식 투자", type: "general" as const, frequency: 56 },
      { keyword: "차트 분석", type: "general" as const, frequency: 42 }
    ],
    ratio: { brand: 35, general: 65 }
  },
  keywordGaps: [
    { area: "실전 사례 분석", currentCoverage: 15, recommendedCoverage: 40 },
    { area: "초보자 가이드", currentCoverage: 20, recommendedCoverage: 35 },
    { area: "리스크 관리", currentCoverage: 5, recommendedCoverage: 25 }
  ]
}

export const titleOptimizationData = {
  problemTitles: [
    {
      original: "오늘 시장 어떻게 됐나요? 간단 정리",
      issues: ["모호한 주제", "키워드 부재", "클릭 유도 약함"],
      improved: "오늘 시장 급등락! 3가지 핵심 포인트 정리",
      improvementScore: 45
    },
    {
      original: "주식 이야기 ep.23",
      issues: ["시리즈 의존", "검색 불가", "내용 불명확"],
      improved: "차트 패턴으로 찾는 매수 타이밍 [주식 이야기 #23]",
      improvementScore: 62
    },
    {
      original: "요즘 핫한 종목 알려드림",
      issues: ["구체성 부족", "신뢰도 저하", "클릭베이트 느낌"],
      improved: "이번 주 급등 예상 종목 TOP 5 (차트 분석)",
      improvementScore: 38
    }
  ],
  titleFormulas: [
    {
      name: "주제 + 결과형",
      formula: "[핵심 키워드] + [결과/효과]",
      example: "차트 분석으로 수익률 200% 달성한 방법",
      effectiveness: 89
    },
    {
      name: "문제 제기 + 해결형",
      formula: "[공감 문제] + [해결책]",
      example: "손절 타이밍 못 잡는 분들, 이것만 기억하세요",
      effectiveness: 82
    },
    {
      name: "비교 + 핵심 수치형",
      formula: "[A vs B] + [핵심 데이터]",
      example: "삼성전자 vs SK하이닉스, 3개월 수익률 비교",
      effectiveness: 76
    },
    {
      name: "리스트 + 실용형",
      formula: "[숫자] + [실용 키워드]",
      example: "주식 초보가 반드시 피해야 할 5가지 실수",
      effectiveness: 71
    }
  ],
  avoidStructures: [
    { structure: "모호한 시리즈명", example: "주식 이야기 ep.XX", reason: "검색 유입 불가" },
    { structure: "과도한 이모지", example: "🔥🔥대박 종목🔥🔥", reason: "신뢰도 저하" },
    { structure: "질문형 단독", example: "이 종목 살까요?", reason: "정보 가치 불명확" }
  ]
}

export const topicClusterData = {
  strongClusters: [
    {
      topic: "차트 분석",
      videoCount: 45,
      avgViews: 98000,
      strength: "high" as const,
      relatedTopics: ["캔들 패턴", "지지/저항", "추세선"]
    },
    {
      topic: "실전 매매",
      videoCount: 38,
      avgViews: 112000,
      strength: "high" as const,
      relatedTopics: ["매수 타이밍", "손절 전략", "분할 매매"]
    }
  ],
  expandableClusters: [
    {
      topic: "ETF 투자",
      currentVideos: 5,
      potential: "high" as const,
      reason: "구독자 요청 다수",
      suggestedVideos: 15
    },
    {
      topic: "배당주 분석",
      currentVideos: 3,
      potential: "high" as const,
      reason: "DNA 패턴과 부합",
      suggestedVideos: 10
    }
  ],
  confusedClusters: [
    {
      topic: "경제 뉴스 정리",
      videoCount: 12,
      avgViews: 23000,
      issue: "채널 핵심과 불일치",
      recommendation: "축소 또는 포맷 변경"
    },
    {
      topic: "라이브 방송 하이라이트",
      videoCount: 8,
      avgViews: 15000,
      issue: "일관성 없는 주제",
      recommendation: "별도 재생목록으로 분리"
    }
  ],
  priorityOrder: [
    { rank: 1, topic: "실전 매매", action: "유지 강화" },
    { rank: 2, topic: "차트 분석", action: "유지 강화" },
    { rank: 3, topic: "ETF 투자", action: "확장" },
    { rank: 4, topic: "배당주 분석", action: "확장" },
    { rank: 5, topic: "경제 뉴스 정리", action: "축소" }
  ]
}

export const seoActionsData = {
  videoIdeas: [
    {
      title: "ETF 입문자를 위한 완벽 가이드",
      keywords: ["ETF 투자", "ETF 입문", "패시브 투자"],
      expectedPerformance: "high" as const,
      basis: "미활용 키워드 + 구독자 요청"
    },
    {
      title: "차트 패턴 TOP 5, 이것만 알면 됩니다",
      keywords: ["차트 패턴", "기술적 분석", "매매 신호"],
      expectedPerformance: "high" as const,
      basis: "강한 클러스터 확장"
    },
    {
      title: "배당주 포트폴리오 구성법",
      keywords: ["배당주", "배당 투자", "월배당"],
      expectedPerformance: "medium" as const,
      basis: "DNA 패턴 기반 확장 주제"
    }
  ],
  titleTemplates: [
    {
      template: "[핵심 키워드]로 [결과] 달성하는 방법",
      filledExample: "차트 분석으로 수익률 50% 달성하는 방법"
    },
    {
      template: "[타겟]을 위한 [주제] 완벽 가이드",
      filledExample: "주식 초보를 위한 차트 분석 완벽 가이드"
    },
    {
      template: "[숫자]가지 [주제] 실전 팁",
      filledExample: "5가지 손절 타이밍 실전 팁"
    }
  ],
  checklistItems: [
    { item: "제목에 핵심 키워드 포함", checked: false },
    { item: "제목 앞부분에 키워드 배치", checked: false },
    { item: "구체적 수치 또는 결과 포함", checked: false },
    { item: "검색 가능한 표현 사용", checked: false },
    { item: "채널 브랜드 키워드 활용", checked: false }
  ],
  recommendedKeywords: [
    { keyword: "실전 투자", reason: "최고 성과 키워드" },
    { keyword: "차트 분석", reason: "일관된 고성과" },
    { keyword: "매매 전략", reason: "구독자 선호" },
    { keyword: "ETF 투자", reason: "확장 잠재력" }
  ],
  avoidKeywords: [
    { keyword: "뉴스 정리", reason: "저성과 반복" },
    { keyword: "시장 전망", reason: "낮은 클릭률" },
    { keyword: "이슈", reason: "모호한 표현" }
  ]
}

export const seoVisualizationData = {
  keywordStrengthMap: [
    { keyword: "실전 투자", strength: 95, category: "strong" as const },
    { keyword: "차트 분석", strength: 88, category: "strong" as const },
    { keyword: "매매 전략", strength: 75, category: "medium" as const },
    { keyword: "주식 입문", strength: 82, category: "strong" as const },
    { keyword: "수익률", strength: 68, category: "medium" as const },
    { keyword: "뉴스 정리", strength: 25, category: "weak" as const },
    { keyword: "시장 전망", strength: 32, category: "weak" as const }
  ],
  titleStructureDistribution: [
    { structure: "주제+결과형", percentage: 35, performance: 92 },
    { structure: "문제+해결형", percentage: 25, performance: 85 },
    { structure: "리스트형", percentage: 20, performance: 71 },
    { structure: "질문형", percentage: 12, performance: 58 },
    { structure: "기타", percentage: 8, performance: 45 }
  ],
  clusterPerformanceRadar: [
    { cluster: "차트 분석", score: 88 },
    { cluster: "실전 매매", score: 92 },
    { cluster: "투자 전략", score: 75 },
    { cluster: "초보 가이드", score: 68 },
    { cluster: "시장 분석", score: 45 }
  ]
}
