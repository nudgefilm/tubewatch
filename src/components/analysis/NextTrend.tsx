"use client";

type NextTrendProps = {
  recommendedTopics: string[] | null;
  contentPatterns: string[] | null;
  growthActionPlan: string[] | null;
  targetAudience: string[] | null;
};

function safe(items: string[] | null | undefined): string[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  return items
    .map((v) => (typeof v === "string" ? v.trim() : ""))
    .filter((v) => {
      if (v.length === 0) return false;
      const key = v.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function SubSection({
  title,
  icon,
  items,
}: {
  title: string;
  icon: string;
  items: string[];
}): JSX.Element | null {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
        <span>{icon}</span>
        {title}
      </h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-start gap-2.5 rounded-lg border border-gray-100 bg-gray-50 px-3.5 py-2.5 text-sm leading-relaxed text-gray-700"
          >
            <span className="mt-[9px] block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
            <span className="min-w-0 break-words">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function NextTrend({
  recommendedTopics,
  contentPatterns,
  growthActionPlan,
  targetAudience,
}: NextTrendProps): JSX.Element {
  const topics = safe(recommendedTopics);
  const audience = safe(targetAudience);
  const actions = safe(growthActionPlan);
  const patterns = safe(contentPatterns);

  const hasAny =
    topics.length > 0 ||
    audience.length > 0 ||
    actions.length > 0 ||
    patterns.length > 0;

  if (!hasAny) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-400">
          추천 콘텐츠 방향을 생성할 데이터가 충분하지 않습니다.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="space-y-5">
        <SubSection title="추천 주제" icon="💡" items={topics} />
        <SubSection title="타겟 시청자 시그널" icon="🎯" items={audience} />
        <SubSection title="콘텐츠 방향" icon="🧭" items={actions} />

        {patterns.length > 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4">
            <p className="mb-2 text-xs font-semibold text-gray-500">
              참고: 현재 콘텐츠 패턴
            </p>
            <ul className="space-y-1">
              {patterns.map((item, i) => (
                <li key={i} className="text-xs leading-5 text-gray-500">
                  <span className="mr-1.5 text-gray-300">—</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
