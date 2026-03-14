"use client";

import { useState } from "react";
import { GuestReportInput } from "@/components/guest/GuestReportInput";
import { GuestPreviewView } from "@/components/guest/GuestPreviewView";
import { submitGuestReport } from "./actions";
import type { GuestReportData } from "@/components/guest/types";
import SectionCard from "@/components/ui/SectionCard";

export function GuestReportClient(): JSX.Element {
  const [result, setResult] = useState<GuestReportData | null>(null);
  const [channelUrl, setChannelUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(submittedUrl: string): Promise<void> {
    setError(null);
    setResult(null);
    setChannelUrl("");
    const res = await submitGuestReport(submittedUrl);
    if (res.ok) {
      setResult(res.data);
      setChannelUrl(submittedUrl);
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="space-y-8">
      <SectionCard>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">채널 입력</h2>
        <GuestReportInput
          onSubmit={handleSubmit}
          disabled={false}
          error={error}
        />
      </SectionCard>

      {result ? (
        <>
          <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
          <GuestPreviewView data={result} channelUrl={channelUrl} />
        </>
      ) : null}
    </div>
  );
}
