import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TubeWatch — 데이터로 설계하는 유튜브 성장 전략",
  description: "채널 데이터를 기반으로 성장 병목과 콘텐츠 방향을 분석합니다. 감이 아닌 데이터로 다음 전략을 설계하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
