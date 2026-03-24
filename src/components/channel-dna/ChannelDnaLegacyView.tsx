import Link from "next/link";
import type { ChannelDnaPageData } from "./channelDnaPageTypes";
import ChannelDnaCompareCard from "./ChannelDnaCompareCard";

type ChannelDnaLegacyViewProps = {
  data: ChannelDnaPageData;
};

export default function ChannelDnaLegacyView({ data }: ChannelDnaLegacyViewProps): JSX.Element {
  const { channels, selectedChannel, compareItems, summaries } = data;
  const hasResult = data.latestResult !== null;
  const showCards = hasResult && compareItems.length > 0;

  return (
    <div className="space-y-6">
      {/* 채널 선택 */}
      {channels.length > 1 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            채널 선택
          </h2>
          <ul className="flex flex-wrap gap-2">
            {channels.map((ch) => {
              const isSelected = selectedChannel?.id === ch.id;
              return (
                <li key={ch.id}>
                  <Link
                    href={`/channel-dna?channelId=${encodeURIComponent(ch.id)}`}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      isSelected
                        ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {ch.thumbnail_url ? (
                      <img
                        src={ch.thumbnail_url}
                        alt=""
                        className="h-6 w-6 rounded-full object-cover"
                        width={24}
                        height={24}
                      />
                    ) : null}
                    <span className="max-w-[140px] truncate">
                      {ch.channel_title || "이름 없음"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* 핵심 비교 카드 4개 */}
      {showCards ? (
        <>
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              핵심 지표 비교
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {compareItems.slice(0, 4).map((item, i) => (
                <ChannelDnaCompareCard key={`${item.title}-${i}`} item={item} />
              ))}
            </div>
          </section>

          {/* 요약 섹션 */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              요약
            </h2>
            <ul className="space-y-1.5 text-sm text-slate-700">
              {summaries.map((line, i) => (
                <li key={`summary-${i}`}>{line}</li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
