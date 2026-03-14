"use client";

import SectionCard from "@/components/ui/SectionCard";
import KpiCard from "@/components/ui/KpiCard";
import BenchmarkRadar from "@/components/analysis/BenchmarkRadar";
import { GuestLockedSection } from "./GuestLockedSection";
import type { GuestReportData } from "./types";

type GuestPreviewViewProps = {
  data: GuestReportData;
  channelUrl?: string;
};

export function GuestPreviewView({
  data,
  channelUrl = "",
}: GuestPreviewViewProps): JSX.Element {
  const {
    channel_title,
    subscriber_count,
    video_count,
    radar_scores,
    strengths,
    weaknesses,
  } = data;

  return (
    <div className="space-y-6">
      {/* Channel Overview + KPIs */}
      <SectionCard>
        <h2 className="text-lg font-semibold text-gray-900">Channel Overview</h2>
        <p className="mt-1 text-gray-700">{channel_title}</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <KpiCard
            label="구독자"
            value={subscriber_count ?? 0}
            subtitle="Subscriber count"
          />
          <KpiCard
            label="영상 수"
            value={video_count ?? 0}
            subtitle="Video count"
          />
        </div>
      </SectionCard>

      {/* Growth Score Radar */}
      <SectionCard>
        <h2 className="text-lg font-semibold text-gray-900">Growth Score Radar</h2>
        <div className="mt-4">
          <BenchmarkRadar metrics={radar_scores} />
        </div>
      </SectionCard>

      {/* Strengths / Weaknesses */}
      <SectionCard>
        <h2 className="text-lg font-semibold text-gray-900">Strength / Weakness</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-medium text-emerald-700">강점</h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-gray-700">
              {strengths.length > 0
                ? strengths.map((s, i) => <li key={i}>{s}</li>)
                : <li>—</li>}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-amber-700">약점</h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-gray-700">
              {weaknesses.length > 0
                ? weaknesses.map((w, i) => <li key={i}>{w}</li>)
                : <li>—</li>}
            </ul>
          </div>
        </div>
      </SectionCard>

      {/* Locked: Action Plan */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Action Plan</h2>
        <GuestLockedSection
          title="Action Plan"
          channelUrl={channelUrl}
          channelTitle={channel_title}
        />
      </section>

      {/* Locked: SEO Lab */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">SEO Lab</h2>
        <GuestLockedSection
          title="SEO Lab"
          channelUrl={channelUrl}
          channelTitle={channel_title}
        />
      </section>

      {/* Locked: Benchmark */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Benchmark</h2>
        <GuestLockedSection
          title="Benchmark"
          channelUrl={channelUrl}
          channelTitle={channel_title}
        />
      </section>

      {/* Locked: Growth Strategy */}
      <section>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">Growth Strategy</h2>
        <GuestLockedSection
          title="Growth Strategy"
          channelUrl={channelUrl}
          channelTitle={channel_title}
        />
      </section>
    </div>
  );
}
