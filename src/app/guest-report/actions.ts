"use server";

import { headers } from "next/headers";
import { getGuestReportData } from "@/lib/server/guest/getGuestReportData";
import type { GuestReportResult } from "@/components/guest/types";

export async function submitGuestReport(
  channelUrl: string
): Promise<GuestReportResult> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  const clientIp = forwarded
    ? forwarded.split(",")[0].trim()
    : headersList.get("x-real-ip");
  return getGuestReportData(channelUrl, clientIp ?? null);
}
