import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Instrument_Sans, JetBrains_Mono } from "next/font/google"
import type { ReactNode } from "react"
import "./globals.css"

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://tubewatch.kr"),

  title: "TubeWatch - 유튜브 채널 성장 전략 플랫폼",
  description:
    "데이터로 분석하고 전략으로 성장하는 유튜버 전용 대시보드. 알고리즘 분석부터 영상 기획안 생성까지 한 번에.",
  keywords: ["유튜브 분석", "채널 성장", "영상 기획", "튜브워치", "유튜버 도구"],

  alternates: {
    canonical: "https://tubewatch.kr",
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },

  openGraph: {
    type: "website",
    url: "https://tubewatch.kr",
    siteName: "TubeWatch",
    locale: "ko_KR",
    title: "TubeWatch - 유튜브 채널 성장 전략 플랫폼",
    description:
      "데이터로 분석하고 전략으로 성장하는 유튜버 전용 대시보드. 알고리즘 분석부터 영상 기획안 생성까지 한 번에.",
    images: [
      {
        url: "/OG_Tube.jpg",
        width: 600,
        height: 315,
        alt: "TubeWatch - 유튜브 채널 성장 전략 플랫폼",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "TubeWatch - 유튜브 채널 성장 전략 플랫폼",
    description:
      "데이터로 분석하고 전략으로 성장하는 유튜버 전용 대시보드. 알고리즘 분석부터 영상 기획안 생성까지 한 번에.",
    images: ["/OG_Tube.jpg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <html lang="ko" data-scroll-behavior="smooth">
      <body className={`${instrumentSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
