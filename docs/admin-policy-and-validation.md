# TubeWatch Admin Policy & Validation

운영 안정화를 위한 관리자 정책, 제한 정책, 검증 시나리오, 체크리스트를 정리합니다.

---

## 1. 관리자 계정 정책

### 관리자 이메일 관리

| 항목 | 값 |
|---|---|
| 설정 파일 | `src/lib/config/admin.ts` |
| 현재 등록 관리자 | `nudgefilm@gmail.com` |
| 정규화 | 입력/배열 모두 `toLowerCase().trim()` 적용 |
| 확장 방법 | `RAW_ADMIN_EMAILS` 배열에 이메일 추가 |

### DB 트리거 동기화

관리자를 추가/제거할 경우 두 곳을 반드시 동기화해야 합니다.

1. **코드**: `src/lib/config/admin.ts` → `RAW_ADMIN_EMAILS`
2. **DB 트리거**: `docs/sql/admin_bypass_channel_limit.sql` → `ARRAY['nudgefilm@gmail.com']`

DB 트리거는 Supabase SQL Editor에서 직접 실행해야 반영됩니다.

---

## 2. 일반 사용자 vs 관리자 제한 정책

| 항목 | 일반 사용자 | 관리자 |
|---|---|---|
| 채널 등록 제한 | 최대 3개 | 최대 999개 |
| 채널 제한 적용 레이어 | API (`getChannelLimit`) + DB 트리거 (`check_channel_limit`) | API + DB 트리거 (bypass) |
| 분석 요청 쿨다운 | 72시간 | bypass (즉시 재요청 가능) |
| 분석 리셋 도구 | 불가 | `/api/admin/reset-analysis` 사용 가능 |
| Admin Dashboard 접근 | `/channels`로 redirect | `/admin` 이하 전체 접근 가능 |
| UI Admin badge | 미표시 | 채널 페이지, 분석 페이지에 badge 표시 |

### 채널 등록 제한 상세

```
사용자 요청 → API (getChannelLimit 검증) → DB INSERT → DB 트리거 (check_channel_limit)
                                                           ↓
                                              admin email → RETURN NEW (bypass)
                                              normal user → count 검증 → 3개 초과 시 RAISE EXCEPTION
```

API 레이어와 DB 트리거가 이중으로 제한을 적용합니다.
DB 트리거는 API를 우회한 직접 INSERT에 대해서도 보호합니다.

### 분석 쿨다운 bypass 상세

```
분석 요청 → canBypassCooldown(email) 확인
           ↓ true → 쿨다운 검증 skip
           ↓ false → 72시간 이내면 거부
```

적용 위치: `src/app/api/analysis/request/route.ts`

---

## 3. 실패 Job 발생 시 운영 확인 절차

### 즉시 확인

1. `/admin` Overview → "누적 실패 작업 수" KPI 카드 확인
2. `/admin` Overview → "최근 실패 작업" 리스트에서 error_message 확인
3. `/admin/jobs?status=failed` → 실패 job 상세 확인
   - error_message hover로 전체 메시지 확인
   - 발생 시각, 소요 시간, 요청 사용자 확인

### 원인 분류

| error_message 패턴 | 의미 | 대응 |
|---|---|---|
| `YouTube API` 관련 | API 키 문제 또는 채널 접근 불가 | 환경변수 확인, 채널 URL 유효성 확인 |
| `Gemini` 관련 | AI 분석 실패 | Gemini API 상태 확인, 프롬프트 길이 확인 |
| `analysis_queue insert failed` | 큐 삽입 실패 | DB 상태 확인 |
| `timeout` / `network` | 네트워크 문제 | 인프라 상태 확인 |

### 반복 실패 대응

1. `/admin/metrics` → 일별 추이에서 실패 급증 여부 확인
2. `/admin/jobs?status=failed` → 동일 사용자/채널에서 반복되는지 확인
3. 반복 시: 해당 채널 데이터 또는 API 상태 점검

---

## 4. Admin Dashboard 페이지별 핵심 확인 포인트

### /admin (Overview)

| 지표 | 확인 포인트 |
|---|---|
| 현재 활성 작업 | 0이 아니면 진행 중인 분석 존재. 장시간 유지되면 stuck 의심 |
| 누적 실패 작업 수 | 증가 추세면 원인 조사 필요 |
| 최근 7일 분석 요청 | 서비스 활용도 지표 |
| 최근 실패 작업 리스트 | error_message로 즉시 원인 파악 |

### /admin/jobs

| 확인 포인트 |
|---|
| `running` 상태가 장시간(30분 이상) 유지되면 worker 장애 의심 |
| `queued` 상태가 장시간 유지되면 worker polling 문제 의심 |
| `failed` 필터로 실패 패턴 분석 |
| 소요 시간이 비정상적으로 긴 job 확인 |

### /admin/users

| 확인 포인트 |
|---|
| 신규 가입자 유입 추세 |
| 분석 요청 수가 0인 사용자 비율 (가입만 하고 미사용) |
| 채널 등록 수 대비 분석 요청 수 비율 |
| 관리자 badge가 올바르게 표시되는지 |

### /admin/channels

| 확인 포인트 |
|---|
| 분석 횟수가 0인 채널 (등록만 된 상태) |
| 최근 상태가 `failed`인 채널 목록 |
| 구독자 수 분포 (서비스 대상 채널 규모 파악) |

### /admin/metrics

| 확인 포인트 |
|---|
| 일별 추이에서 실패(빨강) 비율이 급증하는 날 |
| 7일 vs 30일 성공률 비교 → 최근 안정성 추세 |
| 요청량이 0인 날이 지속되면 서비스 활용도 저하 |

---

## 5. 테스트 시나리오

### 일반 사용자 시나리오

| # | 시나리오 | 기대 결과 |
|---|---|---|
| N-1 | 채널 3개 등록 후 4번째 시도 | "채널 등록 제한" 에러 |
| N-2 | 분석 요청 후 72시간 이내 재요청 | 쿨다운 에러 표시 |
| N-3 | `/admin` 직접 접근 | `/channels`로 redirect |
| N-4 | 분석 완료 후 리포트 확인 | 정상 표시, Admin badge 미표시 |
| N-5 | 분석 이력/Growth Trend/Compare 확인 | 데이터에 따라 정상 표시 또는 empty state |

### 관리자 사용자 시나리오

| # | 시나리오 | 기대 결과 |
|---|---|---|
| A-1 | 채널 4개 이상 등록 | 정상 등록 (999개 제한) |
| A-2 | 분석 요청 직후 즉시 재요청 | 쿨다운 bypass, 정상 요청 |
| A-3 | `/admin` 접근 | Overview 정상 표시 |
| A-4 | `/admin/jobs?status=failed` 필터 | 실패 job만 필터링 |
| A-5 | `/admin/users` 확인 | 본인 계정에 Admin badge 표시 |
| A-6 | `/admin/channels` 확인 | 전체 채널 + owner email 정상 표시 |
| A-7 | `/admin/metrics` 확인 | KPI 카드 + 일별 차트 정상 |
| A-8 | 분석 리셋 버튼 | 분석 상태 초기화 → 재요청 가능 |
| A-9 | 채널 페이지 Admin badge | badge 표시, "무제한" 표시 |
| A-10 | 분석 페이지 쿨다운 영역 | "관리자 계정: 쿨다운 바이패스 활성" 표시 |

### 경계값 테스트

| # | 시나리오 | 기대 결과 |
|---|---|---|
| E-1 | 이메일 대소문자 혼합 로그인 (NudgeFilm@Gmail.COM) | 관리자로 정상 인식 |
| E-2 | 분석 이력 0건인 채널의 Analysis Compare | "이전 분석 기록이 없어 비교를 표시할 수 없습니다." |
| E-3 | 분석 이력 1건인 채널의 Growth Trend | "데이터가 부족합니다" empty state |
| E-4 | `SUPABASE_SERVICE_ROLE_KEY` 미설정 상태에서 `/admin` | 서버 에러 (환경변수 확인 필요) |

---

## 6. 배포 전 최종 검수 체크리스트

### 환경변수

- [ ] `NEXT_PUBLIC_SUPABASE_URL` 설정됨
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정됨
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 설정됨 (서버 전용, `NEXT_PUBLIC_` 아님 확인)
- [ ] YouTube Data API key 설정됨
- [ ] Gemini API key 설정됨

### DB 트리거

- [ ] `check_channel_limit` 트리거 함수가 admin-aware 버전으로 적용됨
- [ ] 트리거 내 admin allowlist가 `RAW_ADMIN_EMAILS`와 동기화됨
- [ ] 일반 사용자 채널 제한(3개)이 정상 작동함

### 접근 제어

- [ ] 비로그인 사용자 → `/admin` 접근 시 redirect 확인
- [ ] 일반 사용자 → `/admin` 접근 시 `/channels`로 redirect 확인
- [ ] 관리자 → `/admin` 정상 접근 확인
- [ ] `supabaseAdmin` (SERVICE_ROLE_KEY)이 client bundle에 포함되지 않음 확인

### Admin Dashboard 동작

- [ ] `/admin` Overview: KPI 6개 카드 정상 표시
- [ ] `/admin/jobs`: 상태 필터 동작, 테이블 데이터 정상
- [ ] `/admin/users`: 사용자 목록, 집계 수치, Admin badge 정상
- [ ] `/admin/channels`: 채널 목록, owner email, 구독자 수 정상
- [ ] `/admin/metrics`: KPI 카드 + 일별 차트 정상 렌더링

### TypeScript

- [ ] `tsc --noEmit` exit code 0 (에러 0건)
- [ ] `any` 타입 사용 없음

---

## 7. 파일 구조 요약

```
src/lib/config/admin.ts           ← 관리자 이메일 배열 + isAdmin()
src/lib/admin/adminTools.ts       ← isAdminUser / getChannelLimit / canBypassCooldown
src/lib/admin/types.ts            ← Admin Dashboard 전체 타입
src/lib/admin/fetchAdminOverview.ts
src/lib/admin/fetchAdminJobs.ts
src/lib/admin/fetchAdminUsers.ts
src/lib/admin/fetchAdminChannels.ts
src/lib/admin/fetchAdminMetrics.ts

src/components/admin/AdminSidebar.tsx
src/components/admin/JobStatusFilter.tsx
src/components/admin/MetricsDailyChart.tsx

src/app/admin/layout.tsx          ← route protection + sidebar layout
src/app/admin/page.tsx            ← Overview
src/app/admin/jobs/page.tsx
src/app/admin/users/page.tsx
src/app/admin/channels/page.tsx
src/app/admin/metrics/page.tsx

src/app/api/admin/reset-analysis/route.ts  ← 관리자 분석 리셋 API

docs/sql/admin_bypass_channel_limit.sql    ← DB 트리거 SQL
docs/admin-policy-and-validation.md        ← 이 문서
```
