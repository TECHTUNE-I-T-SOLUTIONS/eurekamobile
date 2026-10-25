import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/context/ThemeContext';
import { useAppStore, AppState } from '../../src/store/useAppStore';
import { BookOpen, Headphones, MessageSquareCode, Sparkles, Crown } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
}

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const setHasCompletedOnboarding = useAppStore(
    (state: AppState) => state.setHasCompletedOnboarding
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const slides: Slide[] = [
    {
      id: '1',
      title: 'Smart AI Note Summaries',
      subtitle:
        'Upload lecture slides, transcripts, or notes. Eureka automatically extracts key concepts, formulas, and flashcards.',
      icon: <BookOpen size={64} color="#3B82F6" />,
      accentColor: '#3B82F6',
    },
    {
      id: '2',
      title: 'Interactive AI Lecturer',
      subtitle:
        'Listen to personalized voice lectures. Select explanation levels from Beginner to Advanced with real-time Q&A.',
      icon: <Headphones size={64} color="#06B6D4" />,
      accentColor: '#06B6D4',
    },
    {
      id: '3',
      title: 'Smart RAG Study Chat',
      subtitle:
        'Chat directly with your uploaded course materials. Get verified answers cited straight from your lecture notes.',
      icon: <MessageSquareCode size={64} color="#10B981" />,
      accentColor: '#10B981',
    },
    {
      id: '4',
      title: 'Flexible Plans for Students',
      subtitle:
        'Start free with 2 requests per note, or upgrade to Pro (₦5,000/mo - 10 requests) or Premium (₦15,000/mo - Unlimited) anytime.',
      icon: <Crown size={64} color="#F59E0B" />,
      accentColor: '#F59E0B',
    },
  ];

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      finishOnboarding();
    }
  };

  const finishOnboarding = async () => {
    await setHasCompletedOnboarding(true);
    router.replace('/(auth)/login');
  };

  return (
    <ScreenWrapper style={{ backgroundColor: theme.colors.background }}>
      {/* Top Header with Brand & Skip */}
      <View style={styles.header}>
        <View style={styles.brandContainer}>
          <Sparkles size={24} color={theme.colors.primary} />
          <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
            Eureka
          </Text>
        </View>

        <TouchableOpacity onPress={finishOnboarding} style={styles.skipButton}>
          <Text style={[theme.typography.bodyBold, { color: theme.colors.textSecondary }]}>
            Skip
          </Text>
        </TouchableOpacity>
      </View>

      {/* Slide Carousel */}
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        renderItem={({ item }) => (
          <View style={[styles.slideContainer, { width }]}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: theme.isDark ? '#1E293B' : '#EFF6FF',
                  borderColor: theme.colors.surfaceBorder,
                },
              ]}
            >
              {item.icon}
            </View>

            <Text style={[theme.typography.h1, styles.title, { color: theme.colors.textPrimary }]}>
              {item.title}
            </Text>

            <Text
              style={[
                theme.typography.body,
                styles.subtitle,
                { color: theme.colors.textSecondary },
              ]}
            >
              {item.subtitle}
            </Text>
          </View>
        )}
      />

      {/* Pagination Dots & Bottom Action */}
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === currentIndex
                      ? theme.colors.primary
                      : theme.colors.surfaceBorder,
                  width: index === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Button
          title={currentIndex === slides.length - 1 ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          size="lg"
          style={styles.actionButton}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipButton: {
    padding: 8,
  },
  slideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 12,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  actionButton: {
    width: '100%',
  },
});
