type EmptyStateProps = {
  message: string;
  title?: string;
  icon?: React.ReactNode;
  dashed?: boolean;
  action?: React.ReactNode;
};

export default function EmptyState({
  message,
  title,
  icon,
  dashed = false,
  action,
}: EmptyStateProps): JSX.Element {
  return (
    <div
      className={[
        "rounded-xl bg-white px-6 py-10 text-center",
        dashed
          ? "border-2 border-dashed border-gray-200"
          : "border border-gray-200 shadow-sm",
      ].join(" ")}
    >
      {icon ? (
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50">
          {icon}
        </div>
      ) : null}
      {title ? (
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      ) : null}
      <p className={`${title ? "mt-2" : ""} mx-auto max-w-xs text-sm text-gray-500`}>
        {message}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
