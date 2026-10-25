import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onAnimationComplete?: () => void;
}

export const AnimatedSplashScreen: React.FC<AnimatedSplashScreenProps> = ({
  onAnimationComplete,
}) => {
  // Animation values
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const ring1Scale = useRef(new Animated.Value(0.8)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;

  const ring2Scale = useRef(new Animated.Value(0.6)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;

  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(20)).current;

  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Logo and rings entrance
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(ring1Opacity, {
        toValue: 0.5,
        duration: 800,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.timing(ring2Opacity, {
        toValue: 0.3,
        duration: 1000,
        delay: 350,
        useNativeDriver: true,
      }),
      // 2. Text entrance
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        delay: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(textTranslateY, {
        toValue: 0,
        friction: 7,
        tension: 40,
        delay: 400,
        useNativeDriver: true,
      }),
      // 3. Bottom indicator entrance
      Animated.timing(dotsOpacity, {
        toValue: 1,
        duration: 500,
        delay: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Ambient loop for outer glowing rings
    const loopAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ring1Scale, {
            toValue: 1.15,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ring2Scale, {
            toValue: 1.25,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ring1Scale, {
            toValue: 0.95,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(ring2Scale, {
            toValue: 0.85,
            duration: 2200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loopAnim.start();

    return () => {
      loopAnim.stop();
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#050814', '#0B132B', '#161F45']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative Glowing Rings */}
      <View style={styles.centerStage}>
        {/* Outer Ring 2 */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              width: 280,
              height: 280,
              borderRadius: 140,
              borderColor: '#3B82F635',
              transform: [{ scale: ring2Scale }],
              opacity: ring2Opacity,
            },
          ]}
        />

        {/* Inner Ring 1 */}
        <Animated.View
          style={[
            styles.glowRing,
            {
              width: 220,
              height: 220,
              borderRadius: 110,
              borderColor: '#60A5FA45',
              transform: [{ scale: ring1Scale }],
              opacity: ring1Opacity,
            },
          ]}
        />

        {/* Central Logo Box */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoGlassBadge}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
        </Animated.View>
      </View>

      {/* Typography & Brand Header */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textOpacity,
            transform: [{ translateY: textTranslateY }],
          },
        ]}
      >
        <Text style={styles.brandTitle}>Eureka</Text>
        <View style={styles.taglineBadge}>
          <Text style={styles.brandSubtitle}>AI Academic Companion & Lecturer</Text>
        </View>
      </Animated.View>

      {/* Bottom Loading Indicator */}
      <Animated.View style={[styles.bottomContainer, { opacity: dotsOpacity }]}>
        <View style={styles.dotsRow}>
          <View style={[styles.dot, { backgroundColor: '#3B82F6' }]} />
          <View style={[styles.dot, { backgroundColor: '#60A5FA' }]} />
          <View style={[styles.dot, { backgroundColor: '#93C5FD' }]} />
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B132B',
  },
  centerStage: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  logoContainer: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGlassBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E293B80',
    borderWidth: 2,
    borderColor: '#3B82F660',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  logoImage: {
    width: 76,
    height: 76,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  brandTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    textShadowColor: '#3B82F680',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
  },
  taglineBadge: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B60',
    borderWidth: 1,
    borderColor: '#3B82F630',
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 50,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
