export interface SampleChannel {
  name: string;
  channelId: string;
  tier: "micro" | "small" | "medium" | "large";
  note: string;
}

export const sampleChannels: SampleChannel[] = [
  {
    name: "Small Creator Example",
    channelId: "UCxxxxxxxxxxxxxxxxxxxxxx01",
    tier: "micro",
    note: "구독자 500명 미만, 영상 10개 이하 — 초기 채널 시나리오 테스트",
  },
  {
    name: "Growing Channel Example",
    channelId: "UCxxxxxxxxxxxxxxxxxxxxxx02",
    tier: "small",
    note: "구독자 3,000명, 영상 50개 — 성장 초기 채널 시나리오 테스트",
  },
  {
    name: "Medium Channel Example",
    channelId: "UCxxxxxxxxxxxxxxxxxxxxxx03",
    tier: "medium",
    note: "구독자 30,000명, 영상 200개 — 성장기 채널 시나리오 테스트",
  },
  {
    name: "Large Channel Example",
    channelId: "UCxxxxxxxxxxxxxxxxxxxxxx04",
    tier: "large",
    note: "구독자 150,000명, 영상 500개 — 대형 채널 시나리오 테스트",
  },
  {
    name: "Inactive Channel Example",
    channelId: "UCxxxxxxxxxxxxxxxxxxxxxx05",
    tier: "micro",
    note: "최근 30일 업로드 없음 — 비활성 채널 패턴 테스트",
  },
  {
    name: "Shorts-Only Channel Example",
    channelId: "UCxxxxxxxxxxxxxxxxxxxxxx06",
    tier: "small",
    note: "숏폼 전용 채널 — short_video_dominant 패턴 테스트",
  },
];
