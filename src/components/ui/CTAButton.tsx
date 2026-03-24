import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type CTAButtonVariant = "primary" | "subtle-link";

export interface CTAButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  children: ReactNode;
  /**
   * Visual variant based on v0 hero CTAs.
   * - primary: filled pill button (bg-foreground, text-background)
   * - subtle-link: text-style link with underline on hover
   */
  variant?: CTAButtonVariant;
  /**
   * When provided, renders as a Next.js Link with button styling.
   */
  href?: string;
}

function PrimaryButtonBase({
  children,
  className,
  ...rest
}: {
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>): JSX.Element {
  return (
    <button
      type="button"
      className={[
        "inline-flex items-center justify-center",
        "rounded-full bg-foreground text-background",
        "px-8 h-14 text-sm lg:text-base font-medium",
        "shadow-sm hover:bg-foreground/90",
        "transition-colors duration-200",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}

function SubtleLinkBase({
  children,
  className,
  ...rest
}: {
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>): JSX.Element {
  return (
    <button
      type="button"
      className={[
        "inline-flex items-center justify-center",
        "text-sm lg:text-base text-muted-foreground",
        "underline-offset-4 hover:text-foreground hover:underline",
        "transition-colors duration-200",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}

export function CTAButton({
  children,
  variant = "primary",
  href,
  className,
  ...rest
}: CTAButtonProps): JSX.Element {
  if (href) {
    if (variant === "primary") {
      return (
        <Link href={href} className="inline-flex">
          <PrimaryButtonBase className={className} {...rest}>
            {children}
          </PrimaryButtonBase>
        </Link>
      );
    }
    return (
      <Link href={href} className="inline-flex">
        <SubtleLinkBase className={className} {...rest}>
          {children}
        </SubtleLinkBase>
      </Link>
    );
  }

  if (variant === "primary") {
    return (
      <PrimaryButtonBase className={className} {...rest}>
        {children}
      </PrimaryButtonBase>
    );
  }

  return (
    <SubtleLinkBase className={className} {...rest}>
      {children}
    </SubtleLinkBase>
  );
}

