import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface BadgeProps {
  status?: 'completed' | 'processing' | 'pending' | 'error' | string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | string;
  label?: string;
  style?: StyleProp<ViewStyle>;
}

export const Badge: React.FC<BadgeProps> = ({ status, variant, label, style }) => {
  const { theme } = useTheme();

  const getBadgeColors = () => {
    const key = (status || variant || '').toLowerCase();
    switch (key) {
      case 'completed':
      case 'ready':
      case 'primary':
        return {
          bg: theme.colors.statusCompletedBg || theme.colors.primary,
          text: theme.colors.statusCompleted || theme.colors.textPrimary,
        };
      case 'processing':
      case 'secondary':
        return {
          bg: theme.colors.statusProcessingBg || theme.colors.secondary,
          text: theme.colors.statusProcessing || theme.colors.textSecondary,
        };
      case 'pending':
        return {
          bg: theme.colors.statusPendingBg,
          text: theme.colors.statusPending,
        };
      case 'error':
      case 'failed':
        return {
          bg: theme.colors.statusErrorBg,
          text: theme.colors.statusError,
        };
      default:
        return {
          bg: theme.colors.surfaceVariant,
          text: theme.colors.textSecondary,
        };
    }
  };

  const colors = getBadgeColors();
  const displayLabel = label || status || variant || '';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderRadius: theme.borderRadius.full,
          paddingHorizontal: theme.spacing.sm + 2,
          paddingVertical: 3,
        },
        style as any,
      ]}
    >
      <Text style={[theme.typography.badge, { color: colors.text }]}>
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
