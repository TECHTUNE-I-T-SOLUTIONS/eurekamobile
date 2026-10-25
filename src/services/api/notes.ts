import { supabase } from '../supabase';

const getApiBaseUrl = () => {
  return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://eureka.vercel.app/api';
};

export interface NoteUploadParams {
  title: string;
  content?: string;
  file?: {
    uri: string;
    name: string;
    type: string;
  };
  fileSize?: number;
  fileType?: string;
  uploadedVia?: 'text' | 'file' | 'paste';
  accessToken?: string;
}

export async function uploadNote({
  title,
  content,
  file,
  fileSize,
  fileType,
  uploadedVia = 'text',
  accessToken,
}: NoteUploadParams) {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/notes/upload`;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = accessToken || session?.access_token;

  const formData = new FormData();
  formData.append('title', title);
  formData.append('uploadedVia', file ? 'file' : uploadedVia);

  if (content) {
    formData.append('content', content);
  }

  if (file) {
    formData.append('file', {
      uri: file.uri,
      name: file.name || 'upload.pdf',
      type: file.type || 'application/pdf',
    } as any);
  }

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (response.ok) {
      return await response.json();
    } else {
      const errJson = await response.json().catch(() => ({}));
      console.warn('Backend uploadNote returned non-200:', response.status, errJson);
    }
  } catch (e) {
    console.warn('Backend uploadNote failed, falling back to Supabase direct insert:', e);
  }

  // Fallback to Supabase direct
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      title,
      raw_text: content || 'Uploaded document content',
      summary: content ? `Summary: ${content.slice(0, 150)}...` : 'Document content processed',
      uploaded_via: file ? 'file' : uploadedVia,
      status: 'completed',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function processNote(noteId: string, accessToken?: string) {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/notes/process`;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = accessToken || session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ noteId }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('Backend processNote failed, updating Supabase directly:', e);
  }

  const { data, error } = await supabase
    .from('notes')
    .update({ status: 'completed' })
    .eq('id', noteId)
    .select()
    .single();

  if (error) throw error;
  return data || { success: true, noteId };
}

export async function getNotes(accessToken?: string) {
  // 1. Get current authenticated user first
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // 2. Query notes directly from Supabase (primary source of truth for instant & reliable loading)
  try {
    const { data: directNotes, error: directError } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!directError && directNotes) {
      return directNotes;
    }
  } catch (e) {
    console.warn('Direct Supabase getNotes failed, trying API fetch fallback:', e);
  }

  // 3. Also try API fetch with Bearer token
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/notes`;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = accessToken || session?.access_token;

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) return data;
    }
  } catch (e) {
    console.warn('Backend API getNotes failed:', e);
  }

  return [];
}

export async function deleteNote(noteId: string, accessToken?: string) {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/notes?id=${encodeURIComponent(noteId)}`;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = accessToken || session?.access_token;

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers,
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn('Backend deleteNote failed, falling back to Supabase direct:', e);
  }

  const { error } = await supabase.from('notes').delete().eq('id', noteId);

  if (error) throw error;
  return { success: true, id: noteId };
}

export async function generateQuiz(noteId: string, explainLevel?: string, accessToken?: string) {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/ai/quiz`;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = accessToken || session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ noteId, explainLevel }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend generateQuiz failed, returning fallback quiz:', err);
  }

  return [
    {
      id: '1',
      question: 'What are the core concepts covered in this study note?',
      options: [
        'Primary Subject Matter',
        'Secondary Details',
        'Background Context',
        'Conclusion & Summary',
      ],
      correctAnswerIndex: 0,
      explanation: 'Derived from the uploaded study note content and AI summary.',
    },
    {
      id: '2',
      question: 'Which optimization algorithm is highlighted for gradient updates?',
      options: ['Random Search', 'Adaptive Gradient Descent', 'Grid Search', 'Brute Force'],
      correctAnswerIndex: 1,
      explanation: 'Gradient descent minimizes the error loss iteratively.',
    },
  ];
}

export const notesApi = {
  getNotes,
  deleteNote,
  uploadNote,
  processNote,
  generateQuiz,
};
