import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
} from 'react-native-reanimated';
import { ArrowRight, Brain, Headphones, FileText, Zap } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/ui/Button';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/(auth)/onboarding');
  };

  const handleLogin = () => {
    router.push('/(auth)/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Background Gradient Effect */}
      <LinearGradient
        colors={theme.isDark ? ['#1e1b4b', '#0f172a', '#020617'] : ['#eff6ff', '#f8fafc', '#ffffff']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View entering={FadeInUp.duration(800).springify()} style={styles.headerContainer}>
        <View style={[styles.logoBadge, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.surfaceBorder }]}>
          <Image source={require('../../assets/logo.png')} style={styles.logoImage} />
        </View>
        <Text style={[theme.typography.h1, { color: theme.colors.textPrimary, textAlign: 'center', marginTop: 16 }]}>
          Eureka
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4, paddingHorizontal: 24 }]}>
          Your All-In-One AI Academic Companion & Lecturer
        </Text>
      </Animated.View>

      {/* Feature Highlights Cards */}
      <Animated.View entering={FadeInDown.delay(300).duration(800).springify()} style={styles.featuresContainer}>
        <View style={[styles.featureCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <View style={[styles.iconBox, { backgroundColor: '#3B82F620' }]}>
            <Brain size={24} color="#3B82F6" />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={[theme.typography.h4, { color: theme.colors.textPrimary }]}>AI Lecturer & RAG Chat</Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
              Chat with your course materials and listen to personalized lectures.
            </Text>
          </View>
        </View>

        <View style={[styles.featureCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <View style={[styles.iconBox, { backgroundColor: '#06B6D420' }]}>
            <FileText size={24} color="#06B6D4" />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={[theme.typography.h4, { color: theme.colors.textPrimary }]}>Smart Summaries</Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
              Instantly extract flashcards, key concepts, and formulas from PDFs & slides.
            </Text>
          </View>
        </View>

        <View style={[styles.featureCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <View style={[styles.iconBox, { backgroundColor: '#10B98120' }]}>
            <Headphones size={24} color="#10B981" />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={[theme.typography.h4, { color: theme.colors.textPrimary }]}>Voice & Hands-Free</Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
              Study on the go with ultra-realistic text-to-speech voice narration.
            </Text>
          </View>
        </View>

        <View style={[styles.featureCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder }]}>
          <View style={[styles.iconBox, { backgroundColor: '#F59E0B20' }]}>
            <Zap size={24} color="#F59E0B" />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={[theme.typography.h4, { color: theme.colors.textPrimary }]}>Flexible Pricing</Text>
            <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
              Free starter plan available. Upgrade to Pro or Premium anytime.
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Action Buttons */}
      <Animated.View entering={FadeInDown.delay(600).duration(800).springify()} style={styles.footerContainer}>
        <Button
          title="Get Started"
          onPress={handleGetStarted}
          size="lg"
          icon={<Zap size={20} color={theme.colors.primaryForeground} />}
          style={styles.primaryButton}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  logoImage: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
  },
  featuresContainer: {
    marginVertical: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  footerContainer: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    borderRadius: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
});
