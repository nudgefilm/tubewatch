/**
 * SEO Lab — 채널 맞춤 전략 섹션용 공용 타입 (외부 API·mock 없음).
 */

export type SeoStrategyItemVm = {
  id: string;
  title: string;
  shortReason: string;
  signalSource: string;
  /** 키워드·패턴을 어디에 삽입할지 — "제목 앞 배치" / "태그 추가" / "설명란 첫 줄" 등 */
  placement?: string;
};
