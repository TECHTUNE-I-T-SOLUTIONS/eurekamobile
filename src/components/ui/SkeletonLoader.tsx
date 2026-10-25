import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Card } from './Card';

interface SkeletonItemProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonItem({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonItemProps) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [opacity]);

  const backgroundColor = theme.isDark ? '#334155' : '#E2E8F0';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function NoteCardSkeleton() {
  const { theme } = useTheme();

  return (
    <Card style={styles.cardSkeleton}>
      {/* Header row: badge and date */}
      <View style={styles.rowBetween}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <SkeletonItem width={44} height={20} borderRadius={4} style={{ marginRight: 8 }} />
          <SkeletonItem width={70} height={20} borderRadius={12} />
        </View>

        <SkeletonItem width={90} height={14} borderRadius={4} />
      </View>

      {/* Title */}
      <SkeletonItem width="85%" height={22} borderRadius={6} style={{ marginTop: 12 }} />

      {/* Summary lines */}
      <SkeletonItem width="100%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
      <SkeletonItem width="65%" height={14} borderRadius={4} style={{ marginTop: 6 }} />

      {/* Footer actions */}
      <View style={styles.footerRow}>
        <SkeletonItem width={80} height={16} borderRadius={4} style={{ marginRight: 16 }} />
        <SkeletonItem width={100} height={16} borderRadius={4} />
      </View>
    </Card>
  );
}

export function NotesSkeleton({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <NoteCardSkeleton key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  cardSkeleton: {
    marginBottom: 12,
    padding: 16,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.1)',
  },
});
