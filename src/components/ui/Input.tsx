import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  isPassword = false,
  containerStyle,
  style,
  ...props
}) => {
  const { theme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isMultiline = props.multiline;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            theme.typography.caption,
            {
              color: theme.colors.textSecondary,
              marginBottom: theme.spacing.xs,
              fontWeight: '600',
            },
          ]}
        >
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.inputBackground,
            borderColor: error
              ? theme.colors.statusError
              : isFocused
              ? theme.colors.inputFocusBorder
              : theme.colors.inputBorder,
            borderRadius: theme.borderRadius.md,
            borderWidth: isFocused || error ? 1.5 : 1,
            paddingHorizontal: theme.spacing.md,
            minHeight: isMultiline ? 96 : 48,
            alignItems: isMultiline ? 'flex-start' : 'center',
            paddingVertical: isMultiline ? 10 : 0,
          },
        ]}
      >
        {leftIcon && <View style={[{ marginRight: theme.spacing.sm }, isMultiline && { marginTop: 2 }]}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            theme.typography.body,
            {
              color: theme.colors.textPrimary,
              height: isMultiline ? undefined : '100%',
              textAlignVertical: isMultiline ? 'top' : 'center',
            },
            style,
          ]}
          placeholderTextColor={theme.colors.textTertiary}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {rightIcon && <View style={{ marginLeft: theme.spacing.sm }}>{rightIcon}</View>}

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{ marginLeft: theme.spacing.sm }}
          >
            {showPassword ? (
              <EyeOff size={20} color={theme.colors.textSecondary} />
            ) : (
              <Eye size={20} color={theme.colors.textSecondary} />
            )}
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text
          style={[
            theme.typography.caption,
            {
              color: theme.colors.statusError,
              marginTop: theme.spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  inputContainer: {
    flexDirection: 'row',
  },
  input: {
    flex: 1,
  },
});
