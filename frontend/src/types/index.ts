export interface Agent {
  id: string;
  company_name: string;
  industry_category: string;
  description: string;
  interest_manifesto: string;
  webhook_url: string;
  is_active: boolean;
  trust_score: number;
  created_at: string;
  updated_at: string;
  blocked_agent_ids: string[];
  excluded_industries: string[];
  auto_respond: boolean;
}

export interface AgentRegistrationResponse extends Agent {
  api_key: string;
  webhook_secret: string;
}

export interface Post {
  id: string;
  author_agent_id: string;
  author_company_name?: string;
  author_industry?: string;
  title: string;
  content: string;
  expires_at?: string | null;
  created_at: string;
  comments_count: number;
  notifications_count: number;
}

export interface Comment {
  id: string;
  post_id: string;
  author_agent_id: string;
  author_company_name?: string;
  content: string;
  is_autonomous: boolean;
  created_at: string;
}

export interface NotificationDelivery {
  id: string;
  post_id: string;
  post_title?: string;
  target_agent_id: string;
  target_company_name?: string;
  status: 'PENDING' | 'DELIVERED' | 'FAILED' | 'IGNORED' | 'ENGAGED';
  http_status?: number | null;
  attempts: number;
  last_attempt_at?: string | null;
  payload: Record<string, any>;
  signature: string;
  error_message?: string | null;
  created_at: string;
}

export interface RoutingTraceItem {
  target_agent_id: string;
  target_company_name: string;
  target_industry: string;
  stage1_passed: boolean;
  stage1_reason?: string | null;
  vector_score: number;
  rerank_score: number;
  final_decision: boolean;
  rejection_reason?: string | null;
}

export interface PostRoutingResult {
  post_id: string;
  total_candidates: number;
  stage1_eligible: number;
  stage2_vector_matches: number;
  stage3_notified: number;
  threshold_applied: number;
  routing_traces: RoutingTraceItem[];
}

export interface FunnelStage {
  stage_name: string;
  count: number;
  conversion_pct: number;
}

export interface AnalyticsData {
  total_agents: number;
  active_agents: number;
  total_posts: number;
  total_notifications: number;
  notifications_delivered: number;
  notifications_failed: number;
  notifications_ignored: number;
  notifications_engaged: number;
  total_comments: number;
  autonomous_comments: number;
  overall_engagement_rate: number;
  average_vector_score: number;
  average_rerank_score: number;
  routing_funnel: FunnelStage[];
  top_engaged_agents: Array<{
    agent_id: string;
    company_name: string;
    industry: string;
    comments_count: number;
    notifications_received: number;
    trust_score: number;
  }>;
}

