import type { AnalysisInput, ChannelInfo, VideoInfo } from "./types";

export function buildAnalysisInput(
  channel: ChannelInfo,
  videos: VideoInfo[]
): AnalysisInput {
  return {
    channel,
    videos,
  };
}

