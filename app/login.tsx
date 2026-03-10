import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Alert, KeyboardAvoidingView,
  Platform, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const btnAnim = useRef(new Animated.Value(1)).current;

  const validate = useCallback(() => {
    const e: { email?: string; password?: string } = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email address';
    if (!password.trim()) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [email, password]);

  const handleLogin = useCallback(() => {
    if (!validate()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(btnAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(btnAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    router.replace('/(tabs)/(home)');
  }, [validate, router, btnAnim]);

  const isValid = email.trim().length > 0 && password.trim().length >= 6;

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
              <Text style={styles.subtitle}>Welcome back! Sign in to continue.</Text>
            </View>
          </SafeAreaView>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputRow, errors.email ? styles.inputError : null]}>
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
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
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
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  testID="password-input"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                  {showPassword ? <EyeOff size={18} color={Colors.textTertiary} /> : <Eye size={18} color={Colors.textTertiary} />}
                </Pressable>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <Pressable onPress={() => router.push('/forgot-password')} testID="forgot-password">
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>

            <Pressable onPress={handleLogin} disabled={!isValid} testID="login-btn">
              <Animated.View style={[styles.loginBtn, !isValid && styles.loginBtnDisabled, { transform: [{ scale: btnAnim }] }]}>
                <Text style={styles.loginBtnText}>Sign In</Text>
              </Animated.View>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <Pressable style={styles.socialBtn} onPress={() => Alert.alert('Google Sign In', 'Google OAuth would be integrated here.')} testID="google-btn">
              <Text style={styles.socialBtnText}>Continue with Google</Text>
            </Pressable>

            <Pressable style={styles.socialBtn} onPress={() => Alert.alert('Phone Sign In', 'Phone OTP verification would be integrated here.')} testID="phone-btn">
              <Text style={styles.socialBtnText}>Continue with Phone</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Pressable onPress={() => router.push('/signup')} testID="signup-link">
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
  fieldGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 14, paddingHorizontal: 14,
    height: 52, borderWidth: 1.5, borderColor: Colors.border,
  },
  inputError: { borderColor: Colors.danger },
  input: { flex: 1, fontSize: 15, color: Colors.text },
  errorText: { fontSize: 12, color: Colors.danger, marginLeft: 4 },
  forgotText: { fontSize: 14, fontWeight: '600' as const, color: Colors.primary, textAlign: 'right' },
  loginBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  loginBtnDisabled: { opacity: 0.5 },
  loginBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: 13, color: Colors.textTertiary },
  socialBtn: {
    borderRadius: 14, height: 52, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.card,
  },
  socialBtnText: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  footer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 32, paddingBottom: 30,
  },
  footerText: { fontSize: 15, color: Colors.textSecondary },
  footerLink: { fontSize: 15, fontWeight: '700' as const, color: Colors.primary },
});

