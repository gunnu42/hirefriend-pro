import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Alert,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [sent, setSent] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const btnAnim = useRef(new Animated.Value(1)).current;

  const handleSend = useCallback(() => {
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    setError('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(btnAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(btnAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    setSent(true);
  }, [email, btnAnim]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <SafeAreaView edges={['top']}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
              <ArrowLeft size={22} color={Colors.text} />
            </Pressable>
          </SafeAreaView>

          {!sent ? (
            <View style={styles.content}>
              <Text style={styles.title}>Forgot Password?</Text>
              <Text style={styles.subtitle}>
                Enter your email address and we'll send you a link to reset your password.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={[styles.inputRow, error ? styles.inputError : null]}>
                  <Mail size={18} color={Colors.textTertiary} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={Colors.textTertiary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    testID="email-input"
                  />
                </View>
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
              </View>

              <Pressable onPress={handleSend} testID="send-btn">
                <Animated.View style={[styles.sendBtn, { transform: [{ scale: btnAnim }] }]}>
                  <Text style={styles.sendBtnText}>Send Reset Link</Text>
                </Animated.View>
              </Pressable>

              <Pressable onPress={() => router.replace('/login')} style={styles.backToLogin} testID="back-to-login">
                <Text style={styles.backToLoginText}>Back to Sign In</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.successContent}>
              <View style={styles.successIcon}>
                <Check size={40} color={Colors.success} />
              </View>
              <Text style={styles.successTitle}>Check Your Email</Text>
              <Text style={styles.successSubtitle}>
                We've sent a password reset link to {email}. Please check your inbox.
              </Text>
              <Pressable style={styles.sendBtn} onPress={() => router.replace('/login')} testID="go-login">
                <Text style={styles.sendBtnText}>Back to Sign In</Text>
              </Pressable>
              <Pressable onPress={() => { setSent(false); }} style={styles.resendBtn} testID="resend-btn">
                <Text style={styles.resendText}>Didn't receive it? Resend</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  content: { marginTop: 40 },
  title: { fontSize: 28, fontWeight: '800' as const, color: Colors.text },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 8, lineHeight: 22 },
  fieldGroup: { gap: 6, marginTop: 28 },
  label: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 14, paddingHorizontal: 14,
    height: 52, borderWidth: 1.5, borderColor: Colors.border,
  },
  inputError: { borderColor: Colors.danger },
  input: { flex: 1, fontSize: 15, color: Colors.text },
  errorText: { fontSize: 12, color: Colors.danger, marginLeft: 4 },
  sendBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 24,
  },
  sendBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
  backToLogin: { alignItems: 'center', marginTop: 20 },
  backToLoginText: { fontSize: 15, fontWeight: '600' as const, color: Colors.primary },
  successContent: { alignItems: 'center', marginTop: 80 },
  successIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.successLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  successTitle: { fontSize: 24, fontWeight: '800' as const, color: Colors.text },
  successSubtitle: {
    fontSize: 15, color: Colors.textSecondary, textAlign: 'center',
    marginTop: 10, lineHeight: 22, paddingHorizontal: 20,
  },
  resendBtn: { marginTop: 20 },
  resendText: { fontSize: 14, fontWeight: '600' as const, color: Colors.primary },
});

