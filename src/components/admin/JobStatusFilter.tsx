"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { JOB_STATUS_FILTERS } from "@/lib/admin/types";
import type { JobStatusFilter } from "@/lib/admin/types";

const FILTER_LABELS: Record<JobStatusFilter, string> = {
  all: "전체",
  queued: "queued",
  running: "running",
  success: "success",
  failed: "failed",
};

const FILTER_DOT_COLORS: Record<JobStatusFilter, string> = {
  all: "bg-gray-400",
  queued: "bg-amber-500",
  running: "bg-blue-500",
  success: "bg-emerald-500",
  failed: "bg-red-500",
};

export default function JobStatusFilterBar({
  totalCount,
}: {
  totalCount: number;
}): JSX.Element {
  const searchParams = useSearchParams();
  const current = (searchParams.get("status") ?? "all") as JobStatusFilter;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {JOB_STATUS_FILTERS.map((filter) => {
        const isActive = filter === current;
        return (
          <Link
            key={filter}
            href={filter === "all" ? "/admin/jobs" : `/admin/jobs?status=${filter}`}
            className={[
              "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition",
              isActive
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
            ].join(" ")}
          >
            <span className={`inline-block h-2 w-2 rounded-full ${FILTER_DOT_COLORS[filter]}`} />
            {FILTER_LABELS[filter]}
          </Link>
        );
      })}
      <span className="ml-auto text-xs tabular-nums text-gray-400">
        {totalCount.toLocaleString("ko-KR")}건
      </span>
    </div>
  );
}
