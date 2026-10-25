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

export const paymentsApi = {
  async initializePayment(
    plan: 'pro' | 'premium',
    email?: string
  ): Promise<{ authorization_url: string; reference: string }> {
    const baseUrl = getApiBaseUrl();
    const headers = await getAuthHeaders();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const userEmail = email || user?.email || 'student@example.com';

    const response = await fetch(`${baseUrl}/payments/initialize`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        plan,
        email: userEmail,
        callback_url: 'https://standard.paystack.co/close',
      }),
    });

    const data = await response.json();
    if (!response.ok || !data.status) {
      throw new Error(data.error || 'Failed to initialize payment');
    }

    return {
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    };
  },

  async verifyPayment(reference: string): Promise<{ success: boolean; plan: 'free' | 'pro' | 'premium' }> {
    const baseUrl = getApiBaseUrl();
    const headers = await getAuthHeaders();

    const response = await fetch(`${baseUrl}/payments/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reference }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Payment verification failed');
    }

    return {
      success: data.success,
      plan: data.plan || 'pro',
    };
  },
};
