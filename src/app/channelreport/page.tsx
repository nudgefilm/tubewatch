import type { Metadata } from "next";
import ChannelReportLanding from "@/components/channelreport/ChannelReportLanding";

export const metadata: Metadata = {
  title: "Channel Report | 전문가 채널 분석 컨설팅",
  description:
    "Channel Report는 유튜브 채널 데이터를 정밀 분석하여 광고주·크리에이터의 성장 전략을 제시하는 전문가 컨설팅 서비스입니다.",
};

export default function ChannelReportPage() {
  return <ChannelReportLanding />;
}
