import type { SeoLabCardItem } from "./types";

type SeoLabCardProps = {
  item: SeoLabCardItem;
};

export default function SeoLabCard({ item }: SeoLabCardProps): JSX.Element {
  return (
    <div className="p-4 rounded-xl border bg-card">
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {item.title}
      </h3>
      {item.current_status ? (
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {item.current_status}
        </p>
      ) : null}
      <p className="mt-2 text-sm font-medium leading-relaxed text-slate-800">
        {item.recommendation}
      </p>
    </div>
  );
}
