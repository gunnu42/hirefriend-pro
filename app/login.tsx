import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Alert, KeyboardAvoidingView,
  Platform, ScrollView, Animated, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, Phone, Smartphone, Clock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signInEmail, sendPhoneOTP, verifyPhoneOTP } = useAuth();

  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [otpTimer, setOtpTimer] = useState<number>(0);
  const [errors, setErrors] = useState<{ email?: string; password?: string; phone?: string; otp?: string }>({});
  const btnAnim = useRef(new Animated.Value(1)).current;

  // OTP Timer effect
  React.useEffect(() => {
    if (otpTimer <= 0) return;
    const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
    return () => clearTimeout(timer);
  }, [otpTimer]);

  const validate = useCallback(() => {
    const e: { email?: string; password?: string; phone?: string; otp?: string } = {};
    if (loginMethod === 'email') {
      if (!email.trim()) e.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email address';
      if (!password.trim()) e.password = 'Password is required';
      else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    } else {
      if (!phone.trim()) e.phone = 'Phone number is required';
      if (otpSent && !otp.trim()) e.otp = 'OTP is required';
      else if (otpSent && otp.trim().length < 6) e.otp = 'OTP must be 6 digits';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [email, password, phone, otp, otpSent, loginMethod]);

  const handleLogin = useCallback(async () => {
    if (!validate()) return;

    try {
      setLoading(true);
      if (loginMethod === 'email') {
        await signInEmail(email.trim(), password);
      } else {
        if (!otpSent) {
          await sendPhoneOTP(phone.trim());
          setOtpSent(true);
          setOtpTimer(60);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('OTP Sent', `Verification code sent to ${phone.trim()}`);
          return;
        } else {
          await verifyPhoneOTP(phone.trim(), otp.trim());
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.sequence([
        Animated.timing(btnAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
        Animated.timing(btnAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start();
      router.replace('/(tabs)' as any);
    } catch (err) {
      console.error('Login error:', err);
      const message = err instanceof Error ? err.message : 'Please check your credentials and try again.';
      Alert.alert('Login Failed', message);
    } finally {
      setLoading(false);
    }
  }, [validate, router, btnAnim, signInEmail, email, password, loginMethod, sendPhoneOTP, phone, otpSent, verifyPhoneOTP, otp]);

  const handleResendOTP = useCallback(async () => {
    if (otpTimer > 0) return;
    try {
      setLoading(true);
      await sendPhoneOTP(phone.trim());
      setOtpTimer(60);
      setOtp('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resend OTP';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, [phone, sendPhoneOTP, otpTimer]);

  const isValid = !loading && (
    loginMethod === 'email'
      ? email.trim().length > 0 && password.trim().length >= 6
      : phone.trim().length > 0 && (!otpSent || otp.trim().length === 6)
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <SafeAreaView edges={['top']}>
            <View style={styles.header}>
              <Text style={styles.logo}>HireFriend</Text>
              <Text style={styles.subtitle}>Sign in to connect with friends</Text>
            </View>
          </SafeAreaView>

          <View style={styles.form}>
            {/* Method Selector */}
            <View style={styles.methodSelector}>
              <Pressable
                style={[styles.methodTab, loginMethod === 'email' && styles.activeMethodTab]}
                onPress={() => { setLoginMethod('email'); setOtpSent(false); setOtp(''); setErrors({}); }}
              >
                <Mail size={16} color={loginMethod === 'email' ? Colors.primary : Colors.textTertiary} />
                <Text style={[styles.methodText, loginMethod === 'email' && styles.activeMethodText]}>Email</Text>
              </Pressable>
              <Pressable
                style={[styles.methodTab, loginMethod === 'phone' && styles.activeMethodTab]}
                onPress={() => { setLoginMethod('phone'); setOtpSent(false); setOtp(''); setErrors({}); }}
              >
                <Phone size={16} color={loginMethod === 'phone' ? Colors.primary : Colors.textTertiary} />
                <Text style={[styles.methodText, loginMethod === 'phone' && styles.activeMethodText]}>Phone OTP</Text>
              </Pressable>
            </View>

            {loginMethod === 'email' ? (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <View style={[styles.inputRow, errors.email ? styles.inputError : null]}>
                    <Mail size={18} color={Colors.textTertiary} />
                    <TextInput
                      style={styles.input}
                      placeholder="you@example.com"
                      placeholderTextColor={Colors.textTertiary}
                      value={email}
                      onChangeText={(text) => { setEmail(text); setErrors({ ...errors, email: '' }); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!loading}
                      testID="email-input"
                    />
                  </View>
                  {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Password</Text>
                  <View style={[styles.inputRow, errors.password ? styles.inputError : null]}>
                    <Lock size={18} color={Colors.textTertiary} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textTertiary}
                      value={password}
                      onChangeText={(text) => { setPassword(text); setErrors({ ...errors, password: '' }); }}
                      secureTextEntry={!showPassword}
                      editable={!loading}
                      testID="password-input"
                    />
                    <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10} disabled={loading}>
                      {showPassword
                        ? <EyeOff size={18} color={Colors.textTertiary} />
                        : <Eye size={18} color={Colors.textTertiary} />}
                    </Pressable>
                  </View>
                  {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
                </View>

                <Pressable onPress={() => router.push('/forgot-password' as any)} disabled={loading} testID="forgot-password">
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Phone Number</Text>
                  <View style={[styles.inputRow, errors.phone ? styles.inputError : null]}>
                    <Phone size={18} color={Colors.textTertiary} />
                    <TextInput
                      style={styles.input}
                      placeholder="+91 9876543210"
                      placeholderTextColor={Colors.textTertiary}
                      value={phone}
                      onChangeText={(text) => { setPhone(text); setErrors({ ...errors, phone: '' }); }}
                      keyboardType="phone-pad"
                      editable={!loading && !otpSent}
                      testID="phone-input"
                    />
                  </View>
                  {errors.phone ? <Text style={styles.errorText}>{errors.phone}</Text> : null}
                  <Text style={styles.infoText}>Note: Phone OTP requires SMS provider setup in Supabase</Text>
                </View>

                {otpSent && (
                  <>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.label}>Verification Code</Text>
                      <View style={[styles.inputRow, errors.otp ? styles.inputError : null]}>
                        <Smartphone size={18} color={Colors.textTertiary} />
                        <TextInput
                          style={styles.input}
                          placeholder="123456"
                          placeholderTextColor={Colors.textTertiary}
                          value={otp}
                          onChangeText={(text) => { setOtp(text); setErrors({ ...errors, otp: '' }); }}
                          keyboardType="number-pad"
                          maxLength={6}
                          editable={!loading}
                          testID="otp-input"
                        />
                      </View>
                      {errors.otp ? <Text style={styles.errorText}>{errors.otp}</Text> : null}
                    </View>

                    <View style={styles.timerRow}>
                      {otpTimer > 0 ? (
                        <>
                          <Clock size={14} color={Colors.textTertiary} />
                          <Text style={styles.timerText}>Resend OTP in {otpTimer}s</Text>
                        </>
                      ) : (
                        <Pressable onPress={handleResendOTP} disabled={loading}>
                          <Text style={styles.resendText}>Resend OTP</Text>
                        </Pressable>
                      )}
                    </View>
                  </>
                )}
              </>
            )}

            <Pressable onPress={handleLogin} disabled={!isValid} testID="login-btn">
              <Animated.View style={[styles.loginBtn, !isValid && styles.loginBtnDisabled, { transform: [{ scale: btnAnim }] }]}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.loginBtnText}>
                    {loginMethod === 'email' ? 'Sign In' : (otpSent ? 'Verify & Sign In' : 'Send OTP')}
                  </Text>
                )}
              </Animated.View>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable onPress={() => router.push('/become-friend' as any)} disabled={loading} testID="signup-link">
              <Text style={styles.footerLink}>Sign Up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24 },
  header: { marginTop: 20, marginBottom: 36 },
  logo: { fontSize: 32, fontWeight: '800' as const, color: Colors.primary },
  subtitle: { fontSize: 16, color: Colors.textSecondary, marginTop: 8 },
  form: { gap: 18 },
  methodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: 8,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeMethodTab: { backgroundColor: Colors.primary + '10' },
  methodText: { fontSize: 14, fontWeight: '600' as const, color: Colors.textTertiary },
  activeMethodText: { color: Colors.primary },
  fieldGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  inputError: { borderColor: Colors.danger },
  input: { flex: 1, fontSize: 15, color: Colors.text },
  errorText: { fontSize: 12, color: Colors.danger, marginLeft: 4 },
  forgotText: { fontSize: 14, fontWeight: '600' as const, color: Colors.primary, textAlign: 'right' },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  timerText: { fontSize: 13, color: Colors.textSecondary },
  resendText: { fontSize: 13, fontWeight: '600' as const, color: Colors.primary },
  infoText: { fontSize: 12, color: Colors.textSecondary, marginTop: 4, fontStyle: 'italic' },
  loginBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    paddingBottom: 30,
  },
  footerText: { fontSize: 15, color: Colors.textSecondary },
  footerLink: { fontSize: 15, fontWeight: '700' as const, color: Colors.primary },
});