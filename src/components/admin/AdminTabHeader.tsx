"use client";

import Link from "next/link";

type Tab = { key: string; label: string };

export default function AdminTabHeader({
  title,
  subtitle,
  tabs,
  activeTab,
}: {
  title: string;
  subtitle?: string;
  tabs: Tab[];
  activeTab: string;
}): JSX.Element {
  return (
    <div className="border-b border-foreground/8">
      <div className="pb-3">
        <h1 className="font-heading text-2xl font-medium tracking-[-0.03em] text-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const href = tab.key === tabs[0].key ? "?" : `?tab=${tab.key}`;
          const active = activeTab === tab.key;
          return (
            <Link
              key={tab.key}
              href={href}
              className={[
                "px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
