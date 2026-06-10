# TubeWatch 개발 진척도

> 마지막 갱신: 2026-06-11
> 기준 문서: `docs/MASTER_PLAN_V1.2.md`

---

## 완료된 작업

### 핵심 아키텍처

- [x] 공통 정규화 레이어 구축 (`src/lib/analysis/normalizeSnapshot.ts`)
- [x] 페이지별 ViewModel 분리 (Analysis / Channel DNA / Action Plan / SEO Lab / Next Trend)
- [x] `analysis_runs.progress_step` 필드 + 폴링 UI 연동
- [x] `analysis_runs.engine_version` / `module_outputs.module_version` 추가
- [x] Atomic Credit (reserve / confirm / rollback) RPC 구현
- [x] `credit_reservation_id ↔ analysis_run_id` Traceability 연결
- [x] Partial Update 라우팅 (`runType` · `requestedModules` DB 저장 버그 수정)
- [x] Engine Version UX ("업데이트 권장" 배지 + 안내 텍스트)

### Feature 페이지 레이아웃 개편

- [x] Channel DNA — "채널 정체성" 통합 섹션, "채널 성과 패턴" / "채널 구조 안정성" 개편
- [x] Next Trend — 중복 섹션 제거, 실행 힌트 섹션 제거, signalStrength 배지 추가
- [x] Action Plan — PrioritySection 제거, Paywall 위치 이동, 체크리스트 라벨 정리
- [ ] Analysis — content_patterns 섹션 Channel DNA 이관 / SummarySection 중복 해소 **(예정)**

### 인프라 / AI

- [x] Gemini 503/429 재시도 로직 (최대 3회, 5초 간격) + 폴백 체인
- [x] 과부하 사용자 친화적 안내 메시지 통일
- [x] Google Ads 전환 태그 연동 (`AW-17934413106`)
- [x] 캔버스 애니메이션 가시 영역 렌더링 최적화 (랜딩)

### 인증 / 사용자

- [x] 카카오 로그인 추가
- [x] 인앱브라우저 Google 로그인 차단 안내
- [x] `@handle` 형식 채널 저장 및 표시

### 관리자

- [x] 30일 트래픽 차트 (Admin 대시보드)
- [x] B2B 문의 탭 리포트 상태·URL 통합
- [x] 총 회원수 표시 복구
- [x] B2B 리포트 채널 URL 자동 매칭

### 리포트 / 네이밍 정리

- [x] Manus API 완전 제거 → `src/lib/report/` 이전
- [x] DB 테이블명 `manus_reports` → `reports` → `tubewatch_reports` 확정

---

## 진행 중 / 예정

### 결제 시스템

- [x] PG사 확정: 한국결제네트웍스(KPN), 포트원(PortOne) 계약 완료 (2026-04-30)
- [x] MID · Passkey 수령, `@portone/browser-sdk` SDK 설치, env vars 세팅 완료
- [ ] 결제 UI 연결 (월 결제 / 6개월 결제 선택 토글)
- [ ] `status === 'refunded'` 차단 로직
- [ ] 원화(KRW) 표기 적용
- [ ] Stripe 레거시 코드 제거 (webhook handler, price ID env keys, checkout 로직)
- [ ] 만료 후 Free 플랜 다운그레이드 로직

### Analysis 페이지 개편

- [ ] `content_patterns` 섹션 → Channel DNA 이관 (Analysis에서 제거)
- [ ] SummarySection 중복 해소

### 기타 미완료

- [ ] `ChannelsPageClient.tsx` — `router.push()` 전 `router.refresh()` 추가
- [ ] 잔존 미사용 컴포넌트 정리:
  - `DnaPatternAnalysisSection` (파일 잔존, 라우트 미사용)
  - `NextTrendCandidatesSection` / `NextTrendRiskSection` (파일 잔존)
  - `ActionPlanPrioritySection` / `toPrioritySection` (파일 잔존, 미호출)
  - `buildPatternAnalysisFromVm` (파일 잔존, 미호출)

---

## 활성 Feature 페이지

```
src/components/features/
  ├── analysis/       → AnalysisPage.tsx
  ├── channel-dna/    → ChannelDnaPage.tsx
  ├── action-plan/    → ActionPlanPage.tsx
  └── next-trend/     → NextTrendPage.tsx
```

---

## 보완 검토 사항 (버그 아님, 향후 판단 필요)

| 페이지 | 항목 |
|--------|------|
| Channel DNA | "채널 정체성" — `targetAudience`/`contentPatterns` 둘 다 없으면 빈 안내 빈번 가능 |
| Next Trend | top block "실행 가능성" Progress 바 제거됨 — 재도입 여부 재검토 필요 |
| Next Trend | Starter 플랜 2순위 후보 1개 노출 — 비교 충분성 확인 필요 |
| Action Plan | CardsSection `whyNeeded` 텍스트 길 경우 접기 처리 검토 |
