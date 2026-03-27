import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft, ShieldCheck, CreditCard, Smartphone, Check, Lock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useWallet, SubscriptionTier } from '@/contexts/WalletContext';

type PaymentMethod = 'upi_gpay' | 'upi_phonepe' | 'upi_paytm' | 'card_visa' | 'card_master' | 'card_rupay';

interface PaymentOption {
  id: PaymentMethod;
  name: string;
  subtitle: string;
  type: 'upi' | 'card';
}

const paymentOptions: PaymentOption[] = [
  { id: 'upi_gpay', name: 'Google Pay', subtitle: 'UPI', type: 'upi' },
  { id: 'upi_phonepe', name: 'PhonePe', subtitle: 'UPI', type: 'upi' },
  { id: 'upi_paytm', name: 'Paytm', subtitle: 'UPI', type: 'upi' },
  { id: 'card_visa', name: 'Visa •••• 4242', subtitle: 'Credit Card', type: 'card' },
  { id: 'card_master', name: 'Mastercard •••• 8888', subtitle: 'Debit Card', type: 'card' },
  { id: 'card_rupay', name: 'RuPay •••• 1234', subtitle: 'Debit Card', type: 'card' },
];

const tierDetails: Record<string, { name: string; price: string; connects: string; connectCount: number }> = {
  silver: { name: 'Silver', price: '₹1,800', connects: '20 Connections', connectCount: 20 },
  gold: { name: 'Gold', price: '₹3,500', connects: '40 Connections', connectCount: 40 },
  platinum: { name: 'Platinum', price: '₹5,000', connects: '300 Connections', connectCount: 300 },
};

export default function CheckoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tier: string }>();
  const walletData = useWallet();
  const kycStatus = walletData?.kycStatus ?? 'pending';
  const setSubscription = walletData?.setSubscription ?? (() => {});
  const addBillingRecord = walletData?.addBillingRecord ?? (() => {});
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('upi_gpay');
  const [processing, setProcessing] = useState<boolean>(false);

  const tier = (params.tier ?? 'silver') as string;
  const details = tierDetails[tier] ?? tierDetails.silver;
  const kycDone = kycStatus === 'verified';

  const handlePurchase = useCallback(() => {
    if (!kycDone) {
      Alert.alert('KYC Required', 'Please complete identity verification before making a purchase.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Verify Now', onPress: () => router.push('/kyc-verification' as any) },
      ]);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setProcessing(true);

    setTimeout(() => {
      Alert.alert(
        '3D Secure Verification',
        'Simulating OTP verification for secure transaction...',
        [{
          text: 'Verify (OTP: 123456)',
          onPress: () => {
            setProcessing(false);
            setSubscription(tier as SubscriptionTier, details.connectCount);
            const method = paymentOptions.find((p) => p.id === selectedMethod);
            addBillingRecord({
              id: `b_${Date.now()}`,
              tier: tier as SubscriptionTier,
              amount: details.price,
              date: new Date().toISOString().split('T')[0],
              status: 'completed',
              method: method?.name ?? 'UPI',
              invoiceId: `INV-${Date.now()}`,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
              'Payment Successful!',
              `Welcome to HireFriend ${details.name}! ${details.connects} have been activated.`,
              [{ text: 'Great!', onPress: () => router.back() }]
            );
          },
        }]
      );
    }, 1500);
  }, [kycDone, tier, selectedMethod, details, router, setSubscription, addBillingRecord]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Checkout</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.orderCard}>
          <Text style={styles.orderLabel}>ORDER SUMMARY</Text>
          <View style={styles.orderRow}>
            <Text style={styles.orderItem}>HireFriend {details.name}</Text>
            <Text style={styles.orderPrice}>{details.price}</Text>
          </View>
          <View style={styles.orderRow}>
            <Text style={styles.orderItemSub}>{details.connects}</Text>
          </View>
          <View style={styles.orderDivider} />
          <View style={styles.orderRow}>
            <Text style={styles.orderTotal}>Total</Text>
            <Text style={styles.orderTotalPrice}>{details.price}</Text>
          </View>
        </View>

        {!kycDone && (
          <Pressable style={styles.kycWarning} onPress={() => router.push('/kyc-verification' as any)} testID="kyc-warning">
            <ShieldCheck size={20} color={Colors.gold} />
            <View style={styles.kycWarningContent}>
              <Text style={styles.kycWarningTitle}>KYC Required</Text>
              <Text style={styles.kycWarningSub}>Complete identity verification to enable purchases</Text>
            </View>
          </Pressable>
        )}

        <Text style={styles.sectionTitle}>UPI Payment</Text>
        {paymentOptions.filter((p) => p.type === 'upi').map((opt) => (
          <Pressable
            key={opt.id}
            style={[styles.methodCard, selectedMethod === opt.id && styles.methodCardSelected]}
            onPress={() => setSelectedMethod(opt.id)}
            testID={`method-${opt.id}`}
          >
            <View style={styles.methodLeft}>
              <View style={styles.methodIcon}>
                <Smartphone size={20} color={selectedMethod === opt.id ? Colors.primary : Colors.textSecondary} />
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

        <Text style={styles.sectionTitle}>Credit / Debit Card</Text>
        {paymentOptions.filter((p) => p.type === 'card').map((opt) => (
          <Pressable
            key={opt.id}
            style={[styles.methodCard, selectedMethod === opt.id && styles.methodCardSelected]}
            onPress={() => setSelectedMethod(opt.id)}
            testID={`method-${opt.id}`}
          >
            <View style={styles.methodLeft}>
              <View style={styles.methodIcon}>
                <CreditCard size={20} color={selectedMethod === opt.id ? Colors.primary : Colors.textSecondary} />
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
          <Text style={styles.securityText}>256-bit SSL Encryption · 3D Secure Verified</Text>
        </View>

        <View style={styles.trustBadges}>
          <View style={styles.trustBadge}>
            <ShieldCheck size={14} color={Colors.teal} />
            <Text style={styles.trustBadgeText}>Secured by Razorpay</Text>
          </View>
          <View style={styles.trustBadge}>
            <Lock size={14} color={Colors.teal} />
            <Text style={styles.trustBadgeText}>PCI-DSS Compliant</Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <SafeAreaView edges={['bottom']} style={styles.bottomBarInner}>
          <View>
            <Text style={styles.bottomPrice}>{details.price}</Text>
            <Text style={styles.bottomSub}>{details.name} Plan</Text>
          </View>
          <Pressable
            style={[styles.payBtn, processing && styles.payBtnDisabled]}
            onPress={handlePurchase}
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
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  scrollContent: { paddingHorizontal: 16 },
  orderCard: {
    backgroundColor: Colors.card, borderRadius: 18, padding: 20,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  orderLabel: { fontSize: 11, fontWeight: '700' as const, color: Colors.textTertiary, letterSpacing: 1, marginBottom: 12 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  orderItem: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  orderItemSub: { fontSize: 13, color: Colors.textSecondary },
  orderPrice: { fontSize: 18, fontWeight: '800' as const, color: Colors.text },
  orderDivider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: 12 },
  orderTotal: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  orderTotalPrice: { fontSize: 22, fontWeight: '800' as const, color: Colors.primary },
  kycWarning: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16,
    backgroundColor: Colors.goldLight, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.goldBorder,
  },
  kycWarningContent: { flex: 1 },
  kycWarningTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.goldText },
  kycWarningSub: { fontSize: 12, color: Colors.goldText, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginTop: 24, marginBottom: 10 },
  methodCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 2, borderColor: 'transparent',
  },
  methodCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.tagBg },
  methodLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  methodIcon: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  methodName: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  methodSub: { fontSize: 12, color: Colors.textTertiary, marginTop: 1 },
  methodCheck: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  securityRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 20,
  },
  securityText: { fontSize: 12, color: Colors.teal, fontWeight: '500' as const },
  trustBadges: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginTop: 10 },
  trustBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.tealLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  trustBadgeText: { fontSize: 11, fontWeight: '600' as const, color: Colors.teal },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  bottomBarInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 14,
  },
  bottomPrice: { fontSize: 22, fontWeight: '800' as const, color: Colors.text },
  bottomSub: { fontSize: 12, color: Colors.textTertiary },
  payBtn: {
    backgroundColor: '#F97316', borderRadius: 14, paddingHorizontal: 32, height: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
});

