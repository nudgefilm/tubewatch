export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
        대시보드
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">총 사용자</p>
          <p className="text-2xl font-semibold mt-1">—</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">이번 달 수익</p>
          <p className="text-2xl font-semibold mt-1">—</p>
        </div>
        <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-sm text-slate-500 dark:text-slate-400">활성 구독</p>
          <p className="text-2xl font-semibold mt-1">—</p>
        </div>
      </div>
    </div>
  );
}
