import type { ReactNode } from "react";

/**
 * Layout for /landing only. Applies v0 design tokens so the page
 * matches the original v0 landing visual fidelity (colors, spacing).
 * Does not affect /, /channels, or /analysis.
 */
export default function LandingLayout({
  children,
}: { children: ReactNode }): JSX.Element {
  return (
    <div className="v0-landing-theme min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}
