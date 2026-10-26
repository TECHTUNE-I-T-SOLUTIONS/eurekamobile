import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Linking,
  Share,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '../src/components/ui/ScreenWrapper';
import { Card } from '../src/components/ui/Card';
import { Button } from '../src/components/ui/Button';
import { Badge } from '../src/components/ui/Badge';
import { useTheme } from '../src/context/ThemeContext';
import {
  ArrowLeft,
  Sparkles,
  BookOpen,
  Mic,
  GraduationCap,
  ShieldCheck,
  Zap,
  Globe,
  Share2,
  Mail,
  Heart,
  Award,
  Layers,
  ChevronRight,
  ExternalLink,
  Cpu,
} from 'lucide-react-native';

export default function AboutScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scalePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle gentle pulse on the logo icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(scalePulse, {
          toValue: 1.05,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(scalePulse, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'Eureka AI - Supercharge Your Academic Success',
        message:
          'Transform your lectures and study documents into crystal-clear executive summaries, multi-level breakdowns, interactive voice tutoring, and exam-grade practice quizzes with Eureka AI! 🚀',
        url: 'https://eureka.techtune.com.ng',
      });
    } catch (e) {
      // Ignore dismiss
    }
  };

  const handleOpenWebsite = () => {
    Linking.openURL('https://eureka.techtune.com.ng');
  };

  const handleSendFeedback = () => {
    Linking.openURL('mailto:support@techtune.com.ng?subject=Eureka%20Mobile%20Feedback');
  };

  const features = [
    {
      icon: <Sparkles size={22} color="#3B82F6" />,
      bg: 'rgba(59, 130, 246, 0.12)',
      title: 'Contextual AI Note Synthesis',
      description:
        'Upload course PDFs, slides, and transcripts. Eureka segments your material into semantic chunks with executive summaries and key takeaway points.',
    },
    {
      icon: <Mic size={22} color="#8B5CF6" />,
      bg: 'rgba(139, 92, 246, 0.12)',
      title: 'Voice Lecturer & Hands-Free Audio',
      description:
        'Listen to full lecture breakdowns on the go. Switch between distinct natural voices and adjust reading cadence to fit your study habits.',
    },
    {
      icon: <GraduationCap size={22} color="#10B981" />,
      bg: 'rgba(16, 185, 129, 0.12)',
      title: 'Adaptive Exam Practice Questions',
      description:
        'Generate 10 university-standard practice questions scoped directly to your notes with instant scoring, feedback, and in-depth academic explanations.',
    },
    {
      icon: <Layers size={22} color="#F59E0B" />,
      bg: 'rgba(245, 158, 11, 0.12)',
      title: 'Multi-Tier Explanation Levels',
      description:
        'Switch seamlessly between Beginner (analogies), Intermediate (core frameworks), and Advanced (mathematical rigor and derivations) at any time.',
    },
    {
      icon: <Cpu size={22} color="#EC4899" />,
      bg: 'rgba(236, 72, 153, 0.12)',
      title: 'Instant Note-Scoped AI Chat',
      description:
        'Have intelligent, grounded Q&A conversations that cite and pull directly from your uploaded materials without hallucinating outside context.',
    },
    {
      icon: <ShieldCheck size={22} color="#06B6D4" />,
      bg: 'rgba(6, 182, 212, 0.12)',
      title: 'Bank-Grade Academic Privacy',
      description:
        'Your academic notes and private uploads remain strictly confidential and protected with enterprise encryption. Your data is never sold.',
    },
  ];

  const techSpecs = [
    { label: 'Application Version', value: '1.0.1 (Build 2026.1)' },
    { label: 'AI Architecture', value: 'Eureka Hybrid RAG + Voice Engine' },
    { label: 'Framework & Engine', value: 'React Native 0.88 + Expo 58' },
    { label: 'Cloud Infrastructure', value: 'Supabase Enterprise + Edge CDN' },
    { label: 'Target Platforms', value: 'Android 10+ & iOS 15+' },
  ];

  return (
    <ScreenWrapper>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: theme.colors.surfaceVariant }]}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginLeft: 12 }]}>
          About Eureka AI
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.contentContainer, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Hero Branding Banner */}
          <LinearGradient
            colors={isDark ? ['#1E1B4B', '#0F172A'] : ['#EEF2FF', '#E0E7FF']}
            style={styles.heroBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Animated Logo Container */}
            <Animated.View style={[styles.logoWrapper, { transform: [{ scale: scalePulse }] }]}>
              <LinearGradient
                colors={['#2563EB', '#7C3AED']}
                style={styles.logoGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Image
                  source={require('../assets/logo-removebg-preview.png')}
                  style={styles.appIcon}
                  resizeMode="contain"
                />
              </LinearGradient>
            </Animated.View>

            <View style={{ alignItems: 'center', marginTop: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[theme.typography.h1, { color: theme.colors.textPrimary, fontWeight: '800' }]}>
                  Eureka AI
                </Text>
                <Badge variant="secondary" label="v1.0.1" />
              </View>
              <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
                The Intelligent AI Study Companion & Virtual Lecturer
              </Text>

              <View style={styles.taglinePill}>
                <Sparkles size={14} color="#2563EB" />
                <Text style={styles.taglineText}>Master Any Subject in Record Time</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Mission Statement Card */}
          <Card style={[styles.cardSection, { marginTop: 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Award size={20} color={theme.colors.primary} />
              <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
                Our Mission
              </Text>
            </View>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 22 }]}>
              Eureka AI is engineered to democratize elite academic mentorship. By transforming passive, lengthy lecture notes and dense course PDFs into dynamic voice lectures, contextual flash quizzes, and tiered explanations, we empower learners to learn faster, retain deeper, and excel in every examination.
            </Text>
          </Card>

          {/* Core Superpowers Grid */}
          <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginTop: 24, marginBottom: 12 }]}>
            What Eureka AI Does
          </Text>

          <View style={{ gap: 12 }}>
            {features.map((item, index) => (
              <Card key={index} style={styles.featureCard}>
                <View style={[styles.featureIconBox, { backgroundColor: item.bg }]}>
                  {item.icon}
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginBottom: 4 }]}>
                    {item.title}
                  </Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, lineHeight: 18 }]}>
                    {item.description}
                  </Text>
                </View>
              </Card>
            ))}
          </View>

          {/* Quick Action Buttons */}
          <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginTop: 24, marginBottom: 12 }]}>
            Connect & Share
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={handleShare}
              style={[styles.actionBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
              activeOpacity={0.7}
            >
              <Share2 size={18} color={theme.colors.primary} />
              <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
                Share App
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenWebsite}
              style={[styles.actionBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
              activeOpacity={0.7}
            >
              <Globe size={18} color="#10B981" />
              <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
                Website
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSendFeedback}
              style={[styles.actionBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}
              activeOpacity={0.7}
            >
              <Mail size={18} color="#F59E0B" />
              <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
                Feedback
              </Text>
            </TouchableOpacity>
          </View>

          {/* Technical Specifications */}
          <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginTop: 24, marginBottom: 12 }]}>
            System & Specifications
          </Text>

          <Card style={styles.specsCard}>
            {techSpecs.map((spec, index) => (
              <View
                key={index}
                style={[
                  styles.specRow,
                  index > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.surfaceBorder, paddingTop: 10, marginTop: 10 },
                ]}
              >
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  {spec.label}
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textPrimary, fontWeight: '700' }]}>
                  {spec.value}
                </Text>
              </View>
            ))}
          </Card>

          {/* Legal Navigation Links */}
          <Card style={[styles.legalCard, { marginTop: 16 }]}>
            <TouchableOpacity
              onPress={() => router.push('/legal/terms')}
              style={styles.legalRow}
              activeOpacity={0.7}
            >
              <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>
                Terms of Service
              </Text>
              <ChevronRight size={18} color={theme.colors.textTertiary} />
            </TouchableOpacity>

            <View style={{ height: 1, backgroundColor: theme.colors.surfaceBorder, marginVertical: 10 }} />

            <TouchableOpacity
              onPress={() => router.push('/legal/privacy')}
              style={styles.legalRow}
              activeOpacity={0.7}
            >
              <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>
                Privacy Policy
              </Text>
              <ChevronRight size={18} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          </Card>

          {/* Footer Copyright */}
          <View style={styles.footer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                Crafted with{' '}
              </Text>
              <Heart size={12} color="#EF4444" fill="#EF4444" />
              <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                {' '}by TECHTUNE IT SOLUTIONS
              </Text>
            </View>
            <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginTop: 4, textAlign: 'center' }]}>
              © 2026 Eureka AI. All rights reserved.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  heroBanner: {
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoWrapper: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  logoGradient: {
    width: 88,
    height: 88,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  appIcon: {
    width: '100%',
    height: '100%',
  },
  heroSubtitle: {
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  taglinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  taglineText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
  cardSection: {
    padding: 18,
    borderRadius: 18,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  specsCard: {
    padding: 16,
    borderRadius: 18,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legalCard: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  footer: {
    marginTop: 28,
    alignItems: 'center',
    paddingBottom: 16,
  },
});
