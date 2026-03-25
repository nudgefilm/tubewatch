import type {
  ActionImpactArea,
  ActionItem,
  ActionPlanChecklistSpec,
  ActionPlanResultRow,
  ActionPlanSpecItem,
} from "@/components/action-plan/types";
import { buildActionSmartAssist } from "@/lib/action-plan/buildActionSmartAssist";

const SCENARIO_BASE =
  "지표 개선을 보장하지 않는 가정입니다. 소규모 실험 후 동일 지표로 전후를 비교할 때의 예상 효과 시나리오입니다.";

function safeStringArray(arr: unknown): string[] {
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim());
}

function countSnapshotVideos(snapshot: unknown): number {
  if (!snapshot || typeof snapshot !== "object") {
    return 0;
  }
  const raw = (snapshot as Record<string, unknown>).videos ?? (snapshot as Record<string, unknown>).sample_videos;
  if (!Array.isArray(raw)) {
    return 0;
  }
  let n = 0;
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const title = (item as { title?: unknown }).title;
    if (typeof title === "string" && title.trim() !== "") {
      n++;
    }
  }
  return n;
}

function daysSinceAnalysis(iso: string | null): number {
  if (!iso) {
    return 999;
  }
  const t = Date.parse(iso);
  if (Number.isNaN(t)) {
    return 999;
  }
  return Math.max(0, Math.round((Date.now() - t) / 86400000));
}

function impactAreaFrom(item: ActionItem): ActionImpactArea {
  switch (item.sourceDetail) {
    case "growth_action_plan":
    case "weakness_bottleneck":
      return "성장·전략";
    case "low_metric":
    case "fallback": {
      const k = item.axisKey;
      if (k === "avgViewCount") {
        return "조회·도달";
      }
      if (k === "avgLikeRatio" || k === "avgCommentRatio") {
        return "반응·참여";
      }
      if (k === "avgUploadIntervalDays" || k === "recent30dUploadCount") {
        return "업로드·일관성";
      }
      if (k === "avgTagCount") {
        return "SEO·메타";
      }
      return "콘텐츠 구조";
    }
    default:
      return "성장·전략";
  }
}

function evidenceData(item: ActionItem, row: ActionPlanResultRow | null): string {
  if (!row) {
    return "저장된 분석 결과가 없어 근거는 기본 룰 템플릿입니다.";
  }
  switch (item.sourceDetail) {
    case "growth_action_plan":
      return "근거 데이터: `growth_action_plan`(Gemini 저장) + 동일 행 `created_at`.";
    case "weakness_bottleneck":
      return "근거 데이터: `weaknesses` / `bottlenecks` 저장 텍스트.";
    case "low_metric":
      return item.axisKey
        ? `근거 데이터: \`feature_snapshot.metrics.${item.axisKey}\` 정규화 점수와 내부 기준선 비교.`
        : "근거 데이터: 스냅샷 메트릭과 기준선 비교.";
    case "fallback":
    default:
      return "근거 데이터: 스냅샷 메트릭·기본 축 룰(fallback).";
  }
}

function difficultyFrom(item: ActionItem): "낮음" | "중간" | "높음" {
  if (item.sourceDetail === "low_metric") {
    return "낮음";
  }
  if (item.sourceDetail === "weakness_bottleneck") {
    return "중간";
  }
  if (item.sourceDetail === "growth_action_plan") {
    return "중간";
  }
  return "중간";
}

function confidenceFrom(
  item: ActionItem,
  row: ActionPlanResultRow | null,
  sampleN: number,
  days: number
): { label: "낮음" | "중간" | "높음"; note: string } {
  const patternHint =
    item.sourceDetail === "growth_action_plan"
      ? "AI 문장(해석 변동 가능)"
      : item.sourceDetail === "low_metric"
        ? "수치 정규화(상대적 안정)"
        : "텍스트·룰 혼합";
  let label: "낮음" | "중간" | "높음" = "중간";
  if (sampleN < 4 || days > 60) {
    label = "낮음";
  } else if (sampleN >= 10 && days <= 45 && item.sourceDetail === "growth_action_plan") {
    label = "중간";
  }
  const note = `표본 약 ${sampleN}개 · 분석 후 ${days}일 · 패턴 ${patternHint} — 보수적 구간.`;
  return { label, note };
}

function executionExample(area: ActionImpactArea): string {
  switch (area) {
    case "조회·도달":
      return "실행 예시: 동일 주제 2편만 썸네일 A/B를 바꾸고 14일 동일 지표로 비교.";
    case "반응·참여":
      return "실행 예시: 영상 끝에 질문 한 줄만 추가하고 댓글·좋아요 비율만 추적.";
    case "업로드·일관성":
      return "실행 예시: 주간 업로드 슬롯 2개를 캘린더에 먼저 고정한 뒤 간격만 조정.";
    case "SEO·메타":
      return "실행 예시: 태그 5개 이내로 줄이고 검색 유입만 2주 비교.";
    case "콘텐츠 구조":
      return "실행 예시: 한 포맷(길이·구성)만 유지하고 나머지 변수는 고정.";
    case "성장·전략":
    default:
      return "실행 예시: P1 한 가지만 2주 적용 후 동일 스냅샷 지표로 재확인.";
  }
}

function scopeText(): string {
  return "적용 범위: 선택 채널의 최신 성공 분석 1건(`status=analyzed`, `gemini_status=success`)에 한정.";
}

function scenarioText(item: ActionItem): string {
  const extra = item.expected_impact?.trim();
  if (extra) {
    return `${SCENARIO_BASE} (저장 필드 참고: ${extra})`;
  }
  return SCENARIO_BASE;
}

function buildSpecItem(
  item: ActionItem,
  index: number,
  row: ActionPlanResultRow | null,
  sampleN: number,
  days: number
): ActionPlanSpecItem {
  const priority: "P1" | "P2" | "P3" = index === 0 ? "P1" : index === 1 ? "P2" : "P3";
  const impact_area = impactAreaFrom(item);
  const { label: confidence_label, note: confidence_note } = confidenceFrom(item, row, sampleN, days);
  const smart_assist = buildActionSmartAssist(item, impact_area);
  return {
    priority,
    impact_area,
    action_title: item.title,
    need_reason: item.reason,
    evidence_data: evidenceData(item, row),
    expected_effect_scenario: scenarioText(item),
    difficulty: difficultyFrom(item),
    confidence_label,
    confidence_note,
    execution_example: executionExample(impact_area),
    scope: scopeText(),
    smart_assist,
  };
}

function buildChecklist(actions: ActionItem[], row: ActionPlanResultRow | null): ActionPlanChecklistSpec {
  const dos: string[] = [];
  const plan = safeStringArray(row?.growth_action_plan);
  if (plan.length >= 1) {
    dos.push(`우선: ${plan[0]}`);
  }
  if (plan.length >= 2) {
    dos.push(`다음 검토: ${plan[1]}`);
  }
  if (dos.length === 0) {
    dos.push("P1 액션만 먼저 실행하고 동일 지표로 전후 비교.");
    dos.push("채널 DNA 스냅샷과 같은 표본 전제에서 변수 하나만 변경.");
  }
  const donts = [
    "썸네일·제목·업로드 주기를 동시에 바꾸지 않기",
    "표본이 적을 때 절대 수치 목표로 해석하지 않기",
  ];
  const core_single_action = actions[0]?.title ?? "핵심 1개 액션을 먼저 고릅니다.";
  return { dos, donts, core_single_action };
}

export function buildActionPlanSpecFromItems(
  actions: ActionItem[],
  latestResult: ActionPlanResultRow | null
): { specItems: ActionPlanSpecItem[]; checklist: ActionPlanChecklistSpec } {
  if (actions.length === 0) {
    return {
      specItems: [],
      checklist: { dos: [], donts: [], core_single_action: "" },
    };
  }
  const sampleN = latestResult?.feature_snapshot
    ? countSnapshotVideos(latestResult.feature_snapshot)
    : 0;
  const days = daysSinceAnalysis(latestResult?.created_at ?? null);
  const specItems = actions.slice(0, 3).map((item, i) => buildSpecItem(item, i, latestResult, sampleN, days));
  const checklist = buildChecklist(actions, latestResult);
  return { specItems, checklist };
}
