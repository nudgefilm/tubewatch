import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SeoLabPageData } from "./types";

type SeoLabViewProps = {
  data: SeoLabPageData;
};

function BulletList({ items }: { items: string[] }): JSX.Element {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">데이터 부족</p>;
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

function tierBarPercent(count: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((count / max) * 100);
}

type ClusterRowProps = { label: string; count: number; max: number; barClass: string };

function ClusterBarRow({ label, count, max, barClass }: ClusterRowProps): JSX.Element {
  const pct = tierBarPercent(count, max);
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span className="tabular-nums font-medium text-slate-800">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SeoLabView({ data }: SeoLabViewProps): JSX.Element {
  const { channels, selectedChannel, latestResult, spec } = data;
  const hasResult = latestResult !== null;

  const kw = spec.keywordAnalysis;
  const strongN = kw.topKeywords.length;
  const midN = kw.underutilized.length;
  const weakN = kw.lowPerformingRepeated.length;
  const kwMax = Math.max(strongN, midN, weakN, 1);

  const cl = spec.clusters;
  const cStrong = cl.strongTopics.length;
  const cExp = cl.expansionTopics.length;
  const cConf = cl.confusedTopics.length;
  const cClean = cl.cleanupPriority.length;
  const clusterMax = Math.max(cStrong, cExp, cConf, cClean, 1);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-12 lg:py-10">
      {channels.length > 1 ? (
        <section className="py-12">
          <div className="space-y-6">
            <div className="rounded-xl border bg-card p-4">
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
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  제목 명확성
                </p>
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-slate-700">
                  {spec.diagnosis.titleClarity}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  키워드 일관성
                </p>
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-slate-700">
                  {spec.diagnosis.keywordConsistency}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  주제 집중도
                </p>
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-slate-700">
                  {spec.diagnosis.topicFocus}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  대표 키워드 축
                </p>
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-slate-700">
                  {spec.diagnosis.representativeKeywordAxis}
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              키워드 강·중·약
            </h2>
            <Card className="border-slate-200">
              <CardContent className="space-y-5 pt-6">
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-emerald-600 hover:bg-emerald-600">강 (자주 쓰는 축)</Badge>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-900 hover:bg-amber-100">
                    중 (덜 활용)
                  </Badge>
                  <Badge variant="outline" className="border-rose-200 text-rose-800">
                    약 (성과 연결 약함)
                  </Badge>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-emerald-800">강</span>
                      <span className="tabular-nums text-slate-600">{strongN}개 키워드</span>
                    </div>
                    <Progress value={tierBarPercent(strongN, kwMax)} className="h-2" />
                    <p className="mt-1 text-xs text-muted-foreground">{kw.topKeywordsNote}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-800">
                      {strongN > 0 ? kw.topKeywords.join(" · ") : "데이터 부족"}
                    </p>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-amber-900">중</span>
                      <span className="tabular-nums text-slate-600">{midN}개 키워드</span>
                    </div>
                    <Progress value={tierBarPercent(midN, kwMax)} className="h-2 bg-amber-50" />
                    <p className="mt-1 text-xs text-muted-foreground">{kw.underutilizedNote}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-800">
                      {midN > 0 ? kw.underutilized.join(" · ") : "데이터 부족"}
                    </p>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium text-rose-800">약</span>
                      <span className="tabular-nums text-slate-600">{weakN}개 키워드</span>
                    </div>
                    <Progress value={tierBarPercent(weakN, kwMax)} className="h-2 bg-rose-50" />
                    <p className="mt-1 text-xs text-muted-foreground">{kw.lowPerformingNote}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-800">
                      {weakN > 0 ? kw.lowPerformingRepeated.join(" · ") : "데이터 부족"}
                    </p>
                  </div>
                </div>
                <p className="line-clamp-3 text-sm text-slate-600">{kw.brandVsGeneral}</p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              제목 Before / After
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-slate-800">Before (현재 패턴)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-4 text-sm leading-relaxed text-slate-700">
                    {spec.titleImprovement.problemAnalysis || "데이터 부족"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-emerald-200/80 bg-emerald-50/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-emerald-900">After (개선 방향)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-4 text-sm font-medium leading-relaxed text-slate-900">
                    {spec.titleImprovement.improvedTitleSuggestion || "데이터 부족"}
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card className="mt-4 border-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  제목 구조 공식
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-sm text-slate-700">{spec.titleImprovement.structureFormula}</p>
              </CardContent>
            </Card>
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              주제 클러스터 (표본 분포)
            </h2>
            <Card className="border-slate-200">
              <CardContent className="space-y-4 pt-6">
                <ClusterBarRow label="강한 주제" count={cStrong} max={clusterMax} barClass="bg-emerald-500" />
                <ClusterBarRow label="확장 주제" count={cExp} max={clusterMax} barClass="bg-sky-500" />
                <ClusterBarRow label="혼선 주제" count={cConf} max={clusterMax} barClass="bg-amber-500" />
                <ClusterBarRow label="정리 우선순위" count={cClean} max={clusterMax} barClass="bg-violet-500" />
              </CardContent>
            </Card>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">강한 주제</p>
                <div className="mt-2">
                  <BulletList items={spec.clusters.strongTopics} />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">확장 주제</p>
                <div className="mt-2">
                  <BulletList items={spec.clusters.expansionTopics} />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">혼선 주제</p>
                <div className="mt-2">
                  <BulletList items={spec.clusters.confusedTopics} />
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">정리 우선순위</p>
                <div className="mt-2">
                  <BulletList items={spec.clusters.cleanupPriority} />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border-2 border-amber-400/70 bg-gradient-to-br from-amber-50/90 to-white p-1 shadow-sm">
            <div className="rounded-[14px] bg-white/95 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-900">
                  실행 액션
                </h2>
                <Badge className="bg-amber-600 hover:bg-amber-600">우선 적용</Badge>
              </div>
              <div className="space-y-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    키워드 기반 영상 제안
                  </p>
                  <div className="mt-2">
                    <BulletList items={spec.execution.keywordVideoIdeas} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    제목 생성 힌트
                  </p>
                  <div className="mt-2">
                    <BulletList items={spec.execution.titleGenerationHints} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    적용 체크리스트
                  </p>
                  <div className="mt-2">
                    <BulletList items={spec.execution.checklist} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
