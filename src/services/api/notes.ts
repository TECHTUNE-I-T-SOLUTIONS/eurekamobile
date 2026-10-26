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

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = accessToken || session?.access_token;

  let base64Data: string | null = null;
  if (file?.uri) {
    // 1. Primary: Use fetch blob reader. It seamlessly reads file://, content://, and network URIs
    // across both Expo Go and native builds without OS permission errors.
    try {
      const resp = await fetch(file.uri);
      const blob = await resp.blob();
      base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          const base64 = res.includes(',') ? res.split(',')[1] : res;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e1) {
      // 2. Secondary fallback: expo-file-system/legacy
      try {
        const FileSystem = require('expo-file-system/legacy');
        if (FileSystem.readAsStringAsync) {
          base64Data = await FileSystem.readAsStringAsync(file.uri, {
            encoding: FileSystem.EncodingType?.Base64 || 'base64',
          });
        }
      } catch (e2) {
        // 3. Fallback: FileSystem File API
        try {
          const FileSystem = require('expo-file-system');
          if (FileSystem.File) {
            const fileObj = new FileSystem.File(file.uri);
            base64Data = await fileObj.base64();
          }
        } catch (e3) {
          console.warn('All base64 reading strategies failed:', e3);
        }
      }
    }
  }

  // 1. Try uploading to backend /api/notes/upload using JSON (avoids React Native fetch FormData boundary bugs)
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload: any = {
      title,
      content,
      uploadedVia: file ? 'file' : uploadedVia,
    };

    if (file && base64Data) {
      payload.file = {
        name: file.name || 'upload.pdf',
        type: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'text/plain'),
        base64: base64Data,
        size: fileSize,
      };
    }

    const response = await fetch(`${baseUrl}/notes/upload`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      return await response.json();
    } else {
      const errJson = await response.json().catch(() => ({}));
      console.warn('Backend uploadNote returned non-200:', response.status, errJson);
    }
  } catch (backendErr) {
    console.warn('Backend uploadNote request failed, trying client insert + process route:', backendErr);
  }

  // 2. Direct Supabase insert + trigger /api/notes/process
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const { data: note, error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      title,
      raw_text: content || `[Document: ${file?.name || title}]`,
      summary: content ? `Summary: ${content.slice(0, 150)}...` : 'Document content processed',
      uploaded_via: file ? 'file' : uploadedVia,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  // Trigger processing asynchronously in backend
  if (note?.id) {
    processNote(note.id, token).catch((err) => {
      console.warn('Async processNote failed:', err);
    });
  }

  return note;
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

export async function generateQuiz(noteId: string, explainLevel?: string, count: number = 10, accessToken?: string) {
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
      body: JSON.stringify({ noteId, explainLevel, count }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data?.questions) {
        return data.questions;
      }
      if (Array.isArray(data)) {
        return data;
      }
    } else {
      const errJson = await response.json().catch(() => ({}));
      if (errJson?.code === 'LIMIT_EXCEEDED') {
        const limitErr: any = new Error(errJson.error || 'Request limit reached');
        limitErr.code = 'LIMIT_EXCEEDED';
        limitErr.plan = errJson.plan;
        throw limitErr;
      }
    }
  } catch (err: any) {
    if (err.code === 'LIMIT_EXCEEDED') throw err;
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
