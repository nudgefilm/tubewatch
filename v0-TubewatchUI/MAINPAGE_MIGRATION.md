# TubeWatch 메인페이지 완전 이식 가이드

새 프로젝트에 이 메인페이지를 복제하려면 아래 순서대로 파일을 생성하세요.

---

## 사용 방법

1. 새 v0 프로젝트를 생성합니다
2. 이 문서의 각 파일 내용을 복사하여 새 프로젝트에 붙여넣기 합니다
3. 파일 순서: package.json → globals.css → layout.tsx → lib/utils.ts → components/ui/button.tsx → components/landing/*.tsx → app/page.tsx

---

## 1. package.json

```json
{
  "name": "tubewatch",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "next build",
    "dev": "next dev",
    "lint": "eslint .",
    "start": "next start"
  },
  "dependencies": {
    "@radix-ui/react-slot": "1.1.1",
    "@vercel/analytics": "1.3.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.454.0",
    "next": "16.0.10",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.9",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "postcss": "^8.5",
    "tailwindcss": "^4.1.9",
    "tw-animate-css": "1.3.3",
    "typescript": "^5"
  }
}
```

---

## 2. app/globals.css

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

:root {
  --background: oklch(0.985 0.002 90);
  --foreground: oklch(0.12 0.01 60);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.12 0.01 60);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.12 0.01 60);
  --primary: oklch(0.12 0.01 60);
  --primary-foreground: oklch(0.985 0.002 90);
  --secondary: oklch(0.96 0.005 90);
  --secondary-foreground: oklch(0.12 0.01 60);
  --muted: oklch(0.94 0.005 90);
  --muted-foreground: oklch(0.45 0.02 60);
  --accent: oklch(0.92 0.01 90);
  --accent-foreground: oklch(0.12 0.01 60);
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: oklch(0.577 0.245 27.325);
  --border: oklch(0.88 0.01 90);
  --input: oklch(0.92 0.01 90);
  --ring: oklch(0.12 0.01 60);
  --chart-1: oklch(0.12 0.01 60);
  --chart-2: oklch(0.35 0.02 60);
  --chart-3: oklch(0.55 0.02 60);
  --chart-4: oklch(0.70 0.02 60);
  --chart-5: oklch(0.85 0.01 60);
  --radius: 0.25rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

@theme inline {
  --font-sans: var(--font-instrument), 'Instrument Sans', system-ui, sans-serif;
  --font-mono: var(--font-jetbrains), 'JetBrains Mono', monospace;
  --font-display: var(--font-instrument-serif), 'Instrument Serif', Georgia, serif;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    scroll-behavior: smooth;
  }
  a, button, [role="button"], [type="button"], [type="submit"], [type="reset"] {
    cursor: pointer;
  }
}

@layer utilities {
  .font-display {
    font-family: var(--font-display);
  }
  
  .text-stroke {
    -webkit-text-stroke: 1.5px currentColor;
    -webkit-text-fill-color: transparent;
  }
  
  .marquee {
    animation: marquee 30s linear infinite;
  }
  
  .marquee-reverse {
    animation: marquee-reverse 25s linear infinite;
  }

  @keyframes marquee {
    0% { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }
  
  @keyframes marquee-reverse {
    0% { transform: translateX(-50%); }
    100% { transform: translateX(0); }
  }
  
  .line-reveal {
    clip-path: inset(0 100% 0 0);
    animation: line-reveal 0.8s cubic-bezier(0.77, 0, 0.175, 1) forwards;
  }
  
  @keyframes line-reveal {
    to { clip-path: inset(0 0 0 0); }
  }
  
  .hover-lift {
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  .hover-lift:hover {
    transform: translateY(-4px);
  }
  
  .letter-spin {
    display: inline-block;
    transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  
  .letter-spin:hover {
    transform: rotateY(360deg);
  }
  
  .animate-char-in {
    animation: char-in 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
    opacity: 0;
    filter: blur(40px);
    transform: translateY(100%);
  }
  
  @keyframes char-in {
    0% {
      opacity: 0;
      filter: blur(40px);
      transform: translateY(100%);
    }
    100% {
      opacity: 1;
      filter: blur(0);
      transform: translateY(0);
    }
  }

  .noise-overlay {
    position: relative;
  }
  
  .noise-overlay::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.03;
    pointer-events: none;
    z-index: 1;
  }
  
  .border-sketch {
    border: 1px solid transparent;
    background: 
      linear-gradient(var(--background), var(--background)) padding-box,
      linear-gradient(135deg, var(--foreground) 25%, transparent 25%, transparent 50%, var(--foreground) 50%, var(--foreground) 75%, transparent 75%) border-box;
    background-size: 100% 100%, 8px 8px;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }

  .animate-ping-slow {
    animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
  }

  @keyframes ping-slow {
    0% { transform: scale(1); opacity: 0.5; }
    75%, 100% { transform: scale(1.3); opacity: 0; }
  }
}
```

---

## 3. app/layout.tsx

```tsx
import React from "react"
import type { Metadata } from 'next'
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const instrumentSans = Instrument_Sans({ 
  subsets: ["latin"],
  variable: '--font-instrument'
});

const instrumentSerif = Instrument_Serif({ 
  subsets: ["latin"],
  weight: "400",
  variable: '--font-instrument-serif'
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-jetbrains'
});

export const metadata: Metadata = {
  title: 'TubeWatch™ - 데이터로 설계하는 유튜브 성장전략 플랫폼',
  description: '채널 데이터를 기반으로 당신의 성장 전략을 찾아갑니다. 채널 분석, Action Plan, SEO 최적화, 벤치마크 비교까지.',
  generator: 'v0.app',
  openGraph: {
    title: 'TubeWatch™ - 데이터로 설계하는 유튜브 성장전략 플랫폼',
    description: '채널 데이터를 기반으로 당신의 성장 전략을 찾아갑니다.',
    url: 'https://tubewatch.app',
    siteName: 'TubeWatch',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TubeWatch - YouTube Growth Platform',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TubeWatch™ - 데이터로 설계하는 유튜브 성장전략 플랫폼',
    description: '채널 데이터를 기반으로 당신의 성장 전략을 찾아갑니다.',
    images: ['/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

---

## 4. lib/utils.ts

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## 5. components/ui/button.tsx

```tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
```

---

## 6. app/page.tsx

```tsx
import { Navigation } from "@/components/landing/navigation";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { InfrastructureSection } from "@/components/landing/infrastructure-section";
import { SecuritySection } from "@/components/landing/security-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FooterSection } from "@/components/landing/footer-section";
import { FloatingTubeTalk } from "@/components/landing/floating-tube-talk";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden noise-overlay">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <InfrastructureSection />
      <SecuritySection />
      <CtaSection />
      <FooterSection />
      <FloatingTubeTalk />
    </main>
  );
}
```

---

## 7. 랜딩 컴포넌트 파일 목록

아래 파일들은 길이가 길어 별도 파일로 분리했습니다. 프로젝트의 다음 위치에서 복사하세요:

| 파일 경로 | 설명 |
|-----------|------|
| `components/landing/navigation.tsx` | 상단 네비게이션 |
| `components/landing/hero-section.tsx` | 히어로 섹션 |
| `components/landing/features-section.tsx` | 기능 프리뷰 섹션 |
| `components/landing/how-it-works-section.tsx` | Three Steps 섹션 |
| `components/landing/infrastructure-section.tsx` | 분석 결과 미리보기 |
| `components/landing/security-section.tsx` | Why TubeWatch 섹션 |
| `components/landing/cta-section.tsx` | CTA 섹션 |
| `components/landing/footer-section.tsx` | 푸터 섹션 |
| `components/landing/floating-tube-talk.tsx` | 텔레그램 버튼 |
| `components/landing/auth-modal.tsx` | 로그인 모달 |
| `components/landing/how-it-works-modal.tsx` | 작동 방식 모달 |
| `components/landing/admin-auth-modal.tsx` | 관리자 로그인 모달 |
| `components/landing/terms-modal.tsx` | 이용약관 모달 |
| `components/landing/privacy-modal.tsx` | 개인정보처리방침 모달 |
| `components/landing/animated-sphere.tsx` | 3D 구체 애니메이션 |
| `components/landing/animated-tetrahedron.tsx` | 3D 사면체 애니메이션 |
| `components/landing/animated-wave.tsx` | 파도 애니메이션 |

---

## 빠른 이식 방법

**새 v0 채팅에서 다음과 같이 요청하세요:**

```
다음 GitHub 레포의 메인페이지를 그대로 복제해주세요:
https://github.com/nudgefilm/UI-Lab

복제할 파일:
- app/page.tsx
- app/layout.tsx  
- app/globals.css
- lib/utils.ts
- components/ui/button.tsx
- components/landing/ 폴더 전체
```

또는 이 프로젝트를 ZIP으로 다운로드하여 필요한 파일만 새 프로젝트에 복사하세요.
