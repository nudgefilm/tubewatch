"use client";

import { useEffect, useState } from "react";
import { X, Activity, Globe, Tv2, BarChart3, Users, Film } from "lucide-react";

interface SiteStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Stats = {
  todayVisitors: number;
  totalVisitors: number;
  channelsCount: number;
  analysisCount: number;
  totalSubscribers: number;
  totalVideos: number;
};

function fmt(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const STATS_CONFIG = [
  {
    key: "todayVisitors" as keyof Stats,
    icon: Activity,
    label: "당일 접속수",
    sub: "오늘 유니크 방문자",
    accent: "text-emerald-400",
    live: true,
  },
  {
    key: "totalVisitors" as keyof Stats,
    icon: Globe,
    label: "누적 접속수",
    sub: "서비스 오픈 이후 전체",
    accent: "text-sky-400",
  },
  {
    key: "channelsCount" as keyof Stats,
    icon: Tv2,
    label: "등록 채널 수",
    sub: "YouTube 채널 기준",
    accent: "text-violet-400",
  },
  {
    key: "analysisCount" as keyof Stats,
    icon: BarChart3,
    label: "누적 분석 실행",
    sub: "전체 분석 횟수",
    accent: "text-orange-400",
  },
  {
    key: "totalSubscribers" as keyof Stats,
    icon: Users,
    label: "총 구독자 합산",
    sub: "등록 채널 구독자 총합",
    accent: "text-pink-400",
  },
  {
    key: "totalVideos" as keyof Stats,
    icon: Film,
    label: "분석된 영상 수",
    sub: "누적 분석 영상 총합",
    accent: "text-amber-400",
  },
];

export function SiteStatsModal({ isOpen, onClose }: SiteStatsModalProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch("/api/site-stats")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-background border border-foreground/10 rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-300 overflow-hidden">

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-foreground/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest">Live</span>
            </div>
            <h2 className="text-xl font-heading font-medium tracking-[-0.03em]">TubeWatch™ 서비스 현황</h2>
            <p className="text-sm text-muted-foreground mt-0.5">실시간 플랫폼 이용 지표</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-foreground/5 transition-colors cursor-pointer mt-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="p-6">
          {loading || !stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-foreground/[0.03] border border-foreground/8 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {STATS_CONFIG.map(({ key, icon: Icon, label, sub, accent, live }) => (
                <div
                  key={key}
                  className="group flex flex-col gap-3 rounded-xl bg-foreground/[0.02] border border-foreground/8 p-4 hover:bg-foreground/[0.04] hover:border-foreground/15 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className={`w-8 h-8 rounded-lg bg-foreground/5 flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${accent}`} />
                    </div>
                    {live && (
                      <span className="font-mono text-[10px] text-emerald-500 tracking-widest uppercase">today</span>
                    )}
                  </div>
                  <div>
                    <div className="font-mono text-2xl font-bold tracking-tight text-foreground tabular-nums">
                      {fmt(stats[key])}
                    </div>
                    <div className="text-sm font-medium text-foreground/80 mt-0.5">{label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 flex items-center justify-between">
          <p className="text-xs text-muted-foreground/60 font-mono">
            KST 기준 · 60초 캐시
          </p>
          <button
            onClick={onClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer font-mono"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
