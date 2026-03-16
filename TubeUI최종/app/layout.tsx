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
    siteName: 'TubeWatch™',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TubeWatch™ - YouTube Growth Platform',
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
