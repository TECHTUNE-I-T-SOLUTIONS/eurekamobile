import { supabase } from '../supabase';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://eureka.vercel.app/api';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
  return headers;
}

export interface LectureSession {
  id: string;
  user_id: string;
  note_id: string | null;
  title: string;
  explanation_level: 'beginner' | 'intermediate' | 'advanced';
  created_at: string;
  updated_at?: string;
  message_count?: number;
}

export interface LectureMessage {
  id: string;
  lecture_id: string;
  sender: 'user' | 'assistant';
  content: string;
  metadata?: any;
  created_at: string;
}

export const lecturesApi = {
  // Get or create a lecture session for this note + level combination
  async getOrCreateSession(noteId: string | null, title: string, explanationLevel: string): Promise<string> {
    const headers = await getAuthHeaders();
    try {
      const res = await fetch(`${API_BASE_URL}/lectures`, { headers });
      if (res.ok) {
        const lectures = await res.json();
        // Look for the most recent existing lecture for this note
        const existing = lectures.find((l: any) => {
          if (noteId) {
            return l.note_id === noteId;
          }
          return !l.note_id && l.explanation_level === explanationLevel;
        });
        if (existing?.id) return existing.id;
      }
    } catch (e) {
      console.warn('Error fetching existing lectures:', e);
    }

    return this.createSession(noteId, title, explanationLevel);
  },

  // Explicitly create a new session
  async createSession(noteId: string | null, title: string, explanationLevel: string): Promise<string> {
    const headers = await getAuthHeaders();
    const createRes = await fetch(`${API_BASE_URL}/lectures`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        noteId: noteId || null,
        title: title || 'Lecture Session',
        explanationLevel: explanationLevel || 'intermediate',
      }),
    });
    if (createRes.ok) {
      const lecture = await createRes.json();
      return lecture.id;
    }
    throw new Error('Failed to create lecture session');
  },

  async getLectures(): Promise<LectureSession[]> {
    const headers = await getAuthHeaders();
    try {
      const res = await fetch(`${API_BASE_URL}/lectures`, { headers });
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      console.warn('Failed to fetch lectures:', e);
      return [];
    }
  },

  async getMessages(lectureId: string): Promise<LectureMessage[]> {
    const headers = await getAuthHeaders();
    try {
      const res = await fetch(`${API_BASE_URL}/lectures/${lectureId}/messages`, { headers });
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      console.warn('Failed to fetch lecture messages:', e);
      return [];
    }
  },

  async deleteLecture(lectureId: string): Promise<boolean> {
    const headers = await getAuthHeaders();
    try {
      const res = await fetch(`${API_BASE_URL}/lectures?id=${lectureId}`, {
        method: 'DELETE',
        headers,
      });
      return res.ok;
    } catch (e) {
      console.warn('Failed to delete lecture:', e);
      return false;
    }
  },
};
