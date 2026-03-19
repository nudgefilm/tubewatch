import * as React from "react";

type ProgressProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: number;
};

export function Progress({
  className,
  value = 0,
  ...props
}: ProgressProps): JSX.Element {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={[
        "relative h-2 w-full overflow-hidden rounded-full bg-muted",
        className ?? "",
      ].join(" ")}
      {...props}
    >
      <div
        className="h-full bg-primary transition-all duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

