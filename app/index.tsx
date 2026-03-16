import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/onboarding');
    }, 1200);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>HireFriend</Text>
      <Text style={styles.tagline}>Your companion for every moment.</Text>
      <ActivityIndicator size="large" color={Colors.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: Colors.primary,
    marginBottom: 12,
  },
  tagline: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  spinner: {
    marginTop: 10,
  },
});
