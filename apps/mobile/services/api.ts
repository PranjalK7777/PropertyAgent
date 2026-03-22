import { createClient } from '@supabase/supabase-js';
import { Conversation, DailyDigest, Message, PropertyConfig, TodayStats } from '@property-agent/types';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = await getAuthHeader();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options.headers as Record<string, string>),
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error ${response.status}: ${error}`);
  }

  return response.json();
}

export const api = {
  // Property
  getProperty: () => request<PropertyConfig>('/property'),
  updateProperty: (data: Partial<PropertyConfig>) =>
    request<PropertyConfig>('/property', { method: 'PUT', body: JSON.stringify(data) }),

  // Conversations
  getConversations: (params?: { leadScore?: string; needsHumanReview?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.leadScore) qs.set('leadScore', params.leadScore);
    if (params?.needsHumanReview != null) qs.set('needsHumanReview', String(params.needsHumanReview));
    return request<Conversation[]>(`/conversations?${qs}`);
  },
  getConversation: (id: string) =>
    request<{ messages: Message[] }>(`/conversations/${id}`),
  updateConversation: (id: string, data: Partial<Conversation>) =>
    request<Conversation>(`/conversations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  replyToConversation: (id: string, message: string) =>
    request<{ success: boolean }>(`/conversations/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  // Stats
  getTodayStats: () => request<TodayStats>('/stats/today'),

  // Digests
  getDigests: () => request<DailyDigest[]>('/digests'),
  triggerDigest: () => request<{ success: boolean }>('/digest/trigger', { method: 'POST' }),

  // Photos
  uploadPhoto: async (uri: string, filename: string, mimeType: string, label: string, order: number): Promise<PropertyConfig> => {
    const authHeaders = await getAuthHeader();
    const formData = new FormData();
    formData.append('file', { uri, name: filename, type: mimeType } as any);
    formData.append('label', label);
    formData.append('order', String(order));

    const response = await fetch(`${API_URL}/property/photos`, {
      method: 'POST',
      headers: { ...authHeaders },
      body: formData,
    });
    if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
    const { property } = await response.json();
    return property;
  },
  deletePhoto: (key: string) =>
    request<{ property: PropertyConfig }>(`/property/photos/${encodeURIComponent(key)}`, { method: 'DELETE' })
      .then((r) => r.property),

  registerPushToken: (token: string, platform: 'ios' | 'android') =>
    request<{ success: boolean }>('/push/register', {
      method: 'POST',
      body: JSON.stringify({ token, platform }),
    }),
};
