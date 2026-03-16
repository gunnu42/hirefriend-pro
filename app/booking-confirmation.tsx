import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, ArrowLeft, Home } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { friends } from '@/mocks/friends';

export default function BookingConfirmationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    friendId?: string;
    date?: string;
    time?: string;
    duration?: string;
    total?: string;
    serviceType?: string;
  }>();

  const friend = useMemo(() => friends.find((f) => f.id === params.friendId), [params.friendId]);
  const date = params.date ? new Date(params.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD';
  const time = params.time ?? 'TBD';
  const duration = params.duration ?? '1';
  const total = params.total ?? '0';
  const serviceType = params.serviceType || 'local';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Booking Confirmed</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <CheckCircle2 size={40} color={Colors.primary} />
        </View>
        <Text style={styles.title}>You're all set!</Text>
        <Text style={styles.subtitle}>Your booking is confirmed and your friend is ready to meet.</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.label}>Friend</Text>
          <Text style={styles.value}>{friend?.name ?? 'N/A'}</Text>

          <Text style={styles.label}>When</Text>
          <Text style={styles.value}>{date} · {time}</Text>

          <Text style={styles.label}>Duration</Text>
          <Text style={styles.value}>{duration}h</Text>

          <Text style={styles.label}>Service</Text>
          <Text style={styles.value}>{serviceType === 'virtual' ? 'Virtual call' : 'In-person meeting'}</Text>

          <Text style={styles.label}>Total Paid</Text>
          <Text style={styles.value}>₹{total}</Text>
        </View>

        <Pressable style={styles.button} onPress={() => router.push('/(tabs)/(home)')} testID="go-home">
          <Home size={18} color="#fff" />
          <Text style={styles.buttonText}>Go to Home</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.secondaryButton]} onPress={() => router.push('/(tabs)/bookings')} testID="view-bookings">
          <Text style={[styles.buttonText, styles.secondaryText]}>View My Bookings</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.tagBg, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800' as const, color: Colors.text, marginBottom: 10 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  summaryCard: { width: '100%', backgroundColor: Colors.card, borderRadius: 18, padding: 18, marginBottom: 28, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  label: { fontSize: 12, color: Colors.textSecondary, textTransform: 'uppercase' as const, marginTop: 12 },
  value: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginTop: 4 },
  button: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: 14, marginBottom: 12 },
  secondaryButton: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border },
  buttonText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
  secondaryText: { color: Colors.text },
});
