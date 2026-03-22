import type { ReactNode } from "react";

type AppHeaderProps = {
  title: string;
  description?: string | null;
  right?: ReactNode;
};

export default function AppHeader({
  title,
  description,
  right,
}: AppHeaderProps): JSX.Element {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div className="min-w-0">
        <h1 className="font-display truncate text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </h1>
        {description ? (
          <p className="mt-0.5 truncate text-sm text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {right ? (
        <div className="ml-4 flex shrink-0 items-center gap-3">
          {right}
        </div>
      ) : null}
    </header>
  );
}
