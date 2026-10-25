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
import { Mail, Lock, User } from 'lucide-react-native';

export default function RegisterScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { signUp } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setError(null);
    setLoading(true);

    const { error: signUpError } = await signUp(
      email.trim(),
      password,
      displayName.trim()
    );

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
    } else {
      Alert.alert(
        'Account Created',
        'Registration successful! Please check your email for confirmation if required, or sign in now.',
        [
          {
            text: 'Continue to Sign In',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
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
              Create Account
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
              ]}
            >
              Join Eureka AI and transform how you study
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

            <Input
              label="Full Name"
              placeholder="John Doe"
              value={displayName}
              onChangeText={(text) => {
                setDisplayName(text);
                if (error) setError(null);
              }}
              leftIcon={<User size={18} color={theme.colors.textSecondary} />}
            />

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

            <Input
              label="Password"
              placeholder="At least 6 characters"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (error) setError(null);
              }}
              isPassword
              leftIcon={<Lock size={18} color={theme.colors.textSecondary} />}
            />

            <Input
              label="Confirm Password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (error) setError(null);
              }}
              isPassword
              leftIcon={<Lock size={18} color={theme.colors.textSecondary} />}
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              size="lg"
              style={styles.submitButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text
                style={[
                  theme.typography.bodyBold,
                  { color: theme.colors.secondary },
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
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
  headerContainer: {
    alignItems: 'center',
    marginBottom: 28,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 28,
  },
});
