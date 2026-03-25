// Channel DNA Mock Data

export const channelDnaData = {
  // A. 성과 구조 요약
  structureSummary: {
    hitDependency: 42, // 히트 영상 의존도 (%)
    growthType: "안정 반복형", // 히트 의존형 | 안정 반복형 | 주제 집중형 | 포맷 견인형
    growthAxis: ["포맷 일관성", "주제 집중도"], // 성장 축 (1~2개)
    structureStability: "안정", // 안정 | 불안정 | 취약
    structureStabilityScore: 78,
    performanceDistribution: [
      { range: "0-1K", count: 8, percentage: 16 },
      { range: "1K-5K", count: 12, percentage: 24 },
      { range: "5K-10K", count: 15, percentage: 30 },
      { range: "10K-50K", count: 10, percentage: 20 },
      { range: "50K+", count: 5, percentage: 10 },
    ],
    summaryText:
      "이 채널은 특정 포맷과 주제에 집중하여 안정적인 조회수를 유지하는 구조입니다. 히트 영상 의존도가 낮아 일관된 성과를 보입니다.",
  },

  // B. 반복 패턴 분석
  patternAnalysis: {
    highPerformancePatterns: [
      {
        pattern: "숫자 기반 제목",
        frequency: "78%",
        description: "상위 20% 영상 중 78%가 숫자를 포함한 제목 사용",
        examples: ["10가지 방법", "5분만에", "3단계로"],
      },
      {
        pattern: "10-15분 영상 길이",
        frequency: "65%",
        description: "고성과 영상의 65%가 10-15분 구간에 분포",
        examples: [],
      },
      {
        pattern: "튜토리얼 포맷",
        frequency: "72%",
        description: "단계별 설명 구조가 반복적으로 높은 성과 기록",
        examples: [],
      },
    ],
    lowPerformancePatterns: [
      {
        pattern: "브이로그 형식",
        frequency: "45%",
        description: "저성과 영상의 45%가 비구조화된 브이로그 형식",
        examples: [],
      },
      {
        pattern: "30분 이상 영상",
        frequency: "38%",
        description: "긴 영상일수록 완주율과 조회수 모두 하락",
        examples: [],
      },
    ],
    titleStructure: {
      dominant: "[숫자] + [핵심 키워드] + [결과/혜택]",
      consistency: 72,
    },
    formatRepetition: {
      dominant: "튜토리얼/가이드",
      consistency: 68,
    },
    topicClusters: [
      { topic: "프로그래밍 기초", weight: 35 },
      { topic: "개발 툴 리뷰", weight: 28 },
      { topic: "커리어 조언", weight: 22 },
      { topic: "프로젝트 실습", weight: 15 },
    ],
    uploadCycleImpact: {
      optimalCycle: "주 2회",
      currentCycle: "주 1.5회",
      performanceCorrelation: "중간",
      note: "업로드 주기가 성과에 미치는 영향은 제한적",
    },
  },

  // C. DNA 카드
  dnaCards: {
    strengths: [
      {
        title: "포맷 일관성",
        description: "튜토리얼 포맷이 전체 영상의 68%를 차지하며 안정적 성과 유지",
        score: 85,
        tags: ["튜토리얼", "단계별 구성", "실습 중심"],
      },
      {
        title: "제목 구조 반복",
        description: "숫자 기반 제목 패턴이 고성과와 높은 상관관계",
        score: 78,
        tags: ["숫자 제목", "결과 제시", "명확한 가치"],
      },
      {
        title: "주제 집중도",
        description: "프로그래밍/개발 주제에 80% 이상 집중",
        score: 82,
        tags: ["프로그래밍", "개발", "기술"],
      },
    ],
    weaknesses: [
      {
        title: "히트 영상 부재",
        description: "바이럴 잠재력이 있는 콘텐츠 구조가 부족",
        score: 35,
        tags: ["바이럴 요소 부족", "안전한 선택"],
      },
      {
        title: "포맷 다양성 부족",
        description: "단일 포맷 의존으로 성장 천장 존재 가능성",
        score: 42,
        tags: ["포맷 단일화", "실험 부족"],
      },
    ],
    corePatterns: [
      {
        pattern: "10-15분 튜토리얼",
        importance: "핵심",
        note: "채널 정체성의 근간이 되는 패턴",
      },
      {
        pattern: "주 2회 업로드",
        importance: "유지",
        note: "현재 성과를 유지하는 최소 기준",
      },
    ],
    risks: [
      {
        type: "히트 의존 리스크",
        level: "낮음",
        description: "히트 영상 의존도 42%로 안정적 구조",
      },
      {
        type: "주제 흔들림 리스크",
        level: "낮음",
        description: "주제 집중도가 높아 정체성 명확",
      },
      {
        type: "구조 지속 리스크",
        level: "중간",
        description: "단일 포맷 의존으로 장기 성장에 제약 가능성",
      },
    ],
  },

  // D. 시각화 데이터
  visualization: {
    radarChart: [
      { axis: "포맷 일관성", value: 85 },
      { axis: "제목 구조", value: 78 },
      { axis: "주제 집중도", value: 82 },
      { axis: "업로드 안정성", value: 70 },
      { axis: "성과 분산", value: 65 },
      { axis: "히트 잠재력", value: 45 },
    ],
    strengthVsWeakness: {
      strengths: 78,
      weaknesses: 42,
    },
    patternStrength: [
      { pattern: "제목 패턴", strength: 78 },
      { pattern: "포맷 패턴", strength: 68 },
      { pattern: "길이 패턴", strength: 65 },
      { pattern: "주제 패턴", strength: 82 },
      { pattern: "업로드 패턴", strength: 55 },
    ],
  },
}

export type ChannelDnaData = typeof channelDnaData
