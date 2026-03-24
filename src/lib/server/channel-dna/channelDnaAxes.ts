/**
 * 채널 DNA 비교용 축 정의.
 * `ChannelDnaRadar`(Channel DNA 레이더)의 첫 4개 축(조회수 경쟁력, 좋아요 반응, 댓글 참여도, 업로드 규칙성)과
 * 동일한 정규화·기준선(baseline) 값을 유지합니다.
 */

export type ChannelDnaAxisKey =
  | "avgViewCount"
  | "avgLikeRatio"
  | "avgCommentRatio"
  | "avgUploadIntervalDays";

export type ChannelDnaAxis = {
  key: ChannelDnaAxisKey;
  label: string;
  /** 기준(베이스라인) 점수 0–100 스케일 해석용 */
  baseline: number;
  normalize: (value: number) => number;
};

function interpolate(value: number, breakpoints: [number, number][]): number {
  if (breakpoints.length === 0) return 0;
  if (value <= breakpoints[0][0]) return breakpoints[0][1];
  for (let i = 1; i < breakpoints.length; i++) {
    const [x0, y0] = breakpoints[i - 1];
    const [x1, y1] = breakpoints[i];
    if (value <= x1) {
      const t = (value - x0) / (x1 - x0);
      return Math.max(0, Math.min(100, y0 + t * (y1 - y0)));
    }
  }
  return Math.min(100, breakpoints[breakpoints.length - 1][1]);
}

/** 채널 DNA 페이지에서 사용하는 4개 축 (Channel DNA 레이더와 동일 기준) */
export const CHANNEL_DNA_AXES: ChannelDnaAxis[] = [
  {
    key: "avgViewCount",
    label: "조회수 경쟁력",
    baseline: 70,
    normalize: (v) =>
      interpolate(v, [[0, 0], [1000, 40], [5000, 70], [10000, 100]]),
  },
  {
    key: "avgLikeRatio",
    label: "좋아요 반응",
    baseline: 70,
    normalize: (v) =>
      interpolate(v, [[0, 0], [0.03, 60], [0.06, 100]]),
  },
  {
    key: "avgCommentRatio",
    label: "댓글 참여도",
    baseline: 60,
    normalize: (v) =>
      interpolate(v, [[0, 0], [0.005, 60], [0.01, 100]]),
  },
  {
    key: "avgUploadIntervalDays",
    label: "업로드 규칙성",
    baseline: 70,
    normalize: (v) =>
      interpolate(v, [[0, 100], [3, 100], [7, 70], [14, 40], [30, 10]]),
  },
];
