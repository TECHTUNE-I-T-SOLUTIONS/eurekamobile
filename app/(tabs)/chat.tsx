import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { useTheme } from '../../src/context/ThemeContext';
import { useAppStore } from '../../src/store/useAppStore';
import { chatApi } from '../../src/services/api/chat';
import { notesApi } from '../../src/services/api/notes';
import { Chat, Note } from '../../src/types/database';
import {
  MessageSquarePlus,
  ChevronRight,
  BookOpen,
  Trash2,
  Calendar,
} from 'lucide-react-native';

export default function ChatHistoryScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const {
    chats,
    setChats,
    chatsLoaded,
    setChatsLoaded,
    notes,
    setNotes,
    notesLoaded,
    setNotesLoaded,
  } = useAppStore();

  const [loading, setLoading] = useState(!chatsLoaded);
  const [creating, setCreating] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  const loadData = async (showSpinner = true) => {
    try {
      if (showSpinner && !chatsLoaded) {
        setLoading(true);
      }
      const [fetchedChats, fetchedNotes] = await Promise.all([
        chatApi.getChats(),
        notesApi.getNotes().catch(() => []),
      ]);
      setChats(fetchedChats);
      setChatsLoaded(true);
      setNotes(fetchedNotes);
      setNotesLoaded(true);
    } catch (e) {
      console.error('Failed to load chat history:', e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // If chats were already loaded previously, refresh smoothly in the background
      loadData(!chatsLoaded);
    }, [chatsLoaded])
  );

  const handleCreateChat = async (noteId?: string | null, title?: string) => {
    try {
      setCreating(true);
      const noteTitle = noteId ? notes.find((n) => n.id === noteId)?.title : null;
      const chatTitle = title || (noteTitle ? `Chat: ${noteTitle}` : 'New Study Session');

      const newChat = await chatApi.createChat(chatTitle, noteId || null);
      setChats([newChat, ...chats]);
      setShowNoteModal(false);
      router.push(`/chat/${newChat.id}`);
    } catch (e) {
      console.error('Failed to create chat:', e);
      Alert.alert('Error', 'Failed to create new chat session.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteChat = async (chatId: string, e: any) => {
    e.stopPropagation();
    Alert.alert('Delete Chat', 'Are you sure you want to delete this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await chatApi.deleteChat(chatId);
            setChats(chats.filter((c) => c.id !== chatId));
          } catch (err) {
            Alert.alert('Error', 'Failed to delete chat.');
          }
        },
      },
    ]);
  };

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={[
              styles.aiAvatar,
              { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.surfaceBorder, borderWidth: 1 },
            ]}
          >
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
            />
          </View>
          <View style={{ marginLeft: 12 }}>
            <Text style={[theme.typography.h3, { color: theme.colors.textPrimary }]}>
              AI Study Chats
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary },
              ]}
            >
              Tutoring & course Q&A
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowNoteModal(true)}
          disabled={creating}
          style={[
            styles.newChatButton,
            { backgroundColor: theme.colors.primary },
          ]}
        >
          <MessageSquarePlus size={18} color={theme.colors.primaryForeground} />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.primaryForeground, fontWeight: '700', marginLeft: 6 },
            ]}
          >
            New Chat
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat History List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 12 }]}>
            Loading conversations...
          </Text>
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconBox,
              { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.surfaceBorder, borderWidth: 1 },
            ]}
          >
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 48, height: 48 }}
              resizeMode="contain"
            />
          </View>
          <Text style={[theme.typography.h4, { color: theme.colors.textPrimary, marginTop: 16 }]}>
            No AI Conversations Yet
          </Text>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textSecondary, textAlign: 'center', marginHorizontal: 32, marginTop: 8 },
            ]}
          >
            Start a new chat to ask questions about your course materials, generate quizzes, or get step-by-step explanations.
          </Text>
          <TouchableOpacity
            onPress={() => setShowNoteModal(true)}
            style={[
              styles.startFirstButton,
              { backgroundColor: theme.colors.primary, marginTop: 24 },
            ]}
          >
            <Image
              source={require('../../assets/logo.png')}
              style={{ width: 20, height: 20, marginRight: 8 }}
              resizeMode="contain"
            />
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.primaryForeground, fontWeight: '700' },
              ]}
            >
              Start First AI Chat
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContainer}>
          <Text
            style={[
              theme.typography.caption,
              { fontWeight: '700', color: theme.colors.textSecondary, marginBottom: 12, marginLeft: 4 },
            ]}
          >
            RECENT CONVERSATIONS ({chats.length})
          </Text>

          {chats.map((chat) => {
            const attachedNote = notes.find((n) => n.id === chat.note_id);
            const dateStr = new Date(chat.updated_at || chat.created_at).toLocaleDateString(
              undefined,
              { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
            );

            return (
              <TouchableOpacity
                key={chat.id}
                onPress={() => router.push(`/chat/${chat.id}`)}
                activeOpacity={0.7}
              >
                <Card
                  style={[
                    styles.chatCard,
                    {
                      backgroundColor: theme.colors.surface,
                      borderColor: theme.colors.surfaceBorder,
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                      <View
                        style={[
                          styles.chatIconBox,
                          { backgroundColor: theme.colors.surfaceVariant },
                        ]}
                      >
                        <Image
                          source={require('../../assets/logo.png')}
                          style={{ width: 22, height: 22 }}
                          resizeMode="contain"
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12, flexShrink: 1 }}>
                        <Text
                          style={[
                            theme.typography.body,
                            { color: theme.colors.textPrimary, fontWeight: '700', flexShrink: 1 },
                          ]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {chat.title}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexShrink: 1 }}>
                          <Calendar size={12} color={theme.colors.textTertiary} />
                          <Text
                            style={[
                              theme.typography.caption,
                              { color: theme.colors.textTertiary, marginLeft: 4 },
                            ]}
                          >
                            {dateStr}
                          </Text>

                          {attachedNote && (
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12, flexShrink: 1, flex: 1 }}>
                              <BookOpen size={12} color={theme.colors.secondary} />
                              <Text
                                style={[
                                  theme.typography.caption,
                                  { color: theme.colors.secondary, marginLeft: 4, fontWeight: '600', flexShrink: 1 },
                                ]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {attachedNote.title}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <TouchableOpacity
                        onPress={(e) => handleDeleteChat(chat.id, e)}
                        style={styles.deleteButton}
                      >
                        <Trash2 size={16} color={theme.colors.statusError} />
                      </TouchableOpacity>
                      <ChevronRight size={18} color={theme.colors.textTertiary} />
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* New Chat Note Attachment Modal */}
      <Modal
        visible={showNoteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNoteModal(false)}
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
            <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginBottom: 8 }]}>
              Start New AI Chat
            </Text>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 16 }]}>
              Choose a specific note to attach as context, or start a general chat session.
            </Text>

            <TouchableOpacity
              onPress={() => handleCreateChat(null, 'General AI Study Session')}
              disabled={creating}
              style={[
                styles.modalOptionButton,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.surfaceBorder,
                },
              ]}
            >
              <Image
                source={require('../../assets/logo.png')}
                style={{ width: 20, height: 20 }}
                resizeMode="contain"
              />
              <Text
                style={[
                  theme.typography.body,
                  { color: theme.colors.textPrimary, fontWeight: '600', marginLeft: 10 },
                ]}
              >
                General Chat (No Specific Note)
              </Text>
            </TouchableOpacity>

            <Text
              style={[
                theme.typography.caption,
                { fontWeight: '700', color: theme.colors.textSecondary, marginTop: 16, marginBottom: 8 },
              ]}
            >
              OR ATTACH FROM YOUR NOTES ({notes.length}):
            </Text>

            <ScrollView style={{ maxHeight: 220 }}>
              {notes.map((note) => (
                <TouchableOpacity
                  key={note.id}
                  onPress={() => handleCreateChat(note.id, `Chat: ${note.title}`)}
                  disabled={creating}
                  style={[
                    styles.modalNoteItem,
                    {
                      backgroundColor: theme.colors.surfaceVariant,
                      borderColor: theme.colors.surfaceBorder,
                    },
                  ]}
                >
                  <BookOpen size={16} color={theme.colors.secondary} />
                  <Text
                    style={[
                      theme.typography.body,
                      { color: theme.colors.textPrimary, marginLeft: 8, flexShrink: 1 },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {note.title}
                  </Text>
                  <ChevronRight size={16} color={theme.colors.textTertiary} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowNoteModal(false)}
              style={[
                styles.modalCloseButton,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <Text style={[theme.typography.body, { color: theme.colors.textPrimary, fontWeight: '600' }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  aiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 64,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  chatCard: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  chatIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
    marginRight: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  modalOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  modalNoteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
  },
  modalCloseButton: {
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
});
