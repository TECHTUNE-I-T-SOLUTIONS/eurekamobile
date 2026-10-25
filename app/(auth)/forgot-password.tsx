import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Mail, ArrowLeft } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setError(null);
    setLoading(true);

    const { error: resetError } = await resetPassword(email.trim());

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
    } else {
      setSent(true);
      Alert.alert(
        'Reset Link Sent',
        'If an account exists for this email, you will receive password reset instructions shortly.',
        [{ text: 'Return to Sign In', onPress: () => router.replace('/(auth)/login') }]
      );
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Action */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.headerContainer}>
            <View
              style={[
                styles.logoBadge,
                {
                  backgroundColor: theme.colors.surfaceVariant,
                  borderColor: theme.colors.surfaceBorder,
                },
              ]}
            >
              <Image
                source={require('../../assets/logo.png')}
                style={styles.logoImage}
              />
            </View>
            <Text
              style={[
                theme.typography.h1,
                { color: theme.colors.textPrimary, marginTop: theme.spacing.md },
              ]}
            >
              Reset Password
            </Text>
            <Text
              style={[
                theme.typography.body,
                {
                  color: theme.colors.textSecondary,
                  marginTop: theme.spacing.xs,
                  textAlign: 'center',
                },
              ]}
            >
              Enter the email associated with your account and we'll send you instructions to reset your password.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            {error && (
              <View
                style={[
                  styles.errorContainer,
                  {
                    backgroundColor: theme.colors.statusErrorBg,
                    borderColor: theme.colors.statusError,
                  },
                ]}
              >
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.statusError, fontWeight: '600' },
                  ]}
                >
                  {error}
                </Text>
              </View>
            )}

            {!sent ? (
              <>
                <Input
                  label="Email Address"
                  placeholder="student@university.edu"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  leftIcon={<Mail size={18} color={theme.colors.textSecondary} />}
                />

                <Button
                  title="Send Reset Link"
                  onPress={handleResetPassword}
                  loading={loading}
                  size="lg"
                  style={styles.submitButton}
                />
              </>
            ) : (
              <Button
                title="Back to Sign In"
                onPress={() => router.replace('/(auth)/login')}
                size="lg"
                style={styles.submitButton}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 32,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 24,
    zIndex: 10,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 40,
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
  formContainer: {
    width: '100%',
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 16,
  },
});
