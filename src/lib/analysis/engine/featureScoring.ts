import type {
    ChannelFeatureMap,
    FeatureScoreItem,
    FeatureScoreResult,
  } from "./types";
  import { average, clamp } from "./utils";
  
  function toPercent(value: number): number {
    return clamp(value * 100, 0, 100);
  }
  
  function toLabel(score: number): "low" | "mid" | "high" {
    if (score >= 70) return "high";
    if (score >= 40) return "mid";
    return "low";
  }
  
  function makeItem(key: string, value: number, score: number): FeatureScoreItem {
    const safeScore = clamp(score, 0, 100);
  
    return {
      key,
      value,
      score: safeScore,
      label: toLabel(safeScore),
    };
  }
  
  export function featureScoring(
    features: ChannelFeatureMap
  ): FeatureScoreResult {
    const items: FeatureScoreItem[] = [
      makeItem("uploadFrequency30d", features.uploadFrequency30d, features.uploadFrequency30d * 12),
      makeItem("recentUploadRatio", features.recentUploadRatio, toPercent(features.recentUploadRatio)),
      makeItem("consistencyScore", features.consistencyScore, toPercent(features.consistencyScore)),
      makeItem("activeDaysRatio", features.activeDaysRatio, toPercent(features.activeDaysRatio)),
      makeItem(
        "shortsRatio",
        features.shortsRatio,
        toPercent(1 - Math.abs(features.shortsRatio - 0.3))
      ),
  
      makeItem("avgViews", features.avgViews, clamp(features.avgViews / 1000, 0, 100)),
      makeItem("medianViews", features.medianViews, clamp(features.medianViews / 1000, 0, 100)),
      makeItem("avgLikes", features.avgLikes, clamp(features.avgLikes / 100, 0, 100)),
      makeItem("avgComments", features.avgComments, clamp(features.avgComments / 20, 0, 100)),
      makeItem("avgEngagementRate", features.avgEngagementRate, clamp(features.avgEngagementRate * 10, 0, 100)),
      makeItem("engagementConsistency", features.engagementConsistency, toPercent(features.engagementConsistency)),
  
      makeItem("avgTitleLength", features.avgTitleLength, clamp(100 - Math.abs(features.avgTitleLength - 42) * 2, 0, 100)),
      makeItem("avgDescriptionLength", features.avgDescriptionLength, clamp(features.avgDescriptionLength / 30, 0, 100)),
      makeItem("avgTagCount", features.avgTagCount, clamp(features.avgTagCount * 10, 0, 100)),
      makeItem("categoryConcentration", features.categoryConcentration, toPercent(1 - features.categoryConcentration)),
      makeItem("titleFormatConsistency", features.titleFormatConsistency, toPercent(features.titleFormatConsistency)),
      makeItem("seriesContentRatio", features.seriesContentRatio, toPercent(features.seriesContentRatio)),
  
      makeItem("keywordTitleRatio", features.keywordTitleRatio, toPercent(features.keywordTitleRatio)),
      makeItem("keywordDescriptionRatio", features.keywordDescriptionRatio, toPercent(features.keywordDescriptionRatio)),
      makeItem("tagUsageRatio", features.tagUsageRatio, toPercent(features.tagUsageRatio)),
      makeItem("metadataCompleteness", features.metadataCompleteness, toPercent(features.metadataCompleteness)),
      makeItem("searchableTitleRatio", features.searchableTitleRatio, toPercent(features.searchableTitleRatio)),
      makeItem("categoryUsageRatio", features.categoryUsageRatio, toPercent(features.categoryUsageRatio)),
  
      makeItem("recentViewsPerDayAvg", features.recentViewsPerDayAvg, clamp(features.recentViewsPerDayAvg / 100, 0, 100)),
      makeItem("olderViewsPerDayAvg", features.olderViewsPerDayAvg, clamp(features.olderViewsPerDayAvg / 100, 0, 100)),
      makeItem("momentumLift", features.momentumLift, clamp(features.momentumLift * 50, 0, 100)),
      makeItem("topVideoDependence", features.topVideoDependence, toPercent(1 - features.topVideoDependence)),
      makeItem("viewDistributionBalance", features.viewDistributionBalance, toPercent(features.viewDistributionBalance)),
      makeItem("breakoutVideoRatio", features.breakoutVideoRatio, toPercent(features.breakoutVideoRatio)),
    ];
  
    const averageByKeys = (keys: string[]) => {
      const filtered = items.filter((item) => keys.includes(item.key));
      return filtered.length ? average(filtered.map((item) => item.score)) : 0;
    };
  
    const sectionScores = {
      channelActivity: averageByKeys([
        "uploadFrequency30d",
        "recentUploadRatio",
        "consistencyScore",
        "activeDaysRatio",
        "shortsRatio",
      ]),
      audienceResponse: averageByKeys([
        "avgViews",
        "medianViews",
        "avgLikes",
        "avgComments",
        "avgEngagementRate",
        "engagementConsistency",
      ]),
      contentStructure: averageByKeys([
        "avgTitleLength",
        "avgDescriptionLength",
        "avgTagCount",
        "categoryConcentration",
        "titleFormatConsistency",
        "seriesContentRatio",
      ]),
      seoOptimization: averageByKeys([
        "keywordTitleRatio",
        "keywordDescriptionRatio",
        "tagUsageRatio",
        "metadataCompleteness",
        "searchableTitleRatio",
        "categoryUsageRatio",
      ]),
      growthMomentum: averageByKeys([
        "recentViewsPerDayAvg",
        "olderViewsPerDayAvg",
        "momentumLift",
        "topVideoDependence",
        "viewDistributionBalance",
        "breakoutVideoRatio",
      ]),
    };
  
    const totalScore = average(Object.values(sectionScores));
  
    return {
      totalScore,
      sectionScores,
      items,
    };
  }