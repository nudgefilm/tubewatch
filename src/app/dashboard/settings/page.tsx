export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6">
        설정
      </h1>
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-6 max-w-2xl">
        <p className="text-slate-600 dark:text-slate-400">
          설정 페이지입니다. 프로필, 알림, 결제 등 옵션을 여기서 관리할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
