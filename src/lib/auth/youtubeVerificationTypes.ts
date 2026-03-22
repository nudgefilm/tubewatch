/**
 * profiles 테이블 YouTube 검증 캐시 (마이그레이션 `profiles_youtube_verification` 와 정렬)
 */
export type YoutubeVerificationProfileStatus =
  | "unverified"
  | "verified"
  | "revoked"
  | "pending";

export type ProfileYoutubeVerificationFields = {
  youtubeVerificationStatus: YoutubeVerificationProfileStatus;
  youtubeVerifiedAt: string | null;
  lastYoutubeCheckAt: string | null;
  verifiedChannelCount: number | null;
};

/** YouTube Data API channels.list 응답을 반영한 런타임 검증 결과 */
export type ManagedYoutubeVerifyStatus =
  | "verified"
  | "unverified"
  | "revoked"
  | "error";

export type ManagedYoutubeChannelRef = {
  channelId: string;
  title: string;
};

export type VerifyManagedYoutubeChannelsResult = {
  status: ManagedYoutubeVerifyStatus;
  managedChannels: ManagedYoutubeChannelRef[];
  checkedAt: string;
  errorMessage: string | null;
};

export type YoutubeVerificationUiVariant =
  | "verified"
  | "unverified"
  | "pending"
  | "revoked";

export type YoutubeVerificationUiState = {
  variant: YoutubeVerificationUiVariant;
  badgeLabel: string;
  message: string;
  detail: string | null;
};

/** 페이지 데이터에 실어 보내는 스냅샷 */
export type YoutubeFeatureAccessSnapshot = {
  canUseCoreAnalysisFeatures: boolean;
  ui: YoutubeVerificationUiState;
  profile: ProfileYoutubeVerificationFields | null;
  liveCheck: VerifyManagedYoutubeChannelsResult | null;
};
