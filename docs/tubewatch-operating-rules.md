# TubeWatch 운영 규칙 문서

> **목적:** 분석 페이지 및 확장 페이지 구현 시 일관된 기준을 유지하기 위한 운영 규칙 문서.
> 디자인 설명서가 아니라 **구현·표현 기준서**다. 새 기능 구현 전 반드시 숙지한다.

---

## 0. 문서 목적

이 문서는 TubeWatch의 모든 페이지 구현과 유지보수 시
일관된 데이터 표현, UI 구조, 시각화 기준을 강제하기 위한 운영 규칙이다.

설명이 아니라 **"구현 기준서"**로 사용한다.

---

## 금지 규칙 (Critical Guardrails)

- mock fallback 재도입 금지
- `v0/`, `archive/`, `legacy/` import 금지
- 데이터 없는 상태에서 임의 수치 생성 금지
- 제목에 문장 절단(`…`) 사용 금지
- ScoreBar를 단독 정보 수단으로 사용하는 것 금지

---

## 렌더 조건 규칙

- ViewModel이 없으면 → 반드시 Empty State 렌더
- 데이터가 일부만 있어도 → 존재하는 데이터만 렌더 (없는 항목은 미표시)
- 조건부 렌더 시 `null` 반환 허용
- `"항상 true"` 형태의 플래그 사용 금지 (예: `hasData = true` 하드코딩)

---

## 1. 적용 범위

- `/analysis`
- `/channel-dna`
- `/action-plan`
- `/seo-lab`
- `/next-trend`
- 향후 추가되는 확장 페이지·마이크로 툴에도 동일 원칙 적용

---

## 2. 데이터 표현 규칙

- **mock fallback 금지.** 실데이터가 없으면 Empty State를 렌더한다.
- **원천 데이터 → ViewModel → 렌더 레이어** 3단 분리를 유지한다.
  - 원천: `analysis_run_id` 또는 `snapshot_id` 기준 DB row
  - ViewModel: 서버 컴포넌트에서 생성, 클라이언트로 직렬화 전달
  - 렌더: `src/components/features/*` 경로의 최신 Feature UI
- **score는 0–100으로 normalize**한 뒤 사용한다.
- **데이터가 없을 때 수치·시각화를 억지로 생성 금지.** null / undefined를 그대로 내리거나 Empty State 처리한다.
- 모든 분석 페이지는 동일한 `analysis_run_id` / `snapshot_id`를 기준으로 ViewModel을 파생한다. 페이지마다 독립 fetch 금지.

---

## 3. Empty State 규칙

### 상태 3종

| 상태 | 조건 |
|---|---|
| 분석 전 | 채널은 있으나 분석 실행 이력 없음 |
| 데이터 없음 | 채널 미선택 또는 결과 row 없음 |
| 신호 부족 | 분석은 있으나 해당 기능에 충분한 신호 없음 |

### 기본 구조

```
Title        — 현재 상태를 한 줄로 요약
Description  — 상태의 이유 또는 다음 행동 안내
CTA          — 조건부 링크
```

### CTA 라우팅 규칙

- `channelId` 있으면 → `/analysis?channel={channelId}`
- `channelId` 없으면 → `/channels`

### 문구 규칙

- 과장·장담 금지
- "데이터가 부족합니다", "분석을 실행하면 표시됩니다" 수준의 실제 상태 중심 문구

---

## 4. 카드 구조 규칙

### 기본 구조

```
Title        — 의미 요약형 진단 라벨 (8–22자)
Description  — 원문 진단 설명 (전체 보존)
```

### 제목 규칙

- 제목은 **설명문이 아니라 진단 라벨**이어야 한다.
- 문장 앞부분 절단 방식 금지 (`"키워드 반복 구조가"` 같은 형태)
- 조사·연결어로 끝나는 제목 금지 (`이/가/은/는/에서/으로/하고` 등)
- 권장 8–18자, 최대 22자 이내
- "…" 로 잘리는 형태 금지
- 본문 원문 설명은 `shortReason` / `description` / `whyNeeded` 에 반드시 유지

---

## 5. 제목 생성 규칙

### 공통 헬퍼

```
파일: src/lib/utils/labelUtils.ts
함수: makeDiagnosticLabel(text: string, maxLen?: number): string
```

### 처리 순서

1. **접두 제거** — `"주의로 기록된 접근 피하기:"` 등 고정 접두 제거
2. **전체 패턴 매칭** — 사전 정의 규칙(FULL_RULES)에 매칭되면 고정 라벨 반환
3. **주제어 + 상태어 조합** — TOPIC_RULES + STATE_RULES 조합으로 합성 라벨 생성
4. **폴백** — 어절 경계 절단 + 조사 제거

### 예시

| 원문 진단 문장 | 생성 제목 |
|---|---|
| 키워드 반복 구조가 일정하지 않아 검색 노출 최적화가 어려운 상태입니다 | **키워드 패턴 불안정** |
| 상위 성과 영상에서 짧은 제목과 강한 대비 썸네일이 반복됩니다 | **짧은 제목 패턴 강세** |
| 조회수 편차가 크고 상위 영상 의존도가 높아 성과 재현성이 낮습니다 | **상위 영상 의존 높음** |
| 업로드 간격 편차가 크게 기록되었습니다 | **업로드 주기 불안정** |
| 성과 재현성이 낮아 지속 성장이 어렵습니다 | **성과 재현성 낮음** |
| 시리즈 반복 구조가 상위 성과 영상에서 반복됩니다 | **시리즈 반복 강세** |

### 적용 위치

- `src/lib/seo-lab/buildSeoRecommendations.ts`
- `src/components/features/channel-dna/ChannelDnaPage.tsx`
- `src/lib/action-plan/actionPlanPageViewModel.ts` (`titleFromText` 내부)

---

## 6. 시각화 규칙 (ScoreBar)

### 원칙

- ScoreBar는 **보조 요소**. 텍스트 설명을 대체하지 않는다.
- 텍스트 설명은 항상 함께 표시한다.
- **실제 DB 데이터가 있을 때만** 렌더. null이면 해당 카드 전체 미표시.
- 과한 색상·애니메이션 금지. 단색 progress 형태 유지.
- score는 0–100 범위로 clamp 후 사용.

### 공통 컴포넌트

```
파일: src/components/ui/ScoreBar.tsx
Props: { label: string; score: number }
```

### 데이터 기준

ScoreBar에 쓰이는 점수는 반드시 `feature_section_scores` 기반 실데이터여야 한다.
인덱스 파생값·임의 추정값 사용 금지.

### 현재 적용 범위 (1차)

| 페이지 | 데이터 필드 | 라벨 |
|---|---|---|
| SEO Lab | `seoSectionScore` | SEO 최적화 |
| SEO Lab | `structureSectionScore` | 콘텐츠 구조 |
| Channel DNA | `radarProfile.channel[2]` (contentStructure) | 콘텐츠 구조 |
| Channel DNA | `radarProfile.channel[1]` (audienceResponse) | 성과 반응 |
| Channel DNA | `radarProfile.channel[0]` (channelActivity) | 채널 활동성 |

---

## 7. 현재 적용 상태 요약

| 항목 | 상태 |
|---|---|
| analysis / channel-dna / action-plan / next-trend / seo-lab mock fallback 제거 | ✅ 완료 |
| Sidebar user name 실데이터 연결 + 초기 세션 보강 | ✅ 완료 |
| Empty State 3종 통일 + CTA 라우팅 규칙 적용 | ✅ 완료 |
| 카드 제목 의미형 생성 로직 (`makeDiagnosticLabel`) 적용 | ✅ 완료 |
| ScoreBar 1차 적용 (SEO Lab, Channel DNA) | ✅ 완료 |
| Settings 실데이터 연결 (이메일, 채널 목록, 로그아웃) | ✅ 완료 |

---

## 8. 개발 가드레일

- **src 디렉터리만** 수정. `public/`, `docs/` 등 비소스 경로는 문서·정적 파일 전용.
- `v0 /`, `archive/`, `legacy/` 경로 참조·import·복구 금지.
- mock 데이터 재도입 금지. 한번 제거된 mock fallback은 복구하지 않는다.
- 실데이터 렌더 경로가 이미 있다면 해당 경로를 우선 확장한다. 새 경로 신설 최소화.
- 기능 추가 전 **기존 규칙 위반 여부를 먼저 점검**한다.
- 모든 작업의 완료 기준: `npx tsc --noEmit` + `npm run build` 통과.

---

## 9. 향후 작업 원칙

- 새 페이지도 동일한 Empty State / 카드 Title / ScoreBar 원칙 적용.
- 새 기능을 추가하기 전에 이 문서의 규칙과 충돌 여부를 점검한다.
- **Billing** 기능은 별도 상용화 판단 이후 진행.
- **특허 검토**는 서비스 테스트 완료 이후 진행.
- 새 확장 페이지(마이크로 툴 등)도 동일한 ViewModel 파생 구조를 따른다.
  - 원천 데이터는 항상 `analysis_run_id` / `snapshot_id` 기준으로 고정.

---

*최종 업데이트: 2026-03-29 (v2 — 문서 목적·금지 규칙·렌더 조건 추가)*
