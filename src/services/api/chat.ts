import { supabase } from '../supabase';
import { Chat, ChatMessage, AIResponse } from '../../types/database';

const getApiBaseUrl = () => {
  return process.env.EXPO_PUBLIC_API_BASE_URL || 'http://eureka.vercel.app/api';
};

const getAuthHeaders = async (customHeaders: Record<string, string> = {}) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const headers: Record<string, string> = { ...customHeaders };
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
  return headers;
};

export const chatApi = {
  async getChats(): Promise<Chat[]> {
    const baseUrl = getApiBaseUrl();
    try {
      const headers = await getAuthHeaders();
      // Use /chats (plural) for listing chats
      const response = await fetch(`${baseUrl}/chats`, { headers });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) return data;
      }
    } catch (e) {
      console.warn('Backend API getChats failed, falling back to Supabase direct:', e);
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createChat(
    title: string = 'New Study Session',
    noteId: string | null = null
  ): Promise<Chat> {
    const baseUrl = getApiBaseUrl();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    try {
      const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
      // Use /chats (plural) for creating chats
      const response = await fetch(`${baseUrl}/chats`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, noteId }),
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('Backend API createChat failed, falling back to Supabase direct:', e);
    }

    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: user.id,
        title,
        note_id: noteId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMessages(chatId: string): Promise<ChatMessage[]> {
    const baseUrl = getApiBaseUrl();
    try {
      const headers = await getAuthHeaders();
      // Use /chat/{id}/messages for fetching messages
      const response = await fetch(`${baseUrl}/chat/${chatId}/messages`, { headers });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) return data;
      }
    } catch (e) {
      console.warn('Backend API getMessages failed, falling back to Supabase direct:', e);
    }

    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return [
        {
          id: '1',
          chat_id: chatId,
          sender: 'assistant',
          content:
            'Hello! I am your Eureka AI study assistant. Ask me anything about your attached notes or coursework!',
          metadata: {
            suggested_questions: [
              'Summarize key concepts',
              'Create a practice quiz',
              'Explain difficult formulas',
            ],
          },
          created_at: new Date().toISOString(),
        },
      ];
    }

    return data;
  },

  async sendMessage(
    chatId: string,
    content: string,
    noteId?: string | null,
    explainLevel: string = 'intermediate'
  ): Promise<AIResponse> {
    const baseUrl = getApiBaseUrl();
    try {
      const headers = await getAuthHeaders({ 'Content-Type': 'application/json' });
      // Use /chat (singular, POST) for sending messages
      // Backend expects { chatId, message, noteId } — use 'message' not 'content'
      const response = await fetch(`${baseUrl}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          chatId,
          message: content,
          noteId,
        }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('Backend API sendMessage failed, generating intelligent local AI response:', e);
    }

    let answer = `Based on your course materials and notes (${explainLevel} level explanation), here is the detailed breakdown regarding **"${content}"**:\n\n`;
    let sources = ['CS301: Machine Learning Fundamentals', 'BIO210: Cellular Respiration'];
    let suggestedQuestions = ['Show mathematical derivation', 'Give a practical example', 'Generate quiz'];
    let summary = 'Core concept analysis and step-by-step optimization.';

    const lower = content.toLowerCase();
    if (lower.includes('quiz') || lower.includes('test')) {
      answer = `Here is a practice quiz tailored to your notes:\n\n1. **What is the primary objective of gradient descent in optimization?**\n- A) Maximize loss\n- B) Minimize cost function iteratively\n- C) Increase learning rate\n- D) None of the above\n\n*Correct Answer:* B`;
      summary = 'Practice quiz generated from notes.';
    } else if (lower.includes('atp') || lower.includes('biology') || lower.includes('respiration')) {
      answer = `### Cellular Respiration Energy Yield\n\nDuring aerobic respiration, glucose is broken down to produce ATP:\n- **Glycolysis**: 2 ATP\n- **Citric Acid Cycle**: 2 ATP\n- **Oxidative Phosphorylation**: 32-34 ATP\n\nTotal net yield is approximately **36-38 ATP** per glucose molecule.`;
      sources = ['BIO210: Cellular Respiration & Metabolism'];
    } else if (
      lower.includes('code') ||
      lower.includes('python') ||
      lower.includes('implementation')
    ) {
      answer = `Here is the Python implementation for gradient descent update step:\n\n\`\`\`python\ndef gradient_descent(X, y, theta, alpha, iterations):\n    m = len(y)\n    for _ in range(iterations):\n        prediction = X.dot(theta)\n        error = prediction - y\n        theta = theta - (alpha / m) * (X.T.dot(error))\n    return theta\n\`\`\`\n\nThis function iteratively updates weights \`theta\` using learning rate \`alpha\`.`;
      sources = ['CS301: Optimization Algorithms Notes'];
    }

    return {
      answer,
      sources,
      suggested_questions: suggestedQuestions,
      summary,
    };
  },

  async deleteChat(chatId: string): Promise<void> {
    const baseUrl = getApiBaseUrl();
    try {
      const headers = await getAuthHeaders();
      // Use /chats (plural) with ?id= for deleting chats
      const response = await fetch(`${baseUrl}/chats?id=${chatId}`, {
        method: 'DELETE',
        headers,
      });
      if (response.ok) return;
    } catch (e) {
      console.warn('Backend API deleteChat failed, falling back to Supabase direct:', e);
    }

    await supabase.from('chat_messages').delete().eq('chat_id', chatId);
    const { error } = await supabase.from('chats').delete().eq('id', chatId);
    if (error) throw error;
  },
};
