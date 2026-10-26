import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Badge } from '../../src/components/ui/Badge';
import { CustomAlert } from '../../src/components/ui/CustomAlert';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useAppStore } from '../../src/store/useAppStore';
import {
  User,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Bell,
  Mail,
  Sliders,
  ChevronRight,
  Volume2,
  Mic,
  Gauge,
  Crown,
  Zap,
  ShieldCheck,
  FileText,
  Info,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { theme, themeMode, setThemeMode } = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const {
    explanationLevel,
    setExplanationLevel,
    speechSpeed,
    setSpeechSpeed,
    selectedVoice,
    setSelectedVoice,
    handsFreeEnabled,
    setHandsFreeEnabled,
    userPlan,
    notifications,
  } = useAppStore();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: 'success' | 'warning' | 'error' | 'info' | 'upgrade' | 'confirm';
    buttons?: any[];
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
  });

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  const displayName =
    user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Student User';
  const email = user?.email || 'student@eureka.edu';

  // Usage Progress Data based on Plan
  const requestsUsed = userPlan === 'free' ? 2 : userPlan === 'pro' ? 8 : 45;
  const requestsLimit = userPlan === 'free' ? 5 : userPlan === 'pro' ? 20 : 100;
  const usagePercentage = Math.min(100, Math.round((requestsUsed / requestsLimit) * 100));

  const speedOptions = [0.75, 1.0, 1.25, 1.5];
  const voiceOptions = [
    { id: 'Puck', label: 'Puck' },
    { id: 'Charon', label: 'Charon (M)' },
    { id: 'Kore', label: 'Kore (F)' },
    { id: 'Fenrir', label: 'Fenrir (M)' },
    { id: 'Aoede', label: 'Aoede (F)' },
  ];

  const planTitles = {
    free: 'Free Student Plan',
    pro: 'Pro Student Plan',
    premium: 'Premium Power Plan',
  };

  const planBadges = {
    free: 'Free Student 🎒',
    pro: 'Pro Student 👑',
    premium: 'Premium Power 🚀',
  };

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[theme.typography.h1, { color: theme.colors.textPrimary }]}>
            Profile & Settings
          </Text>
        </View>

        {/* User Card */}
        <Card style={styles.userCard}>
          <View style={styles.userRow}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: theme.colors.primary },
              ]}
            >
              <User size={32} color={theme.colors.primaryForeground} />
            </View>

            <View style={{ marginLeft: 16, flex: 1, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text
                  style={[
                    theme.typography.h2,
                    { color: theme.colors.textPrimary },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {displayName}
                </Text>
              </View>

              <Text
                style={[
                  theme.typography.body,
                  { color: theme.colors.textSecondary, marginTop: 2 },
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {email}
              </Text>

              <View style={{ flexDirection: 'row', marginTop: 8, alignItems: 'center', gap: 6 }}>
                <Badge
                  status={userPlan === 'free' ? 'pending' : 'completed'}
                  label={planBadges[userPlan]}
                />
              </View>
            </View>
          </View>
        </Card>

        {/* Subscription & Usage Progress Card */}
        <Text
          style={[
            theme.typography.h3,
            { color: theme.colors.textPrimary, marginTop: 20, marginBottom: 12 },
          ]}
        >
          Subscription & Usage
        </Text>

        <Card style={styles.subscriptionCard}>
          <View style={styles.planHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Crown size={20} color={userPlan === 'free' ? theme.colors.textSecondary : '#F59E0B'} />
              <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
                {planTitles[userPlan]}
              </Text>
            </View>
            <View style={[styles.activePill, { backgroundColor: userPlan === 'free' ? theme.colors.surfaceVariant : '#D1FAE5' }]}>
              <Text style={{ color: userPlan === 'free' ? theme.colors.textSecondary : '#059669', fontSize: 11, fontWeight: '700' }}>
                {userPlan === 'free' ? 'Starter' : 'Active'}
              </Text>
            </View>
          </View>

          {/* Usage Progress Indicator */}
          <View style={{ marginTop: 14 }}>
            <View style={styles.progressLabelRow}>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                AI Requests Usage
              </Text>
              <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '700' }]}>
                {requestsUsed} / {requestsLimit} Used ({usagePercentage}%)
              </Text>
            </View>

            <View style={[styles.progressBarTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${usagePercentage}%`,
                    backgroundColor: usagePercentage > 80 ? '#EF4444' : theme.colors.primary,
                  },
                ]}
              />
            </View>
          </View>

          {/* Prominent Upgrade Plan Button */}
          <Button
            title={userPlan === 'free' ? 'Upgrade to Pro or Premium' : 'Manage Subscription / Upgrade'}
            onPress={() => router.push('/subscription')}
            icon={<Zap size={18} color="#FFFFFF" />}
            style={styles.upgradeButton}
          />
        </Card>

        {/* Notifications Quick Access Card */}
        <TouchableOpacity
          onPress={() => router.push('/notifications')}
          activeOpacity={0.8}
          style={{ marginTop: 20 }}
        >
          <Card style={styles.notifAccessCard}>
            <View style={styles.settingRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Bell size={22} color={theme.colors.primary} />
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                    Notifications Center
                  </Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                    {unreadNotifsCount > 0 ? `${unreadNotifsCount} unread alerts` : 'All caught up'}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 8 }}>
                {unreadNotifsCount > 0 && (
                  <View style={styles.badgeCount}>
                    <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>
                      {unreadNotifsCount}
                    </Text>
                  </View>
                )}
                <ChevronRight size={20} color={theme.colors.textTertiary} style={{ marginLeft: 8 }} />
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        {/* Theme Preferences */}
        <Text
          style={[
            theme.typography.h3,
            { color: theme.colors.textPrimary, marginTop: 24, marginBottom: 12 },
          ]}
        >
          Appearance
        </Text>

        <Card style={{ padding: 12 }}>
          <View style={styles.themeOptionsRow}>
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Monitor },
            ].map((item) => {
              const IconComponent = item.icon;
              const isSelected = themeMode === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setThemeMode(item.id as any)}
                  style={[
                    styles.themeOptionChip,
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
                  <IconComponent
                    size={18}
                    color={
                      isSelected
                        ? theme.colors.primaryForeground
                        : theme.colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      theme.typography.bodyBold,
                      {
                        color: isSelected
                          ? theme.colors.primaryForeground
                          : theme.colors.textPrimary,
                        marginLeft: 6,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Study & AI Settings */}
        <Text
          style={[
            theme.typography.h3,
            { color: theme.colors.textPrimary, marginTop: 24, marginBottom: 12 },
          ]}
        >
          Study & AI Preferences
        </Text>

        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Sliders size={20} color={theme.colors.secondary} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  Explanation Level
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  Current: {explanationLevel.toUpperCase()}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                const nextLvl =
                  explanationLevel === 'beginner'
                    ? 'intermediate'
                    : explanationLevel === 'intermediate'
                    ? 'advanced'
                    : 'beginner';
                setExplanationLevel(nextLvl);
              }}
              style={[
                styles.levelPill,
                {
                  backgroundColor: theme.colors.secondaryLight,
                  borderColor: theme.colors.secondary,
                },
              ]}
            >
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.secondary, fontWeight: '700' },
                ]}
              >
                Change
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Speech Playback Preferences */}
        <Text
          style={[
            theme.typography.h3,
            { color: theme.colors.textPrimary, marginTop: 24, marginBottom: 12 },
          ]}
        >
          Speech & Voice Lecturer Preferences
        </Text>

        <Card style={styles.settingCard}>
          {/* Hands-free mode switch */}
          <View style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Mic size={20} color={theme.colors.primary} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  Hands-Free Voice Mode
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  Continuous listening
                </Text>
              </View>
            </View>

            <Switch
              value={handsFreeEnabled}
              onValueChange={setHandsFreeEnabled}
              trackColor={{ false: theme.colors.surfaceBorder, true: theme.colors.primary }}
            />
          </View>

          {/* Voice Selection */}
          <View style={[styles.settingRow, { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.surfaceBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Volume2 size={20} color={theme.colors.primary} />
              <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginLeft: 12 }]}>
                Lecturer Voice
              </Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '60%' }}>
              {voiceOptions.map((v) => {
                const isSelected =
                  selectedVoice === v.id ||
                  (selectedVoice === 'default' && v.id === 'Puck') ||
                  (selectedVoice === 'male' && v.id === 'Charon') ||
                  (selectedVoice === 'female' && v.id === 'Kore');
                return (
                  <TouchableOpacity
                    key={v.id}
                    onPress={() => setSelectedVoice(v.id)}
                    style={[
                      styles.smallChip,
                      {
                        backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceVariant,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.surfaceBorder,
                        marginTop: 4,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        theme.typography.caption,
                        {
                          color: isSelected ? theme.colors.primaryForeground : theme.colors.textPrimary,
                          fontWeight: isSelected ? '700' : '400',
                        },
                      ]}
                    >
                      {v.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Speech Speed Selector */}
          <View style={[styles.settingRow, { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.surfaceBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Gauge size={20} color={theme.colors.primary} />
              <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginLeft: 12 }]}>
                Speed ({speechSpeed}x)
              </Text>
            </View>

            <View style={{ flexDirection: 'row' }}>
              {speedOptions.map((spd) => {
                const isSelected = speechSpeed === spd;
                return (
                  <TouchableOpacity
                    key={spd}
                    onPress={() => setSpeechSpeed(spd)}
                    style={[
                      styles.speedChip,
                      {
                        backgroundColor: isSelected ? theme.colors.primary : theme.colors.surfaceVariant,
                        borderColor: isSelected ? theme.colors.primary : theme.colors.surfaceBorder,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        theme.typography.caption,
                        {
                          color: isSelected ? theme.colors.primaryForeground : theme.colors.textPrimary,
                          fontWeight: isSelected ? '700' : '400',
                        },
                      ]}
                    >
                      {spd}x
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </Card>

        {/* Notifications */}
        <Text
          style={[
            theme.typography.h3,
            { color: theme.colors.textPrimary, marginTop: 24, marginBottom: 12 },
          ]}
        >
          Push & Alerts
        </Text>

        <Card style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Bell size={20} color={theme.colors.primary} />
              <Text
                style={[
                  theme.typography.bodyBold,
                  { color: theme.colors.textPrimary, marginLeft: 12 },
                ]}
                numberOfLines={1}
              >
                Push Notifications
              </Text>
            </View>

            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: theme.colors.surfaceBorder, true: theme.colors.primary }}
            />
          </View>

          <View style={[styles.settingRow, { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.surfaceBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Mail size={20} color={theme.colors.primary} />
              <Text
                style={[
                  theme.typography.bodyBold,
                  { color: theme.colors.textPrimary, marginLeft: 12 },
                ]}
                numberOfLines={1}
              >
                Email Digest & Summaries
              </Text>
            </View>

            <Switch
              value={emailNotifs}
              onValueChange={setEmailNotifs}
              trackColor={{ false: theme.colors.surfaceBorder, true: theme.colors.primary }}
            />
          </View>
        </Card>

        {/* Legal & Privacy Section */}
        <Text
          style={[
            theme.typography.h3,
            { color: theme.colors.textPrimary, marginTop: 24, marginBottom: 12 },
          ]}
        >
          Legal & Privacy
        </Text>

        <Card style={styles.settingCard}>
          <TouchableOpacity
            onPress={() => router.push('/legal/terms')}
            activeOpacity={0.7}
            style={styles.settingRow}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <FileText size={20} color={theme.colors.primary} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  Terms of Service
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  User agreement & policies
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={theme.colors.textTertiary} />
          </TouchableOpacity>

          <View style={[styles.settingRow, { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.surfaceBorder }]}>
            <TouchableOpacity
              onPress={() => router.push('/legal/privacy')}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            >
              <ShieldCheck size={20} color="#10B981" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  Privacy Policy
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  How we protect your study data
                </Text>
              </View>
            </TouchableOpacity>
            <ChevronRight size={20} color={theme.colors.textTertiary} />
          </View>

          <View style={[styles.settingRow, { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.surfaceBorder }]}>
            <TouchableOpacity
              onPress={() => router.push('/about')}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
            >
              <Info size={20} color="#8B5CF6" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  About Eureka AI
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  Mission, features & app architecture
                </Text>
              </View>
            </TouchableOpacity>
            <ChevronRight size={20} color={theme.colors.textTertiary} />
          </View>
        </Card>

        {/* Logout Button */}
        <Button
          title="Sign Out"
          onPress={() => {
            setAlertConfig({
              visible: true,
              title: 'Sign Out of Eureka',
              message: 'This will clear your local session and secure credentials. Are you sure you want to sign out?',
              type: 'confirm',
              buttons: [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Sign Out',
                  style: 'destructive',
                  onPress: async () => {
                    await signOut();
                    router.replace('/(auth)/login');
                  },
                },
              ],
            });
          }}
          variant="outline"
          size="lg"
          style={styles.signOutButton}
          icon={<LogOut size={18} color={theme.colors.statusError} />}
        />
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            Version: 1.0.2
          </Text>
        </View>

      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
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
    marginBottom: 16,
  },
  userCard: {
    padding: 16,
  },
  subscriptionCard: {
    padding: 16,
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  upgradeButton: {
    marginTop: 16,
    backgroundColor: '#2563EB',
  },
  notifAccessCard: {
    padding: 16,
  },
  badgeCount: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themeOptionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  themeOptionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  settingCard: {
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  smallChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 4,
  },
  speedChip: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 4,
  },
  signOutButton: {
    marginTop: 32,
    borderColor: '#DC2626',
  },
});
