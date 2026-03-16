import * as React from "react";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps): JSX.Element {
  return (
    <div
      className={
        "rounded-xl border border-border bg-background text-foreground shadow-sm " +
        (className ?? "")
      }
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div
      className={"flex flex-col space-y-1.5 p-4 " + (className ?? "")}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>): JSX.Element {
  return (
    <h3
      className={
        "text-base font-semibold leading-none tracking-tight " +
        (className ?? "")
      }
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>): JSX.Element {
  return (
    <p
      className={"text-sm text-muted-foreground " + (className ?? "")}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): JSX.Element {
  return (
    <div className={"p-4 pt-0 " + (className ?? "")} {...props} />
  );
}

