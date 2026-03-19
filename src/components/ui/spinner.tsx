type SpinnerProps = {
  size?: number;
  className?: string;
};

export function Spinner({
  size = 24,
  className,
}: SpinnerProps): JSX.Element {
  const dimension = `${size}px`;

  return (
    <div
      className={[
        "inline-block animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary",
        className ?? "",
      ].join(" ")}
      style={{ width: dimension, height: dimension }}
      aria-label="Loading"
      role="status"
    />
  );
}

