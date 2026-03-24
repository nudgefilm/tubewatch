import type {
  ChannelDnaTriLevel,
  InternalChannelDnaSummaryVm,
} from "@/lib/channel-dna/internalChannelDnaSummary";
import { channelDnaTriLevelLabel } from "@/lib/channel-dna/internalChannelDnaSummary";

/**
 * 채널 DNA·스냅샷 기반 내부 신호를 SEO 전략 생성용 중간 표현으로 번역한다.
 * (검색량·SERP 없음)
 */

export type SeoStrategySignalDimension =
  | "format"
  | "repeat_win"
  | "risk"
  | "cadence"
  | "concentration"
  | "spread"
  | "meta";

export type SeoStrategySignalRecord = {
  id: string;
  dimension: SeoStrategySignalDimension;
  /** 한 줄 요약(내부) */
  summaryLine: string;
  /** 추천 생성 시 사용할 SEO 관점 해석 */
  forSeo: string;
  sourceLabel: string;
};

export type SeoStrategySignalsPayload = {
  records: SeoStrategySignalRecord[];
  /** UI evidenceNotes에 넣을 원문·수치 근거 */
  rawEvidenceLines: string[];
};

export type SeoStrategyContext = {
  readonly patternFlags: readonly string[];
  readonly avgTitleLength: number | null;
  readonly avgTagCount: number | null;
  readonly seoOptimizationScore: number | null;
  readonly contentStructureScore: number | null;
};

function triLabel(level: ChannelDnaTriLevel | null): string {
  return channelDnaTriLevelLabel(level);
}

let signalIdSeq = 0;
function nextSignalId(prefix: string): string {
  signalIdSeq += 1;
  return `seo-sig-${prefix}-${signalIdSeq}`;
}

export function buildSeoStrategySignals(
  bench: InternalChannelDnaSummaryVm,
  context: SeoStrategyContext
): SeoStrategySignalsPayload {
  signalIdSeq = 0;
  const records: SeoStrategySignalRecord[] = [];
  const rawEvidenceLines: string[] = [];

  if (bench.recentVideosUsed > 0) {
    rawEvidenceLines.push(
      `최근 분석 스냅샷 표본 영상 수: ${bench.recentVideosUsed}개(제목·메타 해석에 사용).`
    );
  }
  if (bench.sectionScoresLine) {
    rawEvidenceLines.push(bench.sectionScoresLine);
  }
  if (bench.dominantFormat) {
    records.push({
      id: nextSignalId("fmt"),
      dimension: "format",
      summaryLine: `표본 기준 추정 포맷: ${bench.dominantFormat}`,
      forSeo:
        "제목·설명의 정보 밀도와 후킹 문구가 이 포맷(길이·시청 맥락 추정)과 어긋나지 않는지 맞출 것.",
      sourceLabel: "채널 DNA·표본 길이",
    });
  } else if (bench.dominantFormatFallback) {
    rawEvidenceLines.push(bench.dominantFormatFallback);
  }

  for (const line of bench.topPatternSignals.slice(0, 4)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    records.push({
      id: nextSignalId("top"),
      dimension: "repeat_win",
      summaryLine: trimmed.length > 120 ? `${trimmed.slice(0, 117)}…` : trimmed,
      forSeo:
        "베이스 진단에서 반복 언급된 신호입니다. 제목 앞부분 어휘·약속이 이 축과 맞는지 확인할 것.",
      sourceLabel: "베이스 강점·패턴",
    });
  }

  for (const line of bench.weakPatternSignals.slice(0, 4)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    records.push({
      id: nextSignalId("weak"),
      dimension: "risk",
      summaryLine: trimmed.length > 120 ? `${trimmed.slice(0, 117)}…` : trimmed,
      forSeo:
        "베이스에서 주의·개선으로 기록된 문장입니다. 동일 톤을 제목·태그에 그대로 반복하지 않도록 점검.",
      sourceLabel: "베이스 주의·병목",
    });
  }

  if (bench.breakoutDependencyLevel != null) {
    records.push({
      id: nextSignalId("brk"),
      dimension: "concentration",
      summaryLine: `조회 상위권 의존(히트 집중) 신호: ${triLabel(bench.breakoutDependencyLevel)}`,
      forSeo:
        "소수 영상에 조회가 몰린 구조로 읽힙니다. 제목만으로 ‘대표 편’에 기대지 않게 소제목·주제 구분을 명확히 할 것.",
      sourceLabel: "채널 DNA·조회 분포",
    });
    if (bench.breakoutDependencyFallback) {
      rawEvidenceLines.push(bench.breakoutDependencyFallback);
    }
  }

  if (bench.performanceSpreadLevel != null) {
    records.push({
      id: nextSignalId("spr"),
      dimension: "spread",
      summaryLine: `표본 내 조회 편차: ${triLabel(bench.performanceSpreadLevel)}`,
      forSeo:
        "편차가 크면 ‘잘 나온 편’과 그렇지 않은 편의 제목 구조 차이를 표본 안에서만 비교할 것.",
      sourceLabel: "채널 DNA·편차",
    });
    if (bench.performanceSpreadFallback) {
      rawEvidenceLines.push(bench.performanceSpreadFallback);
    }
  }

  if (bench.uploadConsistencyLevel != null) {
    records.push({
      id: nextSignalId("upl"),
      dimension: "cadence",
      summaryLine: `업로드 간격 일관성: ${triLabel(bench.uploadConsistencyLevel)}`,
      forSeo:
        "발행 리듬이 들어가는 제목 표기(회차·주기)가 채널 전체에서 흔들리지 않는지 점검할 것.",
      sourceLabel: "채널 DNA·업로드",
    });
    if (bench.uploadConsistencyFallback) {
      rawEvidenceLines.push(bench.uploadConsistencyFallback);
    }
  }

  for (const flag of context.patternFlags) {
    if (flag === "repeated_topic_pattern") {
      records.push({
        id: nextSignalId("pat"),
        dimension: "meta",
        summaryLine: "스냅샷 패턴: 주제·포맷 반복(repeated_topic_pattern)",
        forSeo:
          "의도적 시리즈라면 제목 접두·회차 표기를 통일하고, 피로 요소는 표본 반응만으로 판단할 것.",
        sourceLabel: "스냅샷 패턴",
      });
    }
    if (flag === "low_tag_usage") {
      records.push({
        id: nextSignalId("tag"),
        dimension: "meta",
        summaryLine: "스냅샷 패턴: 태그 사용 부족(low_tag_usage)",
        forSeo:
          "제목·설명만으로 주제를 모두 담으려 하기보다, 주제 태그와 제목 앞부분의 어휘를 맞출 것.",
        sourceLabel: "스냅샷 패턴",
      });
    }
  }

  if (
    context.seoOptimizationScore != null &&
    context.seoOptimizationScore < 55
  ) {
    records.push({
      id: nextSignalId("seo"),
      dimension: "meta",
      summaryLine: `메타·발견성 구간 점수 ${Math.round(context.seoOptimizationScore)}점(낮게 기록)`,
      forSeo:
        "/analysis 동일 구간과 함께 보며 제목·태그·설명의 용어 일관성을 한 축만 바꿔 실험할 것.",
      sourceLabel: "구간 점수",
    });
  }

  if (
    context.contentStructureScore != null &&
    context.contentStructureScore < 55
  ) {
    records.push({
      id: nextSignalId("str"),
      dimension: "meta",
      summaryLine: `콘텐츠·구조 구간 점수 ${Math.round(context.contentStructureScore)}점(낮게 기록)`,
      forSeo:
        "제목 길이·접두 패턴·시리즈 표기 등 구조 신호를 표본끼리 통일할지 검토할 것.",
      sourceLabel: "구간 점수",
    });
  }

  if (
    context.avgTitleLength != null &&
    Number.isFinite(context.avgTitleLength)
  ) {
    rawEvidenceLines.push(
      `표본 평균 제목 길이 약 ${Math.round(context.avgTitleLength)}자(스냅샷 메트릭).`
    );
  }
  if (context.avgTagCount != null && Number.isFinite(context.avgTagCount)) {
    rawEvidenceLines.push(
      `표본 평균 태그 수 약 ${context.avgTagCount.toFixed(1)}개(스냅샷 메트릭).`
    );
  }

  return { records, rawEvidenceLines };
}
