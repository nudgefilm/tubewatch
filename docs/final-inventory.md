# TubeWatch - 완전한 기술 인벤토리 (최종)

---

## 1. 전체 페이지 목록

### 랜딩 페이지

| 파일 경로 | URL 경로 | 역할
|-----|-----|-----
| `app/page.tsx` | `/` | 랜딩 페이지 (메인)


### 앱 페이지 (사이드바 레이아웃)

| 파일 경로 | URL 경로 | 역할
|-----|-----|-----
| `app/(app)/channels/page.tsx` | `/channels` | 내 채널
| `app/(app)/analysis/[channelId]/page.tsx` | `/analysis/[channelId]` | 채널 분석 (동적 라우트)
| `app/(app)/action-plan/page.tsx` | `/action-plan` | 액션 플랜
| `app/(app)/seo-lab/page.tsx` | `/seo-lab` | SEO 랩
| `app/(app)/benchmark/page.tsx` | `/benchmark` | 벤치마크
| `app/(app)/next-trend/page.tsx` | `/next-trend` | Next Trend
| `app/(app)/mypage/page.tsx` | `/mypage` | 마이페이지
| `app/(app)/billing/page.tsx` | `/billing` | 결제/빌링
| `app/(app)/settings/page.tsx` | `/settings` | 설정
| `app/(app)/support/page.tsx` | `/support` | 고객 지원


### 관리자 페이지

| 파일 경로 | URL 경로 | 역할
|-----|-----|-----
| `app/admin/page.tsx` | `/admin` | 관리자 대시보드


---

## 2. 레이아웃

| 파일 경로 | 역할
|-----|-----|-----
| `app/layout.tsx` | 루트 레이아웃 (폰트, 테마, 메타데이터)
| `app/(app)/layout.tsx` | 앱 레이아웃 (사이드바 포함 대시보드 쉘)


---

## 3. 랜딩 페이지 섹션 구성

### 사용 중인 섹션 (순서대로)

| 순서 | 파일 | 컴포넌트명 | 역할
|-----|-----|-----
| 1 | `components/landing/navigation.tsx` | Navigation | 상단 네비게이션
| 2 | `components/landing/hero-section.tsx` | HeroSection | 히어로 섹션
| 3 | `components/landing/features-section.tsx` | FeaturesSection | 4개 핵심 기능 (2x2 그리드)
| 4 | `components/landing/how-it-works-section.tsx` | HowItWorksSection | 작동 방식 (다크 배경)
| 5 | `components/landing/infrastructure-section.tsx` | InfrastructureSection | 분석 결과 미리보기
| 6 | `components/landing/security-section.tsx` | SecuritySection | Why TubeWatch
| 7 | `components/landing/cta-section.tsx` | CtaSection | CTA 섹션
| 8 | `components/landing/footer-section.tsx` | FooterSection | 푸터
| 9 | `components/landing/floating-tube-talk.tsx` | FloatingTubeTalk | 플로팅 텔레그램 버튼


### 미사용 섹션

| 파일 | 컴포넌트명 | 사용 여부
|-----|-----|-----
| `components/landing/metrics-section.tsx` | MetricsSection | unused
| `components/landing/integrations-section.tsx` | IntegrationsSection | unused
| `components/landing/developers-section.tsx` | DevelopersSection | unused
| `components/landing/testimonials-section.tsx` | TestimonialsSection | unused
| `components/landing/pricing-section.tsx` | PricingSection | unused


---

## 4. 애니메이션 컴포넌트

| 파일 | 컴포넌트명 | 사용 위치 | 기술
|-----|-----|-----
| `components/landing/animated-sphere.tsx` | AnimatedSphere | HeroSection | Canvas 2D, ASCII 렌더링
| `components/landing/animated-tetrahedron.tsx` | AnimatedTetrahedron | CtaSection | Canvas 2D, 3D 변환
| `components/landing/animated-wave.tsx` | AnimatedWave | FooterSection | Canvas 2D, 사인파


---

## 5. 앱 쉘 컴포넌트

| 파일 | 컴포넌트명 | 역할
|-----|-----|-----
| `components/app-sidebar.tsx` | AppSidebar | 앱 사이드바 (메뉴 네비게이션)
| `components/theme-provider.tsx` | ThemeProvider | 다크/라이트 테마 프로바이더


---

## 6. 버튼/링크 연동 맵

### Navigation (랜딩 페이지 상단)

| 요소 | 연결 경로
|-----|-----|-----
| TubeWatch 로고 | `/`
| Channel Analysis | `/channels`
| Action Plan | `/action-plan`
| SEO Lab | `/seo-lab`
| Benchmark | `/benchmark`
| Next Trend | `/next-trend`
| Sign in | `/channels`
| Sign Up | `/channels`


### HeroSection

| 요소 | 연결 경로/동작
|-----|-----|-----
| 내 채널 분석 | `/channels`
| 튜브워치 작동 방식 | 팝업 다이얼로그
| 내 채널 분석 시작하기 (팝업 내) | `/channels`


### CtaSection

| 요소 | 연결 경로
|-----|-----|-----
| Start Free | `/channels`
| Tube Talk | `https://t.me/tubewatch`


### FloatingTubeTalk

| 요소 | 연결 경로
|-----|-----|-----
| Tube Talk 버튼 | `https://t.me/tubewatch`


### FooterSection

| 요소 | 연결 경로/동작
|-----|-----|-----
| TubeWatch 로고 | `/`
| Terms of Service | 팝업 다이얼로그
| Privacy Policy | 팝업 다이얼로그
| Google Privacy Policy | `https://policies.google.com/privacy`
| YouTube Terms of Service | `https://www.youtube.com/t/terms`
| (c) (Admin 링크) | `/admin`


### App Sidebar (사이드바 메뉴)

#### 메인 메뉴

| 순서 | 메뉴 | 연결 경로 | 아이콘
|-----|-----|-----
| 1 | 내 채널 | `/channels` | Tv2
| 2 | 채널 분석 | `/analysis` | BarChart3
| 3 | 액션 플랜 | `/action-plan` | Zap
| 4 | SEO 랩 | `/seo-lab` | Search
| 5 | 벤치마크 | `/benchmark` | GitCompareArrows
| 6 | Next Trend | `/next-trend` | TrendingUp


#### 하단 메뉴

| 메뉴 | 연결 경로 | 아이콘
|-----|-----|-----
| 고객 지원 | `/support` | HelpCircle
| 마이페이지 | `/mypage` | User
| 설정 | `/settings` | Settings
| 로그아웃 | `/` | LogOut


### Admin Page (관리자 대시보드)

| 요소 | 연결 경로
|-----|-----|-----
| TubeWatch 로고 | `/`


---

## 7. 팝업 다이얼로그

### HeroSection - 튜브워치 작동 방식

- 4단계 프로세스 설명 (채널 등록 > 데이터 분석 > 전략 인사이트 생성 > 실행 가능한 액션)
- 각 단계별 고유 색상 테마 (주황/파랑/보라/초록)
- 분석 항목 프로그레스 바 시각화


### FooterSection - Terms of Service

- TubeWatch 이용약관 (제1조~제12조)


### FooterSection - Privacy Policy

- TubeWatch 개인정보 처리방침 (1~8항)
- YouTube API 관련 외부 링크 포함


---

## 8. 폰트 설정

| 폰트 | CSS 변수 | 클래스 | 용도
|-----|-----|-----
| Instrument Sans | `--font-instrument` | `font-sans` | 본문 텍스트
| Instrument Serif | `--font-instrument-serif` | `font-display` | 헤드라인, 타이틀
| JetBrains Mono | `--font-jetbrains` | `font-mono` | 코드, 숫자


---

## 9. 디자인 토큰 (CSS Variables)

```css
:root {
  --background: oklch(0.985 0.002 90);
  --foreground: oklch(0.12 0.01 60);
  --card: oklch(1 0 0);
  --muted: oklch(0.94 0.005 90);
  --muted-foreground: oklch(0.45 0.02 60);
  --border: oklch(0.88 0.01 90);
  --radius: 0.25rem;
}
```

---

## 10. 섹션별 여백 설정

| 섹션 | 패딩 클래스 | 헤더 마진
|-----|-----|-----
| FeaturesSection | `py-16 lg:py-24` | `mb-10 lg:mb-16`
| HowItWorksSection | `py-16 lg:py-24` | `mb-10 lg:mb-16`
| InfrastructureSection | `py-16 lg:py-24` | -
| SecuritySection | `py-16 lg:py-24` | `mb-10 lg:mb-16`
| CtaSection | `py-16 lg:py-24` | -


---

## 11. 외부 의존성 (주요 패키지)

```json
{
  "next": "16.0.10",
  "react": "19.2.0",
  "react-dom": "19.2.0",
  "lucide-react": "^0.454.0",
  "tailwindcss": "^4.1.9",
  "@tailwindcss/postcss": "^4.1.9",
  "tw-animate-css": "1.3.3",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.3.1",
  "@radix-ui/react-dialog": "^1.1.14",
  "@radix-ui/react-scroll-area": "^1.2.8",
  "@radix-ui/react-slot": "1.1.1",
  "@vercel/analytics": "1.3.1",
  "next-themes": "^0.4.6"
}
```

---

## 12. 메타데이터

```typescriptreact
export const metadata: Metadata = {
  title: 'TubeWatch - 데이터로 설계하는 유튜브 성장전략 플랫폼',
  description: '채널 데이터를 기반으로 당신의 성장 전략을 찾아갑니다.',
  openGraph: {
    title: 'TubeWatch - 데이터로 설계하는 유튜브 성장전략 플랫폼',
    description: '채널 데이터를 기반으로 당신의 성장 전략을 찾아갑니다.',
    url: 'https://tubewatch.app',
    siteName: 'TubeWatch',
    locale: 'ko_KR',
    type: 'website',
  },
}
```

---

## 13. Shared UI Components (shadcn/ui)

| 컴포넌트 | 파일
|-----|-----
| Accordion | `components/ui/accordion.tsx`
| AlertDialog | `components/ui/alert-dialog.tsx`
| Alert | `components/ui/alert.tsx`
| AspectRatio | `components/ui/aspect-ratio.tsx`
| Avatar | `components/ui/avatar.tsx`
| Badge | `components/ui/badge.tsx`
| Breadcrumb | `components/ui/breadcrumb.tsx`
| ButtonGroup | `components/ui/button-group.tsx`
| Button | `components/ui/button.tsx`
| Calendar | `components/ui/calendar.tsx`
| Card | `components/ui/card.tsx`
| Carousel | `components/ui/carousel.tsx`
| Chart | `components/ui/chart.tsx`
| Checkbox | `components/ui/checkbox.tsx`
| Collapsible | `components/ui/collapsible.tsx`
| Command | `components/ui/command.tsx`
| ContextMenu | `components/ui/context-menu.tsx`
| Dialog | `components/ui/dialog.tsx`
| Drawer | `components/ui/drawer.tsx`
| DropdownMenu | `components/ui/dropdown-menu.tsx`
| Empty | `components/ui/empty.tsx`
| Field | `components/ui/field.tsx`
| Form | `components/ui/form.tsx`
| HoverCard | `components/ui/hover-card.tsx`
| InputGroup | `components/ui/input-group.tsx`
| InputOTP | `components/ui/input-otp.tsx`
| Input | `components/ui/input.tsx`
| Item | `components/ui/item.tsx`
| Kbd | `components/ui/kbd.tsx`
| Label | `components/ui/label.tsx`
| Menubar | `components/ui/menubar.tsx`
| NavigationMenu | `components/ui/navigation-menu.tsx`
| Pagination | `components/ui/pagination.tsx`
| Popover | `components/ui/popover.tsx`
| Progress | `components/ui/progress.tsx`
| RadioGroup | `components/ui/radio-group.tsx`
| Resizable | `components/ui/resizable.tsx`
| ScrollArea | `components/ui/scroll-area.tsx`
| Select | `components/ui/select.tsx`
| Separator | `components/ui/separator.tsx`
| Sheet | `components/ui/sheet.tsx`
| Sidebar | `components/ui/sidebar.tsx`
| Skeleton | `components/ui/skeleton.tsx`
| Slider | `components/ui/slider.tsx`
| Sonner | `components/ui/sonner.tsx`
| Spinner | `components/ui/spinner.tsx`
| Switch | `components/ui/switch.tsx`
| Table | `components/ui/table.tsx`
| Tabs | `components/ui/tabs.tsx`
| Textarea | `components/ui/textarea.tsx`
| Toast | `components/ui/toast.tsx`
| Toaster | `components/ui/toaster.tsx`
| ToggleGroup | `components/ui/toggle-group.tsx`
| Toggle | `components/ui/toggle.tsx`
| Tooltip | `components/ui/tooltip.tsx`


---

## 14. Hooks

| 파일 | 훅 이름 | 역할
|-----|-----|-----
| `hooks/use-mobile.ts` | useMobile | 모바일 뷰포트 감지
| `hooks/use-toast.ts` | useToast | 토스트 알림 상태 관리


---

## 15. Utilities

| 파일 | 역할
|-----|-----|-----
| `lib/utils.ts` | cn() 클래스 병합 유틸리티


---

## 16. Config Files

| 파일 | 역할
|-----|-----|-----
| `next.config.mjs` | Next.js 설정
| `postcss.config.mjs` | PostCSS 설정
| `tsconfig.json` | TypeScript 설정
| `components.json` | shadcn/ui 설정


---

## 17. 파일 수 요약

| 카테고리 | 파일 수
|-----|-----
| Pages | 12
| Layouts | 2
| Landing Sections (사용) | 9
| Landing Sections (미사용) | 5
| Landing Animations | 3
| App Shell Components | 2
| Shared UI Components | 54
| Hooks | 2
| Utilities | 1
| Config | 4
| **Total** | **94**


---

이 인벤토리는 TubeWatch 사이트의 모든 구성 요소, 페이지, 컴포넌트, 링크 연동, 스타일 설정을 빠짐없이 포함합니다.
