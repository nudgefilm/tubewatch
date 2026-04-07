# 프로젝트 가이드라인

**안정화 태그:** `jaden-feature-stable` (이 지점이 UI/로직의 기준점임)

**작업 원칙:** 모든 수정 사항은 현재 브랜치에서 진행하며, 위 태그의 로직을 파괴하지 않도록 주의할 것

**마스터 플랜:** `docs/MASTER_PLAN_V1.2.md` — 모든 기능 설계 및 DB 구조 결정의 기준점

**UI 렌더 기준:** 모든 페이지는 항상 `src/components/features/*` 경로의 최신 Feature UI를 렌더 기준으로 사용한다. 과거 UI(`analysis/*`, `v0-*`, `Report*` 계열)는 데이터 참고용으로만 허용하며, 라우트의 최종 렌더 대상으로 사용하지 않는다.

---

## 🔴 Analysis Data Consistency Rule (절대 규칙)

### 목적
TubeWatch의 모든 분석 결과는 동일한 기준 데이터(run/snapshot)를 기반으로 해야 한다.

### 1. Source of Truth

모든 분석 데이터의 기준은 다음 중 하나로 고정한다:

- `analysis_run_id`
- 또는 `snapshot_id`

`channelId`는 식별자일 뿐, 데이터 기준이 아니다.

### 2. 절대 금지 사항

다음 구조는 금지한다:

- 페이지마다 독립적으로 데이터를 fetch하는 구조
- 일부 페이지는 최신 데이터, 일부는 이전 데이터를 사용하는 구조
- ViewModel 생성 시 서로 다른 raw dataset 사용
- `channelId`만으로 분석 데이터를 판단하는 구조

### 3. 허용되는 구조

```
[analysis_run_id or snapshot_id]
        ↓
   Shared Dataset
        ↓
 ├ /analysis
 ├ /channel-dna
 ├ /action-plan
 ├ /seo-lab
 └ /next-trend
```

모든 feature 페이지는 동일한 run/snapshot을 기준으로 각자의 ViewModel을 파생해야 한다.

---

## 🔴 OnePagerCard 스타일 규칙 (수정 금지)

`src/components/features/shared/OnePagerCard.tsx`의 `PlanDocument` 렌더러는 아래 `S` 상수로 스타일을 관리한다.
**기능 수정 시 이 상수값을 절대 변경하지 말 것.** 스타일 변경은 명시적 요청이 있을 때만 허용.

| 요소 | 클래스 | 비고 |
|------|--------|------|
| 섹션 헤딩 (##) | `text-sm font-bold text-foreground` | 최대 크기 |
| H3 소제목 (###) | `text-[13px] font-semibold text-foreground/60` | |
| 볼드 전체 라인 | `text-xs font-semibold text-foreground/60` | |
| 본문 단락 | `text-sm text-muted-foreground` | |
| 리스트 아이템 | `text-sm text-muted-foreground` | |
| 번호 뱃지 | `text-xs font-bold text-primary` | 최솟값 |
| 인라인 볼드 | `font-medium text-foreground/80` | |

**최소 폰트:** `text-xs` (12px) 미만 사용 금지.

### OnePagerCard expand 버튼 규칙
- expand 버튼에는 반드시 `useTransition` hook을 사용할 것 (`startTransition` standalone 금지)
- `isPending` 상태일 때 로딩 스피너를 표시할 것
