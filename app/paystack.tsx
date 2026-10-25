import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { Shield, X } from 'lucide-react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://eureka.vercel.app/api';

export default function PaystackScreen() {
  const router = useRouter();
  const { url, reference } = useLocalSearchParams<{ url: string; reference: string }>();

  const handleNavigationChange = async (navState: WebViewNavigation) => {
    const { url: currentUrl } = navState;

    if (
      currentUrl.includes('trxref=') ||
      currentUrl.includes('reference=') ||
      currentUrl.includes('callback') ||
      currentUrl.includes('standard.paystack.co/close')
    ) {
      if (reference) {
        try {
          await fetch(`${API_BASE_URL}/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reference }),
          });
        } catch (e) {
          console.warn('Verification error in paystack route:', e);
        }
      }
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Shield size={18} color="#34D399" />
          <Text style={styles.headerText}>Paystack Checkout</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={22} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {url ? (
        <WebView
          source={{ uri: url }}
          onNavigationStateChange={handleNavigationChange}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#38BDF8" />
            </View>
          )}
        />
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={{ color: '#94A3B8' }}>No payment checkout URL provided.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#0B0F19',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    color: '#F8FAFC',
    fontWeight: '700',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
});
