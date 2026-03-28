import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AnalysisPageData,
  AnalysisResultRow,
} from "@/lib/analysis/getAnalysisPageData";
import type { AnalysisStatus } from "@/lib/analysis/types";

/**
 * ---------------------------------------------------------------------------
 * 분석 데이터 계층 (Supabase 기준 설계 — 코드 주석이 스키마 초안 역할)
 * ---------------------------------------------------------------------------
 *
 * - `analysis_results`
 *   - **베이스 스냅샷** 성격. 워커/파이프라인이 채널을 분석해 한 번에 적재하는
 *     feature_snapshot·구간 점수 등 **공통 베이스**가 들어감.
 *   - 메뉴별(action_plan / seo_lab 등) **전용 파생 컬럼을 여기에 모두 넣지 않는다**
 *     (최초 분석 한 번에 모든 메뉴 결과를 만들지 않는다는 원칙).
 *
 * - `analysis_runs` (본 파일의 `AnalysisRunRecord`와 1:1 매핑 예정)
 *   - **실행 이력** 성격. 어떤 `analysisType`을 언제 시작/완료했는지, 입력·출력
 *     스냅샷 키가 무엇인지 기록.
 *   - 컬럼 예시: id, user_id, channel_id(user_channels.id), analysis_type, status,
 *     started_at, completed_at, updated_at, input_snapshot_id, result_snapshot_id,
 *     error_message
 *
 * - 메뉴별 베이스 재사용·확장 TODO: `@/lib/analysis/menuExtensionDataStrategy`
 * - 메뉴별 **확장 결과 스냅샷** 저장 위치 (다음 중 하나로 확정 예정)
 *   - (A) `analysis_runs.result_snapshot_id` → 별도 테이블 `analysis_menu_snapshots` 등
 *   - (B) `analysis_runs` JSONB 컬럼 `result_payload`
 *   - 원칙: **베이스(analysis_results)를 재사용**하고, 부족한 부분만 해당 메뉴 run으로
 *     수집·파생해 위 저장소에만 넣는다.
 *
 * - 가상(synthetic) base run
 *   - `analysis_runs`에 base 행이 아직 없어도, UI/상태는 `analysis_results` 최신 행으로
 *     `inferSyntheticBaseRunFromLatestResult`를 만들어 **완료된 베이스 run과 동등**하게
 *     다룰 수 있게 한다. 이후 DB에 base run을 백필하면 `latestStoredRun`이 우선한다.
 * ---------------------------------------------------------------------------
 */

/** DB `analysis_runs.analysis_type` / 앱 메뉴 확장 타입 */
export type AnalysisRunAnalysisType =
  | "base"
  | "action_plan"
  | "seo_lab"
  | "channel_dna"
  | "next_trend";

/** DB `analysis_runs.status` */
export type AnalysisRunStatus = "queued" | "running" | "completed" | "failed";

/**
 * Supabase `analysis_runs` 행과 필드명을 맞춘 도메인 레코드.
 * snake_case 컬럼은 insert/select 시 매핑 레이어에서 변환하면 된다.
 */
export type AnalysisRunRecord = {
  readonly id: string;
  readonly userId: string | null;
  /**
   * `user_channels.id` — 앱에서 선택 채널로 쓰는 ID (YouTube channel id 아님).
   */
  readonly channelId: string;
  readonly analysisType: AnalysisRunAnalysisType;
  readonly status: AnalysisRunStatus;
  readonly startedAt: string;
  readonly completedAt: string | null;
  readonly updatedAt: string;
  /**
   * 베이스로 삼은 `analysis_results.id` 또는 입력 스냅샷 외부 키.
   */
  readonly inputSnapshotId: string | null;
  /**
   * 메뉴별 파생 결과가 별도 테이블/JSONB에 있을 때 그 row id 또는 키.
   */
  readonly resultSnapshotId: string | null;
  readonly errorMessage: string | null;
};

export type CreateAnalysisRunInput = {
  userId: string | null;
  channelId: string;
  analysisType: AnalysisRunAnalysisType;
  inputSnapshotId?: string | null;
};

/** DB insert 시에는 로그인 사용자 id 필수 */
export type CreateAnalysisRunForDbInput = Omit<
  CreateAnalysisRunInput,
  "userId"
> & { userId: string };

/** 메뉴 확장 실행 API에서 허용하는 타입(base 제외) */
export const MENU_EXTENSION_ANALYSIS_TYPES = [
  "action_plan",
  "seo_lab",
  "channel_dna",
  "next_trend",
] as const;

export type MenuExtensionAnalysisRunType =
  (typeof MENU_EXTENSION_ANALYSIS_TYPES)[number];

/** POST /api/analysis-run 요청 본문 파싱 */
export function parseExtensionAnalysisRunRequestBody(
  body: unknown
): { channelId: string; analysisType: MenuExtensionAnalysisRunType } | null {
  if (!isRecord(body)) {
    return null;
  }
  const channelId = body.channelId;
  const analysisTypeRaw = body.analysisType;
  if (typeof channelId !== "string" || channelId.trim() === "") {
    return null;
  }
  if (typeof analysisTypeRaw !== "string") {
    return null;
  }
  // 레거시 호환: 과거 "benchmark" 타입을 공식 식별자 "channel_dna"로 정규화.
  // 신규 클라이언트는 반드시 "channel_dna"를 전송해야 하며, "benchmark"는 흡수 전용.
  const normalizedType =
    analysisTypeRaw === "benchmark" ? "channel_dna" : analysisTypeRaw;
  for (const t of MENU_EXTENSION_ANALYSIS_TYPES) {
    if (t === normalizedType) {
      return { channelId: channelId.trim(), analysisType: t };
    }
  }
  return null;
}

export type UpdateAnalysisRunStatusInput =
  | { status: "queued" | "running"; updatedAt?: string }
  | {
      status: "completed";
      completedAt?: string;
      updatedAt?: string;
      resultSnapshotId?: string | null;
    }
  | {
      status: "failed";
      errorMessage?: string;
      completedAt?: string;
      updatedAt?: string;
    };

export type FetchLatestAnalysisRunParams = {
  userId: string;
  channelId: string;
  analysisType: AnalysisRunAnalysisType;
};

function isoNow(): string {
  return new Date().toISOString();
}

function newRunId(): string {
  if (
    typeof globalThis.crypto !== "undefined" &&
    "randomUUID" in globalThis.crypto
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * DB `analysis_runs.analysis_type` 컬럼 값을 도메인 타입으로 변환.
 *
 * 레거시 호환 처리:
 *   - DB에 "benchmark"로 저장된 레거시 행을 "channel_dna"로 정규화.
 *   - 신규 insert 기준은 "channel_dna" — "benchmark" 분기는 레거시 행 흡수 전용.
 *   - 이 함수 외부에서 "benchmark"를 분기 기준값으로 사용하지 말 것.
 */
function parseAnalysisRunAnalysisType(
  v: unknown
): AnalysisRunAnalysisType | null {
  if (v === "benchmark") {
    // 레거시 DB 값 호환 처리 — 공식 식별자는 "channel_dna".
    return "channel_dna";
  }
  switch (v) {
    case "base":
    case "action_plan":
    case "seo_lab":
    case "channel_dna":
    case "next_trend":
      return v;
    default:
      return null;
  }
}

function parseAnalysisRunStatus(v: unknown): AnalysisRunStatus | null {
  switch (v) {
    case "queued":
    case "running":
    case "completed":
    case "failed":
      return v;
    default:
      return null;
  }
}

/**
 * Supabase `analysis_runs` 행 → 도메인 레코드 (검증 실패 시 null).
 */
export function parseAnalysisRunRow(row: unknown): AnalysisRunRecord | null {
  if (!isRecord(row)) {
    return null;
  }
  const id = row.id;
  const userIdRaw = row.user_id;
  const channelId = row.channel_id;
  const analysisType = parseAnalysisRunAnalysisType(row.analysis_type);
  const status = parseAnalysisRunStatus(row.status);
  const startedAt = row.started_at;
  const completedAt = row.completed_at;
  const updatedAt = row.updated_at;
  const inputSnapshotId = row.input_snapshot_id;
  const resultSnapshotId = row.result_snapshot_id;
  const errorMessage = row.error_message;

  if (typeof id !== "string" || id.trim() === "") {
    return null;
  }
  if (typeof channelId !== "string" || channelId.trim() === "") {
    return null;
  }
  if (analysisType == null || status == null) {
    return null;
  }
  if (typeof startedAt !== "string" || startedAt.trim() === "") {
    return null;
  }
  if (typeof updatedAt !== "string" || updatedAt.trim() === "") {
    return null;
  }

  const userId =
    userIdRaw === null
      ? null
      : typeof userIdRaw === "string" && userIdRaw.trim() !== ""
        ? userIdRaw
        : null;

  const completedAtNorm =
    completedAt === null || completedAt === undefined
      ? null
      : typeof completedAt === "string"
        ? completedAt
        : null;

  const inputSnap =
    inputSnapshotId === null || inputSnapshotId === undefined
      ? null
      : typeof inputSnapshotId === "string"
        ? inputSnapshotId
        : null;
  const resultSnap =
    resultSnapshotId === null || resultSnapshotId === undefined
      ? null
      : typeof resultSnapshotId === "string"
        ? resultSnapshotId
        : null;
  const errMsg =
    errorMessage === null || errorMessage === undefined
      ? null
      : typeof errorMessage === "string"
        ? errorMessage
        : null;

  return {
    id,
    userId,
    channelId,
    analysisType,
    status,
    startedAt,
    completedAt: completedAtNorm,
    updatedAt,
    inputSnapshotId: inputSnap,
    resultSnapshotId: resultSnap,
    errorMessage: errMsg,
  };
}

function recordToDbInsertRow(
  record: AnalysisRunRecord
): Record<string, string | null> {
  return {
    id: record.id,
    user_id: record.userId,
    channel_id: record.channelId,
    analysis_type: record.analysisType,
    status: record.status,
    started_at: record.startedAt,
    completed_at: record.completedAt,
    updated_at: record.updatedAt,
    input_snapshot_id: record.inputSnapshotId,
    result_snapshot_id: record.resultSnapshotId,
    error_message: record.errorMessage,
  };
}

/** 순수 생성 — Supabase insert 직전에 동일 필드로 row 빌드 */
export function buildQueuedAnalysisRunRecord(
  input: CreateAnalysisRunInput
): AnalysisRunRecord {
  const now = isoNow();
  return {
    id: newRunId(),
    userId: input.userId,
    channelId: input.channelId,
    analysisType: input.analysisType,
    status: "queued",
    startedAt: now,
    completedAt: null,
    updatedAt: now,
    inputSnapshotId: input.inputSnapshotId ?? null,
    resultSnapshotId: null,
    errorMessage: null,
  };
}

/**
 * `analysis_runs` 에 queued 행 삽입.
 * - RLS: `user_id` 가 세션 사용자와 일치해야 함.
 */
export async function createAnalysisRun(
  client: SupabaseClient,
  input: CreateAnalysisRunForDbInput
): Promise<AnalysisRunRecord | null> {
  const record = buildQueuedAnalysisRunRecord({
    userId: input.userId,
    channelId: input.channelId,
    analysisType: input.analysisType,
    inputSnapshotId: input.inputSnapshotId ?? null,
  });
  const row = recordToDbInsertRow(record);
  const { data, error } = await client
    .from("analysis_runs")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    console.error("[createAnalysisRun] insert failed:", error);
    return null;
  }
  return parseAnalysisRunRow(data);
}

/** 불변 업데이트 — 메모리 상 레코드 병합(테스트·클라이언트 시뮬용) */
export function applyAnalysisRunStatusPatch(
  run: AnalysisRunRecord,
  patch: UpdateAnalysisRunStatusInput
): AnalysisRunRecord {
  const now = patch.updatedAt ?? isoNow();
  if (patch.status === "completed") {
    const done = patch.completedAt ?? now;
    return {
      ...run,
      status: "completed",
      completedAt: done,
      updatedAt: now,
      resultSnapshotId:
        patch.resultSnapshotId !== undefined
          ? patch.resultSnapshotId
          : run.resultSnapshotId,
      errorMessage: null,
    };
  }
  if (patch.status === "failed") {
    const done = patch.completedAt ?? now;
    return {
      ...run,
      status: "failed",
      completedAt: done,
      updatedAt: now,
      errorMessage:
        patch.errorMessage !== undefined
          ? patch.errorMessage
          : run.errorMessage,
    };
  }
  return {
    ...run,
    status: patch.status,
    updatedAt: now,
  };
}

type AnalysisRunDbUpdate = {
  updated_at: string;
  status?: AnalysisRunStatus;
  completed_at?: string | null;
  result_snapshot_id?: string | null;
  error_message?: string | null;
};

/**
 * `analysis_runs.status` 및 타임스탬프 갱신.
 */
export async function updateAnalysisRunStatusInDb(
  client: SupabaseClient,
  args: {
    runId: string;
    userId: string;
    patch: UpdateAnalysisRunStatusInput;
  }
): Promise<boolean> {
  const now = args.patch.updatedAt ?? isoNow();
  let body: AnalysisRunDbUpdate = { updated_at: now };

  if (args.patch.status === "completed") {
    const done = args.patch.completedAt ?? now;
    body = {
      ...body,
      status: "completed",
      completed_at: done,
      error_message: null,
    };
    if (args.patch.resultSnapshotId !== undefined) {
      body.result_snapshot_id = args.patch.resultSnapshotId;
    }
  } else if (args.patch.status === "failed") {
    const done = args.patch.completedAt ?? now;
    body = {
      ...body,
      status: "failed",
      completed_at: done,
      error_message:
        args.patch.errorMessage !== undefined
          ? args.patch.errorMessage
          : "failed",
    };
  } else {
    body = {
      ...body,
      status: args.patch.status,
    };
  }

  const { error } = await client
    .from("analysis_runs")
    .update(body)
    .eq("id", args.runId)
    .eq("user_id", args.userId);

  if (error) {
    console.error("[updateAnalysisRunStatusInDb]", error);
    return false;
  }
  return true;
}

/**
 * `analysis_runs`에서 단일 최신 run 조회.
 */
export async function fetchLatestAnalysisRunFromDb(
  client: SupabaseClient,
  params: FetchLatestAnalysisRunParams
): Promise<AnalysisRunRecord | null> {
  const { data, error } = await client
    .from("analysis_runs")
    .select("*")
    .eq("user_id", params.userId)
    .eq("channel_id", params.channelId)
    .eq("analysis_type", params.analysisType)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[fetchLatestAnalysisRunFromDb]", error);
    return null;
  }
  return parseAnalysisRunRow(data);
}

/**
 * 채널에 속한 run 목록.
 * - 성공: 배열(0건이면 `[]`)
 * - DB/네트워크 오류: `null` → UI에서 “아직 로드 안 됨·실패”와 동일 취급 가능
 */
export async function fetchAnalysisRunsForUserChannel(
  client: SupabaseClient,
  userId: string,
  userChannelId: string
): Promise<readonly AnalysisRunRecord[] | null> {
  const { data, error } = await client
    .from("analysis_runs")
    .select("*")
    .eq("user_id", userId)
    .eq("channel_id", userChannelId)
    .order("started_at", { ascending: false });

  if (error) {
    console.error("[fetchAnalysisRunsForUserChannel]", error);
    return null;
  }

  if (!Array.isArray(data)) {
    return null;
  }

  const out: AnalysisRunRecord[] = [];
  for (const row of data) {
    const rec = parseAnalysisRunRow(row);
    if (rec) {
      out.push(rec);
    }
  }
  return out;
}

/** 메모리/응답 배열에서 채널·타입 일치 최신 run 1건 선택 */
export function selectLatestRunForChannelAndType(
  runs: readonly AnalysisRunRecord[],
  channelId: string,
  analysisType: AnalysisRunAnalysisType
): AnalysisRunRecord | null {
  let best: AnalysisRunRecord | null = null;
  for (const r of runs) {
    if (r.channelId !== channelId || r.analysisType !== analysisType) {
      continue;
    }
    if (!best || r.startedAt > best.startedAt) {
      best = r;
    }
  }
  return best;
}

/**
 * `analysisRuns`가 `null`(미로드)일 때와 `[]`(로드됨·없음)을 구분.
 * - `undefined` 반환: stored run 존재 여부를 **판단할 수 없음** → needs_refresh·queued 등 DB 의존 판정 생략.
 * - `null` 반환: 로드됐으나 해당 타입 run 없음.
 * - 그 외: 최신 1건.
 */
export function pickLatestStoredRun(
  runs: readonly AnalysisRunRecord[] | null | undefined,
  channelId: string,
  analysisType: AnalysisRunAnalysisType
): AnalysisRunRecord | null | undefined {
  if (runs === null || runs === undefined) {
    return undefined;
  }
  return selectLatestRunForChannelAndType(runs, channelId, analysisType);
}

const SYNTHETIC_BASE_PREFIX = "synthetic-base:";

/**
 * `analysis_results` 최신 행으로부터 “완료된 base run”에 해당하는 가상 레코드.
 * DB에 base run 행이 없을 때 `/analysis` 상태·시각을 맞추기 위해 사용.
 */
export function inferSyntheticBaseRunFromLatestResult(
  latest: AnalysisResultRow | null,
  userChannelId: string
): AnalysisRunRecord | null {
  if (!latest || !userChannelId) {
    return null;
  }
  const uid =
    typeof latest.user_id === "string" && latest.user_id.trim() !== ""
      ? latest.user_id
      : null;
  const created =
    typeof latest.created_at === "string" ? latest.created_at : isoNow();
  const updated =
    typeof latest.updated_at === "string" ? latest.updated_at : created;
  return {
    id: `${SYNTHETIC_BASE_PREFIX}${latest.id}`,
    userId: uid,
    channelId: userChannelId,
    analysisType: "base",
    status: "completed",
    startedAt: created,
    completedAt: updated,
    updatedAt: updated,
    inputSnapshotId: null,
    resultSnapshotId: latest.id,
    errorMessage: null,
  };
}

export function pickBaseSnapshotAt(
  latest: AnalysisResultRow | null
): string | null {
  if (!latest) return null;
  if (typeof latest.updated_at === "string" && latest.updated_at.trim() !== "") {
    return latest.updated_at;
  }
  if (typeof latest.created_at === "string" && latest.created_at.trim() !== "") {
    return latest.created_at;
  }
  return null;
}

/**
 * stored base run: `undefined` = analysisRuns 미로드 → synthetic 만 신뢰(큐 상태는 DB 알 때까지 미표시).
 * `null` = 로드됐으나 base 타입 행 없음 → synthetic 폴백.
 */
function effectiveBaseRun(args: {
  latestStoredBaseRun: AnalysisRunRecord | null | undefined;
  syntheticBaseRun: AnalysisRunRecord | null;
}): AnalysisRunRecord | null {
  if (args.latestStoredBaseRun !== undefined && args.latestStoredBaseRun !== null) {
    return args.latestStoredBaseRun;
  }
  if (args.latestStoredBaseRun === null) {
    return args.syntheticBaseRun;
  }
  return args.syntheticBaseRun;
}

function extensionRunCompletedAt(run: AnalysisRunRecord): string | null {
  if (run.status !== "completed") {
    return null;
  }
  return run.completedAt ?? run.updatedAt;
}

/** 확장 메뉴 “갱신 권장” 판정에 쓸 TTL 기본값(시간). TODO: 정책·설정으로 이동. */
export const DEFAULT_EXTENSION_MENU_NEEDS_REFRESH_TTL_HOURS = 72;

/**
 * `needs_refresh` 판정에 넣을 **확장 포인트** 모음.
 * 현재 구현은 일부만 활성화되어 있으며, 나머지는 TODO 로 명시한다.
 */
export type NeedsRefreshContext = {
  baseSnapshotAt: string | null;
  /** 완료된 확장 run (또는 완료로 간주해 비교할 레코드) */
  extensionRun: AnalysisRunRecord | null;
  /** TODO: 채널 최근 업로드 시각 (YouTube API / 캐시) */
  channelLastUploadAt?: string | null;
  /** TODO: 현재 채널 영상 수 (플랫폼) */
  currentVideoCount?: number | null;
  /** TODO: 확장 run 시점 또는 베이스 스냅샷에 기록된 영상 수 */
  snapshotVideoCount?: number | null;
  /** 테스트·결정 시각 주입 */
  now?: Date;
};

function shouldRefreshBecauseBaseSnapshotNewerThanExtensionCompletion(
  ctx: NeedsRefreshContext
): boolean {
  const extDone = ctx.extensionRun
    ? extensionRunCompletedAt(ctx.extensionRun)
    : null;
  if (!ctx.baseSnapshotAt || !extDone) {
    return false;
  }
  return ctx.baseSnapshotAt > extDone;
}

/**
 * TODO: 확장 run 완료 시각 기준 TTL 초과 시 갱신 권장.
 * `DEFAULT_EXTENSION_MENU_NEEDS_REFRESH_TTL_HOURS` 사용 예정.
 */
function shouldRefreshBecauseTtlExceeded(_ctx: NeedsRefreshContext): boolean {
  void _ctx;
  return false;
}

/**
 * TODO: 확장 완료 이후 신규 업로드가 있으면 갱신 권장 (`channelLastUploadAt`).
 */
function shouldRefreshBecauseRecentUpload(_ctx: NeedsRefreshContext): boolean {
  void _ctx;
  return false;
}

/**
 * TODO: 스냅샷 대비 영상 수 변화 시 갱신 권장.
 */
function shouldRefreshBecauseVideoCountChanged(
  _ctx: NeedsRefreshContext
): boolean {
  void _ctx;
  return false;
}

/**
 * 확장 메뉴 `needs_refresh` — 정책 오케스트레이션.
 * 우선순위는 함수 내 순서; 이후 제품 정책에 맞게 조정.
 */
export function shouldMarkNeedsRefresh(ctx: NeedsRefreshContext): boolean {
  if (shouldRefreshBecauseBaseSnapshotNewerThanExtensionCompletion(ctx)) {
    return true;
  }
  if (shouldRefreshBecauseTtlExceeded(ctx)) {
    return true;
  }
  if (shouldRefreshBecauseRecentUpload(ctx)) {
    return true;
  }
  if (shouldRefreshBecauseVideoCountChanged(ctx)) {
    return true;
  }
  return false;
}

/** @deprecated `shouldMarkNeedsRefresh` 사용 권장 */
export function shouldMarkExtensionNeedsRefresh(args: {
  baseSnapshotAt: string | null;
  extensionRun: AnalysisRunRecord | null;
}): boolean {
  return shouldMarkNeedsRefresh({
    baseSnapshotAt: args.baseSnapshotAt,
    extensionRun: args.extensionRun,
  });
}

export type ResolveMenuFieldsInput = {
  analysisType: AnalysisRunAnalysisType;
  hasChannel: boolean;
  hasBaseAnalysis: boolean;
  baseSnapshotAt: string | null;
  /**
   * DB에서 고른 해당 타입 최신 run.
   * `undefined` — analysisRuns 미로드, stored 존재 여부 불명.
   * `null` — 로드됐으나 해당 타입 run 없음.
   */
  latestStoredRun: AnalysisRunRecord | null | undefined;
  /** analysis_results 기반 가상 base run */
  syntheticBaseRun: AnalysisRunRecord | null;
};

/**
 * ViewModel.menuStatus / 확장 메뉴 실행 버튼 정책의 단일 진입점.
 * - base: stored base run 우선, 없으면 synthetic base run.
 * - 확장: stored extension run만 해당 메뉴 완료로 인정; 없으면 베이스 유무로 ready / not_started.
 * - freshness: `shouldMarkNeedsRefresh` (현재는 베이스 스냅샷 vs 확장 완료 시각 + TODO TTL·업로드 등).
 */
export function resolveMenuFields(
  input: ResolveMenuFieldsInput
): { menuStatus: AnalysisStatus; lastRunAt: string | null } {
  const menuStatus = resolveMenuStatusForView(input);
  const lastRunAt = resolveLastRunAtForView(input, menuStatus);
  return { menuStatus, lastRunAt };
}

export function resolveMenuStatusForView(
  input: ResolveMenuFieldsInput
): AnalysisStatus {
  if (!input.hasChannel) {
    return "not_started";
  }

  if (input.analysisType === "base") {
    const baseRun = effectiveBaseRun({
      latestStoredBaseRun: input.latestStoredRun,
      syntheticBaseRun: input.syntheticBaseRun,
    });
    if (!baseRun) {
      return input.hasBaseAnalysis ? "completed" : "not_started";
    }
    if (baseRun.status === "queued") {
      return "queued";
    }
    if (baseRun.status === "running") {
      return "running";
    }
    if (baseRun.status === "failed") {
      return "failed";
    }
    if (baseRun.status === "completed") {
      return "completed";
    }
    return "not_started";
  }

  const ext = input.latestStoredRun;
  if (ext) {
    if (ext.status === "queued") {
      return "queued";
    }
    if (ext.status === "running") {
      return "running";
    }
    if (ext.status === "failed") {
      return "failed";
    }
    if (ext.status === "completed") {
      if (
        shouldMarkNeedsRefresh({
          baseSnapshotAt: input.baseSnapshotAt,
          extensionRun: ext,
        })
      ) {
        return "needs_refresh";
      }
      return "completed";
    }
  }

  if (!input.hasBaseAnalysis) {
    return "not_started";
  }
  return "ready_from_base";
}

export function resolveLastRunAtForView(
  input: ResolveMenuFieldsInput,
  menuStatus: AnalysisStatus
): string | null {
  if (input.analysisType === "base") {
    const baseRun = effectiveBaseRun({
      latestStoredBaseRun: input.latestStoredRun,
      syntheticBaseRun: input.syntheticBaseRun,
    });
    if (baseRun?.status === "queued" || baseRun?.status === "running") {
      return baseRun.startedAt;
    }
    if (baseRun?.status === "completed" && baseRun.completedAt) {
      return baseRun.completedAt;
    }
    return input.baseSnapshotAt;
  }

  if (input.latestStoredRun) {
    const ext = input.latestStoredRun;
    if (ext.status === "queued" || ext.status === "running") {
      return ext.startedAt;
    }
    if (ext.status === "completed" && ext.completedAt) {
      return ext.completedAt;
    }
    if (ext.status === "failed" && ext.completedAt) {
      return ext.completedAt;
    }
    return ext.updatedAt;
  }

  if (
    menuStatus === "ready_from_base" ||
    menuStatus === "not_started" ||
    menuStatus === "needs_refresh" ||
    menuStatus === "queued" ||
    menuStatus === "running"
  ) {
    return input.baseSnapshotAt;
  }

  return input.baseSnapshotAt;
}

export function deriveMenuFieldsFromPageData(
  data: AnalysisPageData | null,
  analysisType: AnalysisRunAnalysisType
): { menuStatus: AnalysisStatus; lastRunAt: string | null } {
  const ch = data?.selectedChannel ?? null;
  const hasCh = !!(data && data.channels.length > 0 && ch);
  const latest = data?.latestResult ?? null;
  const channelId = ch?.id ?? "";
  const runs = data == null ? null : data.analysisRuns;
  const baseSnapshotAt = pickBaseSnapshotAt(latest);
  const syntheticBase = inferSyntheticBaseRunFromLatestResult(
    latest,
    channelId
  );

  const latestStoredForType =
    channelId !== ""
      ? pickLatestStoredRun(runs, channelId, analysisType)
      : undefined;

  if (analysisType === "base") {
    return resolveMenuFields({
      analysisType: "base",
      hasChannel: hasCh,
      hasBaseAnalysis: latest != null,
      baseSnapshotAt,
      latestStoredRun: latestStoredForType,
      syntheticBaseRun: syntheticBase,
    });
  }

  return resolveMenuFields({
    analysisType,
    hasChannel: hasCh,
    hasBaseAnalysis: latest != null,
    baseSnapshotAt,
    latestStoredRun: latestStoredForType,
    syntheticBaseRun: syntheticBase,
  });
}

/** `analysisRuns !== null` 이면 목록이 한 번이라도 확정됨(빈 배열 포함). */
export function deriveAnalysisRunsLoaded(data: AnalysisPageData | null): boolean {
  if (!data) return false;
  return data.analysisRuns !== null;
}

/** /analysis — 베이스 분석 완료 시 completed (synthetic 또는 stored base run) */
export function deriveBaseAnalysisMenuFields(
  data: AnalysisPageData | null
): { menuStatus: AnalysisStatus; lastRunAt: string | null } {
  return deriveMenuFieldsFromPageData(data, "base");
}

/** 확장 메뉴 — stored extension run + 베이스 freshness */
export function deriveExtensionMenuFields(
  data: AnalysisPageData | null,
  analysisType: Exclude<AnalysisRunAnalysisType, "base">
): { menuStatus: AnalysisStatus; lastRunAt: string | null } {
  return deriveMenuFieldsFromPageData(data, analysisType);
}

/**
 * action-plan / seo-lab / channel_dna 상단 실행 버튼 활성 조건 (단일 정책).
 * - 채널 없음 / queued / running / 베이스 없음(not_started) → 비활성
 * - ready_from_base, needs_refresh, completed, failed → 활성
 */
export function isExtensionMenuExecuteEnabled(
  hasChannel: boolean,
  menuStatus: AnalysisStatus
): boolean {
  if (!hasChannel) return false;
  if (menuStatus === "queued" || menuStatus === "running") return false;
  return menuStatus !== "not_started";
}
