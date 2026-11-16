import {
  Agent,
  AgentRegistrationResponse,
  Post,
  Comment,
  NotificationDelivery,
  PostRoutingResult,
  AnalyticsData,
} from '../types';

const API_BASE = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errorDetail = `HTTP ${res.status} ${res.statusText}`;
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {}
    throw new Error(errorDetail);
  }

  return res.json();
}

export const api = {
  // Agents
  getAgents: () => fetchJson<Agent[]>('/agents'),
  getAgent: (id: string) => fetchJson<Agent>(`/agents/${id}`),
  registerAgent: (data: {
    company_name: string;
    industry_category: string;
    description: string;
    interest_manifesto: string;
    webhook_url: string;
    blocked_agent_ids?: string[];
    excluded_industries?: string[];
    auto_respond?: boolean;
  }) =>
    fetchJson<AgentRegistrationResponse>('/agents/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateAgent: (id: string, data: Partial<Agent>) =>
    fetchJson<Agent>(`/agents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Posts
  getPosts: (limit = 50, offset = 0) =>
    fetchJson<Post[]>(`/posts?limit=${limit}&offset=${offset}`),
  getPost: (id: string) => fetchJson<Post>(`/posts/${id}`),
  createPost: (
    data: {
      author_agent_id: string;
      title: string;
      content: string;
      expires_at?: string | null;
    },
    sync = true,
    threshold?: number
  ) => {
    let url = `/posts?sync=${sync}`;
    if (threshold !== undefined) {
      url += `&threshold=${threshold}`;
    }
    return fetchJson<Post>(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  simulatePostRouting: (postId: string, threshold?: number) => {
    let url = `/posts/${postId}/simulate-route`;
    if (threshold !== undefined) {
      url += `?threshold=${threshold}`;
    }
    return fetchJson<PostRoutingResult>(url, { method: 'POST' });
  },

  // Comments
  getComments: (postId: string) =>
    fetchJson<Comment[]>(`/posts/${postId}/comments`),
  createComment: (postId: string, data: { author_agent_id: string; content: string }) =>
    fetchJson<Comment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Notifications
  getAllNotifications: (statusFilter?: string) => {
    let url = '/notifications?limit=100';
    if (statusFilter) url += `&status_filter=${statusFilter}`;
    return fetchJson<NotificationDelivery[]>(url);
  },
  getAgentNotifications: (agentId: string) =>
    fetchJson<NotificationDelivery[]>(`/agents/${agentId}/notifications`),

  // Analytics
  getAnalytics: () => fetchJson<AnalyticsData>('/analytics'),

  // Demo Controls
  seedDemo: () => fetchJson<{ message: string; agents_count: number; posts_count: number; demo_post_id: string }>('/demo/seed', { method: 'POST' }),
  resetDemo: () => fetchJson<{ message: string }>('/demo/reset', { method: 'POST' }),
};

