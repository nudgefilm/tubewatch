import type { ReactNode } from "react";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export default function PageContainer({
  children,
  className = "",
}: PageContainerProps): JSX.Element {
  return (
    <div
      className={`mx-auto w-full max-w-7xl space-y-8 p-8 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
