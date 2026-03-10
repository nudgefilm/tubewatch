import {
  buildAnalysisInput,
  getChannelInfo,
  getRecentVideos,
} from "@/lib/youtube";

async function main(): Promise<void> {
  const channelId = process.env.YOUTUBE_TEST_CHANNEL_ID;

  if (!channelId) {
    throw new Error("YOUTUBE_TEST_CHANNEL_ID 환경 변수를 설정해 주세요.");
  }

  // 1) 채널 정보 조회
  const channel = await getChannelInfo(channelId);
  console.log("Channel info:");
  console.log(JSON.stringify(channel, null, 2));

  // 2) 최신 영상 조회
  const videos = await getRecentVideos(channelId, 5);
  console.log(`\nFetched ${videos.length} recent videos.`);
  console.log("First video (if exists):");
  console.log(JSON.stringify(videos[0] ?? null, null, 2));

  // 3) 분석 입력 구조 생성
  const input = buildAnalysisInput(channel, videos);
  console.log("\nAnalysis input sample:");
  console.log(
    JSON.stringify(
      {
        channel: input.channel,
        videos_count: input.videos.length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("youtubeFetchTest failed:", error);
});

