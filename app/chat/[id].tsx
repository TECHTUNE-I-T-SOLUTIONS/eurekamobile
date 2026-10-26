import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Clipboard,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { MarkdownText } from '../../src/components/ui/MarkdownText';
import { useTheme } from '../../src/context/ThemeContext';
import { useAppStore } from '../../src/store/useAppStore';
import { chatApi } from '../../src/services/api/chat';
import { notesApi } from '../../src/services/api/notes';
import { ChatMessage, Note } from '../../src/types/database';
import {
  Send,
  User,
  BookOpen,
  HelpCircle,
  ArrowLeft,
  Volume2,
  Copy,
  RotateCw,
  Trash2,
  Paperclip,
} from 'lucide-react-native';

export default function ActiveChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const { explanationLevel, speechSpeed } = useAppStore();
  const scrollViewRef = useRef<any>(null);
  const insets = useSafeAreaInsets();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showNotePicker, setShowNotePicker] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  useEffect(() => {
    loadChatData();
  }, [id]);

  const loadChatData = async () => {
    try {
      setLoading(true);
      const [fetchedMessages, fetchedNotes] = await Promise.all([
        chatApi.getMessages(id || 'default'),
        notesApi.getNotes().catch(() => []),
      ]);
      setMessages(fetchedMessages);
      setNotes(fetchedNotes);
    } catch (e) {
      console.error('Failed to load chat session:', e);
      Alert.alert('Error', 'Failed to load chat messages.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      chat_id: id || 'default',
      sender: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await chatApi.sendMessage(
        id || 'default',
        text,
        selectedNote?.id || null,
        explanationLevel
      );

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        chat_id: id || 'default',
        sender: 'assistant',
        content: response.answer,
        metadata: {
          sources: response.sources,
          suggested_questions: response.suggested_questions,
          summary: response.summary,
        },
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e) {
      console.error('Failed to get AI response:', e);
      Alert.alert('AI Error', 'Failed to generate response. Please try again.');
    } finally {
      setIsTyping(false);
      scrollViewRef.current?.scrollToEnd?.({ animated: true });
    }
  };

  const handleSpeech = (msgId: string, content: string) => {
    if (speakingMsgId === msgId) {
      Speech.stop();
      setSpeakingMsgId(null);
      return;
    }
    Speech.stop();
    setSpeakingMsgId(msgId);
    Speech.speak(content, {
      language: 'en',
      rate: speechSpeed,
      onDone: () => setSpeakingMsgId(null),
      onError: () => setSpeakingMsgId(null),
    });
  };

  const handleCopy = (content: string) => {
    Clipboard.setString(content);
    Alert.alert('Copied', 'Message copied to clipboard.');
  };

  const handleRetry = (lastUserContent: string) => {
    handleSendMessage(lastUserContent);
  };

  const handleDeleteChat = async () => {
    Alert.alert('Delete Chat', 'Are you sure you want to delete this chat session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await chatApi.deleteChat(id || 'default');
            router.back();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete chat session.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 12 }]}>
            Loading AI conversation...
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  const lastUserMessage = [...messages].reverse().find(m => m.sender === 'user')?.content;

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.surfaceBorder,
            },
          ]}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.headerIconButton}>
            <ArrowLeft size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View style={{ flex: 1, marginHorizontal: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={[
                  styles.aiAvatarSmall,
                  { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.surfaceBorder, borderWidth: 1 },
                ]}
              >
                <Image
                  source={require('../../assets/logo.png')}
                  style={{ width: 18, height: 18 }}
                  resizeMode="contain"
                />
              </View>
              <Text
                style={[theme.typography.h4, { color: theme.colors.textPrimary, marginLeft: 8, flexShrink: 1 }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                AI Study Session
              </Text>
            </View>
            <Text
              style={[theme.typography.caption, { color: theme.colors.statusCompleted, flexShrink: 1 }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {selectedNote ? `Attached: ${selectedNote.title}` : `● RAG (${explanationLevel.toUpperCase()})`}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowNotePicker(!showNotePicker)}
            style={[
              styles.headerIconButton,
              { backgroundColor: selectedNote ? theme.colors.surfaceVariant : 'transparent' },
            ]}
          >
            <Paperclip size={20} color={selectedNote ? theme.colors.primary : theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDeleteChat} style={styles.headerIconButton}>
            <Trash2 size={18} color={theme.colors.statusError} />
          </TouchableOpacity>
        </View>

        {/* Note Picker Dropdown */}
        {showNotePicker && (
          <View
            style={[
              styles.notePickerContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.surfaceBorder,
              },
            ]}
          >
            <Text style={[theme.typography.caption, { fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 8 }]}>
              ATTACH NOTE FOR CONTEXT-AWARE CHAT:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedNote(null);
                  setShowNotePicker(false);
                }}
                style={[
                  styles.noteChip,
                  {
                    backgroundColor: !selectedNote ? theme.colors.primary : theme.colors.surfaceVariant,
                    borderColor: theme.colors.surfaceBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    theme.typography.caption,
                    { color: !selectedNote ? theme.colors.primaryForeground : theme.colors.textPrimary, flexShrink: 1 },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  All Notes (General)
                </Text>
              </TouchableOpacity>

              {notes.map((note) => (
                <TouchableOpacity
                  key={note.id}
                  onPress={() => {
                    setSelectedNote(note);
                    setShowNotePicker(false);
                  }}
                  style={[
                    styles.noteChip,
                    {
                      backgroundColor: selectedNote?.id === note.id ? theme.colors.primary : theme.colors.surfaceVariant,
                      borderColor: theme.colors.surfaceBorder,
                    },
                  ]}
                >
                  <BookOpen size={12} color={selectedNote?.id === note.id ? theme.colors.primaryForeground : theme.colors.secondary} />
                  <Text
                    style={[
                      theme.typography.caption,
                      {
                        color: selectedNote?.id === note.id ? theme.colors.primaryForeground : theme.colors.textPrimary,
                        marginLeft: 4,
                        flexShrink: 1,
                      },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {note.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Messages Feed */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd?.({ animated: true })}
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isSpeaking = speakingMsgId === msg.id;

            return (
              <View
                key={msg.id}
                style={[
                  styles.messageRow,
                  isUser ? styles.userMessageRow : styles.assistantMessageRow,
                ]}
              >
                {!isUser && (
                  <View
                    style={[
                      styles.msgAvatar,
                      { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.surfaceBorder, borderWidth: 1 },
                    ]}
                  >
                    <Image
                      source={require('../../assets/logo.png')}
                      style={{ width: 18, height: 18 }}
                      resizeMode="contain"
                    />
                  </View>
                )}

                <View style={{ maxWidth: '82%' }}>
                  <View
                    style={[
                      styles.messageBubble,
                      {
                        backgroundColor: isUser
                          ? theme.colors.primary
                          : theme.colors.surface,
                        borderColor: isUser
                          ? 'transparent'
                          : theme.colors.surfaceBorder,
                        borderWidth: isUser ? 0 : 1,
                      },
                    ]}
                  >
                    <MarkdownText content={msg.content} isUser={isUser} />

                    {/* Cited Sources */}
                    {msg.metadata?.sources && msg.metadata.sources.length > 0 && (
                      <View style={styles.sourcesContainer}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <BookOpen size={12} color={theme.colors.secondary} />
                          <Text
                            style={[
                              theme.typography.caption,
                              { color: theme.colors.secondary, fontWeight: '700', marginLeft: 4 },
                            ]}
                          >
                            Cited Sources:
                          </Text>
                        </View>
                        {msg.metadata.sources.map((src, i) => (
                          <Text
                            key={i}
                            style={[
                              theme.typography.caption,
                              { color: theme.colors.textSecondary, marginTop: 2 },
                            ]}
                          >
                            • {src}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Message Action Bar (TTS, Copy, Retry) */}
                  {!isUser && (
                    <View style={styles.messageActionsRow}>
                      <TouchableOpacity
                        onPress={() => handleSpeech(msg.id, msg.content)}
                        style={[
                          styles.actionButton,
                          {
                            backgroundColor: isSpeaking
                              ? theme.colors.primary
                              : theme.colors.surfaceVariant,
                          },
                        ]}
                      >
                        <Volume2
                          size={14}
                          color={isSpeaking ? theme.colors.primaryForeground : theme.colors.textSecondary}
                        />
                        <Text
                          style={[
                            theme.typography.caption,
                            {
                              color: isSpeaking ? theme.colors.primaryForeground : theme.colors.textSecondary,
                              marginLeft: 4,
                            },
                          ]}
                        >
                          {isSpeaking ? 'Stop' : 'Listen'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleCopy(msg.content)}
                        style={[styles.actionButton, { backgroundColor: theme.colors.surfaceVariant }]}
                      >
                        <Copy size={14} color={theme.colors.textSecondary} />
                      </TouchableOpacity>

                      {lastUserMessage && (
                        <TouchableOpacity
                          onPress={() => handleRetry(lastUserMessage)}
                          style={[styles.actionButton, { backgroundColor: theme.colors.surfaceVariant }]}
                        >
                          <RotateCw size={14} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Suggested Follow-up Questions */}
                  {msg.metadata?.suggested_questions && !isUser && (
                    <View style={styles.questionsContainer}>
                      {msg.metadata.suggested_questions.map((q, qi) => (
                        <TouchableOpacity
                          key={qi}
                          onPress={() => handleSendMessage(q)}
                          style={[
                            styles.suggestedQChip,
                            {
                              backgroundColor: theme.colors.surfaceVariant,
                              borderColor: theme.colors.surfaceBorder,
                            },
                          ]}
                        >
                          <HelpCircle size={12} color={theme.colors.secondary} />
                          <Text
                            style={[
                              theme.typography.caption,
                              { color: theme.colors.secondary, marginLeft: 4, fontWeight: '500' },
                            ]}
                          >
                            {q}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {isUser && (
                  <View
                    style={[styles.msgAvatar, { backgroundColor: theme.colors.secondary }]}
                  >
                    <User size={16} color="#FFF" />
                  </View>
                )}
              </View>
            );
          })}

          {isTyping && (
            <View style={[styles.messageRow, styles.assistantMessageRow]}>
              <View
                style={[
                  styles.msgAvatar,
                  { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.surfaceBorder, borderWidth: 1 },
                ]}
              >
                <Image
                  source={require('../../assets/logo.png')}
                  style={{ width: 18, height: 18 }}
                  resizeMode="contain"
                />
              </View>
              <Card style={{ paddingVertical: 10, paddingHorizontal: 16 }}>
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textSecondary, fontStyle: 'italic' },
                  ]}
                >
                  Eureka AI is synthesizing course notes ({explanationLevel})...
                </Text>
              </Card>
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: theme.colors.surface,
              borderTopColor: theme.colors.surfaceBorder,
              paddingBottom: Math.max(insets.bottom, 10),
            },
          ]}
        >
          <TextInput
            style={[
              styles.textInput,
              theme.typography.body,
              {
                color: theme.colors.textPrimary,
                backgroundColor: theme.colors.inputBackground,
                borderColor: theme.colors.inputBorder,
              },
            ]}
            placeholder={
              selectedNote
                ? `Ask about "${selectedNote.title}"...`
                : 'Ask AI about your course materials...'
            }
            placeholderTextColor={theme.colors.textTertiary}
            value={inputMessage}
            onChangeText={setInputMessage}
            multiline
          />

          <TouchableOpacity
            onPress={() => handleSendMessage()}
            disabled={!inputMessage.trim()}
            style={[
              styles.sendButton,
              {
                backgroundColor: inputMessage.trim()
                  ? theme.colors.primary
                  : theme.colors.surfaceBorder,
              },
            ]}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerIconButton: {
    padding: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notePickerContainer: {
    padding: 12,
    borderBottomWidth: 1,
  },
  noteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 8,
    alignItems: 'flex-start',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  assistantMessageRow: {
    justifyContent: 'flex-start',
  },
  msgAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  messageBubble: {
    padding: 14,
    borderRadius: 16,
  },
  sourcesContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },
  messageActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  questionsContainer: {
    marginTop: 8,
  },
  suggestedQChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    minHeight: 42,
    maxHeight: 100,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
