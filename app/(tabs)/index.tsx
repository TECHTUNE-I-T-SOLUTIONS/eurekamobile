import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useAppStore, AppNotification } from '../../src/store/useAppStore';
import { notesApi } from '../../src/services/api/notes';
import { notificationsApi } from '../../src/services/api/notifications';
import { supabase } from '../../src/services/supabase';
import {
  Sparkles,
  BookOpen,
  MessageSquareCode,
  Headphones,
  Plus,
  Flame,
  Bell,
  ArrowRight,
  BrainCircuit,
  Clock,
  Crown,
  Zap,
} from 'lucide-react-native';
import { Note } from '../../src/types/database';

export default function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { notes, notifications, setNotes, setNotifications, addNotification } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch fresh notes on screen mount & on user change
  const fetchRecentNotes = React.useCallback(async () => {
    try {
      const data = await notesApi.getNotes();
      if (Array.isArray(data)) {
        setNotes(data);
      }
    } catch (err) {
      console.warn('HomeScreen fetchRecentNotes failed:', err);
    }
  }, [setNotes]);

  // Fetch notifications so unread badge shows correctly on first mount
  const fetchRecentNotifications = React.useCallback(async () => {
    if (!user?.id) return;
    try {
      const realData = await notificationsApi.getNotifications(user.id);
      if (realData && realData.length > 0) {
        const mapped: AppNotification[] = realData.map((n) => {
          const payload = n.payload || {};
          let targetId: string | undefined = undefined;
          if (typeof payload.note_id === 'string') targetId = payload.note_id;
          else if (typeof payload.chat_id === 'string') targetId = payload.chat_id;
          else if (typeof payload.target_id === 'string') targetId = payload.target_id;

          let type: AppNotification['type'] = 'doc_processed';
          if (n.type === 'note_ready' || n.type === 'chunks_processed') type = 'doc_processed';
          else if (n.type === 'system' || n.type === 'info') type = 'study_reminder';

          return {
            id: n.id,
            type,
            title: n.title,
            message: n.message,
            isRead: n.is_read,
            createdAt: new Date(n.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            targetId,
            payload,
          };
        });
        setNotifications(mapped);
      }
    } catch (e) {
      console.warn('HomeScreen fetchRecentNotifications failed:', e);
    }
  }, [user?.id, setNotifications]);

  useEffect(() => {
    fetchRecentNotes();
    fetchRecentNotifications();
  }, [fetchRecentNotes, fetchRecentNotifications]);

  // Subscribe to real-time notification changes
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`home_notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as any;
          if (!n) return;
          const p = n.payload || {};
          addNotification({
            id: n.id,
            type: 'doc_processed',
            title: n.title,
            message: n.message,
            isRead: false,
            createdAt: 'Just now',
            targetId: p.note_id || p.chat_id,
            payload: p,
          });
          // Also refresh notes if note processing finished
          if (n.type === 'note_ready' || n.type === 'chunks_processed') {
            fetchRecentNotes();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, addNotification, fetchRecentNotes]);

  // Compute real streak: consecutive days (ending today) with note activity
  const computeStreak = (notesList: typeof notes): number => {
    if (notesList.length === 0) return 0;
    const daySet = new Set(notesList.map((n) => new Date(n.created_at).toDateString()));
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      if (daySet.has(d.toDateString())) { streak++; } else { break; }
    }
    return streak;
  };
  const streakDays = computeStreak(notes);

  // Real recent notes from store, newest first, max 5
  const recentNotes = [...notes]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const [activePromo, setActivePromo] = useState(0);
  const promoAnim = useSharedValue(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePromo((prev) => (prev === 0 ? 1 : 0));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    promoAnim.value = withTiming(activePromo, {
      duration: 600,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [activePromo]);

  const card0Style = useAnimatedStyle(() => {
    return {
      opacity: 1 - promoAnim.value,
      transform: [
        { translateX: promoAnim.value * -350 },
      ],
      zIndex: activePromo === 0 ? 2 : 1,
      pointerEvents: activePromo === 0 ? 'auto' : 'none',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 135,
    };
  });

  const card1Style = useAnimatedStyle(() => {
    return {
      opacity: promoAnim.value,
      transform: [
        { translateX: (1 - promoAnim.value) * 350 },
      ],
      zIndex: activePromo === 1 ? 2 : 1,
      pointerEvents: activePromo === 1 ? 'auto' : 'none',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 135,
    };
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const displayName =
    user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Student';

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchRecentNotes(), fetchRecentNotifications()]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Top Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.greetingRow}>
              <Text
                style={[
                  theme.typography.body,
                  { color: theme.colors.textSecondary, fontWeight: '500' },
                ]}
              >
                Welcome back,
              </Text>
            </View>
            <Text
              style={[
                theme.typography.h1,
                { color: theme.colors.textPrimary, marginTop: 2 },
              ]}
            >
              {displayName} 👋
            </Text>
          </View>

          <View style={styles.headerRightActions}>
            <View
              style={[
                styles.streakBadge,
                {
                  backgroundColor: theme.isDark ? '#312E81' : '#EFF6FF',
                  borderColor: theme.colors.primary,
                },
              ]}
            >
              <Flame size={16} color="#F59E0B" />
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.primary, fontWeight: '700', marginLeft: 4 },
                ]}
              >
                {streakDays} {streakDays === 1 ? 'Day' : 'Days'}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              style={[
                styles.bellButton,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.surfaceBorder,
                },
              ]}
            >
              <Bell size={20} color={theme.colors.textPrimary} />
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>
                    {unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Alternating Promotional Cards Container */}
        <View style={styles.promoWrapper}>
          <Animated.View style={[styles.promoCardContainer, card0Style]}>
            <TouchableOpacity
              onPress={() => router.push('/subscription')}
              activeOpacity={0.9}
            >
              <Card
                style={[
                  styles.upgradeBannerCard,
                  { backgroundColor: '#0F172A', borderColor: '#3B82F6', borderWidth: 1.5 },
                ]}
              >
                <View style={styles.bannerRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.upgradeBadgePill}>
                      <Crown size={14} color="#F59E0B" />
                      <Text style={[theme.typography.caption, { color: '#F59E0B', fontWeight: '700', marginLeft: 4 }]}>
                        UNLOCK UNLIMITED ACCESS
                      </Text>
                    </View>

                    <Text style={[theme.typography.h2, { color: '#F8FAFC', marginTop: 8 }]}>
                      Unlimited AI Lecturing & Requests 👑
                    </Text>

                    <Text style={[theme.typography.caption, { color: '#94A3B8', marginTop: 4 }]}>
                      Get instant voice explanations, unlimited note uploads, and zero request limits.
                    </Text>
                  </View>

                  <View style={[styles.upgradeActionButton, { backgroundColor: '#2563EB' }]}>
                    <Zap size={22} color="#FFFFFF" />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.promoCardContainer, card1Style]}>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/lecturer')}
              activeOpacity={0.9}
            >
              <Card
                style={[
                  styles.bannerCard,
                  { backgroundColor: theme.colors.primary, borderColor: 'transparent' },
                ]}
              >
                <View style={styles.bannerRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.bannerBadge}>
                      <Sparkles size={14} color="#F59E0B" />
                      <Text
                        style={[
                          theme.typography.badge,
                          { color: '#F59E0B', marginLeft: 4 },
                        ]}
                      >
                        AI Study Coach
                      </Text>
                    </View>

                    <Text
                      style={[
                        theme.typography.h3,
                        { color: '#FFFFFF', marginTop: 8 },
                      ]}
                    >
                      Ready for a quick 5-min recap?
                    </Text>
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: '#CBD5E1', marginTop: 4 },
                      ]}
                    >
                      Practice Machine Learning concepts with AI Voice Lecturer.
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.bannerActionButton,
                      { backgroundColor: theme.colors.secondary },
                    ]}
                  >
                    <Headphones size={22} color="#FFFFFF" />
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Promo Indicator Dots */}
        <View style={styles.promoIndicators}>
          <TouchableOpacity
            onPress={() => {
              setActivePromo(0);
              promoAnim.value = withTiming(0, { duration: 400 });
            }}
            style={[
              styles.indicatorDot,
              {
                backgroundColor: activePromo === 0 ? theme.colors.primary : theme.colors.surfaceBorder,
                width: activePromo === 0 ? 20 : 6,
              },
            ]}
          />
          <TouchableOpacity
            onPress={() => {
              setActivePromo(1);
              promoAnim.value = withTiming(1, { duration: 400 });
            }}
            style={[
              styles.indicatorDot,
              {
                backgroundColor: activePromo === 1 ? theme.colors.primary : theme.colors.surfaceBorder,
                width: activePromo === 1 ? 20 : 6,
              },
            ]}
          />
        </View>

        {/* Quick Stats Grid */}
        <Text
          style={[
            theme.typography.h3,
            { color: theme.colors.textPrimary, marginTop: 16, marginBottom: 12 },
          ]}
        >
          Overview
        </Text>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <BookOpen size={20} color={theme.colors.primary} />
            </View>
            <Text
              style={[
                theme.typography.h2,
                { color: theme.colors.textPrimary, marginTop: 8 },
              ]}
            >
              {notes.length}
            </Text>

            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary },
              ]}
            >
              Active Notes
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <MessageSquareCode size={20} color={theme.colors.secondary} />
            </View>
            <Text
              style={[
                theme.typography.h2,
                { color: theme.colors.textPrimary, marginTop: 8 },
              ]}
            >
              18
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary },
              ]}
            >
              AI Queries
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statIconWrapper}>
              <BrainCircuit size={20} color="#10B981" />
            </View>
            <Text
              style={[
                theme.typography.h2,
                { color: theme.colors.textPrimary, marginTop: 8 },
              ]}
            >
              85%
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary },
              ]}
            >
              Mastery Score
            </Text>
          </Card>
        </View>

        {/* Quick Shortcuts */}
        <Text
          style={[
            theme.typography.h3,
            { color: theme.colors.textPrimary, marginTop: 24, marginBottom: 12 },
          ]}
        >
          Quick Actions
        </Text>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/notes')}
            style={[
              styles.actionChip,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.surfaceBorder,
              },
            ]}
          >
            <Plus size={18} color={theme.colors.primary} />
            <Text
              style={[
                theme.typography.bodyBold,
                { color: theme.colors.textPrimary, marginLeft: 6 },
              ]}
            >
              New Note
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/chat')}
            style={[
              styles.actionChip,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.surfaceBorder,
              },
            ]}
          >
            <MessageSquareCode size={18} color={theme.colors.secondary} />
            <Text
              style={[
                theme.typography.bodyBold,
                { color: theme.colors.textPrimary, marginLeft: 6 },
              ]}
            >
              Ask AI
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/lecturer')}
            style={[
              styles.actionChip,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.surfaceBorder,
              },
            ]}
          >
            <Headphones size={18} color="#10B981" />
            <Text
              style={[
                theme.typography.bodyBold,
                { color: theme.colors.textPrimary, marginLeft: 6 },
              ]}
            >
              Lecturer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Recent Notes Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[theme.typography.h3, { color: theme.colors.textPrimary }]}>
            Recent Course Notes
          </Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/notes')}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[theme.typography.caption, { color: theme.colors.secondary, fontWeight: '600' }]}>View All</Text>
              <ArrowRight size={14} color={theme.colors.secondary} style={{ marginLeft: 2 }} />
            </View>
          </TouchableOpacity>
        </View>

        {recentNotes.length === 0 ? (
          <Card style={{ padding: 24, alignItems: 'center' }}>
            <BookOpen size={32} color={theme.colors.textTertiary} />
            <Text style={[theme.typography.body, { color: theme.colors.textTertiary, marginTop: 12, textAlign: 'center' }]}>
              No notes yet. Upload your first study note to get started!
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/notes')}
              style={[styles.actionChip, { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary, marginTop: 16, paddingHorizontal: 20 }]}
            >
              <Plus size={16} color="#FFF" />
              <Text style={[theme.typography.bodyBold, { color: '#FFF', marginLeft: 6 }]}>Upload Note</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          recentNotes.map((note) => (
            <Card key={note.id} onPress={() => router.push(`/notes/${note.id}`)} style={styles.noteCard}>
              <View style={styles.noteHeader}>
                <Badge status={note.status} />
                <View style={styles.timeWrapper}>
                  <Clock size={12} color={theme.colors.textTertiary} />
                  <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginLeft: 4 }]}>
                    {note.chunk_count ? `${note.chunk_count} chunks` : 'Raw text'}
                  </Text>
                </View>
              </View>
              <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginTop: 8 }]} numberOfLines={1}>
                {note.title}
              </Text>
              <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 4 }]} numberOfLines={2}>
                {note.summary || note.raw_text}
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  promoWrapper: {
    position: 'relative',
    height: 135,
    minHeight: 135,
    overflow: 'hidden',
    marginBottom: 6,
  },
  promoCardContainer: {
    width: '100%',
    height: 135,
  },
  promoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  indicatorDot: {
    height: 6,
    borderRadius: 3,
  },
  upgradeBannerCard: {
    padding: 16,
    height: 135,
    minHeight: 135,
    justifyContent: 'center',
  },
  upgradeBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  bannerCard: {
    padding: 16,
    height: 135,
    minHeight: 135,
    justifyContent: 'center',
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerActionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 12,
    alignItems: 'flex-start',
  },
  statIconWrapper: {
    padding: 6,
    borderRadius: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  noteCard: {
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
