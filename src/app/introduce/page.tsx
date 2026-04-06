import type { Metadata } from "next"
import IntroduceLanding from "@/components/landing/introduce-landing"

export const metadata: Metadata = {
  title: "TubeWatch™ 플랫폼 소개 | 유튜버 채널 성장 플랫폼",
  description:
    "TubeWatch™는 채널 데이터를 분석해 다음에 무엇을 해야 할지 명확하게 알려주는 유튜버 전용 성장 플랫폼입니다. Channel Analysis · Channel DNA · Action Plan · Next Trend — 4가지 분석 도구로 채널 성장을 설계하세요.",
}

export default function IntroducePage() {
  return <IntroduceLanding />
}
