> **운영 원칙:** 모든 feature 페이지 작업은 항상 현재 저장소의 최선 feature 버전 UI를 기준선으로 삼고, 구버전/v0/임시 mock 화면을 기준으로 삼지 않는다.

# 🧠 TubeWatch 통합 운영 마스터 플랜 v1.2

> 기존 v1.1 유지 + 신규 보완 반영
> 생성일: 2026-03-28
> **모든 작업의 기준점 문서**

---

## 1️⃣ 최상위 원칙

### 기존 원칙 (유지)

| 원칙 | 설명 |
|------|------|
| 데이터 재사용 극대화 | 단일 분석 → 모든 메뉴 파생 |
| 크레딧 = 현금 | 크레딧 차감은 원자적으로 처리 |
| 사용자 상태 항상 설명 가능 | UI에서 현재 상태를 항상 표현 가능해야 함 |
| 정합성 > 비용 | 저렴해도 틀리면 안 됨 |

### 🔥 추가 강화 원칙 (v1.2 신규)

| 원칙 | 설명 |
|------|------|
| **Traceability** | "모든 실행은 추적 가능해야 한다" — run_id ↔ credit_reservation_id 연결 |
| **Version Priority** | "엔진 변경은 캐시보다 우선한다" — version mismatch 시 캐시 무효화 |

---

## 2️⃣ 통합 아키텍처 개요

```
[Analysis Layer]
  단일 분석 엔진
  + Partial Update        (모듈 단위 재실행)
  + Engine Version 관리   (🔥 v1.2 신규)

[Storage Layer]
  Snapshot 저장
  + Module Output 분리
  + Run Tracking
  + progress_step         (🔥 v1.2 신규)
  + module_version        (🔥 v1.2 신규)

[Business Layer]
  Atomic Credit (reserve / confirm / rollback)
  + Subscription
  + run_id ↔ credit_reservation_id 연결  (🔥 v1.2 신규)

[Experience Layer]
  Ghost Data + Hybrid Cache
  + 분석 진행 상태 표시  (🔥 v1.2 신규)
  + Engine Version 기반 UX  (🔥 v1.2 신규)

[Ops Layer]
  Failure Recovery
  + Cost Control
  + Cache Invalidation      (🔥 v1.2 신규)
  + Version Control         (🔥 v1.2 신규)
```

---

## 3️⃣ Analysis Layer

### 3-1. Partial Update (기존 유지)

- 모듈(action_plan, seo_lab, channel_dna, next_trend) 단위 독립 실행
- base 분석 결과(Snapshot)를 공통 입력으로 재사용
- 전체 재분석 없이 단일 모듈만 재실행 가능

### 3-2. 🔥 Engine Version 관리 (v1.2 신규)

**필드 추가 대상**
- `analysis_runs.engine_version`
- `module_outputs.module_version`

**동작 규칙**
```
현재 엔진 버전 > 저장된 버전
  → 캐시 무효화 대상
  → 12시간 미만이어도 "업데이트 권장" 버튼 활성화
```

**효과**
- 프롬프트 개선 즉시 반영 가능
- 캐시 품질 문제 제거
- 사용자 체감 품질 상승

---

## 4️⃣ Storage Layer

### 4-1. 🔥 progress_step 추가 (v1.2 신규)

`analysis_runs` 테이블에 `progress_step` 필드 추가.

| progress_step 값 | 의미 |
|-----------------|------|
| `queued` | 대기 중 |
| `fetching_yt` | 유튜브 데이터 수집 중 |
| `processing_data` | 데이터 처리 중 |
| `generating_ai` | AI 분석 중 |
| `saving_results` | 결과 저장 중 |
| `completed` | 완료 |
| `failed` | 실패 |

### 4-2. 왜 중요한가

**현재 문제**
- 분석 실행 후 10~30초 공백
- 사용자 이탈 및 중복 클릭 발생
- 크레딧 중복 소모 위험

**해결 효과**

| 항목 | 개선 |
|------|------|
| UX | 진행 상태 가시화 |
| 비용 | 중복 실행 감소 |
| 안정성 | 재접속 시 복구 가능 |

### 4-3. UI 연동 규칙

사용자가 재접속했을 때 `progress_step` 기반으로 상태 복구:
```
"분석 진행 중입니다 (AI 생성 단계)"
```

---

## 5️⃣ Business Layer

### Atomic Credit (기존 유지 — 완벽 구조)

```
reserve()   → 크레딧 선점 (분석 시작 전)
confirm()   → 크레딧 확정 차감 (분석 완료 후)
rollback()  → 크레딧 복구 (분석 실패 시)
```
→ RPC 기반 원자적 처리

### 🔥 Traceability 연결 (v1.2 신규)

```
analysis_runs.run_id
  ↔ credit_reservation_id
```
→ 모든 크레딧 트랜잭션이 실행 기록과 1:1 연결됨
→ 정산 오류 추적 및 환불 처리 가능

---

## 6️⃣ Experience Layer

### 6-1. Ghost Data + Hybrid Cache (기존 유지)

- 분석 전: 이전 결과(Ghost Data)로 레이아웃 유지
- 분석 완료: 새 결과로 seamless 교체
- 썸네일/채널명 mismatch 방지

### 6-2. 🔥 분석 진행 상태 표시 (v1.2 신규)

| progress_step | UI 표시 |
|--------------|---------|
| `fetching_yt` | "유튜브 데이터 수집 중" |
| `generating_ai` | "AI 분석 중" |
| `saving_results` | "결과 저장 중" |

**UX 규칙**
- 새로고침해도 상태 유지 (DB 기반)
- `progress_step` 폴링 또는 실시간 구독으로 표시

### 6-3. 🔥 Engine Version 기반 UX (v1.2 신규)

**조건**: `module_version < current_engine_version`

**UI**:
```
"새로운 분석 엔진이 적용되었습니다"
[업데이트하기]
```

**효과**
- 사용자 재방문 유도
- 업데이트 체감 증가
- 캐시 품질 문제 해결

---

## 7️⃣ Ops Layer

### 7-1. 🔥 Cache Invalidation 전략 (v1.2 강화)

| 조건 | 처리 |
|------|------|
| 엔진 버전 변경 | 즉시 업데이트 권장 |
| 시간 만료 (12시간) | 재진단 허용 |
| 둘 다 해당 | 전체 재분석 권장 |

### 7-2. Invalidation 우선순위

```
1순위: engine_version mismatch → Version 기반 무효화
2순위: 12시간 경과 → 시간 기반 무효화
3순위: 사용자 수동 요청 → 즉시 재실행
```

---

## 8️⃣ 비용 / 효과 시뮬레이션

| 전략 | 기대 효과 | 근거 |
|------|-----------|------|
| Partial Update | AI 비용 40~60% 절감 | 전체 재분석 제거, 모듈 단위 실행 |
| Hybrid Cache | CS 문의 약 80% 감소 | 썸네일/채널명 mismatch 제거 |
| Atomic Commit | 정산 오류 → 0% 수렴 | 트랜잭션 기반 처리 |
| 🔥 Progress Tracking | 중복 분석 요청 30~50% 감소 | 사용자 불안 제거, 상태 가시화 |
| 🔥 Engine Version | 업데이트 체감률 상승, 재사용률 증가 | 버전 기반 UX 유도 |

---

## 9️⃣ 최종 운영 구조 (완성형)

```
[Analysis]
  단일 엔진 + Partial Update + Engine Version

[Storage]
  Snapshot + Module Output + Run Tracking + Progress Step

[Business]
  Atomic Credit + Subscription + Traceability

[Experience]
  Hybrid Cache + Progress UI + Version UX

[Ops]
  Failure Recovery + Cost Control + Cache Invalidation + Version Control
```

---

## 🔥 v1.2 최종 정의

> **"공통 분석 자산을 기반으로,**
> **부분 업데이트 · 원자적 정산 · 하이브리드 캐시 · 진행 상태 추적 · 엔진 버전 관리를 결합해**
> **비용, 정합성, 사용자 신뢰를 동시에 통제하는 운영 시스템"**

---

## 📋 현재 DB 스키마 vs 마스터 플랜 갭 (구현 체크리스트)

> 최종 점검일: 2026-05-01

| 항목 | 현재 상태 | 비고 |
|------|-----------|------|
| `analysis_runs.progress_step` | ✅ 완료 | `analysis_jobs.progress_step` + API 폴링 + UI 연동 |
| `analysis_runs.engine_version` | ✅ 완료 | `analysis_results` + `analysis_runs` 양쪽 필드 추가 |
| `module_outputs` 테이블 | ✅ 완료 | `analysis_module_results` 테이블로 구현 |
| `module_outputs.module_version` | ✅ 완료 | 마이그레이션 + insert 시 `CURRENT_ENGINE_VERSION` 기록 (2026-05-01) |
| `credit_reservation_id` 연결 | ✅ 완료 | `credit_reservations.analysis_run_id` FK 단방향 연결 |
| Partial Update 라우팅 | ✅ 완료 | `runType`·`requestedModules` DB 미저장 버그 수정 (2026-05-01) |
| Progress UI 컴포넌트 | ✅ 완료 | `ChannelsPageClient` 폴링 + 단계별 메시지 표시 |
| Engine Version UX | ✅ 완료 | "업데이트 권장" 배지 + "새로운 분석 엔진" 안내 텍스트 |
