import type { SeoLabResultRow, SeoLabSpecViewModel } from "@/components/seo-lab/types";

const PIPELINE_NOTE =
  "저장된 분석 표본(제목·조회·태그 등)과 분석 시 기록된 문장만 사용합니다. 검색 노출·외부 검색량·다른 채널과의 비교는 포함하지 않습니다.";

const STOP = new Set([
  "및",
  "그리고",
  "그런",
  "하는",
  "있는",
  "같은",
  "위한",
  "대한",
  "영상",
  "이번",
  "오늘",
  "에서",
  "으로",
  "있다",
  "없다",
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "with",
]);

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function safeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim());
}

function readString(row: Record<string, unknown> | null, key: string): string | null {
  if (!row) {
    return null;
  }
  const v = row[key];
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

type VideoRow = {
  title: string;
  viewCount: number | null;
  tags: string[];
};

function parseVideos(snapshot: unknown): VideoRow[] {
  if (!isRecord(snapshot)) {
    return [];
  }
  const raw = snapshot.videos ?? snapshot.sample_videos;
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: VideoRow[] = [];
  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }
    const title = typeof item.title === "string" ? item.title.trim() : "";
    if (!title) {
      continue;
    }
    const viewCount =
      typeof item.viewCount === "number"
        ? item.viewCount
        : typeof item.view_count === "number"
          ? item.view_count
          : null;
    const tagsRaw = item.tags ?? item.tag_list ?? item.keywords;
    const tags: string[] = [];
    if (Array.isArray(tagsRaw)) {
      for (const t of tagsRaw) {
        if (typeof t === "string" && t.trim()) {
          tags.push(t.trim());
        }
      }
    } else if (typeof tagsRaw === "string" && tagsRaw.trim()) {
      tags.push(...tagsRaw.split(/[,#]/).map((s) => s.trim()).filter(Boolean));
    }
    out.push({ title, viewCount, tags });
  }
  return out;
}

function tokenize(text: string): string[] {
  return text
    .split(/[\s|·,/，#]+|[•]+/g)
    .map((s) => s.replace(/['"`]/g, "").trim())
    .filter((s) => s.length >= 2 && s.length <= 32 && !STOP.has(s));
}

function countTokens(
  videos: VideoRow[]
): { counts: Map<string, number>; tokensByTitle: string[][] } {
  const counts = new Map<string, number>();
  const tokensByTitle: string[][] = [];
  for (const v of videos) {
    const tokens = tokenize(v.title);
    tokensByTitle.push(tokens);
    for (const t of tokens) {
      const k = t.toLowerCase();
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
  return { counts, tokensByTitle };
}

function topN(counts: Map<string, number>, n: number): string[] {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  if (s.length % 2 === 1) {
    return s[mid] ?? null;
  }
  const a = s[mid - 1];
  const b = s[mid];
  if (a == null || b == null) {
    return null;
  }
  return (a + b) / 2;
}

function brandTokensFromChannel(channelTitle: string | null): Set<string> {
  const s = new Set<string>();
  if (!channelTitle) {
    return s;
  }
  for (const t of tokenize(channelTitle)) {
    s.add(t.toLowerCase());
  }
  return s;
}

export function buildSeoLabSpecViewModel(
  row: SeoLabResultRow | null,
  channelTitle: string | null
): SeoLabSpecViewModel {
  const emptyBase = (): SeoLabSpecViewModel => ({
    dataPipelineNote: PIPELINE_NOTE,
    diagnosis: {
      titleClarity: "저장된 분석이 없어 제목 명확성을 평가하지 않았습니다.",
      keywordConsistency: "—",
      topicFocus: "—",
      representativeKeywordAxis: "—",
    },
    keywordAnalysis: {
      topKeywords: [],
      topKeywordsNote: "표본이 없습니다.",
      lowPerformingRepeated: [],
      lowPerformingNote: "표본이 없습니다.",
      underutilized: [],
      underutilizedNote: "표본이 없습니다.",
      brandVsGeneral: channelTitle
        ? `채널명만 확인: “${channelTitle}”. 분석 스냅샷이 없어 키워드 표본·일반 키워드 비교는 없습니다.`
        : "채널명이 없습니다.",
    },
    titleImprovement: {
      problemAnalysis: "—",
      improvedTitleSuggestion: "—",
      structureFormula:
        "후크(한 줄) + 주제 키워드 + 결과/형식(선택). 외부 검색량은 반영하지 않습니다.",
    },
    clusters: {
      strongTopics: [],
      expansionTopics: [],
      confusedTopics: [],
      cleanupPriority: [],
    },
    execution: {
      keywordVideoIdeas: [],
      titleGenerationHints: [],
      checklist: [],
    },
  });

  if (!row) {
    return emptyBase();
  }

  const raw = row as Record<string, unknown>;
  const videos = parseVideos(row.feature_snapshot);
  const { counts, tokensByTitle } = countTokens(videos);
  const topKw = topN(counts, 8);
  const topKwNote =
    videos.length > 0
      ? `제목 ${videos.length}개에서 자주 사용된 키워드입니다. 외부 검색량이나 경쟁 정도는 알 수 없습니다.`
      : "표본 제목이 없어 자주 쓰인 키워드를 계산하지 않았습니다.";

  const weak = safeStringArray(row.weaknesses);
  const bottle = safeStringArray(row.bottlenecks);
  const patterns = isRecord(row.feature_snapshot)
    ? safeStringArray((row.feature_snapshot as Record<string, unknown>).patterns)
    : [];

  const views = videos.map((v) => v.viewCount).filter((v): v is number => v != null && Number.isFinite(v));
  const med = median(views);
  const lowIdx: number[] = [];
  if (med != null && med > 0) {
    videos.forEach((v, i) => {
      if (v.viewCount != null && v.viewCount <= med) {
        lowIdx.push(i);
      }
    });
  }
  const lowCounts = new Map<string, number>();
  for (const i of lowIdx) {
    const tokens = tokensByTitle[i] ?? [];
    for (const t of tokens) {
      const k = t.toLowerCase();
      lowCounts.set(k, (lowCounts.get(k) ?? 0) + 1);
    }
  }
  const lowRep = topN(lowCounts, 5).filter((k) => (lowCounts.get(k) ?? 0) >= 2);
  const lowNote =
    med != null && videos.length >= 3
      ? `표본 안에서 조회가 중간 이하인 영상 제목에 자주 나온 키워드입니다. 내부 표본 비교만이며, 검색 결과나 클릭률과 연결하지 않습니다.`
      : "표본이 3개 미만이거나 조회수가 없어 ‘자주 쓰지만 성과 연결이 약한 키워드’를 나누지 않았습니다.";

  const tagSet = new Set<string>();
  for (const v of videos) {
    for (const t of v.tags) {
      tagSet.add(t.toLowerCase());
    }
  }
  const highTokens = new Set<string>();
  if (med != null && med > 0) {
    videos.forEach((v, i) => {
      if (v.viewCount != null && v.viewCount > med) {
        for (const t of tokensByTitle[i] ?? []) {
          highTokens.add(t.toLowerCase());
        }
      }
    });
  }
  const under: string[] = [];
  for (const t of Array.from(highTokens)) {
    if (!tagSet.has(t) && topKw.slice(0, 5).includes(t)) {
      under.push(t);
    }
  }
  const underNote =
    tagSet.size > 0
      ? "조회가 잘 나온 편(표본 안) 제목 키워드 중, 태그에 아직 안 넣은 표현입니다. 잘된 패턴인데 덜 활용한 경우로 볼 수 있습니다."
      : "표본에 태그가 없어 이 항목을 계산하지 않았습니다.";

  const brand = brandTokensFromChannel(channelTitle);
  let brandGeneral =
    "채널명이 없거나 제목 키워드와 겹치지 않아 브랜드/일반 구분을 두지 않았습니다.";
  if (brand.size > 0 && topKw.length > 0) {
    const hits = topKw.filter((k) => brand.has(k));
    const rest = topKw.filter((k) => !brand.has(k));
    brandGeneral =
      hits.length > 0
        ? `채널명과 겹치는 표현: ${hits.slice(0, 4).join(", ")}. 그 밖에 자주 나온 키워드: ${rest.slice(0, 4).join(", ") || "—"}.`
        : `자주 나온 키워드는 채널명과 겹치지 않아 일반 주제로 읽을 수 있습니다: ${rest.slice(0, 6).join(", ")}.`;
  }

  const titleInsight = readString(raw, "title_insights");
  const metaInsight = readString(raw, "metadata_insights");
  const contentPatternSummary = readString(raw, "content_pattern_summary");
  const recommendedTopics = safeStringArray(raw.recommended_topics);

  const titleClarity =
    titleInsight ??
    (videos.length > 0
      ? `제목 길이와 반복 표현만 보면, 가장 많이 쓰인 키워드는 “${topKw[0] ?? "—"}”입니다. (저장된 제목 진단 문장이 없을 때의 내부 요약)`
      : "표본 제목이 없어 명확성을 수치화하지 않았습니다.");

  const keywordConsistency =
    tagSet.size > 0 && topKw.length > 0
      ? `제목에서 자주 나온 키워드와 태그의 일치: ${topKw.filter((k) => tagSet.has(k)).slice(0, 4).join(", ") || "거의 없음"}.`
      : "태그 표본이 없어 제목·태그 일관성을 계산하지 않았습니다.";

  const topicFocus =
    contentPatternSummary ??
    (patterns.length > 0
      ? `스냅샷 패턴 플래그: ${patterns.slice(0, 4).join(" · ")}`
      : weak[0] ?? "저장된 주제 요약이 없습니다.");

  const seoScore =
    row.feature_section_scores && typeof row.feature_section_scores.seoOptimization === "number"
      ? row.feature_section_scores.seoOptimization
      : null;
  const representativeKeywordAxis =
    recommendedTopics.length > 0
      ? `저장된 주제 후보: ${recommendedTopics.slice(0, 5).join(" · ")}`
      : seoScore != null
        ? `SEO 구간 점수(0–100): ${Math.round(seoScore)}. 외부 검색량은 없습니다.`
        : topKw.length > 0
          ? `표본 제목에서 반복되는 축: ${topKw.slice(0, 4).join(" · ")}`
          : "대표 키워드 축을 계산할 표본이 없습니다.";

  const problemAnalysis =
    weak.slice(0, 2).join(" · ") || "저장된 약점 문장이 없습니다. 제목·메타는 표본 기준으로만 점검합니다.";
  const improvedTitleSuggestion =
    recommendedTopics[0] != null
      ? `주제 후보를 제목에 녹이는 예: “… ${recommendedTopics[0]} …” (형식·채널 톤에 맞게 조정)`
      : "저장된 주제 후보가 없으면, 표본에서 자주 나온 키워드를 제목에 넣는 실험을 권합니다.";

  const strongTopics = topKw.slice(0, 4);
  const expansionTopics = recommendedTopics.slice(0, 5);
  const confusedTopics =
    lowRep.length > 0
      ? lowRep
      : patterns.filter((p) => p.includes("?") || p.includes("혼")).slice(0, 3);
  const cleanupPriority = bottle.slice(0, 4).length > 0 ? bottle.slice(0, 4) : weak.slice(0, 4);

  const keywordVideoIdeas =
    recommendedTopics.length > 0
      ? recommendedTopics.slice(0, 4).map((t) => `주제: ${t} — 표본 키워드와 맞는 1편 기획 초안`)
      : topKw.slice(0, 3).map((t) => `주제: ${t} — 표본에서 자주 나온 키워드로 잡은 영상 아이디어`);

  const titleGenerationHints = [
    `저장된 제목 진단 요약: ${titleInsight ? "있음" : "없음"}`,
    `저장된 설명 메모: ${metaInsight ? "있음" : "없음"}`,
    "구조: 후크 + 키워드 + 결과/형식. 외부 자동 생성은 없습니다.",
  ];

  const checklist = [
    "한 번에 바꿀 것은 제목 또는 태그 중 하나만",
    "변경 전후 2주 동일 지표(표본 조회·반응)만 비교",
    "검색 순위·노출은 이 페이지에서 다루지 않음",
  ];

  return {
    dataPipelineNote: PIPELINE_NOTE,
    diagnosis: {
      titleClarity,
      keywordConsistency,
      topicFocus,
      representativeKeywordAxis,
    },
    keywordAnalysis: {
      topKeywords: topKw,
      topKeywordsNote: topKwNote,
      lowPerformingRepeated: lowRep,
      lowPerformingNote: lowNote,
      underutilized: under.slice(0, 6),
      underutilizedNote: underNote,
      brandVsGeneral: brandGeneral,
    },
    titleImprovement: {
      problemAnalysis,
      improvedTitleSuggestion,
      structureFormula:
        "후크(한 줄) + 주제 키워드 + 결과/형식(선택). 외부 검색량·다른 채널 비교는 포함하지 않습니다.",
    },
    clusters: {
      strongTopics,
      expansionTopics,
      confusedTopics: confusedTopics.length > 0 ? confusedTopics : ["저장된 혼선 주제 신호가 없습니다."],
      cleanupPriority: cleanupPriority.length > 0 ? cleanupPriority : ["저장된 병목·정리 우선순위가 없습니다."],
    },
    execution: {
      keywordVideoIdeas,
      titleGenerationHints,
      checklist,
    },
  };
}
