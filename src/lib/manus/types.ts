// ---------- Manus 실제 출력 JSON 스키마 ----------

export type ScoreBreakdownItem = {
  grade: string;
  score: number;
  comment?: string;
};

export type ManusReportJson = {
  channel_info?: {
    channel_name?: string;
    channel_description?: string;
    email?: string;
    channel_url?: string;
    founded?: string;
    subscribers?: number;
    total_videos?: number;
    total_views?: number;
    analysis_date?: string;
  };

  section1_scorecard?: {
    grade?: string;
    overall_score?: number;
    strengths?: string[];
    weaknesses?: string[];
    score_breakdown?: {
      growth_velocity?: ScoreBreakdownItem;
      niche_authority?: ScoreBreakdownItem;
      viral_potential?: ScoreBreakdownItem;
      upload_regularity?: ScoreBreakdownItem;
      engagement_quality?: ScoreBreakdownItem;
      content_consistency?: ScoreBreakdownItem;
      [key: string]: ScoreBreakdownItem | undefined;
    };
  };

  section2_growth_metrics?: {
    growth_trend?: {
      trend_comment?: string;
      growth_rate_pct?: number;
      recent_10_avg_views?: number;
      previous_10_avg_views?: number;
      monthly_upload_last_30d?: number;
    };
    top10_videos?: Array<{
      rank?: number;
      title?: string;
      views?: number;
      date?: string;
    }>;
    view_statistics?: {
      average_views?: number;
      median_views?: number;
      max_views?: { title?: string; views?: number; date?: string };
      min_views?: { title?: string; views?: number; date?: string };
      total_views_50_videos?: number;
    };
    view_distribution?: {
      over_500k?: number;
      under_50k?: number;
      viral_ratio_pct?: number;
      above_average_ratio_pct?: number;
    };
    engagement_metrics?: {
      avg_like_rate?: number;
      avg_comment_rate?: number;
      avg_likes_per_video?: number;
      avg_comments_per_video?: number;
    };
    subscriber_efficiency?: {
      view_to_subscriber_ratio_pct?: number;
      comment?: string;
    };
  };

  section3_data_signals?: {
    high_performance_patterns?: Array<{
      pattern?: string;
      avg_views?: number;
      description?: string;
      insight?: string;
    }>;
    low_performance_patterns?: Array<{
      pattern?: string;
      avg_views?: number;
      description?: string;
      insight?: string;
    }>;
    keyword_analysis?: {
      high_ctr_keywords?: string[];
      topic_performance?: Record<string, {
        avg_views?: number;
        share_pct?: number;
        video_count?: number;
      }>;
    };
    title_pattern_analysis?: {
      avg_title_length?: number;
      optimal_title_length?: string;
      effective_structures?: string[];
      hashtag_usage?: {
        avg_tags?: number;
        effective_tags?: string;
      };
    };
  };

  section4_channel_patterns?: {
    upload_patterns?: {
      avg_upload_interval_days?: number;
      recent_30d_uploads?: number;
      upload_consistency?: string;
      optimal_upload_frequency?: string;
      peak_upload_period?: string;
    };
    audience_behavior?: {
      viral_trigger?: string;
      comment_driver?: string;
      engagement_peak_content?: string;
    };
    content_evolution?: {
      phase1?: { theme?: string; period?: string; description?: string; avg_views_estimate?: number };
      phase2?: { theme?: string; period?: string; description?: string; avg_views_estimate?: number };
      phase3?: { theme?: string; period?: string; description?: string; avg_views_estimate?: number };
      phase4?: { theme?: string; period?: string; description?: string; avg_views_estimate?: number };
      phase5?: { theme?: string; period?: string; description?: string; avg_views_estimate?: number };
      [key: string]: { theme?: string; period?: string; description?: string; avg_views_estimate?: number } | undefined;
    };
    series_performance?: Record<string, {
      name?: string;
      status?: string;
      avg_views?: number;
      video_count?: number;
      peak_video?: string;
    }>;
    thumbnail_and_title_patterns?: {
      effective_title_formulas?: string[];
      effective_thumbnail_elements?: string[];
    };
    pattern_actions?: Array<{
      rank: number;
      name: string;
      immediate_action: string;
      weekly_action: string;
    }>;
  };

  section5_channel_dna?: {
    core_identity?: string;
    brand_keywords?: string[];
    content_pillars?: Array<{
      pillar?: string;
      description?: string;
      avg_performance?: string;
      contribution_pct?: number;
    }>;
    creator_persona?: {
      character?: string;
      storytelling_style?: string;
      relationship_with_audience?: string;
    };
    target_audience?: {
      primary?: string;
      secondary?: string;
      tertiary?: string;
    };
    unique_value_proposition?: string;
    competitive_differentiation?: string;
  };

  section6_content_plans?: {
    series_concepts?: Array<{
      series_name?: string;
      concept?: string;
      episode_count?: number;
      target_views_per_episode?: string;
      content_calendar?: string;
    }>;
    immediate_opportunities?: Array<{
      title?: string;
      concept?: string;
      format?: string;
      rationale?: string;
      priority?: number;
      title_formula?: string;
      structure_flow?: string[];
      expected_views?: string;
    }>;
    short_form_strategy?: {
      posting_frequency?: string;
      hashtag_strategy?: string;
      recommended_formats?: string[];
    };
  };

  section7_action_plan?: {
    immediate_actions?: {
      tasks?: Array<{
        task?: string;
        detail?: string;
        priority?: string;
        expected_impact?: string;
      }>;
      timeframe?: string;
    };
    short_term_plan?: {
      tasks?: Array<{
        task?: string;
        detail?: string;
        priority?: string;
        expected_impact?: string;
      }>;
      timeframe?: string;
    };
    long_term_plan?: {
      tasks?: Array<{
        task?: string;
        detail?: string;
        kpi?: string;
        priority?: string;
        timeline?: string;
      }>;
      timeframe?: string;
    };
    kpi_targets?: {
      "1_month"?: { subscribers?: number; upload_count?: number; avg_views_per_video?: number };
      "3_months"?: { subscribers?: number; upload_count?: number; avg_views_per_video?: number };
      "6_months"?: { subscribers?: number; upload_count?: number; avg_views_per_video?: number };
      "12_months"?: { subscribers?: number; upload_count?: number; avg_views_per_video?: number };
    };
    risk_management?: Array<{
      risk?: string;
      mitigation?: string;
      probability?: string;
    }>;
  };
};

