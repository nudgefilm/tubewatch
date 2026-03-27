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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://tubewatch.kr"),
  title: "TubeWatch™ - 데이터로 설계하는 유튜브 성장전략 플랫폼",
  description:
    "채널 데이터를 기반으로 당신의 성장 전략을 찾아갑니다. 채널 분석, Action Plan, SEO 최적화, 채널 DNA 비교까지.",
  generator: "TubeWatch",
  openGraph: {
    title: "TubeWatch™ - 데이터로 설계하는 유튜브 성장전략 플랫폼",
    description: "채널 데이터를 기반으로 당신의 성장 전략을 찾아갑니다.",
    url: "https://tubewatch.app",
    siteName: "TubeWatch",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TubeWatch - YouTube Growth Platform",
      },
    ],
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TubeWatch™ - 데이터로 설계하는 유튜브 성장전략 플랫폼",
    description: "채널 데이터를 기반으로 당신의 성장 전략을 찾아갑니다.",
    images: ["/og-image.jpg"],
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
