# TubeWatch AI Guardrail v1.0

## 0. 핵심 원칙

- UI 구조 수정 금지
- 기존 컴포넌트 수정 최소화
- 데이터 주입만 수행
- mock 데이터 제거 → 실제 데이터 연결
- 모든 로직은 ViewModel에서 처리

---

## 1. 작업 범위 제한

허용:
- 데이터 fetch 연결
- ViewModel 생성 및 수정
- API route 연결
- 상태 처리 (loading / empty / error)
- 카드 데이터 매핑

금지:
- UI 레이아웃 변경
- className 수정
- 컴포넌트 구조 변경
- 디자인 요소 추가/삭제
- 텍스트 카피 임의 변경

---

## 2. 데이터 흐름 구조

[API] → [Server Loader] → [ViewModel] → [UI]

규칙:
- UI에서 직접 fetch 금지
- 모든 계산은 ViewModel에서 수행
- UI는 render 전용
- API 응답 그대로 사용 금지

---

## 3. ViewModel 규칙

모든 카드 구조:

type CardItem = {
  value: number | string
  state: "good" | "normal" | "warning"
  insight: string
  confidence: "high" | "medium" | "low"
  dataStatus: "ready" | "partial" | "locked" | "empty"
}

규칙:
- 모든 카드 = value + state + insight
- insight 최소 2문장 이상
- confidence 필수
- dataStatus 필수
- 계산은 ViewModel에서만 수행

---

## 4. 데이터 기준

- 기본: 최근 20개 영상
- 부족 시: 전체 + partial
- 없음: empty
- OAuth 필요: locked

---

## 5. 해석 규칙

반드시 포함:
- 원인
- 의미
- 행동 방향

금지:
- "좋습니다"
- "문제 있습니다"
- "개선 필요"

허용:
- 문장형 설명

---

## 6. 근거 데이터

- 모든 인사이트는 근거 영상 포함
- 기준: 20개 영상
- 근거 없는 해석 금지

---

## 7. Next Trend 규칙

- 예측 금지 (가능성만)
- signal_type 필수:
  - strong / emerging / experimental
- confidence 필수

---

## 8. SEO Lab 규칙

- 검색량 기반 금지
- 채널 적합성 기반만 허용

---

## 9. Action Plan 규칙

- 실행 가능한 액션만 허용
- 모호한 표현 금지

---

## 10. 상태 처리

- loading / empty / partial / error / locked

---

## 11. 채널 컨텍스트

- channel_id 필수
- 없으면 /channels redirect

---

## 12. 변경 금지 영역

수정 금지:
- v0-TubewatchUI/*
- src/components/ui/*

---

## 13. 완료 기준

- build 성공
- 데이터 정상 렌더
- UI 변경 없음

---

## 핵심 정의

AI는 UI를 만드는 역할이 아니라,
정해진 UI에 데이터를 채우는 역할만 수행한다.

---

## 14. /analysis 운영 단일 엔트리 (회귀 방지)

- **라우트 파일**: `src/app/(app)/analysis/page.tsx` — UI는 **`AnalysisReportPageClient`** 하나만 렌더한다.
- **클라이언트 엔트리**: `src/components/analysis/AnalysisReportPageClient.tsx` → `AnalysisShell` + `AnalysisReportView`.
- **금지**: `@/v0-tubewatchui/app/(app)/analysis/*`, `@/v0-core/app/(app)/analysis/*`, 구 mock analysis 페이지로의 재연결.
- **검증**: `npm run check:analysis-route` (import chain + 금지 경로), ESLint `no-restricted-imports` (해당 라우트·클라이언트 엔트리).
- **데이터 구조** (`analysisViewModel`, `reportPresentation`, `aiInsightFields`, `reportCompare` 등)는 유지하고, UI 레이아웃/스타일 임의 변경은 하지 않는다.
