import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, Alert, KeyboardAvoidingView,
  Platform, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const btnAnim = useRef(new Animated.Value(1)).current;

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 3) e.name = 'Full name must be at least 3 characters';
    if (!email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email address';
    if (!phone.trim() || phone.trim().length < 10) e.phone = 'Valid phone number is required';
    if (!password.trim()) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [name, email, phone, password]);

  const handleSignup = useCallback(() => {
    if (!validate()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.sequence([
      Animated.timing(btnAnim, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(btnAnim, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    Alert.alert('Account Created!', 'Please verify your email to continue.', [
      { text: 'OK', onPress: () => router.replace('/login') },
    ]);
  }, [validate, router, btnAnim]);

  const isValid = name.trim().length >= 3 && email.includes('@') && phone.length >= 10 && password.length >= 6;

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <SafeAreaView edges={['top']}>
            <View style={styles.topRow}>
              <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
                <ArrowLeft size={22} color={Colors.text} />
              </Pressable>
            </View>
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join HireFriend and start connecting.</Text>
            </View>
          </SafeAreaView>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputRow, errors.name ? styles.inputError : null]}>
                <User size={18} color={Colors.textTertiary} />
                <TextInput style={styles.input} placeholder="John Doe" placeholderTextColor={Colors.textTertiary} value={name} onChangeText={setName} testID="name-input" />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputRow, errors.email ? styles.inputError : null]}>
                <Mail size={18} color={Colors.textTertiary} />
                <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={Colors.textTertiary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" testID="email-input" />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputRow, errors.phone ? styles.inputError : null]}>
                <Phone size={18} color={Colors.textTertiary} />
                <TextInput style={styles.input} placeholder="+91 9876543210" placeholderTextColor={Colors.textTertiary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" testID="phone-input" />
              </View>
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputRow, errors.password ? styles.inputError : null]}>
                <Lock size={18} color={Colors.textTertiary} />
                <TextInput style={styles.input} placeholder="••••••••" placeholderTextColor={Colors.textTertiary} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} testID="password-input" />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                  {showPassword ? <EyeOff size={18} color={Colors.textTertiary} /> : <Eye size={18} color={Colors.textTertiary} />}
                </Pressable>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <Pressable onPress={handleSignup} disabled={!isValid} testID="signup-btn">
              <Animated.View style={[styles.signupBtn, !isValid && styles.signupBtnDisabled, { transform: [{ scale: btnAnim }] }]}>
                <Text style={styles.signupBtnText}>Create Account</Text>
              </Animated.View>
            </Pressable>

            <Text style={styles.terms}>
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => router.replace('/login')} testID="login-link">
              <Text style={styles.footerLink}>Sign In</Text>
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
  topRow: { flexDirection: 'row', paddingTop: 8 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  header: { marginTop: 16, marginBottom: 28 },
  title: { fontSize: 28, fontWeight: '800' as const, color: Colors.text },
  subtitle: { fontSize: 15, color: Colors.textSecondary, marginTop: 6 },
  form: { gap: 16 },
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
  signupBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
  },
  signupBtnDisabled: { opacity: 0.5 },
  signupBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
  terms: { fontSize: 12, color: Colors.textTertiary, textAlign: 'center', lineHeight: 18 },
  footer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 28, paddingBottom: 30,
  },
  footerText: { fontSize: 15, color: Colors.textSecondary },
  footerLink: { fontSize: 15, fontWeight: '700' as const, color: Colors.primary },
});

