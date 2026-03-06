export function Header() {
  return (
    <header className="h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-6">
      <span className="text-sm text-slate-500 dark:text-slate-400">
        SaaS Dashboard
      </span>
      <div className="ml-auto flex items-center gap-4">
        <span className="text-sm text-slate-700 dark:text-slate-300">
          사용자
        </span>
      </div>
    </header>
  );
}
