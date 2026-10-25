import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Card } from '../../src/components/ui/Card';
import { useTheme } from '../../src/context/ThemeContext';
import {
  ArrowLeft,
  Shield,
  Eye,
  Lock,
  Database,
  UserCheck,
  Mail,
} from 'lucide-react-native';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const sections = [
    {
      title: '1. Information We Collect',
      icon: <Eye size={20} color={theme.colors.primary} />,
      content:
        'We collect your account email address, authentication credentials, uploaded study notes (PDFs, text, markdown transcripts), and interaction logs with the AI Lecturer to personalize your study experience.',
    },
    {
      title: '2. How Your Study Data is Used',
      icon: <Database size={20} color="#10B981" />,
      content:
        'Your notes and documents are processed using secure retrieval-augmented generation (RAG) to generate summaries, study answers, and voice lectures. We do not sell your academic content or personal data to third parties.',
    },
    {
      title: '3. Data Security & Storage',
      icon: <Lock size={20} color="#F59E0B" />,
      content:
        'All data is encrypted in transit using TLS/SSL and stored securely in encrypted databases. Sensitive credentials and auth tokens on your phone are protected by native secure hardware storage (Expo SecureStore).',
    },
    {
      title: '4. Voice & Speech Processing',
      icon: <Shield size={20} color="#6366F1" />,
      content:
        'Voice interaction queries and dictation are processed securely for real-time speech-to-text and AI lecture audio synthesis. Audio recordings are not used for advertising or persistent tracking.',
    },
    {
      title: '5. Your Rights & Control',
      icon: <UserCheck size={20} color="#3B82F6" />,
      content:
        'You have full control over your study library. You can delete individual notes, clear conversation history, or request full account deletion at any time from your Profile settings.',
    },
  ];

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          <ArrowLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[theme.typography.h2, { color: theme.colors.textPrimary, marginLeft: 12 }]}>
          Privacy Policy
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Card style={[styles.heroCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <Text style={[theme.typography.caption, { color: '#10B981', fontWeight: '700' }]}>
            YOUR PRIVACY MATTERS
          </Text>
          <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginTop: 4 }]}>
            Eureka AI Privacy Notice
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 6, lineHeight: 20 }]}>
            We are dedicated to safeguarding your personal data and keeping your academic materials completely confidential.
          </Text>
          <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginTop: 8 }]}>
            Last updated: October 2026
          </Text>
        </Card>

        {sections.map((sec, idx) => (
          <Card
            key={idx}
            style={[styles.sectionCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              {sec.icon}
              <Text style={[theme.typography.h4, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
                {sec.title}
              </Text>
            </View>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 21 }]}>
              {sec.content}
            </Text>
          </Card>
        ))}

        <Card style={[styles.contactCard, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.surfaceBorder }]}>
          <Mail size={20} color={theme.colors.primary} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary }]}>
              Privacy Concerns or Inquiries?
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
              Reach our Data Protection Officer at privacy@eureka.study
            </Text>
          </View>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  heroCard: {
    padding: 18,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
});
