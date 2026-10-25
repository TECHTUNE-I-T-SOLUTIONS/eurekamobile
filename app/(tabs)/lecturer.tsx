import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { audioPlayer } from '../../src/services/audioPlayer';
import { notesApi } from '../../src/services/api/notes';
import { lecturesApi, LectureSession, LectureMessage } from '../../src/services/api/lectures';
import { CustomAlert, AlertButton } from '../../src/components/ui/CustomAlert';
import { MarkdownText } from '../../src/components/ui/MarkdownText';
import { GeminiAudioPlayer, GeminiAudioBridgeHandle } from '../../src/components/audio/GeminiAudioPlayer';
import { fetchGeminiSpeechAudio, splitIntoTtsSegments } from '../../src/services/api/geminiTts';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/context/ThemeContext';
import { useAppStore } from '../../src/store/useAppStore';
import { Note } from '../../src/types/database';
import { supabase } from '../../src/services/supabase';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Mic,
  Volume2,
  VolumeX,
  BookOpen,
  Check,
  X,
  Send,
  Sliders,
  ChevronDown,
  History,
  Sparkles,
  MessageSquare,
  ArrowLeft,
  Trash2,
  Plus,
  RefreshCw,
} from 'lucide-react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://eureka.vercel.app/api';

type LecturerState = 'idle' | 'listening' | 'processing' | 'speaking';

interface TranscriptItem {
  id: string;
  sender: 'user' | 'lecturer';
  text: string;
  timestamp: string;
}

export default function LecturerScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    explanationLevel,
    setExplanationLevel,
    speechSpeed,
    setSpeechSpeed,
    selectedVoice,
    setSelectedVoice,
    notes,
    setNotes,
  } = useAppStore();

  const [selectedNote, setSelectedNote] = useState<Note | null>(
    notes.length > 0 ? notes[0] : null
  );
  const [isFetchingNotes, setIsFetchingNotes] = useState(false);

  // Custom Alert configuration
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: 'success' | 'warning' | 'error' | 'info' | 'upgrade' | 'confirm';
    buttons?: AlertButton[];
  }>({
    visible: false,
    title: '',
  });

  const showAlert = (
    title: string,
    message?: string,
    type: 'success' | 'warning' | 'error' | 'info' | 'upgrade' | 'confirm' = 'info',
    buttons?: AlertButton[]
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      buttons: buttons || [{ text: 'OK', style: 'primary' }],
    });
  };

  const loadUserNotes = useCallback(async () => {
    try {
      setIsFetchingNotes(true);
      const data = await notesApi.getNotes();
      if (Array.isArray(data) && data.length > 0) {
        setNotes(data);
        setSelectedNote((current) => current || data[0]);
      }
    } catch (e) {
      console.warn('Failed to load notes in lecturer:', e);
    } finally {
      setIsFetchingNotes(false);
    }
  }, [setNotes]);

  useEffect(() => {
    loadUserNotes();
  }, [loadUserNotes]);

  useEffect(() => {
    if (!selectedNote && notes.length > 0) {
      setSelectedNote(notes[0]);
    }
  }, [notes, selectedNote]);

  // Modals visibility state
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [isAudioModalVisible, setIsAudioModalVisible] = useState(false);
  const [isLevelModalVisible, setIsLevelModalVisible] = useState(false);
  const [isHistoryModalVisible, setIsHistoryModalVisible] = useState(false);

  const [lecturerState, setLecturerState] = useState<LecturerState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Lecture session persistence & history
  const [currentLectureId, setCurrentLectureId] = useState<string | null>(null);
  const [pastLectures, setPastLectures] = useState<LectureSession[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyTab, setHistoryTab] = useState<'current' | 'all'>('current');

  // Live ChatGPT-style Voice Interaction Modal
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const [voiceQueryText, setVoiceQueryText] = useState('');
  const [isListeningActive, setIsListeningActive] = useState(false);
  const voiceInputRef = useRef<any>(null);

  // Auto-focus input when Voice Modal opens so native OS keyboard with STT mic appears
  useEffect(() => {
    if (isVoiceModalVisible) {
      const timer = setTimeout(() => {
        voiceInputRef.current?.focus();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isVoiceModalVisible]);

  // Refs to avoid stale closure bugs in async callbacks
  const lastSpokenTextRef = useRef<string>('');
  const isPausedRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const lecturerStateRef = useRef<LecturerState>('idle');
  const segmentsRef = useRef<string[]>([]);
  const currentSegmentIdxRef = useRef<number>(0);
  const audioBridgeRef = useRef<GeminiAudioBridgeHandle>(null);

  // Keep refs in sync with state
  const setLecturerStateSync = (state: LecturerState) => {
    lecturerStateRef.current = state;
    setLecturerState(state);
  };

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Load existing lecture session and history for a given note
  const loadLectureSessionForNote = useCallback(async (note: Note | null) => {
    try {
      setIsLoadingHistory(true);
      const lectures = await lecturesApi.getLectures();
      setPastLectures(lectures);

      const target = lectures.find((l) =>
        note ? l.note_id === note.id : !l.note_id
      );

      if (target) {
        setCurrentLectureId(target.id);
        const msgs = await lecturesApi.getMessages(target.id);
        if (msgs.length > 0) {
          const mapped: TranscriptItem[] = msgs.map((m) => ({
            id: m.id,
            sender: m.sender === 'user' ? 'user' : 'lecturer',
            text: m.content,
            timestamp: new Date(m.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            }),
          }));
          setTranscript(mapped.reverse());
          const lastLecturer = mapped.find((m) => m.sender === 'lecturer');
          if (lastLecturer) {
            lastSpokenTextRef.current = lastLecturer.text;
          }
          return;
        }
      }

      // If no past messages found, show initial greeting
      setCurrentLectureId(null);
      setTranscript([
        {
          id: 'welcome-' + Date.now(),
          sender: 'lecturer',
          text: note
            ? `Welcome to your Live AI Voice Lecture on "${note.title}". I am ready at the ${explanationLevel.toUpperCase()} level. Tap Play or ask a question to begin!`
            : `Welcome to Eureka AI Live Lecturer! Select a study note to load course context and start an interactive voice lecture.`,
          timestamp: 'Just now',
        },
      ]);
    } catch (e) {
      console.warn('Failed to load lecture history:', e);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [explanationLevel]);

  useEffect(() => {
    if (selectedNote) {
      loadLectureSessionForNote(selectedNote);
    }
  }, [selectedNote, loadLectureSessionForNote]);

  // Ensure a lecture session exists (lazy initialization on first question)
  const ensureLectureSession = async (): Promise<string | null> => {
    if (currentLectureId) return currentLectureId;
    try {
      const title = selectedNote
        ? `Lecture: ${selectedNote.title}`
        : 'Lecture Session';
      const id = await lecturesApi.getOrCreateSession(
        selectedNote?.id ?? null,
        title,
        explanationLevel
      );
      setCurrentLectureId(id);
      return id;
    } catch (e) {
      console.warn('Failed to create lecture session:', e);
      return null;
    }
  };

  useEffect(() => {
    return () => {
      audioPlayer.stop().catch(() => {});
    };
  }, []);

  // Initial welcome transcript
  const [transcript, setTranscript] = useState<TranscriptItem[]>([
    {
      id: '1',
      sender: 'lecturer',
      text: selectedNote
        ? `Welcome to your Live AI Voice Lecture on "${selectedNote.title}". I am ready at the ${explanationLevel.toUpperCase()} level. Tap Play or ask a question to begin!`
        : `Welcome to Eureka AI Live Lecturer! Select a study note to load course context and start an interactive voice lecture.`,
      timestamp: 'Just now',
    },
  ]);

  // Waveform Pulse & Equalizer Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const bar1 = useRef(new Animated.Value(12)).current;
  const bar2 = useRef(new Animated.Value(22)).current;
  const bar3 = useRef(new Animated.Value(16)).current;
  const bar4 = useRef(new Animated.Value(28)).current;
  const bar5 = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    if (
      lecturerState === 'speaking' ||
      lecturerState === 'listening' ||
      lecturerState === 'processing'
    ) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.16,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 650,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      const createBarAnim = (
        anim: Animated.Value,
        max: number,
        min: number,
        duration: number
      ) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, { toValue: max, duration, useNativeDriver: false }),
            Animated.timing(anim, { toValue: min, duration, useNativeDriver: false }),
          ])
        );

      const a1 = createBarAnim(bar1, 38, 8, 300);
      const a2 = createBarAnim(bar2, 48, 12, 400);
      const a3 = createBarAnim(bar3, 42, 10, 350);
      const a4 = createBarAnim(bar4, 52, 14, 450);
      const a5 = createBarAnim(bar5, 36, 6, 320);

      a1.start();
      a2.start();
      a3.start();
      a4.start();
      a5.start();
    } else {
      pulseAnim.setValue(1);
      bar1.setValue(12);
      bar2.setValue(16);
      bar3.setValue(20);
      bar4.setValue(14);
      bar5.setValue(10);
    }
  }, [lecturerState]);

  const speakTextSegmented = async (text: string) => {
    if (isMutedRef.current || !text || !text.trim()) return;
    lastSpokenTextRef.current = text;
    isPausedRef.current = false;
    setIsPaused(false);
    setLecturerStateSync('speaking');

    const segments = splitIntoTtsSegments(text, 800);
    segmentsRef.current = segments;
    currentSegmentIdxRef.current = 0;

    const playNextSegment = async () => {
      if (isPausedRef.current) return;
      const idx = currentSegmentIdxRef.current;
      if (idx >= segmentsRef.current.length) {
        setLecturerStateSync('idle');
        setIsPaused(false);
        return;
      }

      const seg = segmentsRef.current[idx];
      currentSegmentIdxRef.current = idx + 1;

      let audioUrl: string | null = null;
      try {
        audioUrl = await fetchGeminiSpeechAudio(seg, selectedVoice, API_BASE_URL);
      } catch (err) {
        console.warn('TTS segment audio fetch error:', err);
      }

      if (isPausedRef.current) return;

      await audioPlayer.play(seg, audioUrl, speechSpeed, {
        onStart: () => {
          setLecturerStateSync('speaking');
        },
        onDone: () => {
          if (!isPausedRef.current) {
            playNextSegment();
          }
        },
        onError: () => {
          if (!isPausedRef.current) {
            playNextSegment();
          }
        },
      });
    };

    await playNextSegment();
  };

  const handlePauseResume = async () => {
    try {
      const currentState = lecturerStateRef.current;
      if (currentState === 'speaking' && !isPausedRef.current) {
        isPausedRef.current = true;
        setIsPaused(true);
        await audioPlayer.pause();
      } else if (isPausedRef.current) {
        isPausedRef.current = false;
        setIsPaused(false);
        setLecturerStateSync('speaking');
        await audioPlayer.resume();
      } else if (lastSpokenTextRef.current) {
        await speakTextSegmented(lastSpokenTextRef.current);
      } else {
        handleTogglePlay();
      }
    } catch (e) {
      console.warn('Pause/Resume error:', e);
      setLecturerStateSync('idle');
      setIsPaused(false);
    }
  };

  const handleStop = async () => {
    try {
      isPausedRef.current = false;
      setIsPaused(false);
      segmentsRef.current = [];
      currentSegmentIdxRef.current = 0;
      await audioPlayer.stop();
    } catch (e) {
      console.warn('Audio stop error:', e);
    }
    setLecturerStateSync('idle');
  };

  const handleRepeat = () => {
    const lastLecturerMsg = transcript.find((t) => t.sender === 'lecturer');
    if (lastLecturerMsg) {
      speakTextSegmented(lastLecturerMsg.text);
    } else if (lastSpokenTextRef.current) {
      speakTextSegmented(lastSpokenTextRef.current);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    isMutedRef.current = nextMuted;
    if (nextMuted) {
      handleStop();
    }
  };

  const handleFetchLecturerResponse = async (questionText: string) => {
    setIsLoading(true);
    setLecturerStateSync('processing');
    await handleStop();

    try {
      // Ensure lecture session in DB so exchanges are persisted
      let lectureId = currentLectureId;
      if (!lectureId) {
        const title = selectedNote ? `Lecture: ${selectedNote.title}` : 'Live Voice Lecture';
        lectureId = await lecturesApi.createSession(
          selectedNote?.id ?? null,
          title,
          explanationLevel
        );
        setCurrentLectureId(lectureId);
      }

      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${API_BASE_URL}/lecturer/ask`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: questionText,
          noteId: selectedNote?.id,
          noteContext: selectedNote?.raw_text || selectedNote?.summary || '',
          explanationLevel,
          lectureId,
        }),
      });

      if (response.status === 403) {
        const errorData = await response.json();
        setLecturerStateSync('idle');
        setIsLoading(false);
        showAlert(
          'Usage Limit Reached',
          errorData.error ||
            'You have reached the request limit for this study note. Upgrade your plan for unlimited AI access!',
          'upgrade',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Upgrade Plan',
              style: 'primary',
              onPress: () => router.push('/subscription'),
            },
          ]
        );
        return;
      }

      const data = await response.json();
      setIsLoading(false);

      if (data.answer) {
        const newItem: TranscriptItem = {
          id: 'l-' + Date.now(),
          sender: 'lecturer',
          text: data.answer,
          timestamp: 'Just now',
        };

        setTranscript((prev) => [newItem, ...prev]);
        await speakTextSegmented(data.answer);
      } else {
        throw new Error('No answer returned');
      }
    } catch (error) {
      console.warn('Lecturer API fallback to offline mode:', error);
      setIsLoading(false);

      const fallbackText = selectedNote
        ? `Here is the ${explanationLevel} breakdown for "${selectedNote.title}": ${
            selectedNote.summary ||
            selectedNote.raw_text?.slice(0, 300) ||
            'Core principles explain structured data representation and processing.'
          }`
        : `To make the most of Eureka AI Live Lecturer, please select a study note from your library.`;

      const fallbackItem: TranscriptItem = {
        id: 'l-fb-' + Date.now(),
        sender: 'lecturer',
        text: fallbackText,
        timestamp: 'Just now',
      };

      setTranscript((prev) => [fallbackItem, ...prev]);
      await speakTextSegmented(fallbackText);
    }
  };

  const handleStartNewLecture = async () => {
    try {
      await handleStop();
      const title = selectedNote ? `Lecture: ${selectedNote.title}` : 'Live Voice Lecture';
      const id = await lecturesApi.createSession(
        selectedNote?.id ?? null,
        title,
        explanationLevel
      );
      setCurrentLectureId(id);
      setTranscript([
        {
          id: 'welcome-' + Date.now(),
          sender: 'lecturer',
          text: selectedNote
            ? `Started a new lecture session on "${selectedNote.title}". I'm ready at ${explanationLevel.toUpperCase()} level. Ask me anything!`
            : `Started a fresh Eureka AI Live Lecture session. Ready when you are!`,
          timestamp: 'Just now',
        },
      ]);
      showAlert('New Lecture Started', 'A fresh lecture session has been created.', 'success');
      // Refresh past lectures list
      const list = await lecturesApi.getLectures();
      setPastLectures(list);
    } catch (e) {
      console.warn('Failed to start new lecture:', e);
      showAlert('Error', 'Could not create new lecture session.', 'error');
    }
  };

  const handleSelectPastLecture = async (lecture: LectureSession) => {
    try {
      await handleStop();
      setCurrentLectureId(lecture.id);
      setIsHistoryModalVisible(false);

      // Find matching note if present
      if (lecture.note_id) {
        const foundNote = notes.find((n) => n.id === lecture.note_id);
        if (foundNote) {
          setSelectedNote(foundNote);
        }
      }

      // Load messages
      const msgs = await lecturesApi.getMessages(lecture.id);
      if (msgs.length > 0) {
        const mapped: TranscriptItem[] = msgs.map((m) => ({
          id: m.id,
          sender: m.sender === 'user' ? 'user' : 'lecturer',
          text: m.content,
          timestamp: new Date(m.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }));
        setTranscript(mapped.reverse());
        const lastLecturer = mapped.find((m) => m.sender === 'lecturer');
        if (lastLecturer) {
          lastSpokenTextRef.current = lastLecturer.text;
        }
      } else {
        setTranscript([
          {
            id: 'resume-' + Date.now(),
            sender: 'lecturer',
            text: `Resumed lecture session: "${lecture.title}". Ask a question to continue!`,
            timestamp: 'Just now',
          },
        ]);
      }
    } catch (e) {
      console.warn('Failed to load past lecture:', e);
    }
  };

  const handleDeleteLecture = async (lectureId: string) => {
    try {
      const ok = await lecturesApi.deleteLecture(lectureId);
      if (ok) {
        setPastLectures((prev) => prev.filter((l) => l.id !== lectureId));
        if (currentLectureId === lectureId) {
          setCurrentLectureId(null);
        }
      }
    } catch (e) {
      console.warn('Failed to delete lecture:', e);
    }
  };

  const handleOpenVoiceInput = async () => {
    // Pause any active AI speech so user can speak freely
    if (lecturerStateRef.current === 'speaking') {
      await audioPlayer.pause();
      isPausedRef.current = true;
      setIsPaused(true);
    }
    setVoiceQueryText('');
    setIsListeningActive(true);
    setIsVoiceModalVisible(true);
    audioBridgeRef.current?.startListening?.();
  };

  const handleSendVoiceQuery = (queryToSend?: string) => {
    const q = queryToSend || voiceQueryText.trim();
    if (!q) return;
    setIsVoiceModalVisible(false);
    setIsListeningActive(false);
    audioBridgeRef.current?.stopListening?.();

    const userMsg: TranscriptItem = {
      id: 'u-' + Date.now(),
      sender: 'user',
      text: q,
      timestamp: 'Just now',
    };

    setTranscript((prev) => [userMsg, ...prev]);
    handleFetchLecturerResponse(q);
  };

  const handleSendQuestion = () => {
    if (!inputQuery.trim()) return;
    const query = inputQuery.trim();
    setInputQuery('');

    const userMsg: TranscriptItem = {
      id: 'u-' + Date.now(),
      sender: 'user',
      text: query,
      timestamp: 'Just now',
    };

    setTranscript((prev) => [userMsg, ...prev]);
    handleFetchLecturerResponse(query);
  };

  const handleTogglePlay = () => {
    if (lecturerState === 'speaking') {
      handlePauseResume();
    } else {
      const topicTitle = selectedNote ? selectedNote.title : 'Study Note Overview';
      const prompt = `Can you explain the main concepts of ${topicTitle}?`;
      handleFetchLecturerResponse(prompt);
    }
  };

  const handleBack = () => {
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    } catch (e) {
      router.replace('/(tabs)');
    }
  };

  const levelIcons = {
    beginner: '🌱',
    intermediate: '🚀',
    advanced: '🧠',
  };

  const latestLecturerMsg = transcript.find((t) => t.sender === 'lecturer');

  return (
    <ScreenWrapper>
      <View style={[styles.screenContainer, { backgroundColor: theme.colors.background }]}>
        {/* Top Floating Overlay Controls Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.topFloatingBar}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={handleBack}
            style={[
              styles.floatingBackBtn,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
            ]}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={18} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          {/* 1. Select Note Context Button */}
          <TouchableOpacity
            onPress={() => setIsNoteModalVisible(true)}
            style={[
              styles.floatingPillBtn,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
            ]}
            activeOpacity={0.8}
          >
            <BookOpen size={15} color={theme.colors.secondary} />
            <Text style={[styles.floatingPillText, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {selectedNote ? selectedNote.title : 'Select Context'}
            </Text>
            <ChevronDown size={14} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          {/* 2. Audio Settings Button */}
          <TouchableOpacity
            onPress={() => setIsAudioModalVisible(true)}
            style={[
              styles.floatingIconBtn,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
            ]}
            activeOpacity={0.8}
          >
            <Sliders size={15} color={theme.colors.secondary} />
            <Text style={[styles.floatingBtnLabel, { color: theme.colors.textPrimary }]}>{speechSpeed}x</Text>
          </TouchableOpacity>

          {/* 3. Explanation Level Chip */}
          <TouchableOpacity
            onPress={() => setIsLevelModalVisible(true)}
            style={[
              styles.floatingLevelChip,
              { backgroundColor: theme.colors.secondaryLight, borderColor: theme.colors.secondary },
            ]}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 12 }}>{levelIcons[explanationLevel]}</Text>
            <Text style={[styles.floatingLevelText, { color: theme.colors.secondary }]}>
              {explanationLevel.toUpperCase()}
            </Text>
          </TouchableOpacity>

          {/* 4. Transcript & History Modal Toggle Overlay Button */}
          <TouchableOpacity
            onPress={() => setIsHistoryModalVisible(true)}
            style={[
              styles.floatingHistoryBtn,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.secondary },
            ]}
            activeOpacity={0.8}
          >
            <History size={15} color={theme.colors.secondary} />
            <Text style={[styles.floatingBtnLabel, { color: theme.colors.textPrimary }]}>Transcript 📜</Text>
            {transcript.length > 0 && (
              <View style={[styles.badgeCount, { backgroundColor: theme.colors.secondary }]}>
                <Text style={styles.badgeCountText}>{transcript.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Central Immersive Animated Interface */}
        <ScrollView
          contentContainerStyle={styles.mainScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Orb & Equalizer Visualization Card */}
          <Card
            style={[
              styles.heroOrbCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
            ]}
          >
            {/* Status Indicator Badge */}
            <View style={[styles.statusRow, { backgroundColor: theme.colors.surfaceVariant }]}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      lecturerState === 'speaking'
                        ? '#34D399'
                        : lecturerState === 'listening'
                        ? '#F59E0B'
                        : lecturerState === 'processing'
                        ? theme.colors.secondary
                        : theme.colors.textSecondary,
                  },
                ]}
              />
              <Text style={[styles.statusText, { color: theme.colors.textPrimary }]}>
                {lecturerState.toUpperCase()}
              </Text>
            </View>

            {/* Glowing Orb Visualization */}
            <View style={styles.orbWrapper}>
              <Animated.View
                style={[
                  styles.soundRingOuter,
                  {
                    transform: [{ scale: pulseAnim }],
                    backgroundColor:
                      lecturerState === 'speaking'
                        ? 'rgba(52, 211, 153, 0.18)'
                        : lecturerState === 'listening'
                        ? 'rgba(245, 158, 11, 0.18)'
                        : 'rgba(37, 99, 235, 0.15)',
                  },
                ]}
              >
                <View
                  style={[
                    styles.soundRingInner,
                    {
                      backgroundColor:
                        lecturerState === 'speaking'
                          ? 'rgba(52, 211, 153, 0.35)'
                          : lecturerState === 'listening'
                          ? 'rgba(245, 158, 11, 0.35)'
                          : 'rgba(37, 99, 235, 0.28)',
                    },
                  ]}
                >
                  <TouchableOpacity
                    onPress={handleTogglePlay}
                    disabled={isLoading}
                    style={[
                      styles.playMainButton,
                      {
                        backgroundColor:
                          lecturerState === 'speaking' ? '#059669' : theme.colors.secondary,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFF" size="large" />
                    ) : lecturerState === 'speaking' && !isPaused ? (
                      <Pause size={32} color="#FFFFFF" />
                    ) : (
                      <Play size={32} color="#FFFFFF" style={{ marginLeft: 3 }} />
                    )}
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Eureka Logo Badge Overlay */}
              <View
                style={[
                  styles.orbLogoOverlay,
                  { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.secondary },
                ]}
              >
                <Image
                  source={require('../../assets/logo.png')}
                  style={{ width: 16, height: 16 }}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Equalizer Waveform Bars */}
            <View style={styles.equalizerRow}>
              {[bar1, bar2, bar3, bar4, bar5].map((bar, i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.equalizerBar,
                    {
                      height: bar,
                      backgroundColor:
                        lecturerState === 'speaking'
                          ? '#34D399'
                          : lecturerState === 'processing'
                          ? theme.colors.secondary
                          : theme.colors.textSecondary,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Title & Context */}
            <Text
              style={[
                theme.typography.h2,
                { color: theme.colors.textPrimary, textAlign: 'center', marginTop: 2, fontSize: 18 },
              ]}
              numberOfLines={1}
            >
              {selectedNote ? selectedNote.title : 'Eureka AI Voice Lecturer'}
            </Text>

            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' },
              ]}
            >
              Live AI Voice • Level: {explanationLevel.toUpperCase()}
            </Text>

            {/* DYNAMIC AUDIO CONTROLS BAR */}
            {lecturerState === 'speaking' || lecturerState === 'processing' || isPaused ? (
              <View style={styles.controlsBar}>
                <TouchableOpacity
                  onPress={handlePauseResume}
                  style={[styles.controlBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                  activeOpacity={0.8}
                >
                  {isPaused ? (
                    <Play size={16} color="#34D399" />
                  ) : (
                    <Pause size={16} color="#F59E0B" />
                  )}
                  <Text style={[styles.controlText, { color: theme.colors.textPrimary }]}>
                    {isPaused ? 'Resume' : 'Pause'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleStop}
                  style={[styles.controlBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                  activeOpacity={0.8}
                >
                  <Square size={15} color="#EF4444" />
                  <Text style={[styles.controlText, { color: theme.colors.textPrimary }]}>Stop</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRepeat}
                  style={[styles.controlBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                  activeOpacity={0.8}
                >
                  <RotateCcw size={15} color={theme.colors.secondary} />
                  <Text style={[styles.controlText, { color: theme.colors.textPrimary }]}>Repeat</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleToggleMute}
                  style={[styles.controlBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                  activeOpacity={0.8}
                >
                  {isMuted ? (
                    <VolumeX size={16} color="#EF4444" />
                  ) : (
                    <Volume2 size={16} color="#34D399" />
                  )}
                  <Text style={[styles.controlText, { color: theme.colors.textPrimary }]}>
                    {isMuted ? 'Muted' : 'Mute'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.controlsBar}>
                <TouchableOpacity
                  onPress={handleTogglePlay}
                  style={[styles.controlBtn, { backgroundColor: theme.colors.secondary, flex: 1.2 }]}
                  activeOpacity={0.8}
                >
                  <Play size={16} color="#FFFFFF" />
                  <Text style={[styles.controlText, { color: '#FFFFFF', fontWeight: '700' }]}>
                    Start
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleOpenVoiceInput}
                  style={[styles.controlBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                  activeOpacity={0.8}
                >
                  <Mic size={16} color="#F59E0B" />
                  <Text style={[styles.controlText, { color: theme.colors.textPrimary }]}>Speak</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleToggleMute}
                  style={[styles.controlBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                  activeOpacity={0.8}
                >
                  {isMuted ? (
                    <VolumeX size={16} color="#EF4444" />
                  ) : (
                    <Volume2 size={16} color="#34D399" />
                  )}
                  <Text style={[styles.controlText, { color: theme.colors.textPrimary }]}>
                    {isMuted ? 'Muted' : 'Mute'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setIsHistoryModalVisible(true)}
                  style={[styles.controlBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                  activeOpacity={0.8}
                >
                  <History size={16} color={theme.colors.secondary} />
                  <Text style={[styles.controlText, { color: theme.colors.textPrimary }]}>History</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>

          {/* Live Lecturer Response Card */}
          {latestLecturerMsg && (
            <Card
              style={[
                styles.liveCaptionCard,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
              ]}
            >
              <View style={styles.captionHeaderRow}>
                <View
                  style={[styles.avatarChipSmall, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.surfaceBorder, borderWidth: 1 }]}
                >
                  <Image
                    source={require('../../assets/logo.png')}
                    style={{ width: 14, height: 14 }}
                    resizeMode="contain"
                  />
                </View>
                <Text style={[styles.captionHeaderTitle, { color: theme.colors.secondary }]}>
                  Eureka AI Lecturer Response
                </Text>
                <TouchableOpacity
                  onPress={() => speakTextSegmented(latestLecturerMsg.text)}
                  style={[styles.inlineSpeakBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                >
                  <Volume2 size={14} color={theme.colors.secondary} />
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 8, maxHeight: 180, overflow: 'hidden' }}>
                <MarkdownText content={latestLecturerMsg.text} />
              </View>

              <TouchableOpacity
                onPress={() => setIsHistoryModalVisible(true)}
                style={styles.viewHistoryLink}
              >
                <MessageSquare size={14} color={theme.colors.secondary} />
                <Text style={[styles.viewHistoryLinkText, { color: theme.colors.secondary }]}>
                  View Full Transcript & History ({transcript.length}) 📜
                </Text>
              </TouchableOpacity>
            </Card>
          )}

          {/* Quick Prompt Suggestion Chips (Horizontal Scroll Above Input) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionScrollContent}
            style={styles.suggestionScroll}
          >
            {[
              'Explain key concepts',
              'Give exam summary',
              'Define key terms',
              'Practice Quiz',
              'Key Formulas',
            ].map((prompt, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => {
                  setInputQuery(prompt);
                }}
                style={[
                  styles.suggestionChip,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
                ]}
                activeOpacity={0.8}
              >
                <Sparkles size={12} color={theme.colors.secondary} />
                <Text style={[styles.suggestionText, { color: theme.colors.textSecondary }]}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Quick Question Input Row */}
          <View style={styles.inputBarRow}>
            <TextInput
              style={[
                styles.inputQueryField,
                theme.typography.body,
                {
                  backgroundColor: theme.colors.inputBackground,
                  borderColor: theme.colors.inputBorder,
                  color: theme.colors.textPrimary,
                },
              ]}
              placeholder={
                selectedNote
                  ? `Ask Eureka AI about "${selectedNote.title}"...`
                  : 'Ask Eureka AI a voice question...'
              }
              placeholderTextColor={theme.colors.textTertiary}
              value={inputQuery}
              onChangeText={setInputQuery}
              onSubmitEditing={handleSendQuestion}
            />
            <TouchableOpacity
              onPress={handleSendQuestion}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: inputQuery.trim() ? theme.colors.secondary : theme.colors.surfaceBorder,
                },
              ]}
              disabled={!inputQuery.trim() || isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" size="small" />
              ) : (
                <Send size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* MODAL 1: Select Note Context */}
        <Modal
          visible={isNoteModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsNoteModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <BookOpen size={20} color={theme.colors.secondary} />
                  <Text style={[theme.typography.h2, { color: theme.colors.textPrimary, marginLeft: 8, fontSize: 18 }]}>
                    Select Note Context
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsNoteModalVisible(false)}
                  style={[styles.closeModalBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                >
                  <X size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 340, marginVertical: 12 }}>
                {isFetchingNotes ? (
                  <View style={{ padding: 32, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={theme.colors.secondary} />
                    <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                      Loading your course notes...
                    </Text>
                  </View>
                ) : notes.length === 0 ? (
                  <View style={{ padding: 24, alignItems: 'center' }}>
                    <BookOpen size={40} color={theme.colors.secondary} style={{ marginBottom: 12, opacity: 0.7 }} />
                    <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, textAlign: 'center', marginBottom: 6 }]}>
                      No Study Notes Found
                    </Text>
                    <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 16, fontSize: 13, lineHeight: 18 }]}>
                      Upload your course materials (PDF, DOCX, TXT) to start an interactive AI voice lecture!
                    </Text>
                    <Button
                      title="Upload New Note"
                      onPress={() => {
                        setIsNoteModalVisible(false);
                        router.push('/(tabs)/notes');
                      }}
                      size="sm"
                      style={{ height: 38, paddingHorizontal: 16 }}
                    />
                  </View>
                ) : (
                  notes.map((note) => {
                    const isSelected = selectedNote?.id === note.id;
                    return (
                      <TouchableOpacity
                        key={note.id}
                        onPress={() => {
                          setSelectedNote(note);
                          setIsNoteModalVisible(false);
                        }}
                        style={[
                          styles.noteOptionItem,
                          {
                            backgroundColor: isSelected ? theme.colors.surfaceVariant : theme.colors.background,
                            borderColor: isSelected ? theme.colors.secondary : theme.colors.surfaceBorder,
                          },
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary }]}>
                            {note.title}
                          </Text>
                          {note.summary && (
                            <Text
                              style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}
                              numberOfLines={2}
                            >
                              {note.summary}
                            </Text>
                          )}
                        </View>
                        {isSelected && <Check size={20} color={theme.colors.secondary} style={{ marginLeft: 12 }} />}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button
                  title="Refresh Notes"
                  onPress={loadUserNotes}
                  variant="outline"
                  style={{ flex: 1, borderColor: theme.colors.surfaceBorder, height: 44 }}
                  textStyle={{ color: theme.colors.textSecondary }}
                />
                <Button
                  title="Close"
                  onPress={() => setIsNoteModalVisible(false)}
                  style={{ flex: 1, backgroundColor: theme.colors.secondary, height: 44 }}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* MODAL 2: Audio & Speech Settings */}
        <Modal
          visible={isAudioModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsAudioModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Sliders size={20} color={theme.colors.secondary} />
                  <Text style={[theme.typography.h2, { color: theme.colors.textPrimary, marginLeft: 8, fontSize: 18 }]}>
                    Audio & Speech Settings
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsAudioModalVisible(false)}
                  style={[styles.closeModalBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                >
                  <X size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginTop: 16 }]}>
                Lecturer Speech Speed
              </Text>

              <View style={styles.speedOptionsRow}>
                {[0.75, 1.0, 1.25, 1.5].map((spd) => {
                  const isSelected = speechSpeed === spd;
                  return (
                    <TouchableOpacity
                      key={spd}
                      onPress={() => {
                        setSpeechSpeed(spd);
                        audioPlayer.setRate(spd).catch(() => {});
                        if (lecturerState === 'speaking' && lastSpokenTextRef.current) {
                          speakTextSegmented(lastSpokenTextRef.current);
                        }
                      }}
                      style={[
                        styles.speedPill,
                        {
                          backgroundColor: isSelected ? theme.colors.secondary : theme.colors.surfaceVariant,
                          borderColor: isSelected ? theme.colors.secondary : theme.colors.surfaceBorder,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          theme.typography.bodyBold,
                          {
                            color: isSelected ? theme.colors.secondaryForeground : theme.colors.textPrimary,
                            fontSize: 13,
                          },
                        ]}
                      >
                        {spd}x
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginTop: 16 }]}>
                Gemini Studio Voice
              </Text>

              <View style={{ gap: 8, marginTop: 8, marginBottom: 16 }}>
                {[
                  { id: 'Puck', label: 'Puck (Natural & Energetic)', desc: 'Friendly, balanced tone' },
                  { id: 'Charon', label: 'Charon (Deep Academic)', desc: 'Authoritative male professor' },
                  { id: 'Kore', label: 'Kore (Clear & Crisp)', desc: 'Natural female lecturer' },
                  { id: 'Fenrir', label: 'Fenrir (Warm Storyteller)', desc: 'Resonant baritone male' },
                  { id: 'Aoede', label: 'Aoede (Expressive Female)', desc: 'Engaging, expressive' },
                ].map((v) => {
                  const isSelected =
                    selectedVoice === v.id ||
                    (selectedVoice === 'default' && v.id === 'Puck') ||
                    (selectedVoice === 'male' && v.id === 'Charon') ||
                    (selectedVoice === 'female' && v.id === 'Kore');
                  return (
                    <TouchableOpacity
                      key={v.id}
                      onPress={() => {
                        setSelectedVoice(v.id);
                        if (lecturerState === 'speaking' && lastSpokenTextRef.current) {
                          speakTextSegmented(lastSpokenTextRef.current);
                        }
                      }}
                      style={[
                        styles.voiceOptionRow,
                        {
                          backgroundColor: isSelected ? theme.colors.secondaryLight : theme.colors.surfaceVariant,
                          borderColor: isSelected ? theme.colors.secondary : theme.colors.surfaceBorder,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>{v.label}</Text>
                        <Text style={{ color: theme.colors.textSecondary, fontSize: 11, marginTop: 2 }}>{v.desc}</Text>
                      </View>
                      {isSelected && <Check size={18} color={theme.colors.secondary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Button
                title="Done"
                onPress={() => setIsAudioModalVisible(false)}
                style={{ backgroundColor: theme.colors.secondary, height: 44 }}
              />
            </View>
          </View>
        </Modal>

        {/* MODAL 3: Explanation Level Modal */}
        <Modal
          visible={isLevelModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsLevelModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
              <View style={styles.modalHeader}>
                <Text style={[theme.typography.h2, { color: theme.colors.textPrimary, fontSize: 18 }]}>
                  Select Explanation Level
                </Text>
                <TouchableOpacity
                  onPress={() => setIsLevelModalVisible(false)}
                  style={[styles.closeModalBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                >
                  <X size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={{ marginVertical: 14 }}>
                {[
                  {
                    id: 'beginner' as const,
                    label: 'Beginner 🌱',
                    desc: 'Simple analogies, basic definitions & step-by-step introductions.',
                  },
                  {
                    id: 'intermediate' as const,
                    label: 'Intermediate 🚀',
                    desc: 'Core formulas, framework concepts & balanced technical depth.',
                  },
                  {
                    id: 'advanced' as const,
                    label: 'Advanced 🧠',
                    desc: 'Rigor math proofs, architectural details & research insights.',
                  },
                ].map((lvl) => {
                  const isSelected = explanationLevel === lvl.id;
                  return (
                    <TouchableOpacity
                      key={lvl.id}
                      onPress={() => {
                        setExplanationLevel(lvl.id);
                        setIsLevelModalVisible(false);
                      }}
                      style={[
                        styles.levelModalCard,
                        {
                          backgroundColor: isSelected ? theme.colors.secondaryLight : theme.colors.surfaceVariant,
                          borderColor: isSelected ? theme.colors.secondary : theme.colors.surfaceBorder,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary }]}>
                          {lvl.label}
                        </Text>
                        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 4 }]}>
                          {lvl.desc}
                        </Text>
                      </View>
                      {isSelected && <Check size={20} color={theme.colors.secondary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Button
                title="Done"
                onPress={() => setIsLevelModalVisible(false)}
                style={{ backgroundColor: theme.colors.secondary, height: 44 }}
              />
            </View>
          </View>
        </Modal>

        {/* MODAL 4: Conversation History & Past Lectures Panel Modal */}
        <Modal
          visible={isHistoryModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setIsHistoryModalVisible(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder, maxHeight: '85%', flex: 1 }]}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <History size={20} color={theme.colors.secondary} />
                  <Text style={[theme.typography.h2, { color: theme.colors.textPrimary, marginLeft: 8, fontSize: 18 }]}>
                    Lecture History 📜
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    onPress={handleStartNewLecture}
                    style={[styles.smallActionPill, { backgroundColor: theme.colors.secondaryLight, borderColor: theme.colors.secondary }]}
                  >
                    <Plus size={14} color={theme.colors.secondary} />
                    <Text style={{ color: theme.colors.secondary, fontSize: 11, fontWeight: '700', marginLeft: 4 }}>
                      New
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setIsHistoryModalVisible(false)}
                    style={[styles.closeModalBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                  >
                    <X size={20} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Tab Selector: Current Session vs All Saved Lectures */}
              <View style={[styles.historyTabRow, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.surfaceBorder }]}>
                <TouchableOpacity
                  onPress={() => setHistoryTab('current')}
                  style={[
                    styles.historyTabBtn,
                    historyTab === 'current' && { backgroundColor: theme.colors.surface, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: historyTab === 'current' ? '700' : '500',
                      color: historyTab === 'current' ? theme.colors.textPrimary : theme.colors.textSecondary,
                    }}
                  >
                    Current Lecture ({transcript.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={async () => {
                    setHistoryTab('all');
                    try {
                      setIsLoadingHistory(true);
                      const list = await lecturesApi.getLectures();
                      setPastLectures(list);
                    } catch {}
                    setIsLoadingHistory(false);
                  }}
                  style={[
                    styles.historyTabBtn,
                    historyTab === 'all' && { backgroundColor: theme.colors.surface, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3 },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: historyTab === 'all' ? '700' : '500',
                      color: historyTab === 'all' ? theme.colors.textPrimary : theme.colors.textSecondary,
                    }}
                  >
                    All Saved ({pastLectures.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Tab 1: Current Session Transcript */}
              {historyTab === 'current' ? (
                <>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 4, marginBottom: 12 }]}>
                    {selectedNote ? `Active Context: ${selectedNote.title}` : 'Live Lecture Session'}
                  </Text>

                  <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                    {transcript.map((item) => (
                      <Card
                        key={item.id}
                        style={[
                          styles.transcriptCard,
                          {
                            backgroundColor:
                              item.sender === 'lecturer' ? theme.colors.surface : theme.colors.surfaceVariant,
                            borderColor: theme.colors.surfaceBorder,
                          },
                        ]}
                      >
                        <View style={styles.transcriptHeaderRow}>
                          {item.sender === 'lecturer' ? (
                            <View style={[styles.avatarChipSmall, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.surfaceBorder, borderWidth: 1 }]}>
                              <Image
                                source={require('../../assets/logo.png')}
                                style={{ width: 14, height: 14 }}
                                resizeMode="contain"
                              />
                            </View>
                          ) : (
                            <View style={[styles.avatarChipSmall, { backgroundColor: '#10B981' }]}>
                              <Mic size={10} color="#FFFFFF" />
                            </View>
                          )}
                          <Text
                            style={[
                              theme.typography.caption,
                              {
                                color: item.sender === 'lecturer' ? theme.colors.secondary : '#10B981',
                                fontWeight: '700',
                                marginLeft: 6,
                              },
                            ]}
                          >
                            {item.sender === 'lecturer' ? 'Eureka AI Lecturer' : 'You'}
                          </Text>
                          <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginLeft: 'auto' }]}>
                            {item.timestamp}
                          </Text>

                          {item.sender === 'lecturer' && (
                            <TouchableOpacity
                              onPress={() => speakTextSegmented(item.text)}
                              style={[styles.smallIconBtn, { backgroundColor: theme.colors.surfaceVariant, marginLeft: 8 }]}
                            >
                              <Volume2 size={14} color={theme.colors.secondary} />
                            </TouchableOpacity>
                          )}
                        </View>

                        <View style={{ marginTop: 8 }}>
                          <MarkdownText content={item.text} isUser={item.sender === 'user'} />
                        </View>
                      </Card>
                    ))}
                  </ScrollView>
                </>
              ) : (
                /* Tab 2: All Saved Lectures List from Database */
                <ScrollView style={{ flex: 1, marginTop: 10 }} showsVerticalScrollIndicator={false}>
                  {isLoadingHistory ? (
                    <View style={{ padding: 30, alignItems: 'center' }}>
                      <ActivityIndicator size="large" color={theme.colors.secondary} />
                      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 10 }]}>
                        Loading your saved lectures...
                      </Text>
                    </View>
                  ) : pastLectures.length === 0 ? (
                    <View style={{ padding: 30, alignItems: 'center' }}>
                      <History size={36} color={theme.colors.textTertiary} />
                      <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginTop: 12 }]}>
                        No Saved Lectures Yet
                      </Text>
                      <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4 }]}>
                        Every question and lecture exchange is automatically saved here for instant review!
                      </Text>
                    </View>
                  ) : (
                    pastLectures.map((lec) => {
                      const isCurrent = lec.id === currentLectureId;
                      return (
                        <Card
                          key={lec.id}
                          style={[
                            styles.pastLectureCard,
                            {
                              backgroundColor: isCurrent ? theme.colors.secondaryLight : theme.colors.surface,
                              borderColor: isCurrent ? theme.colors.secondary : theme.colors.surfaceBorder,
                            },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                              {lec.title}
                            </Text>
                            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
                              {new Date(lec.created_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })} • {lec.explanation_level.toUpperCase()}
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                            <TouchableOpacity
                              onPress={() => handleSelectPastLecture(lec)}
                              style={[
                                styles.openLectureBtn,
                                {
                                  backgroundColor: isCurrent ? theme.colors.secondary : theme.colors.surfaceVariant,
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontWeight: '700',
                                  color: isCurrent ? '#FFF' : theme.colors.textPrimary,
                                }}
                              >
                                {isCurrent ? 'Active' : 'Open'}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleDeleteLecture(lec.id)}
                              style={[styles.smallIconBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                            >
                              <Trash2 size={13} color="#EF4444" />
                            </TouchableOpacity>
                          </View>
                        </Card>
                      );
                    })
                  )}
                </ScrollView>
              )}

              <Button
                title="Close"
                onPress={() => setIsHistoryModalVisible(false)}
                variant="outline"
                style={{ borderColor: theme.colors.surfaceBorder, marginTop: 12, height: 44 }}
                textStyle={{ color: theme.colors.textPrimary }}
              />
            </View>
          </View>
        </Modal>

        {/* MODAL 5: Live ChatGPT-Style Voice Interaction Modal */}
        <Modal
          visible={isVoiceModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setIsVoiceModalVisible(false);
            setIsListeningActive(false);
            audioBridgeRef.current?.stopListening?.();
          }}
        >
          <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder, alignItems: 'center', paddingVertical: 24 }]}>
              {/* Header */}
              <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Sparkles size={18} color={theme.colors.secondary} />
                  <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginLeft: 6 }]}>
                    Live Voice Interaction
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setIsVoiceModalVisible(false);
                    setIsListeningActive(false);
                    audioBridgeRef.current?.stopListening?.();
                  }}
                  style={[styles.closeModalBtn, { backgroundColor: theme.colors.surfaceVariant }]}
                >
                  <X size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Pulsing Voice Orb - Interactive Mic Button */}
              <Animated.View
                style={[
                  styles.voiceOrbOuter,
                  {
                    transform: [{ scale: pulseAnim }],
                    backgroundColor: isListeningActive ? 'rgba(245, 158, 11, 0.2)' : 'rgba(37, 99, 235, 0.2)',
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    setIsListeningActive(true);
                    voiceInputRef.current?.focus();
                  }}
                  style={[
                    styles.voiceOrbInner,
                    {
                      backgroundColor: isListeningActive ? '#F59E0B' : theme.colors.secondary,
                    },
                  ]}
                >
                  <Mic size={36} color="#FFFFFF" />
                </TouchableOpacity>
              </Animated.View>

              <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginTop: 16, textAlign: 'center' }]}>
                {isListeningActive ? 'Listening to You...' : 'Ask Eureka AI Anything'}
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' }]}>
                {selectedNote ? `Discussing: ${selectedNote.title}` : 'Voice questions are answered with Gemini speech'}
              </Text>

              {/* Live Transcribed / Query Input Box */}
              <View style={[styles.voiceInputBox, { backgroundColor: theme.colors.inputBackground, borderColor: theme.colors.inputBorder }]}>
                <TextInput
                  ref={voiceInputRef}
                  style={[theme.typography.body, { color: theme.colors.textPrimary, flex: 1, maxHeight: 80 }]}
                  placeholder="Speak or type your question..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={voiceQueryText}
                  onChangeText={setVoiceQueryText}
                  multiline
                  onFocus={() => setIsListeningActive(true)}
                />
              </View>

              {/* Native Keyboard Mic Hint */}
              <Text style={{ color: theme.colors.textTertiary, fontSize: 11, textAlign: 'center', marginTop: 4, marginBottom: 4 }}>
                💡 Tip: Tap the 🎤 mic icon on your phone keyboard to dictate
              </Text>

              {/* Quick Prompt Chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ width: '100%', marginVertical: 8 }}
                contentContainerStyle={{ gap: 6 }}
              >
                {[
                  'Explain that with an everyday analogy',
                  'What are the core exam takeaways?',
                  'Give me a practice question',
                  'Summarize in 3 bullet points',
                ].map((chip, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      setVoiceQueryText(chip);
                    }}
                    style={[styles.voicePromptChip, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.surfaceBorder }]}
                  >
                    <Text style={{ color: theme.colors.textPrimary, fontSize: 11, fontWeight: '500' }}>
                      {chip}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', width: '100%', gap: 10, marginTop: 8 }}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setIsVoiceModalVisible(false);
                    setIsListeningActive(false);
                    audioBridgeRef.current?.stopListening?.();
                  }}
                  variant="outline"
                  style={{ flex: 1, borderColor: theme.colors.surfaceBorder }}
                  textStyle={{ color: theme.colors.textSecondary }}
                />

                <Button
                  title="Send Question"
                  onPress={() => handleSendVoiceQuery()}
                  style={{ flex: 1.5, backgroundColor: theme.colors.secondary }}
                  icon={<Send size={15} color="#FFF" />}
                />
              </View>
            </View>
          </View>
        </Modal>

        {/* Headless Gemini Studio Voice Audio Bridge */}
        <GeminiAudioPlayer
          ref={audioBridgeRef}
          onSpeechRecognized={(text) => {
            setVoiceQueryText(text);
          }}
          onSpeechEnd={() => {
            setIsListeningActive(false);
          }}
        />

        {/* Custom Alert Modal */}
        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          buttons={alertConfig.buttons}
          onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  topFloatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  floatingBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingPillBtn: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  floatingPillText: {
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 120,
  },
  floatingIconBtn: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  floatingLevelChip: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  floatingLevelText: {
    fontSize: 11,
    fontWeight: '700',
  },
  floatingHistoryBtn: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  floatingBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  badgeCount: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  badgeCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  mainScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  heroOrbCard: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  orbWrapper: {
    position: 'relative',
    marginVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  soundRingOuter: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  soundRingInner: {
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playMainButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  orbLogoOverlay: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  equalizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 48,
    marginVertical: 6,
  },
  equalizerBar: {
    width: 6,
    marginHorizontal: 3,
    borderRadius: 3,
  },
  controlsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 14,
    gap: 6,
  },
  controlBtn: {
    flex: 1,
    height: 42,
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 21,
  },
  controlText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  liveCaptionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  captionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  captionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    flex: 1,
  },
  inlineSpeakBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionBodyText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
  },
  viewHistoryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  viewHistoryLinkText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  inputQueryField: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  suggestionScroll: {
    marginTop: 12,
    marginBottom: 4,
  },
  suggestionScrollContent: {
    paddingRight: 16,
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    gap: 6,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 11,
    fontWeight: '500',
  },
  transcriptCard: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  transcriptHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarChipSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smallIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeModalBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  speedOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
    gap: 6,
  },
  speedPill: {
    flex: 1,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  voiceOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  levelModalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  smallActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  historyTabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginVertical: 10,
  },
  historyTabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  pastLectureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  openLectureBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  voiceOrbOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  voiceOrbInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  voiceInputBox: {
    width: '100%',
    minHeight: 56,
    maxHeight: 110,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  voicePromptChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
});
