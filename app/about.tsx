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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '../src/components/ui/ScreenWrapper';
import { Card } from '../src/components/ui/Card';
import { Badge } from '../src/components/ui/Badge';
import { useTheme } from '../src/context/ThemeContext';
import {
  ArrowLeft,
  Sparkles,
  BookOpen,
  Mic,
  GraduationCap,
  ShieldCheck,
  Globe,
  Share2,
  MessageSquare,
  Award,
  Layers,
  ChevronRight,
  Cpu,
  Smartphone,
  HardDrive,
  Wifi,
  Notebook,
  Book,
} from 'lucide-react-native';

const APP_SHARE_URL = 'http://eureka.vercel.app/app';
const WEBSITE_URL = 'http://eureka.vercel.app/';
const WHATSAPP_PHONE = '2348109816653';

export default function AboutScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Entrance and subtle breathing animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const scalePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Gentle pulse animation on app icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(scalePulse, {
          toValue: 1.04,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scalePulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'Eureka AI - Study & Lecture Companion',
        message:
          'Supercharge your study sessions with Eureka AI! Convert lecture notes & PDFs into crystal-clear summaries, multi-tier breakdowns, interactive voice audio, and practice exams:\n' +
          APP_SHARE_URL,
        url: APP_SHARE_URL,
      });
    } catch {
      // Ignored
    }
  };

  const handleOpenWebsite = () => {
    Linking.openURL(WEBSITE_URL);
  };

  const handleWhatsAppFeedback = () => {
    const defaultMsg = encodeURIComponent(
      'Hello Eureka Team, I am using the Eureka Mobile App (v1.0.1) and would love to share my feedback / thoughts:'
    );
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${defaultMsg}`;
    Linking.openURL(whatsappUrl);
  };

  const features = [
    {
      icon: <Book size={20} color={theme.colors.secondary} />,
      bg: isDark ? 'rgba(59, 130, 246, 0.15)' : theme.colors.secondaryLight,
      title: 'Contextual Note Synthesis',
      description:
        'Upload course PDFs and study documents. Eureka breaks them into structured semantic chunks with executive summaries and essential takeaways.',
    },
    {
      icon: <Mic size={20} color={theme.colors.secondary} />,
      bg: isDark ? 'rgba(59, 130, 246, 0.15)' : theme.colors.secondaryLight,
      title: 'Voice Lecturer & Audio Playback',
      description:
        'Listen to full audio walkthroughs of your lecture notes on the go. Choose from natural voices and control playback speeds to fit your study pace.',
    },
    {
      icon: <GraduationCap size={20} color={theme.colors.accentEmerald} />,
      bg: isDark ? 'rgba(16, 185, 129, 0.15)' : theme.colors.statusCompletedBg,
      title: 'Standardized Practice Exams',
      description:
        'Generate 10 university-standard practice questions scoped directly to your notes with instant scoring, feedback, and academic explanations.',
    },
    {
      icon: <Layers size={20} color={theme.colors.statusProcessing} />,
      bg: isDark ? 'rgba(217, 119, 6, 0.15)' : theme.colors.statusProcessingBg,
      title: 'Multi-Level Explanations',
      description:
        'Switch smoothly between Beginner (everyday analogies), Intermediate (frameworks & principles), and Advanced (mathematical rigor) levels.',
    },
    {
      icon: <BookOpen size={20} color={theme.colors.secondary} />,
      bg: isDark ? 'rgba(59, 130, 246, 0.15)' : theme.colors.secondaryLight,
      title: 'Grounded Note Chat',
      description:
        'Ask questions directly about your uploaded material with factual, note-scoped answers designed specifically to prevent hallucinations.',
    },
    {
      icon: <ShieldCheck size={20} color={theme.colors.accentEmerald} />,
      bg: isDark ? 'rgba(16, 185, 129, 0.15)' : theme.colors.statusCompletedBg,
      title: 'Academic Privacy & Security',
      description:
        'Your academic materials, lecture notes, and study files are protected with industry-standard encryption and kept strictly confidential.',
    },
  ];

  const systemRequirements = [
    {
      icon: <Smartphone size={16} color={theme.colors.secondary} />,
      label: 'Operating System',
      value: 'Android 10.0+ / iOS 15.0+',
    },
    {
      icon: <HardDrive size={16} color={theme.colors.secondary} />,
      label: 'Storage Space',
      value: '50 MB free disk space',
    },
    {
      icon: <Wifi size={16} color={theme.colors.secondary} />,
      label: 'Connectivity',
      value: 'Active Internet (Wi-Fi or Mobile Data)',
    },
    {
      icon: <Cpu size={16} color={theme.colors.secondary} />,
      label: 'Supported Formats',
      value: 'PDF, TXT & MD files',
    },
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
          About Eureka
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom, 24) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Hero Branding Banner */}
          <LinearGradient
            colors={
              isDark
                ? [theme.colors.surface, theme.colors.background]
                : [theme.colors.secondaryLight, theme.colors.surface]
            }
            style={[styles.heroBanner, { borderColor: theme.colors.surfaceBorder, borderWidth: 1 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {/* Animated Logo Container */}
            <Animated.View style={[styles.logoWrapper, { transform: [{ scale: scalePulse }] }]}>
              <View
                style={[
                  styles.logoBox,
                  {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.surfaceBorder,
                  },
                ]}
              >
                <Image
                  source={require('../assets/logo-removebg-preview.png')}
                  style={styles.appIcon}
                  resizeMode="contain"
                />
              </View>
            </Animated.View>

            <View style={{ alignItems: 'center', marginTop: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[theme.typography.h1, { color: theme.colors.textPrimary, fontWeight: '800' }]}>
                  Eureka
                </Text>
              </View>
              <View style={{ marginLeft: 8 }}>
                <Badge variant="secondary" label="v1.0.1" />
              </View>
              <Text style={[styles.heroSubtitle, { color: theme.colors.textSecondary }]}>
                Intelligent Study Companion & AI Lecturer
              </Text>

              <View
                style={[
                  styles.taglinePill,
                  {
                    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : theme.colors.secondaryLight,
                    borderColor: theme.colors.surfaceBorder,
                  },
                ]}
              >
                <Notebook size={14} color={theme.colors.secondary} />
                <Text style={[styles.taglineText, { color: theme.colors.secondary }]}>
                  Master Coursework with Clarity
                </Text>
              </View>
            </View>
          </LinearGradient>

          {/* Mission & Purpose */}
          <Card style={[styles.cardSection, { marginTop: 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Award size={20} color={theme.colors.primary} />
              <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
                Purpose & Vision
              </Text>
            </View>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, lineHeight: 22 }]}>
              Eureka is built to empower students and professionals to master demanding academic material. By condensing course documents into clear summaries, multi-tiered conceptual explanations, interactive voice lectures, and practice examinations, Eureka helps you understand deeper and study more effectively.
            </Text>
          </Card>

          {/* Core Features */}
          <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginTop: 24, marginBottom: 12 }]}>
            What Eureka Offers
          </Text>

          <View style={{ gap: 12 }}>
            {features.map((item, index) => (
              <Card key={index} style={styles.featureCard}>
                <View style={[styles.featureIconBox, { backgroundColor: item.bg }]}>
                  {item.icon}
                </View>
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginBottom: 3 }]}>
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
              style={[
                styles.actionBtn,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
              ]}
              activeOpacity={0.7}
            >
              <Share2 size={18} color={theme.colors.secondary} />
              <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
                Share App
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenWebsite}
              style={[
                styles.actionBtn,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
              ]}
              activeOpacity={0.7}
            >
              <Globe size={18} color={theme.colors.accentEmerald} />
              <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
                Website
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleWhatsAppFeedback}
              style={[
                styles.actionBtn,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder },
              ]}
              activeOpacity={0.7}
            >
              <MessageSquare size={18} color={theme.colors.statusProcessing} />
              <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
                Feedback
              </Text>
            </TouchableOpacity>
          </View>

          {/* System & Hardware Requirements */}
          <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginTop: 24, marginBottom: 12 }]}>
            System Requirements
          </Text>

          <Card style={styles.specsCard}>
            {systemRequirements.map((req, index) => (
              <View
                key={index}
                style={[
                  styles.specRow,
                  index > 0 && {
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.surfaceBorder,
                    paddingTop: 12,
                    marginTop: 12,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {req.icon}
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginLeft: 8 }]}>
                    {req.label}
                  </Text>
                </View>
                <Text style={[theme.typography.caption, { color: theme.colors.textPrimary, fontWeight: '700' }]}>
                  {req.value}
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

          {/* Professional Footer */}
          <View style={styles.footer}>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, fontWeight: '600' }]}>
              Eureka Academic Technologies
            </Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginTop: 4, textAlign: 'center' }]}>
              © 2026 Eureka. All rights reserved.
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
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  logoWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  logoBox: {
    width: 84,
    height: 84,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 1,
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
    borderWidth: 1,
  },
  taglineText: {
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
    width: 42,
    height: 42,
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
