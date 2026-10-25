import { supabase } from '../supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://eureka.vercel.app/api';

export const authApi = {
  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    resetUrl: string,
    expiresAt: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/email/password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, resetUrl, expiresAt }),
      });
      if (response.ok) {
        return await response.json();
      }
      const data = await response.json();
      return { success: false, error: data.error || 'Failed to send password reset email' };
    } catch (e: any) {
      console.warn('Backend password reset email failed:', e);
      return { success: false, error: e?.message || 'Network error' };
    }
  },

  async sendOtpEmail(
    email: string,
    fullName: string,
    code: string,
    purpose: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/email/otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, code, purpose }),
      });
      if (response.ok) {
        return await response.json();
      }
      const data = await response.json();
      return { success: false, error: data.error || 'Failed to send OTP email' };
    } catch (e: any) {
      console.warn('Backend OTP email failed:', e);
      return { success: false, error: e?.message || 'Network error' };
    }
  },
};
