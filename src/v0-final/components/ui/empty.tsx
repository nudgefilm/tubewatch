import type { ReactNode } from "react"

type EmptyProps = {
  className?: string
  children: ReactNode
}

export function Empty({ className, children }: EmptyProps): JSX.Element {
  return (
    <section
      className={
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center " +
        (className ?? "")
      }
    >
      {children}
    </section>
  )
}

type SimpleProps = {
  children: ReactNode
}

export function EmptyHeader({ children }: SimpleProps): JSX.Element {
  return <div className="space-y-2">{children}</div>
}

export function EmptyMedia({
  children,
}: SimpleProps & { variant?: "icon" }): JSX.Element {
  return (
    <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-slate-900/5 text-slate-700">
      {children}
    </div>
  )
}

export function EmptyTitle({ children }: SimpleProps): JSX.Element {
  return <h2 className="text-base font-semibold text-slate-900">{children}</h2>
}

export function EmptyDescription({ children }: SimpleProps): JSX.Element {
  return <p className="mt-1 text-sm leading-relaxed text-slate-500">{children}</p>
}

export function EmptyContent({ children }: SimpleProps): JSX.Element {
  return <div className="mt-6 flex justify-center">{children}</div>
}
