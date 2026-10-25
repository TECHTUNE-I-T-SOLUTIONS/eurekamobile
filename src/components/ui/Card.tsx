import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'outlined' | 'flat';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  variant = 'elevated',
}) => {
  const { theme } = useTheme();

  const getCardStyle = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.surfaceBorder,
        };
      case 'flat':
        return {
          backgroundColor: theme.colors.surfaceVariant,
        };
      case 'elevated':
      default:
        return {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.surfaceBorder,
          ...(theme.isDark ? {} : theme.shadows.sm),
        };
    }
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        getCardStyle(),
        {
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.md + 2,
        },
        style as any,
      ]}
    >
      {children}
    </Component>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
  },
});
