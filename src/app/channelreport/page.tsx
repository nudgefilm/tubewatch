import type { Metadata } from "next";
import ChannelReportLanding from "@/components/channelreport/ChannelReportLanding";

export const metadata: Metadata = {
  title: "Channel Report | 유튜브 채널 진단 전략 컨설팅",
  description:
    "유튜브 채널 영상 50개·시그널 30개 전수 분석. 수석 전략가 1:1 진단 코멘터리, 특허출원 기술 기반 병목 탐지, 30일 실행 로드맵 제공. 광고기획사·MCN 전문 채널 컨설팅 서비스.",
  openGraph: {
    title: "Channel Report | 유튜브 채널 진단 전략 컨설팅",
    description:
      "유튜브 채널 영상 50개·시그널 30개 전수 분석. 수석 전략가 1:1 진단 코멘터리, 특허출원 기술 기반 병목 탐지, 30일 실행 로드맵 제공.",
    url: "https://channelreport.net",
    siteName: "Channel Report",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Channel Report | 유튜브 채널 진단 전략 컨설팅",
    description:
      "유튜브 채널 영상 50개·시그널 30개 전수 분석. 수석 전략가 1:1 진단 코멘터리, 병목 탐지, 30일 실행 로드맵.",
  },
  keywords: ["유튜브 채널 분석", "MCN 컨설팅", "광고기획사 유튜브", "채널 전략", "유튜브 마케팅"],
};

export default function ChannelReportPage() {
  return <ChannelReportLanding />;
}
