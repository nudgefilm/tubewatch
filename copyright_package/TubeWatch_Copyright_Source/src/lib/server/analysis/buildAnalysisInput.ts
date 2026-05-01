// src/lib/server/analysis/buildAnalysisInput.ts

type VideoItem = {
    videoId: string;
    title: string;
    publishedAt: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    duration: string;
  };
  
  type ChannelInfo = {
    channelId: string;
    title: string;
    description: string;
    subscriberCount: number;
    videoCount: number;
    viewCount: number;
    publishedAt: string;
    thumbnails?: {
      default?: { url: string };
      medium?: { url: string };
      high?: { url: string };
    };
  };
  
  export type BuildAnalysisInputArgs = {
    channel: ChannelInfo;
    videos: VideoItem[];
  };
  
  export type BuiltAnalysisInput = {
    input: {
      channel: ChannelInfo;
      videos: VideoItem[];
      stats: {
        totalVideosAnalyzed: number;
        avgViews: number;
        avgLikes: number;
        avgComments: number;
        maxViews: number;
        minViews: number;
      };
    };
    prompt: string;
  };
  
  function average(nums: number[]) {
    if (nums.length === 0) return 0;
    return Math.round(nums.reduce((sum, n) => sum + n, 0) / nums.length);
  }
  
  export function buildAnalysisInput({
    channel,
    videos,
  }: BuildAnalysisInputArgs): BuiltAnalysisInput {
    const sanitizedVideos = videos
      .slice(0, 50)
      .map((video) => ({
        videoId: video.videoId,
        title: video.title,
        publishedAt: video.publishedAt,
        viewCount: Number(video.viewCount || 0),
        likeCount: Number(video.likeCount || 0),
        commentCount: Number(video.commentCount || 0),
        duration: video.duration || "",
      }));
  
    const viewCounts = sanitizedVideos.map((v) => v.viewCount);
    const likeCounts = sanitizedVideos.map((v) => v.likeCount);
    const commentCounts = sanitizedVideos.map((v) => v.commentCount);
  
    const stats = {
      totalVideosAnalyzed: sanitizedVideos.length,
      avgViews: average(viewCounts),
      avgLikes: average(likeCounts),
      avgComments: average(commentCounts),
      maxViews: viewCounts.length ? Math.max(...viewCounts) : 0,
      minViews: viewCounts.length ? Math.min(...viewCounts) : 0,
    };
  
    const input = {
      channel: {
        channelId: channel.channelId,
        title: channel.title,
        description: channel.description || "",
        subscriberCount: Number(channel.subscriberCount || 0),
        videoCount: Number(channel.videoCount || 0),
        viewCount: Number(channel.viewCount || 0),
        publishedAt: channel.publishedAt || "",
        thumbnails: channel.thumbnails || {},
      },
      videos: sanitizedVideos,
      stats,
    };
  
    const prompt = [
      "다음은 유튜브 채널 데이터입니다.",
      "이 데이터를 바탕으로 TubeWatch용 채널 진단 결과를 JSON으로 작성하세요.",
      "",
      "[분석 원칙]",
      "- 한국어로 작성",
      "- 과장된 성공 예측 금지",
      "- 데이터 기반으로 현실적 진단",
      "- 배열 항목은 짧고 명확하게 작성",
      "- 실행 가능한 액션 중심으로 작성",
      "- 영상 목록과 채널 설명을 함께 반영",
      "",
      "[점수 기준]",
      "- niche_clarity: 주제 선명도",
      "- content_quality: 콘텐츠 경쟁력",
      "- clickability: 제목/썸네일 클릭 잠재력",
      "- consistency: 업로드 및 포맷 일관성",
      "- growth_potential: 단기 성장 가능성 시나리오",
      "- total: 종합 점수",
      "",
      "[채널 데이터 JSON]",
      JSON.stringify(input, null, 2),
    ].join("\n");
  
    return {
      input,
      prompt,
    };
  }