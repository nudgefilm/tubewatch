import Link from "next/link";
import type { SeoLabPageData } from "./types";

type SeoLabViewProps = {
  data: SeoLabPageData;
};

function BulletList({ items }: { items: string[] }): JSX.Element {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">—</p>;
  }
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
      {items.map((line, i) => (
        <li key={i} className="leading-relaxed">
          {line}
        </li>
      ))}
    </ul>
  );
}

export default function SeoLabView({ data }: SeoLabViewProps): JSX.Element {
  const { channels, selectedChannel, latestResult, spec } = data;
  const hasResult = latestResult !== null;

  return (
    <div className="w-full max-w-6xl mx-auto px-6 lg:px-12 py-8 lg:py-10">
      {channels.length > 1 ? (
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
        </div>
          </div>
        </section>
      ) : null}

      <p className="text-sm leading-relaxed text-slate-600">{spec.dataPipelineNote}</p>

      {!hasResult ? (
        <section className="mt-8 rounded-xl border border-dashed border-border bg-card p-4 text-sm text-muted-foreground">
          <p className="font-medium text-slate-800">최신 성공 분석이 없습니다.</p>
          <p className="mt-1 text-slate-600">
            /analysis에서 분석을 완료하면 저장 스냅샷 기준 SEO Lab 섹션이 채워집니다.
          </p>
        </section>
      ) : (
        <div className="mt-8 space-y-10">
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              SEO 진단
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">제목 명확성</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{spec.diagnosis.titleClarity}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">키워드 일관성</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{spec.diagnosis.keywordConsistency}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">주제 집중도</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{spec.diagnosis.topicFocus}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">대표 키워드 축</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-700">{spec.diagnosis.representativeKeywordAxis}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              키워드 분석
            </h2>
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  자주 사용된 키워드
                </p>
                <p className="mt-1 text-xs text-slate-500">{spec.keywordAnalysis.topKeywordsNote}</p>
                <p className="mt-2 text-sm text-slate-800">
                  {spec.keywordAnalysis.topKeywords.length > 0
                    ? spec.keywordAnalysis.topKeywords.join(" · ")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  자주 쓰지만 성과 연결이 약한 키워드
                </p>
                <p className="mt-1 text-xs text-slate-500">{spec.keywordAnalysis.lowPerformingNote}</p>
                <p className="mt-2 text-sm text-slate-800">
                  {spec.keywordAnalysis.lowPerformingRepeated.length > 0
                    ? spec.keywordAnalysis.lowPerformingRepeated.join(" · ")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  잘된 패턴인데 덜 활용한 키워드
                </p>
                <p className="mt-1 text-xs text-slate-500">{spec.keywordAnalysis.underutilizedNote}</p>
                <p className="mt-2 text-sm text-slate-800">
                  {spec.keywordAnalysis.underutilized.length > 0
                    ? spec.keywordAnalysis.underutilized.join(" · ")
                    : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  브랜드 vs 일반 키워드
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{spec.keywordAnalysis.brandVsGeneral}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              제목 개선
            </h2>
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">문제 분석</p>
                <p className="mt-1 text-sm text-slate-700">{spec.titleImprovement.problemAnalysis}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">개선 제목</p>
                <p className="mt-1 text-sm text-slate-700">{spec.titleImprovement.improvedTitleSuggestion}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">제목 구조 공식</p>
                <p className="mt-1 text-sm text-slate-700">{spec.titleImprovement.structureFormula}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              비슷한 주제 묶음
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">강한 주제</p>
                <div className="mt-2"><BulletList items={spec.clusters.strongTopics} /></div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">확장 주제</p>
                <div className="mt-2"><BulletList items={spec.clusters.expansionTopics} /></div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">혼선 주제</p>
                <div className="mt-2"><BulletList items={spec.clusters.confusedTopics} /></div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">정리 우선순위</p>
                <div className="mt-2"><BulletList items={spec.clusters.cleanupPriority} /></div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              실행 액션
            </h2>
            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  키워드 기반 영상 제안
                </p>
                <div className="mt-2"><BulletList items={spec.execution.keywordVideoIdeas} /></div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">제목 생성 힌트</p>
                <div className="mt-2"><BulletList items={spec.execution.titleGenerationHints} /></div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">적용 체크리스트</p>
                <div className="mt-2"><BulletList items={spec.execution.checklist} /></div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
