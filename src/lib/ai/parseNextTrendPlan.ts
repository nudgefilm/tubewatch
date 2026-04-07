import type { NextTrendAIPlan } from "@/lib/ai/getGeminiConfig";

export const MAX_ITEM_LENGTH = 120;

// ── Insight item normalization ──

const LEADING_MARKER_PATTERN =
  /^(?:[\d]+[.)]\s*|[-*•·‣▸▹►→●○◆◇■□▪▫]\s*|[①②③④⑤⑥⑦⑧⑨⑩]\s*)/;

function stripLeadingMarker(text: string): string {
  return text.replace(LEADING_MARKER_PATTERN, "").trim();
}

export function truncateToLimit(text: string, limit: number): string {
  if (text.length <= limit) return text;

  const cut = text.slice(0, limit);

  const lastKoreanEnd = cut.lastIndexOf("다.");
  if (lastKoreanEnd > limit * 0.5) {
    return cut.slice(0, lastKoreanEnd + 2);
  }

  const lastPeriod = cut.lastIndexOf(".");
  if (lastPeriod > limit * 0.5) {
    return cut.slice(0, lastPeriod + 1);
  }

  return cut.trimEnd();
}

function deduplicateItems(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.toLowerCase().replace(/\s+/g, " ").trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function cleanInsightArray(items: string[], maxCount: number): string[] {
  const cleaned = items
    .map((item) => stripLeadingMarker(item.trim()))
    .filter((item) => item.length > 0)
    .map((item) => truncateToLimit(item, MAX_ITEM_LENGTH));

  return deduplicateItems(cleaned).slice(0, maxCount);
}

// ── Field normalization ──

export function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 ? text : null;
}

export function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function clampScore(v: unknown): number {
  const n =
    typeof v === "number"
      ? v
      : typeof v === "string"
        ? parseFloat(v)
        : NaN;
  return Number.isFinite(n) ? Math.max(1, Math.min(5, Math.round(n))) : 3;
}

export function assembleVideoPlanDocument(obj: Record<string, unknown>): string {
  // vpd_sec1~6 개별 필드 우선 조합, 없으면 구버전 video_plan_document 폴백
  const sections = [
    { heading: "## 1. 기획 의도 (The Logic)", key: "vpd_sec1" },
    { heading: "## 2. 킬러 타이틀 & 썸네일 (The Hook)", key: "vpd_sec2" },
    { heading: "## 3. 인트로 30초 설계 (The Retention)", key: "vpd_sec3" },
    { heading: "## 4. 메인 콘텐츠 구성 (The Body)", key: "vpd_sec4" },
    { heading: "## 5. 시청자 결핍 & SEO (The Value)", key: "vpd_sec5" },
    { heading: "## 6. 예상 시청자 반응 (The Outcome)", key: "vpd_sec6" },
  ];

  const hasSections = sections.some(
    (s) =>
      typeof obj[s.key] === "string" && (obj[s.key] as string).trim().length > 0
  );

  if (hasSections) {
    return sections
      .map(({ heading, key }) => {
        const content = normalizeString(obj[key]) ?? "";
        if (!content) return "";
        // Gemini가 이미 ## 헤딩을 포함한 경우 중복 방지
        const startsWithHeading = content.trimStart().startsWith("##");
        return startsWithHeading ? content : `${heading}\n${content}`;
      })
      .filter(Boolean)
      .join("\n\n");
  }

  // 구버전 호환 폴백
  return normalizeString(obj.video_plan_document) ?? "";
}

export function normalizeNextTrendPlan(raw: unknown): NextTrendAIPlan | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  const topic = normalizeString(obj.topic);
  const why = normalizeString(obj.why_this_topic);
  const pain = normalizeString(obj.pain_point);
  if (!topic || !why || !pain) return null;
  const titles = cleanInsightArray(normalizeStringArray(obj.title_candidates), 3);
  const tags = cleanInsightArray(normalizeStringArray(obj.recommended_tags), 8);

  // viewing_points normalization: clamp to 1–5 integers
  const vpRaw =
    obj.viewing_points &&
    typeof obj.viewing_points === "object" &&
    !Array.isArray(obj.viewing_points)
      ? (obj.viewing_points as Record<string, unknown>)
      : null;

  const plan: NextTrendAIPlan = {
    topic: truncateToLimit(topic, 40),
    why_this_topic: truncateToLimit(why, 300),
    pain_point: truncateToLimit(pain, 200),
    content_angle: truncateToLimit(normalizeString(obj.content_angle) ?? "", 150),
    opening_hook: truncateToLimit(normalizeString(obj.opening_hook) ?? "", 200),
    title_candidates: titles.length > 0 ? titles : [],
    recommended_tags: tags,
    script_outline: truncateToLimit(
      normalizeString(obj.script_outline) ?? "",
      400
    ),
    thumbnail_direction: truncateToLimit(
      normalizeString(obj.thumbnail_direction) ?? "",
      300
    ),
    content_plan: truncateToLimit(
      normalizeString(obj.content_plan) ?? "",
      400
    ),
    exit_prevention: truncateToLimit(
      normalizeString(obj.exit_prevention) ?? "",
      400
    ),
    expected_reaction: truncateToLimit(
      normalizeString(obj.expected_reaction) ?? "",
      400
    ),
    viewing_points: {
      popularity: clampScore(vpRaw?.popularity),
      expertise: clampScore(vpRaw?.expertise),
      stimulation: clampScore(vpRaw?.stimulation),
      informativeness: clampScore(vpRaw?.informativeness),
      fan_service: clampScore(vpRaw?.fan_service),
    },
    video_plan_document: assembleVideoPlanDocument(obj),
    execution_hint_document:
      normalizeString(obj.execution_hint_document) ?? "",
  };

  return plan;
}
