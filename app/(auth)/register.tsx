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
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../src/components/ui/ScreenWrapper';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { Mail, Lock, User, CheckSquare, Square, X, Shield, FileText } from 'lucide-react-native';

export default function RegisterScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { signUp } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null);
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

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service & Privacy Policy to create an account');
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
              Join users of Eureka AI and transform how you study
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

            {/* Terms of Service & Privacy Policy Agreement Checkbox */}
            <View style={{ marginVertical: 12 }}>
              <TouchableOpacity
                onPress={() => {
                  setAgreedToTerms(!agreedToTerms);
                  if (error) setError(null);
                }}
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'flex-start' }}
              >
                <View style={{ marginTop: 2, marginRight: 10 }}>
                  {agreedToTerms ? (
                    <CheckSquare size={20} color={theme.colors.primary} />
                  ) : (
                    <Square size={20} color={theme.colors.textTertiary} />
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, lineHeight: 18 }]}>
                    I agree to the{' '}
                    <Text
                      onPress={() => setModalType('terms')}
                      style={{ color: theme.colors.primary, fontWeight: '700', textDecorationLine: 'underline' }}
                    >
                      Terms of Service
                    </Text>
                    {' '}and{' '}
                    <Text
                      onPress={() => setModalType('privacy')}
                      style={{ color: theme.colors.primary, fontWeight: '700', textDecorationLine: 'underline' }}
                    >
                      Privacy Policy
                    </Text>
                    .
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

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

      {/* Terms & Privacy Sheet Modal */}
      <Modal
        visible={modalType !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setModalType(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.surfaceBorder,
              },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {modalType === 'terms' ? (
                  <FileText size={22} color={theme.colors.primary} />
                ) : (
                  <Shield size={22} color="#10B981" />
                )}
                <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, marginLeft: 8 }]}>
                  {modalType === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setModalType(null)}
                style={[styles.closeBtn, { backgroundColor: theme.colors.surfaceVariant }]}
              >
                <X size={18} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Modal Scrollable Content */}
            <ScrollView
              style={{ maxHeight: 380, marginVertical: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {modalType === 'terms' ? (
                <View>
                  <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginBottom: 4 }]}>
                    1. Educational Purpose & AI Assistance
                  </Text>
                  <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 12, lineHeight: 20 }]}>
                    Eureka provides AI-assisted note summarization, voice tutoring, and study assistance. All generated answers and explanations are intended for educational and study reference purposes.
                  </Text>

                  <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginBottom: 4 }]}>
                    2. User Ownership of Uploaded Notes
                  </Text>
                  <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 12, lineHeight: 20 }]}>
                    You retain ownership of the study materials, notes, and documents you upload. You grant Eureka a secure license to parse, index, and generate summaries solely to deliver your study experience.
                  </Text>

                  <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginBottom: 4 }]}>
                    3. Subscriptions & Usage Limits
                  </Text>
                  <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 12, lineHeight: 20 }]}>
                    Free accounts include starter AI requests. Upgrading to Student Pro or Premium Power unlocks enhanced limits, live voice lectures, and priority AI processing via secure Paystack billing.
                  </Text>
                </View>
              ) : (
                <View>
                  <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginBottom: 4 }]}>
                    1. Information We Collect
                  </Text>
                  <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 12, lineHeight: 20 }]}>
                    We collect your account email, display name, and uploaded study notes solely to personalize your study sessions and power contextual AI explanations.
                  </Text>

                  <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginBottom: 4 }]}>
                    2. Confidentiality & Security
                  </Text>
                  <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 12, lineHeight: 20 }]}>
                    We do not sell your academic content or personal data to third parties. All network communications are encrypted in transit with TLS/SSL.
                  </Text>

                  <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginBottom: 4 }]}>
                    3. Account Control & Data Deletion
                  </Text>
                  <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginBottom: 12, lineHeight: 20 }]}>
                    You can delete your notes or request full account deletion at any time directly through your Profile settings.
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Agree & Close Action */}
            <Button
              title="I Understand & Agree"
              onPress={() => {
                setAgreedToTerms(true);
                setModalType(null);
              }}
              style={{ marginTop: 8 }}
            />
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
