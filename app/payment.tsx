import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, Smartphone, Check, Lock } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { friends } from '@/mocks/friends';

type PaymentMethod = 'upi_gpay' | 'upi_phonepe' | 'upi_paytm' | 'card_visa' | 'card_master' | 'card_rupay';

const paymentOptions: { id: PaymentMethod; name: string; subtitle: string; type: 'upi' | 'card' }[] = [
  { id: 'upi_gpay', name: 'Google Pay', subtitle: 'UPI', type: 'upi' },
  { id: 'upi_phonepe', name: 'PhonePe', subtitle: 'UPI', type: 'upi' },
  { id: 'upi_paytm', name: 'Paytm', subtitle: 'UPI', type: 'upi' },
  { id: 'card_visa', name: 'Visa •••• 4242', subtitle: 'Credit Card', type: 'card' },
  { id: 'card_master', name: 'Mastercard •••• 8888', subtitle: 'Debit Card', type: 'card' },
  { id: 'card_rupay', name: 'RuPay •••• 1234', subtitle: 'Debit Card', type: 'card' },
];

export default function PaymentScreen() {
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
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi_gpay');
  const [processing, setProcessing] = useState(false);

  const total = params.total ? Number(params.total) : friend?.pricePerHour ?? 0;
  const date = params.date ? new Date(params.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD';
  const time = params.time ?? 'TBD';
  const duration = params.duration ?? '1';
  const serviceType = params.serviceType ?? 'local';

  const handlePay = useCallback(() => {
    if (!friend) {
      Alert.alert('Missing friend', 'Try booking again from the profile page.');
      return;
    }

    setProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setTimeout(() => {
      setProcessing(false);
      router.push({ pathname: '/booking-confirmation' as any,
        params: {
          friendId: friend.id,
          date: params.date ?? '',
          time,
          duration,
          total: total.toString(),
          serviceType,
        },
      });
    }, 1200);
  }, [friend, router, params.date, time, duration, total, serviceType]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Summary</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{friend?.name ?? 'Friend'}</Text>
            <Text style={styles.summaryValue}>{date} · {time} · {duration}h</Text>
            <Text style={styles.summarySub}>{serviceType === 'virtual' ? 'Virtual Session' : 'In-person Session'}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        {paymentOptions.map((opt) => (
          <Pressable
            key={opt.id}
            style={[styles.methodCard, selectedMethod === opt.id && styles.methodCardSelected]}
            onPress={() => setSelectedMethod(opt.id)}
            testID={`method-${opt.id}`}
          >
            <View style={styles.methodLeft}>
              <View style={styles.methodIcon}>
                {opt.type === 'upi' ? (
                  <Smartphone size={20} color={selectedMethod === opt.id ? Colors.primary : Colors.textSecondary} />
                ) : (
                  <CreditCard size={20} color={selectedMethod === opt.id ? Colors.primary : Colors.textSecondary} />
                )}
              </View>
              <View>
                <Text style={styles.methodName}>{opt.name}</Text>
                <Text style={styles.methodSub}>{opt.subtitle}</Text>
              </View>
            </View>
            {selectedMethod === opt.id && (
              <View style={styles.methodCheck}>
                <Check size={16} color="#fff" />
              </View>
            )}
          </Pressable>
        ))}

        <View style={styles.securityRow}>
          <Lock size={14} color={Colors.teal} />
          <Text style={styles.securityText}>Secure payment · 256-bit SSL · 3D Secure</Text>
        </View>

        <View style={{ height: 140 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <SafeAreaView edges={['bottom']} style={styles.bottomBarInner}>
          <View>
            <Text style={styles.bottomPrice}>₹{total}</Text>
            <Text style={styles.bottomSub}>Total</Text>
          </View>
          <Pressable
            style={[styles.payBtn, processing && styles.payBtnDisabled]}
            onPress={handlePay}
            disabled={processing}
            testID="pay-btn"
          >
            <Text style={styles.payBtnText}>{processing ? 'Processing...' : 'Pay Now'}</Text>
          </Pressable>
        </SafeAreaView>
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
  scrollContent: { paddingHorizontal: 16 },
  section: { marginTop: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginBottom: 12 },
  summaryCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 18, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 3 },
  summaryLabel: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  summaryValue: { fontSize: 14, color: Colors.textSecondary, marginTop: 8 },
  summarySub: { fontSize: 13, color: Colors.textTertiary, marginTop: 4 },
  methodCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: 'transparent' },
  methodCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.tagBg },
  methodLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  methodIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surfaceAlt },
  methodName: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  methodSub: { fontSize: 13, color: Colors.textSecondary },
  methodCheck: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  securityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  securityText: { fontSize: 12, color: Colors.textSecondary },
  bottomBar: { borderTopWidth: 1, borderTopColor: Colors.borderLight, backgroundColor: Colors.surface, paddingTop: 10 },
  bottomBarInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 },
  bottomPrice: { fontSize: 20, fontWeight: '800' as const, color: Colors.text },
  bottomSub: { fontSize: 12, color: Colors.textSecondary },
  payBtn: { backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 14 },
  payBtnDisabled: { opacity: 0.6 },
  payBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
});

