import { supabase } from '../supabase';

const getApiBaseUrl = () => {
  return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://eureka.vercel.app/api';
};

const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
};

export const subscriptionApi = {
  async getSubscription(): Promise<{ plan: 'free' | 'pro' | 'premium'; status: string }> {
    const baseUrl = getApiBaseUrl();
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${baseUrl}/subscriptions`, { headers });
      if (response.ok) {
        const data = await response.json();
        return { plan: data.plan || 'free', status: data.status || 'active' };
      }
    } catch (e) {
      console.warn('Failed to fetch subscription via API, defaulting to free:', e);
    }
    return { plan: 'free', status: 'active' };
  },
};
