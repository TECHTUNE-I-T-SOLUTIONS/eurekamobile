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
  Gavel,
  CheckCircle2,
  AlertCircle,
  Lock,
  Mail,
  RotateCcw,
} from 'lucide-react-native';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const sections = [
    {
      title: '1. Agreement to Terms',
      icon: <Gavel size={20} color={theme.colors.primary} />,
      content:
        'By downloading, accessing, or using Eureka AI, you agree to be bound by these Terms of Service. If you do not agree, please do not use the application. These terms apply to all visitors, registered users, and subscribers.',
    },
    {
      title: '2. Educational AI Assistance',
      icon: <CheckCircle2 size={20} color="#10B981" />,
      content:
        'Eureka provides AI-assisted note summarization, voice tutoring, and quiz generation for educational reference. While our AI models strive for academic rigor, Eureka is an educational study aid and should not replace accredited coursework or medical/legal counsel.',
    },
    {
      title: '3. User Accounts & Security',
      icon: <Lock size={20} color="#F59E0B" />,
      content:
        'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized access to your account. Account credentials must not be shared.',
    },
    {
      title: '4. User Content & Intellectual Property',
      icon: <RotateCcw size={20} color="#6366F1" />,
      content:
        'You retain ownership of the study materials, notes, and documents you upload. By uploading materials, you grant Eureka a secure license to parse, index, and generate summaries solely to deliver your study experience.',
    },
    {
      title: '5. Acceptable Use Policy',
      icon: <AlertCircle size={20} color="#EF4444" />,
      content:
        'You agree not to upload harmful, infringing, or illegal material, attempt to reverse engineer the application, or disrupt the system or underlying AI APIs.',
    },
    {
      title: '6. Subscriptions & Billing',
      icon: <CheckCircle2 size={20} color="#3B82F6" />,
      content:
        'Paid subscriptions (Student Pro and Premium Power) grant enhanced AI request limits, voice lectures, and priority support. Billing is processed securely through Paystack and renews according to your selected billing period unless canceled.',
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
          Terms of Service
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Card style={[styles.heroCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <Text style={[theme.typography.caption, { color: theme.colors.primary, fontWeight: '700' }]}>
            LEGAL AGREEMENT
          </Text>
          <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginTop: 4 }]}>
            Eureka AI Terms of Use
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 6, lineHeight: 20 }]}>
            Please review these terms before using Eureka. By continuing to use the app, you agree to comply with and be bound by these conditions.
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
              Questions about our Terms?
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
              Contact support at legal@eureka.study
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
