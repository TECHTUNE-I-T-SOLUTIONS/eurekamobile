export interface User {
  id: string;
  email: string;
  user_metadata?: {
    display_name?: string;
  };
}

export interface UserSettings {
  id: string;
  display_name: string | null;
  explain_level: 'beginner' | 'intermediate' | 'advanced';
  study_preferences: Record<string, unknown>;
  notify_on_new_chunks: boolean;
  push_enabled: boolean;
  email_notifications: boolean;
  theme: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  raw_text: string;
  summary: string | null;
  uploaded_via: 'text' | 'file' | 'paste';
  status: 'pending' | 'processing' | 'completed' | 'error';
  created_at: string;
  updated_at: string;
  chunk_count?: number;
}

export interface Chunk {
  id: string;
  note_id: string;
  chunk_index: number;
  chunk_text: string;
  chunk_hash: string;
  embedding: number[] | null;
  created_at: string;
}

export interface Chat {
  id: string;
  user_id: string;
  title: string;
  note_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender: 'user' | 'assistant';
  content: string;
  metadata?: {
    sources?: string[];
    suggested_questions?: string[];
    summary?: string;
  };
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'chunks_processed' | 'note_ready' | 'system' | 'info';
  title: string;
  message: string;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface Job {
  id: string;
  user_id: string;
  type: 'chunk_embed' | 'summarize' | 'export';
  status: 'pending' | 'processing' | 'completed' | 'error';
  payload: Record<string, unknown>;
  result: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIResponse {
  answer: string;
  sources: string[];
  suggested_questions: string[];
  summary: string;
}
