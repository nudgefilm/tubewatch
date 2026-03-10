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
    };
    items: FeatureScoreItem[];
  };