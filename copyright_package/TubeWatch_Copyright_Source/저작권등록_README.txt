================================================================================
  TubeWatch — 컴퓨터프로그램저작권 등록 소스코드 패키지
================================================================================

■ 프로그램명    : TubeWatch
■ 버전          : v1.2 (Master Plan v1.2 기준)
■ 저작자        : nudgefilm@gmail.com
■ 패키지 생성일 : 2026-05-01

■ 프로그램 개요
  TubeWatch는 YouTube 채널을 과학적으로 진단하고 성장 전략을 제공하는 SaaS 플랫폼입니다.
  채널 데이터를 수집하여 고유한 알고리즘으로 분석하고, AI 기반 인사이트를 생성합니다.

■ 기술 스택
  - 프론트엔드 : Next.js 15 (App Router), TypeScript, Tailwind CSS
  - 백엔드      : Supabase (PostgreSQL + RLS + RPC Functions)
  - AI 엔진    : Google Gemini API
  - 결제        : PortOne (국내 PG사 연동)
  - 호스팅      : Vercel

--------------------------------------------------------------------------------
■ 포함된 핵심 소스코드 구조
--------------------------------------------------------------------------------

src/
  lib/
    analysis/
      analysisRun.ts              ← 분석 실행 이력 관리 (run/snapshot 기반 상태 머신)
      analysisViewModel.ts        ← 분석 결과 ViewModel 파생 로직
      normalizeSnapshot.ts        ← 공통 정규화 레이어 (단일 진입점)
      engine/
        types.ts                  ← 핵심 도메인 타입 정의
        buildChannelFeatures.ts   ← 채널 특성 지표 32개 산출 엔진
        computeChannelMetrics.ts  ← 채널 기본 메트릭 계산
        detectPatterns.ts         ← 채널 패턴 플래그 감지 (7개 신호)
        featureScoring.ts         ← 5+1 구간 점수화 엔진 (0-100 스케일)
        buildAnalysisContext.ts   ← 분석 컨텍스트 (채널 규모·해석 모드)
        normalizeVideoMetrics.ts  ← 영상 지표 정규화
        utils.ts                  ← 통계 유틸리티 (average, median, CV 등)

    channel-dna/
      internalChannelDnaSummary.ts ← 채널 DNA 8대 분석 신호 추출 엔진
      channelDnaPageViewModel.ts   ← /channel-dna 페이지 ViewModel

    engines/
      channelDnaPageEngine.ts     ← DNA 페이지 섹션 렌더링 엔진
      channelDnaHelper.ts         ← DNA 신호 인간화 변환 유틸

    server/
      analysis/
        atomicCredit.ts           ← Atomic Credit 트랜잭션 (reserve/confirm/rollback)
        checkUserCredits.ts       ← 사용자 크레딧 조회/생성
        analysisCostGuard.ts      ← 분석 비용 검증 가드
        saveAnalysisResult.ts     ← 분석 결과 저장 (upsert)
        buildAnalysisInput.ts     ← 분석 입력 데이터 빌드
        status.ts                 ← 분석 상태 관리

    supabase/
      admin.ts                    ← Supabase Admin 클라이언트 (Service Role)

  app/
    api/
      analysis/
        worker/route.ts           ← 분석 워커 API (Gemini AI 병렬 실행)

supabase/
  migrations/
    20250312000000_user_credits.sql              ← 사용자 크레딧 테이블
    20250315000000_user_subscriptions.sql        ← 구독 테이블
    20250316000000_profiles.sql                  ← 사용자 프로필 테이블
    20260322120000_analysis_runs.sql             ← 분석 실행 이력 테이블
    20260329000000_..._run_type_requested_modules.sql ← run_type/모듈 컬럼 추가
    20260330000000_credit_logs_credit_reservations.sql ← 크레딧 예약/로그 테이블
    20260330000001_analysis_module_results.sql   ← AI 모듈 결과 테이블
    20260403000000_user_credits_lifetime.sql     ← 평생 크레딧 컬럼 추가
    20260403000003_atomic_credit_rpc.sql         ← Atomic Credit RPC 함수
    20260403000004_engine_version.sql            ← 엔진 버전 추적
    20260405000001_..._onepager_keys.sql         ← 원페이저 키 구조
    20260421000001_user_channels_rls_select.sql  ← 채널 RLS 정책

--------------------------------------------------------------------------------
■ 핵심 알고리즘 설명
--------------------------------------------------------------------------------

1. 채널 특성 분석 엔진 (buildChannelFeatures.ts)
   - 32개 특성 지표를 5개 구간으로 분류하여 산출:
     · Channel Activity (업로드 주기/일관성/활성도)
     · Audience Response (조회/좋아요/댓글/인게이지먼트)
     · Content Structure (제목 길이/태그/카테고리/시리즈성)
     · SEO Optimization (키워드 밀도/메타데이터 완성도)
     · Growth Momentum (성장 추이/히트 의존성/분포 균형)

2. 채널 DNA 추출 엔진 (internalChannelDnaSummary.ts)
   - 성과 편차 분석 (CV 기반 3구간: low/medium/high)
   - 히트 의존도 분석 (상위 3개 영상 조회 비중)
   - 업로드 일관성 판정 (평균 업로드 간격 기반)
   - 팬덤 응집도 계산 ((좋아요+댓글)/조회수)
   - 포맷 분포 시각화 (Shorts/단편/장편 3구간)

3. Atomic Credit 트랜잭션 (atomicCredit.ts + atomic_credit_rpc.sql)
   - reserve(): FOR UPDATE 락으로 동시 요청 직렬화
   - confirm(): 분석 성공 시 예약 확정
   - rollback(): 분석 실패 시 크레딧 복구

--------------------------------------------------------------------------------
■ 보안 처리 안내
--------------------------------------------------------------------------------
  · 모든 .env 설정값 및 API Key는 이 패키지에 포함되지 않습니다
  · src/lib/supabase/admin.ts의 Service Role Key는 환경변수(process.env)로만 참조됩니다
  · Supabase URL 및 인증 정보는 서버 환경변수로 관리됩니다
  · 이 패키지에는 순수 소스코드(알고리즘·스키마·비즈니스 로직)만 포함됩니다

================================================================================
