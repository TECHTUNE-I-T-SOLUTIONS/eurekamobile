import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { Input } from '../../src/components/ui/Input';
import { useTheme } from '../../src/context/ThemeContext';
import { useAppStore } from '../../src/store/useAppStore';
import { notesApi } from '../../src/services/api/notes';
import { subscriptionApi } from '../../src/services/api/subscriptions';
import { chatApi } from '../../src/services/api/chat';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BookOpen,
  GraduationCap,
  HelpCircle,
  Sparkles,
  FileText,
  MessageSquareCode,
  CheckCircle2,
  RefreshCw,
  Send,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  X,
  Zap,
} from 'lucide-react-native';
import { Note } from '../../src/types/database';

export default function NoteWorkspaceScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, userPlan, setUserPlan } = useAppStore();
  const insets = useSafeAreaInsets();

  const [note, setNote] = useState<Note | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'content' | 'chat' | 'quiz'>('summary');
  const [explainLevel, setExplainLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [showLevelModal, setShowLevelModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);
  const SUMMARY_PREVIEW_CHARS = 280;

  // Usage stats
  const requestsUsed = 12;
  const requestsLimit = 20;

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Hello! I am Eureka, your AI study assistant for this note. Ask me anything about the concepts, formulas, or key takeaways.',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (id) {
      const found = notes.find((n) => n.id === id);
      if (found) {
        setNote(found);
      } else {
        // Fallback mock note if not in store
        setNote({
          id: id as string,
          user_id: 'demo',
          title: 'Advanced Neural Network Architectures & Transformers',
          raw_text:
            'Transformers rely entirely on self-attention mechanisms, dispensing with recurrence and convolutions entirely. Multi-head attention allows the model to jointly attend to information from different representation subspaces.',
          summary:
            'Comprehensive guide to Transformer architecture, scaled dot-product attention, positional encodings, and encoder-decoder stacks.',
          uploaded_via: 'file',
          status: 'completed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          chunk_count: 12,
        });
      }
    }
  }, [id, notes]);

  const handleGenerateQuiz = async () => {
    if (!note) return;
    setQuizLoading(true);
    try {
      const questions = await notesApi.generateQuiz(note.id, explainLevel);
      setQuizQuestions(questions);
      setSelectedAnswers({});
      setQuizSubmitted(false);
    } catch (e) {
      Alert.alert('Error', 'Could not generate quiz questions.');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    const userMsg = inputMessage.trim();
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setInputMessage('');
    setChatLoading(true);

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Based on your note "${note?.title}", at the ${explainLevel} explanation level: Eureka AI notes that ${userMsg} is a foundational concept. Specifically, attention mechanisms compute weights between tokens to capture contextual dependencies.`,
        },
      ]);
      setChatLoading(false);
    }, 1000);
  };

  if (!note) {
    return (
      <ScreenWrapper>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 12 }]}>
            Loading note workspace...
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  const levelDescriptions = {
    beginner: 'Simple terms, everyday analogies & core definitions',
    intermediate: 'Core formulas, conceptual frameworks & technical details',
    advanced: 'Mathematical rigor, architectural depth & optimization proofs',
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <Text style={[theme.typography.h3, { color: theme.colors.textPrimary }]} numberOfLines={1}>
              {note.title}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <Badge status={note.status} /> <br />
              <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginLeft: 8 }]}>
                {note.chunk_count || 8} Chunks • {explainLevel.toUpperCase()}
              </Text>
            </View>
          </View>

          {/* Upgrade Plan Trigger Button */}
          <TouchableOpacity
            onPress={() => router.push('/subscription')}
            style={[styles.upgradeTriggerBtn, { backgroundColor: '#2563EB' }]}
          >
            <Zap size={14} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700', marginLeft: 4 }}>
              Upgrade
            </Text>
          </TouchableOpacity>
        </View>

        {/* Explanation Level & AI Usage Counter Row */}
        <View style={styles.levelSelectorRow}>
          <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, fontWeight: '700' }]}>
            Explanation Level:
          </Text>
          <TouchableOpacity
            onPress={() => setShowLevelModal(true)}
            style={[
              styles.levelDropdownButton,
              {
                backgroundColor: theme.colors.surfaceVariant,
                borderColor: theme.colors.surfaceBorder,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.primary, fontWeight: '700', textTransform: 'capitalize' },
              ]}
            >
              {explainLevel}
            </Text>
            <ChevronDown size={14} color={theme.colors.primary} style={{ marginLeft: 6 }} />
          </TouchableOpacity>

          {/* AI Requests Counter Badge */}
          <View style={styles.usageCounterBadge}>
            <Sparkles size={12} color="#F59E0B" />
            <Text style={[theme.typography.caption, { color: theme.colors.textPrimary, fontWeight: '600', marginLeft: 4 }]}>
              {requestsUsed}/{requestsLimit} Requests
            </Text>
          </View>
        </View>

        {/* Workspace Tabs */}
        <View style={styles.tabsContainer}>
          {(['summary', 'content', 'chat', 'quiz'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => {
                setActiveTab(tab);
              }}
              style={[
                styles.tabItem,
                activeTab === tab && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
              ]}
            >
              <Text
                style={[
                  theme.typography.body,
                  {
                    color: activeTab === tab ? theme.colors.primary : theme.colors.textSecondary,
                    fontWeight: activeTab === tab ? '700' : '500',
                    textTransform: 'capitalize',
                  },
                ]}
              >
                {tab === 'quiz' ? 'Practice Exam' : tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <ScrollView contentContainerStyle={styles.workspaceBody} showsVerticalScrollIndicator={false}>
          {activeTab === 'summary' && (
            <View>
                            {/* AI Summary Card */}
              <Card style={styles.sectionCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
                    <Sparkles size={18} color={theme.colors.secondary} />
                    <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginLeft: 8 }]} numberOfLines={1}>
                      Eureka AI Executive Summary
                    </Text>
                  </View>
                  {note.summary ? (
                    <TouchableOpacity
                      onPress={() => setShowSummaryModal(true)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      }}
                    >
                      <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '700' }]}>
                        Modal View
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {note.summary ? (
                  <>
                    <Text
                      style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 22 }]}
                      numberOfLines={isSummaryExpanded ? undefined : 4}
                    >
                      {note.summary}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                      <TouchableOpacity
                        onPress={() => setIsSummaryExpanded((prev) => !prev)}
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '700' }]}>
                          {isSummaryExpanded ? 'Show less' : 'View more'}
                        </Text>
                        {isSummaryExpanded ? (
                          <ChevronUp size={16} color={theme.colors.primary} style={{ marginLeft: 4 }} />
                        ) : (
                          <ChevronDown size={16} color={theme.colors.primary} style={{ marginLeft: 4 }} />
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => setShowSummaryModal(true)}
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                      >
                        <Text style={[theme.typography.caption, { color: theme.colors.secondary, fontWeight: '600' }]}>
                          Open full modal
                        </Text>
                        <ChevronRight size={14} color={theme.colors.secondary} style={{ marginLeft: 2 }} />
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <Text style={[theme.typography.body, { color: theme.colors.textTertiary, lineHeight: 22, fontStyle: 'italic' }]}>
                    {note.status === 'processing'
                      ? 'Eureka AI is generating and structuring your study summary...'
                      : 'No summary available yet. Head over to the Quiz tab or re-upload to analyze.'}
                  </Text>
                )}
              </Card>

              {/* Note Content Preview */}
              <Card style={styles.sectionCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <FileText size={18} color={theme.colors.primary} />
                  <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
                    Note Content Preview
                  </Text>
                </View>
                <Text style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 22 }]} numberOfLines={6}>
                  {note.raw_text || 'No content available.'}
                </Text>
                <TouchableOpacity
                  onPress={() => setActiveTab('content')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 10,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '700' }]}>
                    View full content
                  </Text>
                  <ChevronRight size={14} color={theme.colors.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </Card>

              {/* Study Statistics */}
              <Card style={[styles.sectionCard, { backgroundColor: 'rgba(59,130,246,0.04)' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <Layers size={18} color={theme.colors.primary} />
                  <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
                    Study Statistics
                  </Text>
                </View>
                <View style={{ gap: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Chunks indexed</Text>
                    <Text style={[theme.typography.body, { color: theme.colors.textPrimary, fontWeight: '700' }]}>{note.chunk_count ?? '—'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Upload type</Text>
                    <Text style={[theme.typography.body, { color: theme.colors.textPrimary, fontWeight: '700', textTransform: 'capitalize' }]}>{note.uploaded_via}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Status</Text>
                    <Text style={[theme.typography.body, { fontWeight: '700', color: note.status === 'completed' ? '#10B981' : note.status === 'processing' ? '#3B82F6' : '#F59E0B', textTransform: 'capitalize' }]}>{note.status}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>Approx. words</Text>
                    <Text style={[theme.typography.body, { color: theme.colors.textPrimary, fontWeight: '700' }]}>{note.raw_text ? '~' + (Math.round(note.raw_text.split(/\s+/).length / 10) * 10) : '—'}</Text>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {activeTab === 'content' && (
            <Card style={styles.sectionCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <FileText size={18} color={theme.colors.primary} />
                <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
                  Raw Course Material & Chunks
                </Text>
              </View>
              <Text style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 22 }]}>
                {note.raw_text}
              </Text>
            </Card>
          )}

          {activeTab === 'chat' && (
            <View>
              <Card style={styles.sectionCard}>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
                  Ask Eureka AI questions scoped directly to "{note.title}"
                </Text>
                {chatMessages.map((msg, index) => (
                  <View
                    key={index}
                    style={[
                      styles.chatBubble,
                      msg.role === 'user'
                        ? { alignSelf: 'flex-end', backgroundColor: theme.colors.primary }
                        : { alignSelf: 'flex-start', backgroundColor: 'rgba(150,150,150,0.1)' },
                    ]}
                  >
                    <Text
                      style={[
                        theme.typography.body,
                        {
                          color: msg.role === 'user' ? theme.colors.primaryForeground : theme.colors.textPrimary,
                        },
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                ))}

                {chatLoading && (
                  <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginVertical: 8 }} />
                )}
              </Card>

              <View style={styles.chatInputRow}>
                <Input
                  placeholder="Ask Eureka AI about this note..."
                  value={inputMessage}
                  onChangeText={setInputMessage}
                  containerStyle={{ flex: 1, marginVertical: 0 }}
                  style={{ flex: 1 }}
                />
                <TouchableOpacity
                  onPress={handleSendMessage}
                  style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
                >
                  <Send size={18} color={theme.colors.primaryForeground} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeTab === 'quiz' && (
            <View>
              <View style={styles.quizHeaderRow}>
                <Text style={[theme.typography.h3, { color: theme.colors.textPrimary }]}>
                  Practice Quiz ({explainLevel})
                </Text>
                <Button
                  title="Regenerate"
                  onPress={handleGenerateQuiz}
                  loading={quizLoading}
                  size="sm"
                  variant="secondary"
                  icon={<RefreshCw size={14} color={theme.colors.textPrimary} />}
                />
              </View>

              {quizLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                    Generating AI practice questions...
                  </Text>
                </View>
              ) : (
                quizQuestions.map((q, qIndex) => (
                  <Card key={q.id || qIndex} style={styles.sectionCard}>
                    <Text style={[theme.typography.body, { color: theme.colors.textPrimary, fontWeight: '700' }]}>
                      {qIndex + 1}. {q.question}
                    </Text>

                    <View style={{ marginTop: 12 }}>
                      {q.options.map((option: string, optIndex: number) => {
                        const isSelected = selectedAnswers[qIndex] === optIndex;
                        const isCorrect = q.correctAnswerIndex === optIndex;
                        let optionBg = theme.colors.surface;
                        let borderColor = theme.colors.surfaceBorder;

                        if (quizSubmitted) {
                          if (isCorrect) {
                            optionBg = '#D1FAE5';
                            borderColor = '#10B981';
                          } else if (isSelected && !isCorrect) {
                            optionBg = '#FEE2E2';
                            borderColor = '#EF4444';
                          }
                        } else if (isSelected) {
                          optionBg = 'rgba(59, 130, 246, 0.1)';
                          borderColor = theme.colors.primary;
                        }

                        return (
                          <TouchableOpacity
                            key={optIndex}
                            onPress={() => {
                              if (!quizSubmitted) {
                                setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optIndex }));
                              }
                            }}
                            style={[
                              styles.optionButton,
                              { backgroundColor: optionBg, borderColor },
                            ]}
                          >
                            <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>
                              {option}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {quizSubmitted && (
                      <View style={[styles.explanationBox, { backgroundColor: 'rgba(150,150,150,0.05)' }]}>
                        <Text style={[theme.typography.caption, { color: '#10B981', fontWeight: '700' }]}>
                          Explanation:
                        </Text>
                        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 2 }]}>
                          {q.explanation}
                        </Text>
                      </View>
                    )}
                  </Card>
                ))
              )}

              {quizQuestions.length > 0 && !quizSubmitted && (
                <Button
                  title="Submit Answers & Grade"
                  onPress={() => setQuizSubmitted(true)}
                  size="lg"
                  style={{ marginTop: 16, marginBottom: 24 }}
                />
              )}
            </View>
          )}
        </ScrollView>

        {/* Full AI Summary Modal */}
        <Modal visible={showSummaryModal} transparent animationType="slide" onRequestClose={() => setShowSummaryModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder, maxHeight: '80%' }]}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Sparkles size={18} color={theme.colors.secondary} />
                  <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginLeft: 8 }]}>Full AI Summary</Text>
                </View>
                <TouchableOpacity onPress={() => setShowSummaryModal(false)}>
                  <X size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
                <Text style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 24, paddingBottom: 24 }]} selectable>
                  {note.summary}
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Explanation Level Selector Modal */}
        <Modal
          visible={showLevelModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLevelModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.surfaceBorder,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={[theme.typography.h3, { color: theme.colors.textPrimary }]}>
                  Select Explanation Level
                </Text>
                <TouchableOpacity onPress={() => setShowLevelModal(false)}>
                  <X size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 16 }]}>
                Choose how deeply Eureka AI should explain concepts and generate quizzes.
              </Text>

              {(['beginner', 'intermediate', 'advanced'] as const).map((lvl) => {
                const isSelected = explainLevel === lvl;
                return (
                  <TouchableOpacity
                    key={lvl}
                    onPress={() => {
                      setExplainLevel(lvl);
                      setShowLevelModal(false);
                    }}
                    style={[
                      styles.levelOptionItem,
                      {
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : theme.colors.surfaceVariant,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.surfaceBorder,
                        borderWidth: isSelected ? 1.5 : 1,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          theme.typography.body,
                          {
                            color: isSelected ? theme.colors.primary : theme.colors.textPrimary,
                            fontWeight: '700',
                            textTransform: 'capitalize',
                          },
                        ]}
                      >
                        {lvl}
                      </Text>
                      <Text
                        style={[
                          theme.typography.caption,
                          { color: theme.colors.textSecondary, marginTop: 4 },
                        ]}
                      >
                        {levelDescriptions[lvl]}
                      </Text>
                    </View>
                    {isSelected && <CheckCircle2 size={20} color={theme.colors.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(150,150,150,0.1)',
  },
  upgradeTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 8,
    gap: 8,
  },
  levelDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  usageCounterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    marginLeft: 'auto',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150,150,150,0.15)',
    paddingHorizontal: 20,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  workspaceBody: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionCard: {
    marginBottom: 16,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  chatBubble: {
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
    maxWidth: '85%',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingBottom: 24,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quizHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  optionButton: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  explanationBox: {
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
});
