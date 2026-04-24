"use client";

import React from "react";

type State = { error: Error | null };

export default class ReportErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
          <p className="text-lg font-semibold text-foreground">리포트를 표시할 수 없습니다</p>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            이전 형식으로 생성된 리포트입니다. 채널 페이지에서 이번 달 리포트를 새로 신청하면 정상적으로 표시됩니다.
          </p>
          <p className="text-xs text-muted-foreground/50 font-mono mt-2">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
