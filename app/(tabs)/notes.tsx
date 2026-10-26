import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Input } from '../../src/components/ui/Input';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { UploadModal } from '../../src/components/notes/UploadModal';
import { NotesSkeleton } from '../../src/components/ui/SkeletonLoader';
import { CustomAlert, AlertButton } from '../../src/components/ui/CustomAlert';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useAppStore } from '../../src/store/useAppStore';
import { notesApi } from '../../src/services/api/notes';
import {
  Search,
  Plus,
  BookOpen,
  FileText,
  MessageSquareCode,
  Headphones,
  FileCode,
  SlidersHorizontal,
  Trash2,
  ChevronRight,
  X,
} from 'lucide-react-native';
import { Note } from '../../src/types/database';

export default function NotesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { notes, setNotes, removeNote } = useAppStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pdf' | 'txt' | 'md'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'title' | 'size'>('newest');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Custom Alert state
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

  const fetchUserNotes = useCallback(async () => {
    try {
      const data = await notesApi.getNotes();
      setNotes(data || []);
    } catch (error) {
      console.error('Failed to fetch notes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setNotes]);

  useEffect(() => {
    fetchUserNotes();
  }, [fetchUserNotes]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserNotes();
  };

  // Real user notes from store only (no mock data fallback)
  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.raw_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.summary && note.summary.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === 'all') return true;
    // if (selectedFilter === 'processing') return note.status === 'processing';
    if (selectedFilter === 'pdf') return note.uploaded_via === 'file' || note.title.toLowerCase().includes('.pdf');
    if (selectedFilter === 'txt') return note.uploaded_via === 'paste' || note.title.toLowerCase().includes('.txt');
    if (selectedFilter === 'md') return note.uploaded_via === 'text' || note.title.toLowerCase().includes('.md');

    return true;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'size') {
      return (b.chunk_count || 0) - (a.chunk_count || 0);
    }
    return 0;
  });

  const handleDeleteNote = async (id: string) => {
    showAlert(
      'Delete Note',
      'Are you sure you want to delete this study note? This action cannot be undone.',
      'confirm',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notesApi.deleteNote(id);
              removeNote(id);
              showAlert('Deleted', 'Note removed successfully.', 'success');
            } catch (e) {
              showAlert('Error', 'Could not delete note. Please try again.', 'error');
            }
          },
        },
      ]
    );
  };

  const getFileBadgeType = (note: Note) => {
    if (note.title.toLowerCase().endsWith('.pdf') || note.uploaded_via === 'file') return 'PDF';
    if (note.title.toLowerCase().endsWith('.md') || note.uploaded_via === 'text') return 'MD';
    return 'TXT';
  };

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'pdf', label: 'PDF' },
    { id: 'txt', label: 'TXT' },
    { id: 'md', label: 'MD' },
    // { id: 'processing', label: 'Processing' },
  ] as const;

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <BookOpen size={24} color={theme.colors.primary} />
          <Text
            style={[
              theme.typography.h1,
              { color: theme.colors.textPrimary, marginLeft: 8 },
            ]}
          >
            Notes Library
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setIsUploadModalOpen(true)}
          style={[
            styles.addNoteButton,
            { backgroundColor: theme.colors.primary },
          ]}
          activeOpacity={0.8}
        >
          <Plus size={20} color={theme.colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Input
          placeholder="Search notes, topics, formulas..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIcon={<Search size={12} color={theme.colors.textSecondary} />}
          rightIcon={
            searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={12} color={theme.colors.textTertiary} />
              </TouchableOpacity>
            ) : undefined
          }
        />
      </View>

      {/* Category Filter Tabs */}
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {filterTabs.map((tab) => {
            const isSelected = selectedFilter === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setSelectedFilter(tab.id)}
                activeOpacity={0.7}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.surfaceVariant,
                    borderColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.surfaceBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    {
                      color: isSelected
                        ? theme.colors.primaryForeground
                        : theme.colors.textPrimary,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Sort Bar */}
      <View style={styles.sortRow}>
        <SlidersHorizontal size={14} color={theme.colors.textSecondary} />
        <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginLeft: 6 }]}>
          Sort by:
        </Text>
        {(['newest', 'title', 'size'] as const).map((sort) => (
          <TouchableOpacity
            key={sort}
            onPress={() => setSortBy(sort)}
            style={[
              styles.sortButton,
              sortBy === sort && { backgroundColor: theme.isDark ? 'rgba(129, 140, 248, 0.15)' : 'rgba(30, 27, 75, 0.08)' },
            ]}
          >
            <Text
              style={[
                theme.typography.caption,
                {
                  color: sortBy === sort ? theme.colors.primary : theme.colors.textSecondary,
                  fontWeight: sortBy === sort ? '700' : '500',
                  textTransform: 'capitalize',
                },
              ]}
            >
              {sort}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content Area: Skeleton Loader or Notes List */}
      {loading && !refreshing ? (
        <NotesSkeleton count={3} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.notesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {filteredNotes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: theme.colors.surfaceVariant },
                ]}
              >
                <FileCode size={40} color={theme.colors.primary} />
              </View>

              <Text
                style={[
                  theme.typography.h3,
                  { color: theme.colors.textPrimary, marginTop: 16, textAlign: 'center' },
                ]}
              >
                {notes.length === 0
                  ? 'Your Notes Library is Empty'
                  : 'No Matching Notes Found'}
              </Text>

              <Text
                style={[
                  theme.typography.body,
                  { color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 22 },
                ]}
              >
                {notes.length === 0
                  ? 'Upload course material, PDFs, or paste lecture transcripts to build your personalized AI study library.'
                  : 'Try clearing your search query or selecting a different category filter.'}
              </Text>

              {notes.length === 0 ? (
                <TouchableOpacity
                  onPress={() => setIsUploadModalOpen(true)}
                  style={[
                    styles.quickUploadBtn,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  activeOpacity={0.85}
                >
                  <Plus size={18} color={theme.colors.primaryForeground} />
                  <Text
                    style={[
                      theme.typography.body,
                      { color: theme.colors.primaryForeground, fontWeight: '700', marginLeft: 8 },
                    ]}
                  >
                    Upload Your First Note
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedFilter('all');
                  }}
                  style={[
                    styles.resetFilterBtn,
                    { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.surfaceBorder },
                  ]}
                >
                  <Text style={[theme.typography.body, { color: theme.colors.primary, fontWeight: '600' }]}>
                    Reset Search & Filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredNotes.map((note) => {
              const fileType = getFileBadgeType(note);
              const dateStr = new Date(note.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <Card
                  key={note.id}
                  onPress={() => router.push(`/notes/${note.id}`)}
                  style={styles.noteCard}
                >
                  <View style={styles.noteCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={[
                          styles.fileTypeBadge,
                          {
                            backgroundColor:
                              fileType === 'PDF'
                                ? '#FEE2E2'
                                : fileType === 'MD'
                                ? '#DBEAFE'
                                : '#D1FAE5',
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '800',
                            color:
                              fileType === 'PDF'
                                ? '#DC2626'
                                : fileType === 'MD'
                                ? '#2563EB'
                                : '#059669',
                          }}
                        >
                          {fileType}
                        </Text>
                      </View>
                      <Badge status={note.status} />
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text
                        style={[
                          theme.typography.caption,
                          { color: theme.colors.textTertiary, marginRight: 8 },
                        ]}
                      >
                        {dateStr} • {note.chunk_count ? `${note.chunk_count} Chunks` : 'Ready'}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteNote(note.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Trash2 size={16} color={theme.colors.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text
                    style={[
                      theme.typography.h3,
                      { color: theme.colors.textPrimary, marginTop: 8 },
                    ]}
                    numberOfLines={2}
                  >
                    {note.title}
                  </Text>

                  <Text
                    style={[
                      theme.typography.body,
                      { color: theme.colors.textSecondary, marginTop: 4 },
                    ]}
                    numberOfLines={3}
                  >
                    {note.summary || note.raw_text}
                  </Text>

                  {/* Card footer actions */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      onPress={() => router.push(`/(tabs)/chat`)}
                      style={styles.cardActionItem}
                    >
                      <MessageSquareCode size={14} color={theme.colors.secondary} />
                      <Text
                        style={[
                          theme.typography.caption,
                          { color: theme.colors.secondary, marginLeft: 4, fontWeight: '600' },
                        ]}
                      >
                        Ask Chat
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => router.push(`/(tabs)/lecturer`)}
                      style={styles.cardActionItem}
                    >
                      <Headphones size={14} color="#10B981" />
                      <Text
                        style={[
                          theme.typography.caption,
                          { color: '#10B981', marginLeft: 4, fontWeight: '600' },
                        ]}
                      >
                        Audio Lecturer
                      </Text>
                    </TouchableOpacity>

                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <ChevronRight size={16} color={theme.colors.textTertiary} />
                    </View>
                  </View>
                </Card>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Upload Modal */}
      <UploadModal
        visible={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onNoteUploaded={fetchUserNotes}
      />

      {/* Custom Confirmation / Alert Modal */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
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
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addNoteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 2,
  },
  filterWrapper: {
    marginVertical: 10,
  },
  filtersRow: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sortButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 6,
  },
  notesList: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resetFilterBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 20,
  },
  noteCard: {
    marginBottom: 12,
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fileTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.15)',
  },
  cardActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
});
