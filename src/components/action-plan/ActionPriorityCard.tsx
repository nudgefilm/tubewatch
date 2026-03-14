import type { ActionItem } from "./types";

type ActionPriorityCardProps = {
  item: ActionItem;
  priority: "P1" | "P2" | "P3";
  priorityLabel: string;
};

export default function ActionPriorityCard({
  item,
  priority,
  priorityLabel,
}: ActionPriorityCardProps): JSX.Element {
  const bgClass =
    priority === "P1"
      ? "border-amber-200 bg-amber-50/50"
      : priority === "P2"
        ? "border-sky-200 bg-sky-50/50"
        : "border-slate-200 bg-slate-50/50";

  return (
    <div
      className={`min-w-0 rounded-xl border p-4 shadow-sm ${bgClass}`}
      data-priority={priority}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {priority}
        </span>
        <span className="text-xs font-medium text-slate-500">{priorityLabel}</span>
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
      {item.reason ? (
        <p className="mt-1.5 text-xs text-slate-600">{item.reason}</p>
      ) : null}
      {item.expected_impact ? (
        <p className="mt-1 text-xs text-slate-500">{item.expected_impact}</p>
      ) : null}
    </div>
  );
}
