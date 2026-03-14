import { parseChannelUrl } from "@/lib/youtube/parseChannelUrl";
import { getChannelInfo } from "@/lib/youtube/getChannelInfo";
import { getRecentVideos, type VideoInfo } from "@/lib/youtube";
import { normalizeVideoMetrics } from "@/lib/analysis/engine/normalizeVideoMetrics";
import { buildChannelFeatures } from "@/lib/analysis/engine/buildChannelFeatures";
import { featureScoring } from "@/lib/analysis/engine/featureScoring";
import { computeChannelMetrics } from "@/lib/analysis/engine/computeChannelMetrics";
import { detectPatterns } from "@/lib/analysis/engine/detectPatterns";
import { buildAnalysisContext } from "@/lib/analysis/engine/buildAnalysisContext";
import {
  analyzeChannelWithGemini,
  type ChannelVideoSample,
} from "@/lib/ai/analyzeChannelWithGemini";
import { buildActionItemsFromResult } from "@/lib/server/action-plan/buildActionItemsFromResult";
import { buildSeoLabItemsFromResult } from "@/lib/server/seo-lab/buildSeoLabItemsFromResult";
import { buildBenchmarkItemsFromResult } from "@/lib/server/benchmark/buildBenchmarkItemsFromResult";
import type { ActionPlanResultRow } from "@/components/action-plan/types";
import type { SeoLabResultRow } from "@/components/seo-lab/types";
import type { BenchmarkResultRow } from "@/components/benchmark/types";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { GuestFullReportData } from "./guestReportTypes";
import { generateStrategyPdf } from "@/lib/server/pdf/generateStrategyPdf";

function toChannelVideoSamples(videos: VideoInfo[]): ChannelVideoSample[] {
  return videos.map((video) => ({
    videoId: video.video_id,
    title: video.title,
    publishedAt: video.published_at,
    viewCount: video.view_count,
    likeCount: video.like_count,
    commentCount: video.comment_count,
    duration: video.duration,
    description: video.description,
    thumbnail: video.thumbnail_url ?? null,
    tags: video.tags,
    categoryId: video.category_id,
  }));
}

export type GenerateGuestFullReportResult =
  | { ok: true; reportId: string }
  | { ok: false; error: string };

/**
 * Runs full analysis pipeline (no DB write to analysis_results), builds report_data,
 * inserts guest_reports, generates PDF, uploads to storage, updates pdf_url.
 */
export async function generateGuestFullReport(
  stripeSessionId: string,
  channelUrl: string,
  channelTitle: string
): Promise<GenerateGuestFullReportResult> {
  const trimmed = channelUrl.trim();
  const parsed = parseChannelUrl(trimmed || " ");
  if (!parsed) {
    return { ok: false, error: "Invalid channel URL" };
  }

  let channel;
  try {
    channel = await getChannelInfo(parsed);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Channel fetch failed";
    return { ok: false, error: msg };
  }

  let youtubeVideos: VideoInfo[];
  try {
    youtubeVideos = await getRecentVideos(channel.channel_id, 20);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Videos fetch failed";
    return { ok: false, error: msg };
  }

  const normalizedDataset = normalizeVideoMetrics({
    channel: {
      youtube_channel_id: channel.channel_id,
      title: channel.channel_title,
      description: channel.description ?? "",
      published_at: null,
      subscriber_count: channel.subscriber_count,
      video_count: channel.video_count,
      view_count: channel.view_count,
    },
    videos: youtubeVideos.map((v) => ({
      video_id: v.video_id,
      title: v.title,
      description: v.description,
      published_at: v.published_at,
      thumbnail: v.thumbnail_url,
      view_count: v.view_count,
      like_count: v.like_count,
      comment_count: v.comment_count,
      duration: v.duration,
      tags: v.tags,
      category_id: v.category_id,
    })),
  });

  const featureMap = buildChannelFeatures(normalizedDataset);
  const scoreResult = featureScoring(featureMap);
  const channelMetrics = computeChannelMetrics(normalizedDataset);
  const channelPatterns = detectPatterns(channelMetrics, featureMap);
  const analysisContext = buildAnalysisContext(
    channelMetrics,
    channelPatterns,
    scoreResult,
    {
      subscriberCount: channel.subscriber_count ?? undefined,
      sampleVideoCount: youtubeVideos.length,
      collectedVideoCount: normalizedDataset.collectedVideoCount,
    }
  );

  const gemini = await analyzeChannelWithGemini({
    channelTitle: channel.channel_title || "Untitled Channel",
    subscriberCount: channel.subscriber_count,
    videos: toChannelVideoSamples(youtubeVideos),
    analysisContext,
  });

  if (!gemini.ok) {
    return { ok: false, error: gemini.error };
  }

  const featureSnapshot = {
    collectedVideoCount: normalizedDataset.collectedVideoCount,
    sampleVideoCount: youtubeVideos.length,
    metrics: channelMetrics,
    patterns: channelPatterns.flags,
  };

  const syntheticRow: ActionPlanResultRow & SeoLabResultRow & BenchmarkResultRow = {
    id: "",
    user_channel_id: "",
    status: "analyzed",
    channel_summary: gemini.result.channel_summary,
    growth_action_plan: gemini.result.growth_action_plan,
    weaknesses: gemini.result.weaknesses,
    bottlenecks: gemini.result.bottlenecks,
    feature_snapshot: featureSnapshot as Record<string, unknown>,
    feature_section_scores: scoreResult.sectionScores as Record<string, number>,
    created_at: new Date().toISOString(),
  };

  const actionPlanItems = buildActionItemsFromResult(syntheticRow);
  const seoItems = buildSeoLabItemsFromResult(syntheticRow);
  const benchmarkItems = buildBenchmarkItemsFromResult(syntheticRow);

  const reportData: GuestFullReportData = {
    channel_title: channel.channel_title ?? "",
    subscriber_count: channel.subscriber_count,
    video_count: channel.video_count,
    channel_summary: gemini.result.channel_summary,
    content_pattern_summary: gemini.result.content_pattern_summary,
    content_patterns: gemini.result.content_patterns ?? [],
    strengths: gemini.result.strengths ?? [],
    weaknesses: gemini.result.weaknesses ?? [],
    bottlenecks: gemini.result.bottlenecks ?? [],
    recommended_topics: gemini.result.recommended_topics ?? [],
    growth_action_plan: gemini.result.growth_action_plan ?? [],
    target_audience: gemini.result.target_audience ?? [],
    sample_size_note: gemini.result.sample_size_note,
    interpretation_mode: gemini.result.interpretation_mode,
    analysis_confidence: gemini.result.analysis_confidence,
    metrics: {
      avgViewCount: channelMetrics.avgViewCount,
      avgLikeRatio: channelMetrics.avgLikeRatio,
      avgCommentRatio: channelMetrics.avgCommentRatio,
      avgUploadIntervalDays: channelMetrics.avgUploadIntervalDays,
      recent30dUploadCount: channelMetrics.recent30dUploadCount,
      avgTagCount: channelMetrics.avgTagCount,
    },
    action_plan_items: actionPlanItems.map((a) => ({
      title: a.title,
      reason: a.reason,
      expected_impact: a.expected_impact,
      source: a.source,
    })),
    seo_items: seoItems.map((s) => ({
      title: s.title,
      current_status: s.current_status,
      recommendation: s.recommendation,
      source: s.source,
    })),
    benchmark_items: benchmarkItems.map((b) => ({
      title: b.title,
      current_score: b.current_score,
      benchmark_score: b.benchmark_score,
      status_label: b.status_label,
      source: b.source,
    })),
  };

  const { data: insertRow, error: insertError } = await supabaseAdmin
    .from("guest_reports")
    .insert({
      stripe_session_id: stripeSessionId,
      channel_url: trimmed || channelUrl,
      channel_title: (channelTitle.trim() || channel.channel_title) ?? "",
      report_data: reportData as unknown as Record<string, unknown>,
      pdf_url: null,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertError || !insertRow) {
    return {
      ok: false,
      error: insertError?.message ?? "Failed to save guest report",
    };
  }

  const reportId = insertRow.id;

  try {
    const pdfBytes = await generateStrategyPdf(reportData);
    const fileName = `${reportId}.pdf`;
    const pdfBuffer = Buffer.from(pdfBytes);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("guest-reports")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) {
      await supabaseAdmin
        .from("guest_reports")
        .update({ pdf_url: null })
        .eq("id", reportId);
      return {
        ok: false,
        error: `PDF upload failed: ${uploadError.message}`,
      };
    }

    const { error: updateError } = await supabaseAdmin
      .from("guest_reports")
      .update({ pdf_url: fileName })
      .eq("id", reportId);

    if (updateError) {
      return {
        ok: false,
        error: `PDF URL update failed: ${updateError.message}`,
      };
    }
  } catch (pdfErr) {
    const msg =
      pdfErr instanceof Error ? pdfErr.message : "PDF generation failed";
    return { ok: false, error: msg };
  }

  return { ok: true, reportId };
}
