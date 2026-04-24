import ReportGeneratingClient from "@/components/report/ReportGeneratingClient";

type Props = { searchParams: { token?: string } };

export default function ReportGeneratingPage({ searchParams }: Props) {
  const token = searchParams?.token;

  if (token) {
    return <ReportGeneratingClient token={token} />;
  }

  // token 없이 직접 접근한 경우 — 정적 스피너
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
      <p className="mb-2 text-xl font-semibold tracking-tight text-foreground">TubeWatch™</p>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">월간 리포트를 생성하고 있습니다.</p>
        <p className="mt-1 text-xs text-muted-foreground">채널 데이터를 분석하는 중입니다. 1~2분 소요됩니다.</p>
      </div>
      <div className="flex gap-1 mt-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"
            style={{ animationDelay: `${i * 200}ms` }} />
        ))}
      </div>
    </div>
  );
}
