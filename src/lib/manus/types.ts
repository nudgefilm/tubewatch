export type ManusReportStatus = "pending" | "processing" | "completed" | "failed";

export type ManusReportRow = {
  id: string;
  user_id: string;
  user_channel_id: string;
  snapshot_id: string;
  year_month: string;
  manus_task_id: string | null;
  manus_project_id: string | null;
  status: ManusReportStatus;
  access_token: string;
  result_json: ManusReportJson | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

// ---------- Manus 출력 JSON 스키마 (v1.2 확정본) ----------

export type SignalStatus = "good" | "warn" | "bad";
export type TrendType = "up" | "down" | "neutral";
export type TaskPriority = "URGENT" | "HIGH" | "NORMAL";

export type ManusReportJson = {
  channel_info: {
    name: string;
    description: string;
    created_date: string;
    total_videos: number;
    subscribers: number;
    analysis_date: string;
  };
  section1_scorecard: {
    channel_score: number;
    grade: string;
    grade_label: string;
    metrics: Array<{ label: string; value: string; sub_label: string }>;
  };
  section2_growth_metrics: Array<{
    id: number;
    title: string;
    status: string;
    status_type: TrendType;
    value: string;
    label: string;
    diagnosis: string;
  }>;
  section3_data_signals: {
    content: Array<{ id: string; label: string; value: string; status: SignalStatus }>;
    performance: Array<{ id: string; label: string; value: string; status: SignalStatus }>;
    identity: Array<{ id: string; label: string; value: string; status: SignalStatus }>;
  };
  section4_channel_patterns: Array<{
    id: string;
    title: string;
    pattern: string;
    interpretation: string;
  }>;
  section5_channel_dna: {
    core_identity: string;
    positioning: string;
    strengths: Array<{ id: string; title: string; description: string }>;
    weaknesses: Array<{ id: string; title: string; description: string }>;
  };
  section6_content_plans: Array<{
    id: number;
    titles: Array<{ type: string; title: string }>;
    intent: string;
    structure: string[];
    target_response: string;
    tags: string[];
    audience_reaction: {
      interest: number;
      shareability: number;
      engagement: number;
      informativeness: number;
    };
  }>;
  section7_action_plan: {
    month: string;
    weeks: Array<{
      week: number;
      title: string;
      tasks: Array<{ title: string; priority: TaskPriority }>;
    }>;
    success_criteria: Array<{ label: string; current: string; target: string }>;
  };
};

// ---------- Manus API 응답 타입 ----------

export type ManusProjectCreateResponse = {
  id: string;
  name: string;
};

export type ManusTaskCreateResponse = {
  task_id: string;
};

export type ManusMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  created_at?: string;
};

export type ManusTaskMessagesResponse = {
  messages: ManusMessage[];
};

export type ManusWebhookPayload = {
  event: string;
  task_id: string;
  status?: string;
};
