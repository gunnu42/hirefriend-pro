import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function InfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ title?: string; message?: string; actionLabel?: string }>();

  const title = params.title ?? 'Coming Soon';
  const message = params.message ?? 'This feature is coming soon. Stay tuned!';
  const actionLabel = params.actionLabel ?? 'Go Back';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
          <ArrowLeft size={22} color={Colors.text} />
        </Pressable>
      </SafeAreaView>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <Pressable style={styles.button} onPress={() => router.back()} testID="action-button">
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { backgroundColor: Colors.background, paddingHorizontal: 16, paddingTop: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: '800' as const, color: Colors.text, textAlign: 'center' },
  message: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', marginTop: 16, lineHeight: 22 },
  button: { marginTop: 32, backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  buttonText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
});
