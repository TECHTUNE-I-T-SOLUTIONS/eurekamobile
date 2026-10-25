import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Note, Chat, UserSettings } from '../types/database';

const ONBOARDING_KEY = 'eureka_has_completed_onboarding';
const PLAN_KEY = 'eureka_user_plan';
const VOICE_KEY = 'eureka_selected_voice';
const SPEED_KEY = 'eureka_speech_speed';
const EXPLAIN_LEVEL_KEY = 'eureka_explain_level';

export interface AppNotification {
  id: string;
  type: 'doc_processed' | 'upload_failed' | 'study_reminder' | 'lecturer';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  targetId?: string;
  payload?: Record<string, unknown>;
}

export interface AppState {
  hasCompletedOnboarding: boolean;
  isLoadingOnboarding: boolean;
  checkOnboardingStatus: () => Promise<void>;
  setHasCompletedOnboarding: (completed: boolean) => Promise<void>;

  explanationLevel: 'beginner' | 'intermediate' | 'advanced';
  setExplanationLevel: (level: 'beginner' | 'intermediate' | 'advanced') => void;

  explainLevel: 'beginner' | 'intermediate' | 'advanced';
  setExplainLevel: (level: 'beginner' | 'intermediate' | 'advanced') => void;

  speechSpeed: number;
  setSpeechSpeed: (speed: number) => void;

  userPlan: 'free' | 'pro' | 'premium';
  setUserPlan: (plan: 'free' | 'pro' | 'premium') => void;

  selectedVoice: string;
  setSelectedVoice: (voice: string) => void;

  handsFreeEnabled: boolean;
  setHandsFreeEnabled: (enabled: boolean) => void;

  userSettings: UserSettings | null;
  setUserSettings: (settings: UserSettings | null) => void;

  notes: Note[];
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  removeNote: (id: string) => void;

  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  chatsLoaded: boolean;
  setChatsLoaded: (loaded: boolean) => void;
  notesLoaded: boolean;
  setNotesLoaded: (loaded: boolean) => void;

  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;

  notifications: AppNotification[];
  notificationsLoaded: boolean;
  setNotificationsLoaded: (loaded: boolean) => void;
  setNotifications: (notifications: AppNotification[]) => void;
  addNotification: (notification: AppNotification) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
}

const getStorageItem = async (key: string): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') return await AsyncStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  } catch {
    return await AsyncStorage.getItem(key);
  }
};

const setStorageItem = async (key: string, value: string): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  } catch {
    await AsyncStorage.setItem(key, value);
  }
};

const initialNotifications: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'doc_processed',
    title: 'Document Parsed Successfully',
    message: 'Biology_Ch1_Cellular_Respiration.pdf was successfully parsed, chunked, and summarized.',
    isRead: false,
    createdAt: '10 mins ago',
  },
  {
    id: 'notif-2',
    type: 'upload_failed',
    title: 'Upload Failed',
    message: 'Failed to upload Quantum_Mechanics_Notes.docx. Network timeout. Tap to retry.',
    isRead: false,
    createdAt: '1 hour ago',
  },
  {
    id: 'notif-3',
    type: 'study_reminder',
    title: 'Daily Study Reminder',
    message: 'Time for your daily Machine Learning voice lecture session with Eureka AI!',
    isRead: true,
    createdAt: 'Yesterday',
  },
  {
    id: 'notif-4',
    type: 'lecturer',
    title: 'AI Voice Lecturer Ready',
    message: 'New adaptive explanations for Advanced Neural Networks are available.',
    isRead: true,
    createdAt: '2 days ago',
  },
];

export const useAppStore = create<AppState>()((set: any) => ({
  hasCompletedOnboarding: false,
  isLoadingOnboarding: true,

  checkOnboardingStatus: async () => {
    const value = await getStorageItem(ONBOARDING_KEY);
    const planVal = await getStorageItem(PLAN_KEY);
    const voiceVal = await getStorageItem(VOICE_KEY);
    const speedVal = await getStorageItem(SPEED_KEY);
    const levelVal = await getStorageItem(EXPLAIN_LEVEL_KEY);

    set({
      hasCompletedOnboarding: value === 'true',
      isLoadingOnboarding: false,
      userPlan: (planVal as 'free' | 'pro' | 'premium') || 'free',
      selectedVoice: voiceVal || 'Puck',
      speechSpeed: speedVal ? parseFloat(speedVal) : 1.0,
      explanationLevel: (levelVal as 'beginner' | 'intermediate' | 'advanced') || 'intermediate',
      explainLevel: (levelVal as 'beginner' | 'intermediate' | 'advanced') || 'intermediate',
    });
  },

  setHasCompletedOnboarding: async (completed: boolean) => {
    await setStorageItem(ONBOARDING_KEY, completed ? 'true' : 'false');
    set({ hasCompletedOnboarding: completed });
  },

  explanationLevel: 'intermediate',
  setExplanationLevel: async (explanationLevel: 'beginner' | 'intermediate' | 'advanced') => {
    await setStorageItem(EXPLAIN_LEVEL_KEY, explanationLevel);
    set({ explanationLevel, explainLevel: explanationLevel });
  },

  explainLevel: 'intermediate',
  setExplainLevel: async (explainLevel: 'beginner' | 'intermediate' | 'advanced') => {
    await setStorageItem(EXPLAIN_LEVEL_KEY, explainLevel);
    set({ explainLevel, explanationLevel: explainLevel });
  },

  speechSpeed: 1.0,
  setSpeechSpeed: async (speechSpeed: number) => {
    await setStorageItem(SPEED_KEY, speechSpeed.toString());
    set({ speechSpeed });
  },

  userPlan: 'free',
  setUserPlan: async (userPlan: 'free' | 'pro' | 'premium') => {
    await setStorageItem(PLAN_KEY, userPlan);
    set({ userPlan });
  },

  selectedVoice: 'Puck',
  setSelectedVoice: async (selectedVoice: string) => {
    await setStorageItem(VOICE_KEY, selectedVoice);
    set({ selectedVoice });
  },

  handsFreeEnabled: false,
  setHandsFreeEnabled: (handsFreeEnabled: boolean) => set({ handsFreeEnabled }),

  userSettings: null,
  setUserSettings: (userSettings: UserSettings | null) =>
    set({ userSettings }),

  notes: [],
  setNotes: (notes: Note[]) => set({ notes }),
  addNote: (note: Note) =>
    set((state: AppState) => ({ notes: [note, ...state.notes] })),
  removeNote: (id: string) =>
    set((state: AppState) => ({ notes: state.notes.filter((n) => n.id !== id) })),

  chats: [],
  setChats: (chats: Chat[]) => set({ chats }),
  chatsLoaded: false,
  setChatsLoaded: (chatsLoaded: boolean) => set({ chatsLoaded }),
  notesLoaded: false,
  setNotesLoaded: (notesLoaded: boolean) => set({ notesLoaded }),

  activeChatId: null,
  setActiveChatId: (activeChatId: string | null) => set({ activeChatId }),

  notifications: initialNotifications,
  notificationsLoaded: false,
  setNotificationsLoaded: (notificationsLoaded: boolean) => set({ notificationsLoaded }),
  setNotifications: (notifications: AppNotification[]) => set({ notifications }),
  addNotification: (notification: AppNotification) =>
    set((state: AppState) => ({ notifications: [notification, ...state.notifications] })),
  markNotificationAsRead: (id: string) =>
    set((state: AppState) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    })),
  markAllNotificationsAsRead: () =>
    set((state: AppState) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
