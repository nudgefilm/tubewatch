import Link from "next/link";
import type { ActionPlanPageData } from "./types";
import ActionPriorityCard from "./ActionPriorityCard";

const PRIORITY_CONFIG: { key: "P1" | "P2" | "P3"; label: string }[] = [
  { key: "P1", label: "지금 바로" },
  { key: "P2", label: "이번 주" },
  { key: "P3", label: "다음 단계" },
];

type ActionPlanViewProps = {
  data: ActionPlanPageData;
};

export default function ActionPlanView({ data }: ActionPlanViewProps): JSX.Element {
  const { channels, selectedChannel, actions } = data;
  const hasChannels = channels.length > 0;
  const hasResult = data.latestResult !== null;
  const showActions = hasResult && actions.length > 0;

  return (
    <div className="w-full max-w-6xl mx-auto px-6 lg:px-12 py-8 lg:py-10">
      {/* 채널 선택 */}
      {hasChannels && channels.length > 1 ? (
        <section className="py-12">
          <div className="space-y-6">
        <div className="p-4 rounded-xl border bg-card">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            채널 선택
          </h2>
          <ul className="flex flex-wrap gap-2">
            {channels.map((ch) => {
              const isSelected = selectedChannel?.id === ch.id;
              return (
                <li key={ch.id}>
                  <Link
                    href={`/action-plan?channelId=${encodeURIComponent(ch.id)}`}
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
                    <span className="truncate max-w-[140px]">
                      {ch.channel_title || "이름 없음"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
          </div>
        </section>
      ) : null}

      {/* 우선순위 액션 3개 */}
      {showActions ? (
        <>
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              우선순위 액션
            </h2>
            <div className="grid gap-6 sm:grid-cols-3">
              {actions.slice(0, 3).map((item, i) => (
                <ActionPriorityCard
                  key={`${item.title}-${i}`}
                  item={item}
                  priority={PRIORITY_CONFIG[i].key}
                  priorityLabel={PRIORITY_CONFIG[i].label}
                />
              ))}
            </div>
          </section>

          {/* 근거 섹션 */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              근거
            </h2>
            <ul className="space-y-1.5 text-sm text-slate-600">
              {actions.slice(0, 3).map((item, i) => (
                <li key={`reason-${i}`} className="break-words">
                  <span className="font-medium text-slate-500">
                    {PRIORITY_CONFIG[i].key}:{" "}
                  </span>
                  {item.reason || "—"}
                </li>
              ))}
            </ul>
          </section>
        </>
      ) : null}
    </div>
  );
}
