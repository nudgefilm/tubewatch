/**
 * Action Plan / Benchmark 파이프라인 로그 검증용 스크립트.
 * 프로덕션 모듈은 import만 하며 수정하지 않습니다.
 *
 * 실행: npx --yes tsx scripts/action-plan-quality-verify.ts
 */
import type { AnalysisPageData, AnalysisResultRow } from "@/lib/analysis/getAnalysisPageData";
import { deniedYoutubeFeatureAccessSnapshot } from "@/lib/auth/youtubeFeatureAccessShared";
import { buildActionPlanPageViewModel } from "@/lib/action-plan/actionPlanPageViewModel";
import type { ActionPlanCardVm } from "@/lib/action-plan/actionPlanPageViewModel";
import {
  buildBenchmarkActionCandidates,
  type BenchmarkActionCandidate,
} from "@/lib/action-plan/buildBenchmarkActionCandidates";
import { buildInternalBenchmarkSummary } from "@/lib/benchmark/internalBenchmarkSummary";
import { pickBenchmarkSignalsForActionPlan } from "@/lib/benchmark/benchmarkSignalsForActionPlan";

type ActionKind = "benchmark" | "metric" | "text" | "fallback" | "unknown";

function classifyId(id: string): ActionKind {
  if (id.startsWith("benchmark-")) {
    return "benchmark";
  }
  if (id.startsWith("metric-")) {
    return "metric";
  }
  if (id.startsWith("text-")) {
    return "text";
  }
  if (id === "fallback-low-sections") {
    return "fallback";
  }
  return "unknown";
}

function whyQuality(len: number): string {
  if (len < 20) {
    return "too short";
  }
  if (len > 200) {
    return "too long";
  }
  return "ok";
}

function parseSectionsFromRow(
  row: AnalysisResultRow | null
): {
  channelActivity: number;
  audienceResponse: number;
  contentStructure: number;
  seoOptimization: number;
  growthMomentum: number;
} | null {
  if (!row) {
    return null;
  }
  const raw = row.feature_section_scores;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const keys = [
    "channelActivity",
    "audienceResponse",
    "contentStructure",
    "seoOptimization",
    "growthMomentum",
  ] as const;
  const out: Partial<Record<(typeof keys)[number], number>> = {};
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) {
      out[k] = Math.max(0, Math.min(100, v));
    }
  }
  if (Object.keys(out).length === 0) {
    return null;
  }
  return {
    channelActivity: out.channelActivity ?? 0,
    audienceResponse: out.audienceResponse ?? 0,
    contentStructure: out.contentStructure ?? 0,
    seoOptimization: out.seoOptimization ?? 0,
    growthMomentum: out.growthMomentum ?? 0,
  };
}

/** mergePrioritizedActionStack과 동일 규칙으로 메타를 붙여 재현 (비공개 함수 미러) */
function replayMergeMeta(
  benchmarkRows: BenchmarkActionCandidate[],
  metricCards: Omit<ActionPlanCardVm, "priority">[],
  textCards: Omit<ActionPlanCardVm, "priority">[]
): readonly {
  id: string;
  title: string;
  whyNeeded: string;
  sortTier: number;
  sortOrder: number;
  type: ActionKind;
  evidenceSource: ActionPlanCardVm["evidenceSource"];
  isFiltered: boolean;
}[] {
  type Sortable = Omit<ActionPlanCardVm, "priority"> & {
    sortTier: number;
    sortOrder: number;
  };

  const bench: Sortable[] = benchmarkRows.map((b) => ({
    id: b.id,
    title: b.title,
    whyNeeded: b.whyNeeded,
    expectedEffect: b.expectedEffect,
    difficulty: b.difficulty,
    executionHint: b.executionHint,
    evidenceSource: "benchmark",
    sortTier: b.sortTier,
    sortOrder: b.sortOrder,
  }));

  const metricS: Sortable[] = metricCards.map((c, i) => ({
    ...c,
    sortTier: 4,
    sortOrder: 100 + i,
  }));

  const textS: Sortable[] = textCards.map((c, i) => ({
    ...c,
    sortTier: 6,
    sortOrder: i,
  }));

  const all = [...bench, ...metricS, ...textS];
  all.sort((a, b) => a.sortTier - b.sortTier || a.sortOrder - b.sortOrder);

  const seenId = new Set<string>();
  const seenKey = new Set<string>();
  const out: {
    id: string;
    title: string;
    whyNeeded: string;
    sortTier: number;
    sortOrder: number;
    type: ActionKind;
    evidenceSource: ActionPlanCardVm["evidenceSource"];
    isFiltered: boolean;
  }[] = [];

  for (const item of all) {
    if (seenId.has(item.id)) {
      continue;
    }
    const key = `${item.title}|${item.whyNeeded.slice(0, 120)}`;
    if (seenKey.has(key)) {
      continue;
    }
    seenKey.add(key);
    seenId.add(item.id);
    out.push({
      id: item.id,
      title: item.title,
      whyNeeded: item.whyNeeded,
      sortTier: item.sortTier,
      sortOrder: item.sortOrder,
      type: classifyId(item.id),
      evidenceSource: item.evidenceSource,
      isFiltered: false,
    });
    if (out.length >= 9) {
      break;
    }
  }
  return out;
}

function makeVideoStub(
  index: number,
  viewCount: number,
  daysAgo: number
): Record<string, unknown> {
  return {
    title: `검증용 영상 ${index + 1}`,
    viewCount,
    publishedAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    durationSeconds: 240,
  };
}

function buildCaseData(videoCount: number): AnalysisPageData {
  const views =
    videoCount >= 3
      ? (() => {
          const arr: number[] = [];
          for (let i = 0; i < videoCount - 1; i++) {
            arr.push(200 + i * 30);
          }
          arr.push(8000);
          return arr;
        })()
      : [150, 9000];

  const videos = views.map((vc, i) => makeVideoStub(i, vc, (i + 1) * 3));

  const snapshot: Record<string, unknown> = {
    metrics: {
      avgUploadIntervalDays: 22,
      medianViewCount: 400,
      avgViewCount: 600,
      recent30dUploadCount: 3,
      avgLikeRatio: 0.035,
      avgTitleLength: 38,
      avgTagCount: 6,
      avgVideoDuration: 280,
    },
    videos,
    patterns: [],
  };

  const row: AnalysisResultRow = {
    id: "verify-row",
    user_channel_id: "verify-ch",
    user_id: "verify-user",
    feature_snapshot: snapshot,
    feature_section_scores: {
      channelActivity: 42,
      audienceResponse: 48,
      contentStructure: 52,
      seoOptimization: 44,
      growthMomentum: 46,
    },
    strengths: videoCount >= 8 ? ["일관된 오프닝 문장"] : [],
    weaknesses: videoCount >= 5 ? [] : ["썸네일 대비 제목 길이"],
    bottlenecks: [],
    feature_total_score: 55,
  };

  const channel = {
    id: "verify-ch",
    user_id: "verify-user",
    channel_title: "검증 채널",
    video_count: videoCount,
  };

  return {
    userId: "verify-user",
    channels: [channel],
    selectedChannel: channel,
    latestResult: row,
    analysisRuns: [],
    youtubeFeatureAccess: deniedYoutubeFeatureAccessSnapshot("검증 스크립트"),
  };
}

function logSection(title: string): void {
  console.log(`\n======== ${title} ========`);
}

/**
 * VM 결과에서 merge 입력(metric/text)을 역으로 완전 복원할 수 없으므로,
 * replayMergeMeta는 "벤치마크 행만" 또는 설명용으로 사용합니다.
 */
function runCase(name: string, data: AnalysisPageData): void {
  logSection(name);

  const ib = buildInternalBenchmarkSummary(data);
  console.log("internalBenchmarkSummary.recentVideosUsed:", ib.recentVideosUsed);
  console.log(
    "internalBenchmarkSummary (핵심):",
    JSON.stringify(
      {
        breakoutDependencyLevel: ib.breakoutDependencyLevel,
        performanceSpreadLevel: ib.performanceSpreadLevel,
        uploadConsistencyLevel: ib.uploadConsistencyLevel,
        top3Share: ib.top3Share,
        topPerformerShare: ib.topPerformerShare,
      },
      null,
      2
    )
  );

  const signals = pickBenchmarkSignalsForActionPlan(ib);
  const sectionInput = parseSectionsFromRow(data.latestResult);

  const benchRows = buildBenchmarkActionCandidates(signals, sectionInput);

  console.log("\n--- buildBenchmarkActionCandidates ---");
  for (const r of benchRows) {
    const len = r.whyNeeded.length;
    console.log(
      JSON.stringify(
        {
          id: r.id,
          title: r.title,
          type: "benchmark",
          sortTier: r.sortTier,
          sortOrder: r.sortOrder,
          whyNeededLength: len,
          whyQuality: whyQuality(len),
          evidenceSource: "benchmark",
          isFiltered: false,
        },
        null,
        2
      )
    );
  }

  const mergeBenchOnly = replayMergeMeta(benchRows, [], []);
  console.log("\n--- replayMergeMeta (benchmark만, sortTier/Order 확인용) ---");
  console.log(JSON.stringify(mergeBenchOnly, null, 2));

  const vm = buildActionPlanPageViewModel(data);

  console.log("\n--- buildActionPlanPageViewModel → actions (최종) ---");
  for (let i = 0; i < vm.actions.length; i++) {
    const a = vm.actions[i];
    const len = a.whyNeeded.length;
    console.log(
      JSON.stringify(
        {
          index: i,
          id: a.id,
          title: a.title,
          type: classifyId(a.id),
          priority: a.priority,
          whyNeededLength: len,
          whyQuality: whyQuality(len),
          evidenceSource: a.evidenceSource ?? null,
          sortTier: "see order index vs type",
          sortOrder: i,
        },
        null,
        2
      )
    );
  }

  const benchmarkCount = vm.actions.filter((a) => a.evidenceSource === "benchmark").length;
  const metricCount = vm.actions.filter((a) => classifyId(a.id) === "metric").length;
  const textCount = vm.actions.filter((a) => classifyId(a.id) === "text").length;

  const ids = vm.actions.map((a) => a.id);
  const idSet = new Set(ids);
  const duplicateIds = ids.length !== idSet.size;

  const issues: string[] = [];
  if (vm.actions.length < 1) {
    issues.push("액션 0개");
  }
  if (duplicateIds) {
    issues.push("id 중복 존재");
  }

  if (name.includes("CASE A")) {
    const benchIds = vm.actions
      .filter((a) => a.evidenceSource === "benchmark")
      .map((a) => a.id);
    const onlyRhythm =
      benchIds.length === 0 ||
      (benchIds.length === 1 && benchIds[0] === "benchmark-upload-rhythm");
    if (!onlyRhythm) {
      issues.push(`CASE A: 벤치마크 카드 기대와 다름 → ${JSON.stringify(benchIds)}`);
    }
  }

  if (name.includes("CASE B")) {
    if (benchRows.length > 3) {
      issues.push(`CASE B: buildBenchmarkActionCandidates ${benchRows.length}개 > 3`);
    }
  }

  if (name.includes("CASE C")) {
    if (vm.actions.length > 9) {
      issues.push(`CASE C: 총 액션 ${vm.actions.length} > 9`);
    }
    const firstBenchIdx = vm.actions.findIndex((a) => a.evidenceSource === "benchmark");
    const firstMetricIdx = vm.actions.findIndex((a) => classifyId(a.id) === "metric");
    if (
      firstBenchIdx !== -1 &&
      firstMetricIdx !== -1 &&
      firstMetricIdx < firstBenchIdx
    ) {
      issues.push("CASE C: metric이 첫 벤치마크 카드보다 앞에 있음");
    }
  }

  const shortWhy = vm.actions.filter((a) => a.whyNeeded.length < 20);
  if (shortWhy.length) {
    issues.push(`whyNeeded 너무 짧음: ${shortWhy.map((a) => a.id).join(", ")}`);
  }

  console.log("\n--- 요약 ---");
  console.log(
    JSON.stringify(
      {
        totalActions: vm.actions.length,
        benchmarkRowsFromBuilder: benchRows.length,
        benchmarkCountInVm: benchmarkCount,
        metricCount,
        textCount,
        issues: issues.length ? issues : "none",
      },
      null,
      2
    )
  );
}

function main(): void {
  console.log("TubeWatch Action Plan 품질 검증 로그 (읽기 전용)\n");
  console.log(
    "참고: mergePrioritizedActionStack은 비공개라 replayMergeMeta로 동일 규칙을 재현했습니다 (벤치마크-only 분)."
  );

  runCase("CASE A — 저표본 (영상 2)", buildCaseData(2));
  runCase("CASE B — 중간 (영상 5)", buildCaseData(5));
  runCase("CASE C — 정상 (영상 10)", buildCaseData(10));

  console.log(
    "\n======== 최종 판정(스크립트 휴리스틱) ========\n위 각 CASE 요약의 issues가 모두 \"none\"이면 Action Plan 1차 품질 통과 후보입니다.\n"
  );
}

main();
