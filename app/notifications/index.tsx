import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useAppStore, AppNotification } from '../../src/store/useAppStore';
import { notificationsApi } from '../../src/services/api/notifications';
import { supabase } from '../../src/services/supabase';
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  Trash2,
  FileText,
  AlertTriangle,
  Clock,
  Headphones,
  MessageSquare,
  Sparkles,
} from 'lucide-react-native';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const {
    notifications,
    setNotifications,
    notificationsLoaded,
    setNotificationsLoaded,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRealNotifications = useCallback(async () => {
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
      setNotificationsLoaded(true);
    } catch (e) {
      console.error('Error fetching real notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, setNotifications, setNotificationsLoaded]);

  useEffect(() => {
    if (!user?.id) return;
    if (notificationsLoaded) {
      fetchRealNotifications();
    } else {
      setLoading(true);
      fetchRealNotifications();
    }
  }, [user?.id, notificationsLoaded, fetchRealNotifications]);

  // Real-time subscription for live alerts & notifications
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`notifications_user_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const n = payload.new;
          if (!n) return;
          const pl = n.payload || {};
          let targetId: string | undefined = undefined;
          if (typeof pl.note_id === 'string') targetId = pl.note_id;
          else if (typeof pl.chat_id === 'string') targetId = pl.chat_id;
          else if (typeof pl.target_id === 'string') targetId = pl.target_id;

          let type: AppNotification['type'] = 'doc_processed';
          if (n.type === 'note_ready' || n.type === 'chunks_processed') type = 'doc_processed';
          else if (n.type === 'system' || n.type === 'info') type = 'study_reminder';

          const mapped: AppNotification = {
            id: n.id,
            type,
            title: n.title,
            message: n.message,
            isRead: n.is_read ?? false,
            createdAt: new Date(n.created_at || Date.now()).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            targetId,
            payload: pl,
          };
          addNotification(mapped);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, addNotification]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRealNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationPress = async (item: AppNotification) => {
    // 1. Mark as read locally and remote
    markNotificationAsRead(item.id);
    notificationsApi.markAsRead(item.id);

    // 2. Deep navigation based on notification target or type
    const payload = item.payload;
    const noteId = item.targetId || (payload?.note_id as string | undefined);
    const chatId = payload?.chat_id as string | undefined;

    if (noteId) {
      router.push(`/notes/${noteId}`);
    } else if (chatId) {
      router.push(`/chat/${chatId}`);
    } else if (item.type === 'doc_processed' || item.type === 'upload_failed') {
      router.push('/(tabs)/notes');
    } else if (item.type === 'study_reminder' || item.type === 'lecturer') {
      router.push('/(tabs)/lecturer');
    } else {
      router.push('/(tabs)/notes');
    }
  };

  const handleMarkAllRead = async () => {
    markAllNotificationsAsRead();
    if (user?.id) {
      await notificationsApi.markAllAsRead(user.id);
    }
  };

  const handleClearAll = async () => {
    Alert.alert('Clear All', 'Are you sure you want to clear all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          clearNotifications();
          if (user?.id) {
            await notificationsApi.clearNotifications(user.id);
          }
        },
      },
    ]);
  };

  const getIconForType = (type: AppNotification['type']) => {
    switch (type) {
      case 'doc_processed':
        return <FileText size={20} color="#10B981" />;
      case 'upload_failed':
        return <AlertTriangle size={20} color="#EF4444" />;
      case 'study_reminder':
        return <Clock size={20} color="#3B82F6" />;
      case 'lecturer':
        return <Headphones size={20} color="#8B5CF6" />;
      default:
        return <Bell size={20} color={theme.colors.primary} />;
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.backButton,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <ArrowLeft size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={[theme.typography.h1, { color: theme.colors.textPrimary }]}>
              Notifications
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary },
              ]}
            >
              {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All caught up'}
            </Text>
          </View>
        </View>

        {/* Action Controls */}
        {notifications.length > 0 && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={handleMarkAllRead}
              style={[
                styles.actionChip,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <CheckCheck size={16} color={theme.colors.primary} />
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.primary, fontWeight: '600', marginLeft: 6 },
                ]}
              >
                Mark All Read
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClearAll}
              style={[
                styles.actionChip,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <Trash2 size={16} color="#EF4444" />
              <Text
                style={[
                  theme.typography.caption,
                  { color: '#EF4444', fontWeight: '600', marginLeft: 6 },
                ]}
              >
                Clear All
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Notifications List */}
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 12 }]}>
              Syncing notifications...
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Bell size={48} color={theme.colors.textTertiary} />
            <Text
              style={[
                theme.typography.h3,
                { color: theme.colors.textPrimary, marginTop: 16 },
              ]}
            >
              No Notifications
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 8 },
              ]}
            >
              You are all caught up! Study reminders and document processing updates will appear here.
            </Text>
          </Card>
        ) : (
          notifications.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleNotificationPress(item)}
              activeOpacity={0.8}
            >
              <Card
                style={[
                  styles.notificationCard,
                  {
                    backgroundColor: item.isRead
                      ? theme.colors.surface
                      : theme.isDark
                      ? '#1E293B'
                      : '#EFF6FF',
                    borderColor: item.isRead
                      ? theme.colors.surfaceBorder
                      : theme.colors.primary,
                    borderWidth: item.isRead ? 1 : 1.5,
                  },
                ]}
              >
                <View style={styles.notificationRow}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.colors.surfaceVariant },
                    ]}
                  >
                    {getIconForType(item.type)}
                  </View>

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          theme.typography.bodyBold,
                          {
                            color: theme.colors.textPrimary,
                            flex: 1,
                            fontWeight: item.isRead ? '600' : '700',
                          },
                        ]}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={[
                          theme.typography.caption,
                          { color: theme.colors.textTertiary, marginLeft: 8 },
                        ]}
                      >
                        {item.createdAt}
                      </Text>
                    </View>

                    <Text
                      style={[
                        theme.typography.body,
                        {
                          color: theme.colors.textSecondary,
                          marginTop: 4,
                          lineHeight: 20,
                        },
                      ]}
                    >
                      {item.message}
                    </Text>

                    {!item.isRead && (
                      <View style={styles.unreadRow}>
                        <View style={styles.unreadDot} />
                        <Text
                          style={[
                            theme.typography.caption,
                            { color: theme.colors.primary, fontWeight: '700', marginLeft: 4 },
                          ]}
                        >
                          Tap to view & dismiss
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
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
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  centerContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    marginTop: 40,
  },
  notificationCard: {
    padding: 16,
    marginBottom: 12,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
  },
});
