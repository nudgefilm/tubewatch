/**
 * 저장된 `feature_snapshot` 표본 영상만 사용. 외부 API·미래 추정 없음.
 */
import { normalizeFeatureSnapshot, type NormalizedSnapshotVideo } from "@/lib/analysis/normalizeSnapshot";

export type TrendSignalStrength = "low" | "medium" | "clear";

export type TrendSignalCategory =
  | "repeat"
  | "view"
  | "format"
  | "rhythm"
  | "snapshot_pattern";

export type TrendSignalRecord = {
  id: string;
  category: TrendSignalCategory;
  headline: string;
  detail: string;
  evidenceSource: string;
  strength: TrendSignalStrength;
};

export type TrendSignalsBundle = {
  records: TrendSignalRecord[];
  evidenceNotes: string[];
  recentVideosUsed: number;
};

const SHORT_SEC = 180;
const LONG_SEC = 480;

const STOP_TOKENS = new Set([
  "및",
  "등",
  "외",
  "왜",
  "뭐",
  "그",
  "이",
  "저",
  "것",
  "수",
  "더",
  "안",
  "잘",
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "in",
  "ep",
  "pt",
]);

function parseTime(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

function tokenizeTitle(title: string): string[] {
  const parts = title.split(/[\s|·•,:;()[\]"'/\\]+/);
  const out: string[] = [];
  for (const p of parts) {
    const t = p.trim().toLowerCase();
    if (t.length < 2) continue;
    if (STOP_TOKENS.has(t)) continue;
    if (/^\d+$/.test(t)) continue;
    out.push(t);
  }
  return out;
}

let sigSeq = 0;
function nextId(prefix: string): string {
  sigSeq += 1;
  return `trend-sig-${prefix}-${sigSeq}`;
}

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((s, v) => s + v, 0) / nums.length;
}

/**
 * 최근 표본 영상에서 내부 통계 신호만 생성 (예측·외부 트렌드 없음).
 */
export function buildTrendSignals(snapshot: unknown): TrendSignalsBundle {
  sigSeq = 0;
  const normalized = normalizeFeatureSnapshot(snapshot);
  const videos = normalized.videos;
  const recentVideosUsed = videos.length;
  const records: TrendSignalRecord[] = [];
  const evidenceNotes: string[] = [];

  if (recentVideosUsed === 0) {
    return { records: [], evidenceNotes: ["스냅샷에 제목이 있는 영상 표본이 없습니다."], recentVideosUsed: 0 };
  }

  evidenceNotes.push(`분석에 사용한 표본 영상 수: ${recentVideosUsed}개(저장 스냅샷).`);

  const withTime = videos
    .map((v, idx) => ({ v, idx, t: parseTime(v.publishedAt) }))
    .sort((a, b) => {
      if (a.t == null && b.t == null) return a.idx - b.idx;
      if (a.t == null) return 1;
      if (b.t == null) return -1;
      return a.t - b.t;
    });

  const chronVideos = withTime.map((x) => x.v);

  /** 반복 토큰: 2편 이상 제목에 등장 */
  const tokenToIndices = new Map<string, Set<number>>();
  videos.forEach((v, i) => {
    const seen = new Set<string>();
    for (const tok of tokenizeTitle(v.title)) {
      if (seen.has(tok)) continue;
      seen.add(tok);
      let set = tokenToIndices.get(tok);
      if (!set) {
        set = new Set<number>();
        tokenToIndices.set(tok, set);
      }
      set.add(i);
    }
  });

  const repeatedTokens: { token: string; count: number }[] = [];
  for (const [token, set] of Array.from(tokenToIndices)) {
    if (set.size >= 2) {
      repeatedTokens.push({ token, count: set.size });
    }
  }
  repeatedTokens.sort((a, b) => b.count - a.count || b.token.length - a.token.length);
  const topTokens = repeatedTokens.slice(0, 4);
  for (const { token, count } of topTokens) {
    const strength: TrendSignalStrength =
      count >= 4 ? "clear" : count >= 3 ? "medium" : "low";
    records.push({
      id: nextId("tok"),
      category: "repeat",
      headline: `제목에서 ‘${token}’ 표현이 여러 편에서 반복됩니다`,
      detail:
        "최근 표본 제목만을 본 관찰입니다. 시청자에게 반복 인지되는 주제·시리즈 축인지 표본 내에서만 확인하세요.",
      evidenceSource: "표본 제목 토큰",
      strength,
    });
  }

  const views = videos
    .map((v) => v.viewCount)
    .filter((x): x is number => x != null && Number.isFinite(x) && x >= 0);
  if (views.length >= 3) {
    const m = mean(views);
    if (m != null && m > 0) {
      let maxV = 0;
      let maxTitle = "";
      for (const v of videos) {
        const vc = v.viewCount;
        if (vc != null && vc > maxV) {
          maxV = vc;
          maxTitle = v.title.length > 40 ? `${v.title.slice(0, 37)}…` : v.title;
        }
      }
      const ratio = maxV / m;
      if (ratio >= 1.35) {
        const strength: TrendSignalStrength = ratio >= 1.9 ? "clear" : "medium";
        records.push({
          id: nextId("view"),
          category: "view",
          headline: "특정 영상이 표본 평균 대비 조회가 높게 나타납니다",
          detail: `표본 평균 조회 대비 최고 편이 약 ${ratio.toFixed(2)}배 수준으로 집계되었습니다. 대표: «${maxTitle}». 인과나 지속성은 단정하지 않습니다.`,
          evidenceSource: "표본 조회수",
          strength,
        });
      }
    }
  }

  const dated = chronVideos.filter((v) => parseTime(v.publishedAt) != null);
  if (dated.length >= 4) {
    const mid = Math.floor(dated.length / 2);
    const older = dated.slice(0, mid);
    const newer = dated.slice(mid);
    const olderViews = older
      .map((v) => v.viewCount)
      .filter((x): x is number => x != null && x >= 0);
    const newerViews = newer
      .map((v) => v.viewCount)
      .filter((x): x is number => x != null && x >= 0);
    const mo = mean(olderViews);
    const mn = mean(newerViews);
    if (mo != null && mn != null && mo > 0 && olderViews.length >= 2 && newerViews.length >= 2) {
      const rel = mn / mo;
      if (rel >= 1.22) {
        const strength: TrendSignalStrength = rel >= 1.45 ? "clear" : "medium";
        records.push({
          id: nextId("vh"),
          category: "view",
          headline: "최근 공개 쪽이 이전 표본 대비 조회가 상대적으로 높게 집계되었습니다",
          detail:
            "공개 시점 기준 앞·뒤 절반을 나눠 평균 조회만 비교했습니다. 미래 성과나 트렌드 예측이 아닙니다.",
          evidenceSource: "표본 조회·공개일",
          strength,
        });
      } else if (rel <= 0.82) {
        const strength: TrendSignalStrength = rel <= 0.68 ? "clear" : "medium";
        records.push({
          id: nextId("vl"),
          category: "view",
          headline: "최근 공개 쪽이 이전 표본 대비 조회가 상대적으로 낮게 집계되었습니다",
          detail:
            "동일하게 절반 구간 비교입니다. 원인 단정 없이 표본 내 차이로만 기술합니다.",
          evidenceSource: "표본 조회·공개일",
          strength,
        });
      }
    }
  }

  const withDur = chronVideos.filter(
    (v) => v.durationSeconds != null && v.durationSeconds > 0
  );
  if (withDur.length >= 4) {
    const mid = Math.floor(withDur.length / 2);
    const older = withDur.slice(0, mid);
    const newer = withDur.slice(mid);
    const shortRatio = (list: NormalizedSnapshotVideo[]): number | null => {
      const durs = list
        .map((x) => x.durationSeconds)
        .filter((d): d is number => d != null && d > 0);
      if (durs.length === 0) return null;
      const shorts = durs.filter((d) => d <= SHORT_SEC).length;
      return shorts / durs.length;
    };
    const ro = shortRatio(older);
    const rn = shortRatio(newer);
    if (ro != null && rn != null) {
      const delta = rn - ro;
      if (Math.abs(delta) >= 0.2) {
        const strength: TrendSignalStrength = Math.abs(delta) >= 0.35 ? "clear" : "medium";
        const dir =
          delta > 0
            ? "짧은 길이(추정) 비중이 최근 쪽에서 이전보다 높게 나타납니다"
            : "긴 영상 비중이 최근 쪽에서 이전보다 높게 나타납니다";
        records.push({
          id: nextId("fmt"),
          category: "format",
          headline: dir,
          detail:
            `길이 기준: 약 ${SHORT_SEC}초 이하를 짧은 편으로만 구분했습니다. 숏스/롱폼 공식 분류가 아닙니다.`,
          evidenceSource: "표본 재생 길이",
          strength,
        });
      }
    }
    const avgOlder = mean(older.map((v) => v.durationSeconds).filter((x): x is number => x != null));
    const avgNewer = mean(newer.map((v) => v.durationSeconds).filter((x): x is number => x != null));
    if (
      avgOlder != null &&
      avgNewer != null &&
      avgOlder > 0 &&
      Math.abs(avgNewer - avgOlder) / avgOlder >= 0.18
    ) {
      const up = avgNewer > avgOlder;
      const strength: TrendSignalStrength =
        Math.abs(avgNewer - avgOlder) / avgOlder >= 0.3 ? "clear" : "medium";
      const headline = up
        ? "최근 표본의 평균 재생 길이가 이전보다 길게 나타납니다"
        : "최근 표본의 평균 재생 길이가 이전보다 짧게 나타납니다";
      const exists = records.some((r) => r.id.startsWith("trend-sig-fmt-"));
      if (!exists) {
        records.push({
          id: nextId("fmt"),
          category: "format",
          headline,
          detail: "공개 시점 기준 앞·뒤 절반의 평균 길이만 비교했습니다.",
          evidenceSource: "표본 재생 길이",
          strength,
        });
      }
    }
  }

  const timeSorted = [...videos].sort((a, b) => {
    const ta = parseTime(a.publishedAt);
    const tb = parseTime(b.publishedAt);
    if (ta == null && tb == null) return 0;
    if (ta == null) return 1;
    if (tb == null) return -1;
    return ta - tb;
  });
  const times = timeSorted
    .map((v) => parseTime(v.publishedAt))
    .filter((t): t is number => t != null);
  if (times.length >= 4) {
    const gaps: number[] = [];
    for (let i = 1; i < times.length; i += 1) {
      const prev = times[i - 1];
      const cur = times[i];
      if (prev != null && cur != null) {
        gaps.push((cur - prev) / 86400000);
      }
    }
    if (gaps.length >= 3) {
      const k = Math.max(1, Math.floor(gaps.length / 2));
      const early = gaps.slice(0, k);
      const late = gaps.slice(-k);
      const me = mean(early);
      const ml = mean(late);
      if (me != null && ml != null && me > 0 && ml > 0) {
        if (ml < me * 0.72) {
          records.push({
            id: nextId("rh"),
            category: "rhythm",
            headline: "최근 구간에서 공개 간격이 이전보다 짧게 나타납니다",
            detail: "스냅샷에 기록된 공개일 간격만 비교했습니다. 업로드 계획을 추천하지 않습니다.",
            evidenceSource: "표본 공개일",
            strength: ml < me * 0.55 ? "clear" : "medium",
          });
        } else if (ml > me * 1.35) {
          records.push({
            id: nextId("rh"),
            category: "rhythm",
            headline: "최근 구간에서 공개 간격이 이전보다 길게 나타납니다",
            detail: "동일하게 공개일 간격 비교만 수행했습니다.",
            evidenceSource: "표본 공개일",
            strength: ml > me * 1.55 ? "clear" : "medium",
          });
        }
      }
    }
  }

  const flags = normalized.patterns;
  for (const flag of flags) {
    if (flag === "high_view_variance") {
      records.push({
        id: nextId("pat"),
        category: "snapshot_pattern",
        headline: "스냅샷에 조회 편차가 크다는 패턴이 기록되어 있습니다",
        detail: "베이스 엔진 플래그입니다. 제목·포맷 차이를 표본 안에서만 대조하세요.",
        evidenceSource: "스냅샷 patterns",
        strength: "medium",
      });
    }
    if (flag === "repeated_topic_pattern") {
      records.push({
        id: nextId("pat"),
        category: "snapshot_pattern",
        headline: "스냅샷에 주제·포맷 반복 패턴이 기록되어 있습니다",
        detail: "시리즈 의도와 맞는지, 표본 반응과 함께 별도 판단이 필요합니다.",
        evidenceSource: "스냅샷 patterns",
        strength: "medium",
      });
    }
    if (flag === "irregular_upload_interval") {
      records.push({
        id: nextId("pat"),
        category: "snapshot_pattern",
        headline: "스냅샷에 업로드 간격 불규칙 플래그가 있습니다",
        detail: "위 공개일 간격 비교와 함께 참고하면 됩니다.",
        evidenceSource: "스냅샷 patterns",
        strength: "low",
      });
    }
  }

  return { records, evidenceNotes, recentVideosUsed };
}

/** Next Trend 내부 스펙(권장 길이 등)용 — 외부 API 없음 */
export function getSnapshotVideoDurationStats(snapshot: unknown): {
  sampleCount: number;
  avgDurationSec: number | null;
} {
  const videos = normalizeFeatureSnapshot(snapshot).videos;
  const durs = videos
    .map((v) => v.durationSeconds)
    .filter((d): d is number => d != null && d > 0);
  if (durs.length === 0) {
    return { sampleCount: videos.length, avgDurationSec: null };
  }
  const avg = durs.reduce((s, v) => s + v, 0) / durs.length;
  return { sampleCount: videos.length, avgDurationSec: avg };
}
