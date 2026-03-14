"use client";

import { useState } from "react";

export type GuestReportInputProps = {
  onSubmit: (channelUrl: string) => Promise<void>;
  disabled?: boolean;
  error: string | null;
};

export function GuestReportInput({
  onSubmit,
  disabled = false,
  error,
}: GuestReportInputProps): JSX.Element {
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || disabled || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label htmlFor="guest-channel-url" className="block text-sm font-medium text-gray-700">
        YouTube channel URL
      </label>
      <input
        id="guest-channel-url"
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://youtube.com/@handle 또는 https://youtube.com/channel/UCxxxx"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        disabled={disabled || submitting}
      />
      <button
        type="submit"
        disabled={!url.trim() || disabled || submitting}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "분석 중..." : "Submit"}
      </button>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
