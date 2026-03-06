# TubeWatch SaaS Dashboard

Next.js 기반 SaaS 대시보드 프로젝트입니다.

## 구조

- `src/app/` — App Router 페이지 및 레이아웃
- `src/app/dashboard/` — 대시보드 레이아웃(사이드바 + 헤더) 및 하위 페이지
- `src/components/` — Sidebar, Header 등 공통 컴포넌트

## 실행 방법

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 으로 접속하세요.

## 스크립트

- `npm run dev` — 개발 서버 실행
- `npm run build` — 프로덕션 빌드
- `npm run start` — 프로덕션 서버 실행
- `npm run lint` — ESLint 실행
