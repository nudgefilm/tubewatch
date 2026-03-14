import Link from "next/link";
import type { SeoLabPageData } from "./types";
import SeoLabCard from "./SeoLabCard";

type SeoLabViewProps = {
  data: SeoLabPageData;
};

export default function SeoLabView({ data }: SeoLabViewProps): JSX.Element {
  const { channels, selectedChannel, cards } = data;
  const hasResult = data.latestResult !== null;
  const showCards = hasResult && cards.length > 0;

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
                    href={`/seo-lab?channelId=${encodeURIComponent(ch.id)}`}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      isSelected
                        ? "border-amber-300 bg-amber-50 text-amber-800"
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

      {/* 핵심 개선 카드 3개 */}
      {showCards ? (
        <>
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              핵심 개선 포인트
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {cards.slice(0, 3).map((item, i) => (
                <SeoLabCard key={`${item.title}-${i}`} item={item} />
              ))}
            </div>
          </section>

          {/* 근거 섹션 */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              근거
            </h2>
            <ul className="space-y-1.5 text-sm text-slate-600">
              {cards.slice(0, 3).map((item, i) => (
                <li key={`evidence-${i}`}>
                  <span className="font-medium text-slate-500">{item.title}: </span>
                  {item.current_status || "—"}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
