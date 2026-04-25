import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Instrument_Sans, JetBrains_Mono } from "next/font/google"
import Script from "next/script"
import type { ReactNode } from "react"
import VisitTracker from "@/components/VisitTracker"
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

  title: "TubeWatch™ - 유튜버 성장 플랫폼",
  description: "당신의 데이터는 이미 다음 전략을 말하고 있습니다.",
  keywords: ["유튜브 분석", "채널 성장", "영상 기획", "튜브워치", "유튜버 도구"],

  alternates: {
    canonical: "https://tubewatch.kr",
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: light)" },
      { url: "/favicon-dark-16x16.png", sizes: "16x16", type: "image/png", media: "(prefers-color-scheme: dark)" },
      { url: "/favicon-dark-32x32.png", sizes: "32x32", type: "image/png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "icon", url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },

  openGraph: {
    type: "website",
    url: "https://tubewatch.kr",
    siteName: "TubeWatch",
    locale: "ko_KR",
    title: "TubeWatch™ - 유튜버 성장 플랫폼",
    description: "당신의 데이터는 이미 다음 전략을 말하고 있습니다.",
    images: [
      {
        url: "/OG_Tube.jpg",
        width: 600,
        height: 315,
        alt: "TubeWatch™ - 유튜버 성장 플랫폼",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "TubeWatch™ - 유튜버 성장 플랫폼",
    description: "당신의 데이터는 이미 다음 전략을 말하고 있습니다.",
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
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-VQE75G8LMY"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-VQE75G8LMY');
          `}
        </Script>
      </head>
      <body className={`${instrumentSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <VisitTracker />
        <Analytics />
      </body>
    </html>
  )
}
