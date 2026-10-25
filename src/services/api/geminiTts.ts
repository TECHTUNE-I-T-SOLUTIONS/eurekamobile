import { supabase } from '../supabase';

// Split text into TTS-friendly segments (~900 chars each at paragraph/sentence boundaries)
export function splitIntoTtsSegments(text: string, maxChars = 900): string[] {
  const clean = sanitizeForSpeech(text);
  if (clean.length <= maxChars) return [clean];

  // Try to split at paragraph boundaries first
  const paragraphs = clean.split(/\n{2,}/);
  const segments: string[] = [];
  let current = '';
  for (const para of paragraphs) {
    if (!para.trim()) continue;
    if ((current + '\n\n' + para).length > maxChars && current) {
      segments.push(current.trim());
      current = para;
    } else {
      current = current ? current + '\n\n' + para : para;
    }
  }
  if (current.trim()) segments.push(current.trim());

  // If any segment is still too long, split at sentence boundaries
  const result: string[] = [];
  for (const seg of segments) {
    if (seg.length <= maxChars) { result.push(seg); continue; }
    const sentences = seg.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [seg];
    let cur = '';
    for (const s of sentences) {
      if ((cur + s).length > maxChars && cur) { result.push(cur.trim()); cur = s; }
      else cur += s;
    }
    if (cur.trim()) result.push(cur.trim());
  }
  return result.filter(s => s.length > 0);
}

const GEMINI_DIRECT_MODELS = [
  'gemini-3.8-live',
  'gemini-3.8-live-extended-thinking',
  'gemini-3.1-flash-live-preview',
  'gemini-3.8-flash-lite-tts',
  'gemini-3.8-flash-tts',
  'gemini-3.1-flash-tts-preview',
  'gemini-2.5-flash-preview-tts',
];

const VALID_VOICES = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'];

function sanitizeForSpeech(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/[-:]{3,}/g, ' ')
    .replace(/\\\(|\\\)|\\\[|\\\]|\$/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchGeminiSpeechAudio(
  text: string,
  voicePreference?: string,
  apiBaseUrl?: string
): Promise<string | null> {
  const directApiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const baseUrl = apiBaseUrl || process.env.EXPO_PUBLIC_API_BASE_URL || 'https://eureka.vercel.app/api';

  // Map user preference to valid Gemini voice
  let voiceName = 'Puck';
  if (voicePreference && VALID_VOICES.includes(voicePreference)) {
    voiceName = voicePreference;
  } else if (voicePreference === 'male') {
    voiceName = 'Charon';
  } else if (voicePreference === 'female') {
    voiceName = 'Kore';
  }

  let cleanSpeech = sanitizeForSpeech(text);
  // Cap to 1100 chars for rapid sub-2s generation
  if (cleanSpeech.length > 1100) {
    cleanSpeech = cleanSpeech.slice(0, 1050) + '...';
  }

  // 1. Direct from mobile device to Google AI Studio (Fastest, zero server overhead)
  if (directApiKey) {
    for (const model of GEMINI_DIRECT_MODELS) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${directApiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: cleanSpeech }] }],
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName },
                },
              },
            },
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const inlineData = json.candidates?.[0]?.content?.parts?.[0]?.inlineData;
          if (inlineData?.data) {
            const mimeType = inlineData.mimeType || 'audio/wav';
            return `data:${mimeType};base64,${inlineData.data}`;
          }
        }
      } catch (directErr) {
        // Try next fallback model
      }
    }
  }

  // 2. Fallback: Request via Eureka Next.js Backend
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const res = await fetch(`${baseUrl}/lecturer/tts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        text: cleanSpeech,
        voice: voiceName,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.audio) {
        return data.audio;
      }
    }
  } catch (backendErr) {
    console.warn('Backend TTS relay fallback error:', backendErr);
  }

  return null;
}
