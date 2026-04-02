export type NormalizedVideo = {
    videoId: string;
    title: string;
    description: string;
    publishedAt: string | null;
    thumbnail: string | null;
  
    viewCount: number;
    likeCount: number;
    commentCount: number;
  
    durationSeconds: number;
    tags: string[];
    categoryId: string | null;
  
    titleLength: number;
    descriptionLength: number;
    tagCount: number;
  
    daysSincePublished: number | null;
    viewsPerDay: number;
    engagementRate: number;
  };
  
  export type NormalizedChannel = {
    youtubeChannelId: string;
    title: string;
    description: string;
    publishedAt: string | null;
  
    subscriberCount: number;
    videoCount: number;
    viewCount: number;
  
    channelAgeDays: number | null;
  };
  
  export type NormalizedChannelDataset = {
    channel: NormalizedChannel;
    videos: NormalizedVideo[];
    collectedVideoCount: number;
  };
  
  export type ChannelFeatureMap = {
    // Channel Activity
    uploadFrequency30d: number;
    avgPublishingGapDays: number;
    recentUploadRatio: number;
    consistencyScore: number;
    activeDaysRatio: number;
    shortsRatio: number;
  
    // Audience Response
    avgViews: number;
    medianViews: number;
    avgLikes: number;
    avgComments: number;
    avgEngagementRate: number;
    engagementConsistency: number;
  
    // Content Structure
    avgTitleLength: number;
    avgDescriptionLength: number;
    avgTagCount: number;
    categoryConcentration: number;
    titleFormatConsistency: number;
    seriesContentRatio: number;
  
    // SEO Optimization
    keywordTitleRatio: number;
    keywordDescriptionRatio: number;
    tagUsageRatio: number;
    metadataCompleteness: number;
    searchableTitleRatio: number;
    categoryUsageRatio: number;
  
    // Growth Momentum
    recentViewsPerDayAvg: number;
    olderViewsPerDayAvg: number;
    momentumLift: number;
    topVideoDependence: number;
    viewDistributionBalance: number;
    breakoutVideoRatio: number;

    // Subscription Conversion
    highEngagementVideoRatio: number;
    commentToLikeRatio: number;
  };
  
  export type FeatureScoreItem = {
    key: string;
    score: number; // 0~100
    label: "low" | "mid" | "high";
    value: number;
  };
  
  export type FeatureScoreResult = {
    totalScore: number;
    sectionScores: {
      channelActivity: number;
      audienceResponse: number;
      contentStructure: number;
      seoOptimization: number;
      growthMomentum: number;
      subscriptionConversion: number;
    };
    items: FeatureScoreItem[];
  };

  export type ChannelMetrics = {
    avgViewCount: number;
    medianViewCount: number;
    avgLikeRatio: number;
    avgCommentRatio: number;
    avgVideoDuration: number;
    avgUploadIntervalDays: number;
    recent30dUploadCount: number;
    avgTitleLength: number;
    avgTagCount: number;
  };

  export type ChannelPatternFlag =
    | "low_upload_frequency"
    | "irregular_upload_interval"
    | "short_video_dominant"
    | "long_video_dominant"
    | "high_view_variance"
    | "repeated_topic_pattern"
    | "low_tag_usage";

  export type ChannelPatterns = {
    flags: ChannelPatternFlag[];
    details: Record<ChannelPatternFlag, boolean>;
  };

  export type AnalysisContextScores = {
    totalScore: number;
    channelActivityScore: number;
    contentStructureScore: number;
    seoScore: number;
    audienceResponseScore: number;
    growthPotentialScore: number;
  };

  export type ChannelSizeTier = "micro" | "small" | "medium" | "large";

  export type InterpretationMode =
    | "early_stage_signal_based"
    | "growth_stage_pattern_based"
    | "scale_stage_optimization";

  export type ConfidenceLevel = "low" | "medium" | "high";

  export type AnalysisContextConfidence = {
    confidenceScore: number;
    confidenceLevel: ConfidenceLevel;
    confidenceReasons: string[];
  };

  export type AnalysisContext = {
    metrics: ChannelMetrics;
    patterns: ChannelPatterns;
    scores: AnalysisContextScores;
    channelSizeTier: ChannelSizeTier;
    interpretationMode: InterpretationMode;
    interpretationHints: string[];
    confidence: AnalysisContextConfidence;
  };