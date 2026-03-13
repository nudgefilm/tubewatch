type PageHeaderProps = {
  title: string;
  description?: string | null;
};

export default function PageHeader({
  title,
  description,
}: PageHeaderProps): JSX.Element {
  return (
    <header>
      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
      {description ? (
        <p className="mt-2 text-base leading-relaxed text-slate-600">
          {description}
        </p>
      ) : null}
    </header>
  );
}
