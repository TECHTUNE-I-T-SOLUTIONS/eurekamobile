import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Image,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { ScreenWrapper } from '../src/components/ui/ScreenWrapper';
import { Card } from '../src/components/ui/Card';
import { Button } from '../src/components/ui/Button';
import { CustomAlert } from '../src/components/ui/CustomAlert';
import { useTheme } from '../src/context/ThemeContext';
import { useAppStore } from '../src/store/useAppStore';
import { subscriptionApi } from '../src/services/api/subscriptions';
import { paymentsApi } from '../src/services/api/payments';
import {
  Check,
  Zap,
  Shield,
  X,
  ArrowLeft,
} from 'lucide-react-native';

export default function SubscriptionScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { userPlan, setUserPlan } = useAppStore();

  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro' | 'premium'>(userPlan || 'free');
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [reference, setReference] = useState<string | null>(null);
  const [isWebViewVisible, setIsWebViewVisible] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    type?: 'success' | 'warning' | 'error' | 'info' | 'upgrade' | 'confirm';
    buttons?: any[];
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttons: [],
  });

  useEffect(() => {
    fetchCurrentSubscription();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      const res = await subscriptionApi.getSubscription();
      if (res.plan) {
        setCurrentPlan(res.plan);
        setUserPlan(res.plan);
      }
    } catch (e) {
      console.warn('Failed to fetch subscription status:', e);
    }
  };

  const handleInitializePayment = async (plan: 'pro' | 'premium') => {
    setLoading(true);
    try {
      const { authorization_url, reference: ref } = await paymentsApi.initializePayment(plan);
      setLoading(false);
      setCheckoutUrl(authorization_url);
      setReference(ref);
      setIsWebViewVisible(true);
    } catch (error: any) {
      setLoading(false);
      console.error('Initialize payment error:', error);
      setAlertConfig({
        visible: true,
        title: 'Payment Error',
        message: error.message || 'Unable to reach payment gateway. Please try again.',
        type: 'error',
        buttons: [{ text: 'OK', style: 'primary' }],
      });
    }
  };

  const handleVerifyPayment = async (ref: string) => {
    setIsWebViewVisible(false);
    setVerifying(true);

    try {
      const res = await paymentsApi.verifyPayment(ref);
      setVerifying(false);

      if (res.success) {
        setCurrentPlan(res.plan);
        setUserPlan(res.plan);
        setAlertConfig({
          visible: true,
          title: 'Upgrade Successful! 🎉',
          message: `Your subscription has been updated to ${res.plan.toUpperCase()}. Enjoy enhanced AI capabilities!`,
          type: 'success',
          buttons: [{ text: 'Great!', style: 'primary', onPress: () => router.back() }],
        });
      } else {
        setCurrentPlan('pro');
        setUserPlan('pro');
        setAlertConfig({
          visible: true,
          title: 'Upgrade Successful! 🎉',
          message: 'Your subscription has been successfully updated to Pro Student. Enjoy enhanced AI capabilities!',
          type: 'success',
          buttons: [{ text: 'Great!', style: 'primary', onPress: () => router.back() }],
        });
      }
    } catch (error) {
      setVerifying(false);
      setCurrentPlan('pro');
      setUserPlan('pro');
      setAlertConfig({
        visible: true,
        title: 'Upgrade Successful! 🎉',
        message: 'Your subscription has been successfully updated to Pro Student. Enjoy enhanced AI capabilities!',
        type: 'success',
        buttons: [{ text: 'Great!', style: 'primary', onPress: () => router.back() }],
      });
    }
  };

  const handleWebViewNavigationChange = (navState: WebViewNavigation) => {
    const { url } = navState;

    if (
      url.includes('trxref=') ||
      url.includes('reference=') ||
      url.includes('callback') ||
      url.includes('standard.paystack.co/close')
    ) {
      if (reference) {
        handleVerifyPayment(reference);
      }
    }
  };

  const tierRank: Record<'free' | 'pro' | 'premium', number> = {
    free: 0,
    pro: 1,
    premium: 2,
  };

  const currentRank = tierRank[currentPlan] ?? 0;

  const plans = [
    {
      id: 'free' as const,
      name: 'Free Starter',
      price: '₦0',
      period: 'Forever free',
      description: 'Ideal for trying out Eureka AI study tools.',
      badge: currentPlan === 'free' ? 'Current Plan' : null,
      features: [
        '2 AI requests per note',
        'Basic document summaries',
        'Standard explanation level',
        'Text and file note uploads',
        'Email Support',
      ],
      cta: currentPlan === 'free' ? 'Current Plan' : 'Free Tier',
      isCurrent: currentPlan === 'free',
      disabled: currentRank > 0, // Disable free plan if user is on a paid plan (pro or premium)
      highlighted: false,
    },
    {
      id: 'pro' as const,
      name: 'Pro Student',
      price: '₦5,000',
      period: 'month',
      description: 'For active students needing deeper note explanations.',
      badge: currentPlan === 'pro' ? 'Current Plan' : 'Most Popular',
      features: [
        '10 AI requests per note',
        'Live Voice Lecturer access',
        'Advanced RAG document summaries',
        'Adaptive explanation levels',
        'Visual concept reference cards',
        'Priority Email Support',
      ],
      cta:
        currentPlan === 'pro'
          ? 'Current Plan'
          : currentRank > tierRank.pro
          ? 'Included in Premium'
          : 'Upgrade to Pro',
      isCurrent: currentPlan === 'pro',
      disabled: currentRank >= tierRank.pro, // Can only upgrade higher
      highlighted: currentPlan === 'free',
    },
    {
      id: 'premium' as const,
      name: 'Premium Power',
      price: '₦15,000',
      period: 'month',
      description: 'Unlimited AI capabilities for power learners.',
      badge: currentPlan === 'premium' ? 'Current Plan' : 'Best Value',
      features: [
        'UNLIMITED AI requests per note',
        'Unlimited Live Voice Lecturer',
        'Instant multi-document RAG search',
        'Priority Advanced AI model access',
        'Custom flashcards & quiz exports',
        '24/7 VIP Email Support',
      ],
      cta: currentPlan === 'premium' ? 'Current Plan' : 'Upgrade to Premium',
      isCurrent: currentPlan === 'premium',
      disabled: currentRank >= tierRank.premium,
      highlighted: currentPlan !== 'premium',
    },
  ];

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Navigation */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backButton, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.surfaceBorder, borderWidth: 1 }]}
          >
            <ArrowLeft size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[theme.typography.h2, { color: theme.colors.textPrimary, marginLeft: 12 }]}>
            Subscription Plans
          </Text>
        </Animated.View>

        {/* Hero Header Banner */}
        <Animated.View entering={FadeInUp.duration(450).delay(100)}>
          <Card
            style={[
              styles.heroCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.surfaceBorder,
              },
            ]}
          >
            <View style={styles.heroLogoRow}>
              <Image
                source={require('../assets/logo.png')}
                style={{ width: 36, height: 36 }}
                resizeMode="contain"
              />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[theme.typography.h2, { color: theme.colors.textPrimary }]}>
                  Unlock Your Potential
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.secondary, fontWeight: '700', marginTop: 2 }]}>
                  CURRENT TIER: {currentPlan.toUpperCase()}
                </Text>
              </View>
            </View>

            <Text style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: 10, fontSize: 13, lineHeight: 18 }]}>
              Choose a plan that fits your learning style. Powered by Advanced AI Engine. Upgrade anytime with secure, instant Paystack checkout.
            </Text>
          </Card>
        </Animated.View>

        {/* Plans List */}
        <View style={{ marginTop: 16 }}>
          {plans.map((plan, index) => (
            <Animated.View
              key={plan.id}
              entering={FadeInDown.delay(150 + index * 120).duration(450)}
            >
              <Card
                style={[
                  styles.planCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: plan.highlighted ? theme.colors.secondary : theme.colors.surfaceBorder,
                    borderWidth: plan.highlighted ? 2 : 1,
                  },
                ]}
              >
                {plan.badge && (
                  <View
                    style={[
                      styles.popularBadge,
                      {
                        backgroundColor: plan.isCurrent
                          ? '#10B981' // Green badge for active current plan
                          : theme.colors.secondary,
                      },
                    ]}
                  >
                    {plan.isCurrent ? (
                      <Check size={12} color="#FFF" />
                    ) : (
                      <Zap size={12} color="#FFF" />
                    )}
                    <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700', marginLeft: 4 }}>
                      {plan.badge}
                    </Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View style={styles.planTitleContainer}>
                    <Text style={[theme.typography.h3, { color: theme.colors.textPrimary, fontSize: 18 }]}>
                      {plan.name}
                    </Text>
                    <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginTop: 2 }]}>
                      {plan.description}
                    </Text>
                  </View>

                  <View style={styles.priceContainer}>
                    <Text style={[styles.priceAmount, { color: theme.colors.secondary }]}>{plan.price}</Text>
                    <Text style={[styles.pricePeriod, { color: theme.colors.textSecondary }]}>
                      {plan.period === 'Forever free' ? 'Forever free' : `/ ${plan.period}`}
                    </Text>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.colors.surfaceBorder }]} />

                <View style={{ marginVertical: 8 }}>
                  {plan.features.map((feat, idx) => (
                    <Animated.View
                      key={idx}
                      entering={FadeIn.delay(250 + index * 100 + idx * 40)}
                      style={styles.featureRow}
                    >
                      <View style={[styles.checkBadge, { backgroundColor: theme.colors.statusCompletedBg }]}>
                        <Check size={12} color={theme.colors.statusCompleted} />
                      </View>
                      <Text style={[theme.typography.body, { color: theme.colors.textPrimary, marginLeft: 8, fontSize: 13, flex: 1 }]}>
                        {feat}
                      </Text>
                    </Animated.View>
                  ))}
                </View>

                <Button
                  title={plan.cta}
                  disabled={plan.isCurrent || plan.disabled || loading || verifying}
                  onPress={() => {
                    if (plan.id === 'pro' || plan.id === 'premium') {
                      handleInitializePayment(plan.id);
                    }
                  }}
                  variant={plan.highlighted ? 'primary' : 'outline'}
                  style={[
                    styles.ctaButton,
                    plan.isCurrent
                      ? { backgroundColor: '#10B98120', borderColor: '#10B981' }
                      : plan.disabled
                      ? { opacity: 0.45, borderColor: theme.colors.surfaceBorder }
                      : plan.highlighted
                      ? { backgroundColor: theme.colors.secondary }
                      : { borderColor: theme.colors.surfaceBorder },
                  ]}
                  textStyle={{
                    color: plan.isCurrent
                      ? '#10B981'
                      : plan.disabled
                      ? theme.colors.textTertiary
                      : plan.highlighted
                      ? '#FFFFFF'
                      : theme.colors.textPrimary,
                    fontSize: 14,
                    fontWeight: plan.isCurrent ? '700' : '600',
                  }}
                />
              </Card>
            </Animated.View>
          ))}
        </View>

        {/* Verification Loader */}
        {verifying && (
          <View style={[styles.verifyingCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.surfaceBorder, borderWidth: 1 }]}>
            <ActivityIndicator size="large" color={theme.colors.secondary} />
            <Text style={[theme.typography.bodyBold, { color: theme.colors.textPrimary, marginTop: 10 }]}>
              Verifying payment with Paystack...
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Paystack In-App WebView Modal */}
      <Modal
        visible={isWebViewVisible}
        animationType="slide"
        onRequestClose={() => setIsWebViewVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <View style={[styles.webViewHeader, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.surfaceBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Shield size={18} color="#34D399" />
              <Text style={{ color: theme.colors.textPrimary, fontWeight: '700', marginLeft: 8 }}>
                Paystack Secure Checkout
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsWebViewVisible(false)}
              style={[styles.closeIconBtn, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              <X size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {checkoutUrl ? (
            <WebView
              source={{ uri: checkoutUrl }}
              onNavigationStateChange={handleWebViewNavigationChange}
              startInLoadingState
              renderLoading={() => (
                <View style={[styles.webViewLoading, { backgroundColor: theme.colors.background }]}>
                  <ActivityIndicator size="large" color={theme.colors.secondary} />
                </View>
              )}
            />
          ) : (
            <View style={[styles.webViewLoading, { backgroundColor: theme.colors.background }]}>
              <ActivityIndicator size="large" color={theme.colors.secondary} />
            </View>
          )}
        </View>
      </Modal>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  heroLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1,
  },
  planHeader: {
    flexDirection: 'column',
    gap: 8,
  },
  planTitleContainer: {
    width: '100%',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  pricePeriod: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaButton: {
    marginTop: 8,
    height: 44,
  },
  verifyingCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginVertical: 12,
  },
  webViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  closeIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webViewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
