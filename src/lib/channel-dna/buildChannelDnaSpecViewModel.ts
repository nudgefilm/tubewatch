import type { AnalysisPageData, AnalysisResultRow, UserChannelRow } from "@/lib/analysis/getAnalysisPageData";
import type { YoutubeFeatureAccessSnapshot } from "@/lib/auth/youtubeVerificationTypes";
import {
  buildInternalChannelDnaSummary,
  channelDnaTriLevelLabel,
} from "@/lib/channel-dna/internalChannelDnaSummary";
import type {
  ChannelDnaPageData,
  ChannelDnaSpecLine,
  ChannelDnaSpecViewModel,
} from "@/components/channel-dna/channelDnaPageTypes";

const STUB_YOUTUBE_ACCESS: YoutubeFeatureAccessSnapshot = {
  canUseCoreAnalysisFeatures: true,
  profile: null,
  liveCheck: null,
  ui: {
    variant: "verified",
    badgeLabel: "분석 준비",
    message: "등록한 채널에 대해 분석을 실행할 수 있습니다.",
    detail: null,
  },
};

function readString(row: unknown, key: string): string | null {
  if (row == null || typeof row !== "object") {
    return null;
  }
  const v = (row as Record<string, unknown>)[key];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

function readStringArray(row: unknown, key: string): string[] {
  if (row == null || typeof row !== "object") {
    return [];
  }
  const v = (row as Record<string, unknown>)[key];
  if (!Array.isArray(v)) {
    return [];
  }
  return v.filter((x): x is string => typeof x === "string" && x.trim() !== "");
}

function line(
  label: string,
  body: string,
  source: ChannelDnaSpecLine["source"]
): ChannelDnaSpecLine {
  return { label, body, source };
}

function toAnalysisPageDataStub(data: ChannelDnaPageData): AnalysisPageData {
  const channels: UserChannelRow[] = data.channels.map((c) => ({
    id: c.id,
    channel_title: c.channel_title,
    thumbnail_url: c.thumbnail_url,
    subscriber_count: c.subscriber_count,
    video_count: c.video_count,
    created_at: c.created_at,
    last_analyzed_at: c.last_analyzed_at,
  }));
  const selected = data.selectedChannel
    ? channels.find((x) => x.id === data.selectedChannel!.id) ?? null
    : null;
  return {
    userId: data.userId,
    channels,
    selectedChannel: selected,
    latestResult: data.latestResult as AnalysisResultRow | null,
    recentAnalysisResults: data.latestResult ? [data.latestResult as AnalysisResultRow] : [],
    analysisRuns: [],
    youtubeFeatureAccess: STUB_YOUTUBE_ACCESS,
  };
}

function formatShare(share: number | null): string {
  if (share == null || !Number.isFinite(share)) {
    return "";
  }
  return ` 상위 조회 비중 약 ${Math.round(share * 100)}%.`;
}

/**
 * Channel DNA 페이지 확정 스펙 ViewModel.
 * YouTube Data API 등 공개 API로 채운 스냅샷 + 수치 계산 + Gemini 저장 필드를 구분해 표시한다.
 */
export function buildChannelDnaSpecViewModel(data: ChannelDnaPageData): ChannelDnaSpecViewModel {
  const stub = toAnalysisPageDataStub(data);
  const internal = buildInternalChannelDnaSummary(stub);
  const row = data.latestResult as unknown as AnalysisResultRow | null;
  const compareItems = data.compareItems;

  const dataPipelineNote =
    "데이터: YouTube 공개 API로 수집한 채널·영상 메타와 조회 등 지표를 `feature_snapshot`에 저장하고, 여기서는 표본 기준 계산과 저장된 Gemini 해석 필드를 함께 씁니다.";

  const hitBodyParts: string[] = [];
  hitBodyParts.push(`히트 의존도 등급: ${channelDnaTriLevelLabel(internal.breakoutDependencyLevel)}.`);
  hitBodyParts.push(internal.breakoutDependencyFallback ?? "");
  hitBodyParts.push(formatShare(internal.top3Share));
  hitBodyParts.push(formatShare(internal.topPerformerShare));
  const hitDependency = line("히트 영상 의존도", hitBodyParts.filter(Boolean).join(" "), "computed");

  const spreadParts: string[] = [];
  spreadParts.push(`성과 분포(편차) 등급: ${channelDnaTriLevelLabel(internal.performanceSpreadLevel)}.`);
  spreadParts.push(internal.performanceSpreadFallback ?? "");
  const performanceDistribution = line(
    "성과 분포",
    spreadParts.filter(Boolean).join(" "),
    "computed"
  );

  const growthModeParts: string[] = [];
  if (internal.dominantFormat) {
    growthModeParts.push(`포맷·길이 중심: ${internal.dominantFormat}`);
  }
  growthModeParts.push(internal.dominantFormatFallback ?? "");
  const growthModeDefinition = line(
    "성장 방식 정의",
    growthModeParts.filter(Boolean).join(" ") || "표본 길이·메타가 부족해 성장 방식을 한 줄로 고정하지 않았습니다.",
    internal.dominantFormat ? "computed" : "computed"
  );

  const axisBody =
    internal.sectionScoresLine ??
    (internal.radarProfile
      ? `저장된 5구간 점수(0–100)로 성장 축 균형을 봅니다: ${internal.radarProfile.labels
        .map((lb, i) => `${lb} ${internal.radarProfile!.channel[i] ?? "—"}`)
        .join(" · ")}`
      : "구간 점수(`feature_section_scores`)가 없어 성장 축 분류를 숫자로 붙이지 못했습니다.");
  const growthAxisClassification = line("성장 축 분류", axisBody, "computed");

  const strengthsAi = readStringArray(row, "strengths");
  const highBody =
    internal.topPatternSignals.length > 0
      ? internal.topPatternSignals.slice(0, 6).join(" · ")
      : strengthsAi.length > 0
        ? strengthsAi.slice(0, 6).join(" · ")
        : "저장된 강점·패턴 문장이 없습니다.";
  const highPerformerCommonalities = line("고성과 콘텐츠 공통점", highBody, "ai_interpretation");

  const cps = readString(row, "content_pattern_summary");
  const titleStructurePatterns = line(
    "반복 제목 구조",
    cps ??
      "제목·메타 텍스트를 추출한 뒤 규칙을 요약한 `content_pattern_summary` 필드가 비어 있습니다.",
    cps ? "ai_interpretation" : "computed"
  );

  const formatBody =
    internal.dominantFormat ??
    internal.dominantFormatFallback ??
    "표본 길이 평균·메타가 없어 포맷·길이 반복성을 계산하지 못했습니다.";
  const formatLengthRepeat = line("포맷/길이 반복성", formatBody, "computed");

  const topics = readStringArray(row, "recommended_topics");
  const topicBody =
    topics.length > 0
      ? `${topics.slice(0, 4).join(" · ")} (토픽 라벨은 Gemini, 군집·유사도는 저장 파이프라인 기준)`
      : "제목·설명·태그에서 토큰을 추출해 군집·유사도를 계산하고, Gemini가 `recommended_topics` 라벨을 채웁니다. 현재 저장 행에 토픽 라벨이 없습니다.";
  const topicCluster = line("주제 클러스터", topicBody, topics.length > 0 ? "ai_interpretation" : "computed");

  const uploadScore = compareItems.find((i) => i.title.includes("업로드"));
  const viewScore = compareItems.find((i) => i.title.includes("조회"));
  const uploadParts: string[] = [];
  uploadParts.push(`업로드 일관성 등급: ${channelDnaTriLevelLabel(internal.uploadConsistencyLevel)}.`);
  uploadParts.push(internal.uploadConsistencyFallback ?? "");
  if (uploadScore) {
    uploadParts.push(`정규화 점수(업로드 축): ${uploadScore.current_score}.`);
  }
  if (viewScore) {
    uploadParts.push(`정규화 점수(조회 축): ${viewScore.current_score}.`);
  }
  const uploadVsPerformance = line(
    "업로드 주기 vs 성과",
    uploadParts.filter(Boolean).join(" "),
    "computed"
  );

  const strengthPattern = line(
    "강점 패턴",
    internal.topPatternSignals.length > 0
      ? internal.topPatternSignals.slice(0, 5).join(" · ")
      : strengthsAi.slice(0, 5).join(" · ") || "저장된 강점 문장이 없습니다.",
    "ai_interpretation"
  );

  const weaknessesAi = readStringArray(row, "weaknesses");
  const weaknessPattern = line(
    "약점 패턴",
    internal.weakPatternSignals.length > 0
      ? internal.weakPatternSignals.slice(0, 5).join(" · ")
      : weaknessesAi.slice(0, 5).join(" · ") || "저장된 약점·병목 문장이 없습니다.",
    "ai_interpretation"
  );

  const midScores = internal.radarProfile?.channel.slice(0, 5) ?? [];
  const maintenanceCore = line(
    "유지 핵심 패턴",
    midScores.length > 0
      ? `5구간 점수가 중간대에 모여 있으면 ‘유지 가치’가 큰 축으로 읽습니다: 활동 ${Math.round(midScores[0] ?? 0)} · 반응 ${Math.round(midScores[1] ?? 0)} · 구조 ${Math.round(midScores[2] ?? 0)} · SEO ${Math.round(midScores[3] ?? 0)} · 성장 ${Math.round(midScores[4] ?? 0)}`
      : internal.topPatternSignals.slice(0, 3).join(" · ") ||
        "구간 점수가 없어 유지 축을 숫자로 고정하지 않았습니다.",
    "computed"
  );

  const riskParts: string[] = [];
  riskParts.push(`히트 의존 리스크: ${channelDnaTriLevelLabel(internal.breakoutDependencyLevel)} 수준으로 읽힙니다.`);
  riskParts.push(internal.breakoutDependencyFallback ?? "");
  riskParts.push(formatShare(internal.top3Share));
  const hitDependenceRisk = line(
    "히트 의존 리스크",
    riskParts.filter(Boolean).join(" "),
    "computed"
  );

  return {
    dataPipelineNote,
    performanceStructure: {
      hitDependency,
      performanceDistribution,
      growthModeDefinition,
      growthAxisClassification,
    },
    repetitionPatterns: {
      highPerformerCommonalities,
      titleStructurePatterns,
      formatLengthRepeat,
      topicCluster,
      uploadVsPerformance,
    },
    dnaCards: {
      strengthPattern,
      weaknessPattern,
      maintenanceCore,
      hitDependenceRisk,
    },
    channelDnaNarrative: internal.channelDnaNarrative.trim() || null,
  };
}
