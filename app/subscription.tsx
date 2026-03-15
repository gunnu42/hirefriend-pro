import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Crown, Star, Zap, Gift, Check, Shield, Lock,
  MessageCircle, Eye, Users, Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useWallet, SubscriptionTier } from '@/contexts/WalletContext';

interface TierConfig {
  id: SubscriptionTier;
  name: string;
  price: string;
  period: string;
  connects: string;
  features: { text: string; locked: boolean }[];
  color: string;
  popular: boolean;
  badge?: string;
}

const tiers: TierConfig[] = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    period: '',
    connects: '2 Connects (lifetime demo)',
    features: [
      { text: 'Browse profiles', locked: false },
      { text: 'Daily check-in rewards', locked: false },
      { text: '2 demo profile connects', locked: false },
      { text: 'Messaging', locked: true },
      { text: 'Full story access', locked: true },
    ],
    color: Colors.textSecondary,
    popular: false,
  },
  {
    id: 'silver',
    name: 'Silver',
    price: '₹1,800',
    period: 'one-time',
    connects: '20 Connects',
    features: [
      { text: '20 friend connections', locked: false },
      { text: 'Standard support', locked: false },
      { text: 'Messaging unlocked', locked: false },
      { text: 'Profile visibility boost', locked: false },
    ],
    color: '#94A3B8',
    popular: false,
  },
  {
    id: 'gold',
    name: 'Gold',
    price: '₹3,500',
    period: 'one-time',
    connects: '50 Connects',
    features: [
      { text: '50 friend connections', locked: false },
      { text: 'Priority chat access', locked: false },
      { text: 'Premium badge', locked: false },
      { text: 'Profile boost (3x views)', locked: false },
      { text: 'Full story access', locked: false },
      { text: 'Priority support', locked: false },
    ],
    color: Colors.gold,
    popular: true,
    badge: 'Most Popular',
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: '₹5,000',
    period: 'one-time',
    connects: '200 Connects',
    features: [
      { text: '200 friend connections', locked: false },
      { text: 'Platinum crown badge', locked: false },
      { text: '24/7 priority support', locked: false },
      { text: 'Early access to new features', locked: false },
      { text: 'Highest profile boost', locked: false },
      { text: 'Full story access', locked: false },
    ],
    color: '#8B5CF6',
    popular: false,
    badge: 'Best Value',
  },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const { subscription, setSubscription, addBillingRecord } = useWallet();
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>(
    subscription === 'free' ? 'silver' : subscription
  );
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const successAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;

  const handlePurchase = useCallback(() => {
    if (selectedTier === 'free') return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const tier = tiers.find(t => t.id === selectedTier);
    if (!tier) return;

    const connectsMap: Record<string, number> = { silver: 20, gold: 40, platinum: 300 };
    const connects = connectsMap[selectedTier] ?? 0;
    setSubscription(selectedTier, connects);
    addBillingRecord({
      id: `b_${Date.now()}`,
      tier: selectedTier,
      amount: tier.price,
      date: new Date().toISOString().split('T')[0],
      status: 'completed',
      method: 'UPI (GPay)',
      invoiceId: `INV-${Date.now()}`,
    });

    setShowSuccess(true);
    Animated.parallel([
      Animated.timing(successAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  }, [selectedTier, setSubscription, addBillingRecord, successAnim, scaleAnim]);

  if (showSuccess) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.successContainer}>
          <Animated.View style={[styles.successContent, { opacity: successAnim, transform: [{ scale: scaleAnim }] }]}>
            <View style={styles.successIconCircle}>
              <Crown size={48} color={Colors.gold} />
            </View>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSub}>
              You are now a {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} member.
              {'\n'}Enjoy your premium features!
            </Text>

            <View style={styles.successFeatures}>
              <View style={styles.successFeatureRow}>
                <MessageCircle size={18} color={Colors.success} />
                <Text style={styles.successFeatureText}>Chat Unlocked</Text>
              </View>
              <View style={styles.successFeatureRow}>
                <Eye size={18} color={Colors.success} />
                <Text style={styles.successFeatureText}>Stories Visible</Text>
              </View>
              <View style={styles.successFeatureRow}>
                <Users size={18} color={Colors.success} />
                <Text style={styles.successFeatureText}>
                  {selectedTier === 'platinum' ? '300' : selectedTier === 'gold' ? '40' : '20'} Connects Available
                </Text>
              </View>
            </View>

            <Pressable style={styles.successBtn} onPress={() => router.back()} testID="done-btn">
              <Text style={styles.successBtnText}>Start Exploring</Text>
            </Pressable>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Subscription</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <Sparkles size={32} color={Colors.gold} />
          <Text style={styles.heroTitle}>Unlock Premium</Text>
          <Text style={styles.heroSub}>
            Get full access to messaging, stories, and connect with friends.
          </Text>
        </View>

        {subscription !== 'free' && (
          <View style={styles.currentPlanCard}>
            <Crown size={18} color={Colors.gold} />
            <Text style={styles.currentPlanText}>
              Current: {subscription.charAt(0).toUpperCase() + subscription.slice(1)}
            </Text>
          </View>
        )}

        {tiers.filter(t => t.id !== 'free').map((tier) => (
          <Pressable
            key={tier.id}
            style={[
              styles.tierCard,
              selectedTier === tier.id && styles.tierCardSelected,
              { borderColor: selectedTier === tier.id ? tier.color : Colors.border },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedTier(tier.id);
            }}
            testID={`tier-${tier.id}`}
          >
            {tier.badge && (
              <View style={[styles.tierBadge, { backgroundColor: tier.color + '20' }]}>
                <Text style={[styles.tierBadgeText, { color: tier.color }]}>{tier.badge}</Text>
              </View>
            )}

            <View style={styles.tierTop}>
              <View style={styles.tierNameRow}>
                {tier.id === 'silver' && <Zap size={20} color={tier.color} />}
                {tier.id === 'gold' && <Star size={20} color={tier.color} />}
                {tier.id === 'platinum' && <Crown size={20} color={tier.color} />}
                <Text style={styles.tierName}>{tier.name}</Text>
              </View>
              <View style={styles.tierPriceCol}>
                <Text style={[styles.tierPrice, { color: tier.color }]}>{tier.price}</Text>
                {tier.period ? <Text style={styles.tierPeriod}>{tier.period}</Text> : null}
              </View>
            </View>

            <Text style={styles.tierConnects}>{tier.connects}</Text>

            <View style={styles.tierFeatures}>
              {tier.features.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  {f.locked ? (
                    <Lock size={14} color={Colors.textTertiary} />
                  ) : (
                    <Check size={14} color={Colors.success} />
                  )}
                  <Text style={[styles.featureText, f.locked && styles.featureTextLocked]}>{f.text}</Text>
                </View>
              ))}
            </View>

            {selectedTier === tier.id && (
              <View style={[styles.selectedDot, { backgroundColor: tier.color }]} />
            )}
          </Pressable>
        ))}

        <View style={styles.freeSection}>
          <Gift size={18} color={Colors.teal} />
          <Text style={styles.freeText}>
            Complete KYC to get 1 free connection!
          </Text>
          <Pressable onPress={() => router.push('/kyc-verification')} testID="kyc-link">
            <Text style={styles.freeLink}>Verify Now</Text>
          </Pressable>
        </View>

        <View style={styles.trustRow}>
          <Shield size={14} color={Colors.teal} />
          <Text style={styles.trustText}>Secured by Razorpay · PCI-DSS Compliant</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <SafeAreaView edges={['bottom']} style={styles.bottomBarInner}>
          <Pressable
            style={[styles.purchaseBtn, selectedTier === 'free' && styles.purchaseBtnDisabled]}
            onPress={handlePurchase}
            disabled={selectedTier === 'free'}
            testID="purchase-btn"
          >
            <Text style={styles.purchaseBtnText}>
              Subscribe to {selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}
            </Text>
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
  heroSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  heroTitle: { fontSize: 28, fontWeight: '800' as const, color: Colors.text },
  heroSub: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  currentPlanCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.goldLight, borderRadius: 12, padding: 12,
    marginBottom: 16, alignSelf: 'center',
  },
  currentPlanText: { fontSize: 14, fontWeight: '700' as const, color: Colors.goldText },
  tierCard: {
    backgroundColor: Colors.card, borderRadius: 18, padding: 18, marginBottom: 14,
    borderWidth: 2, position: 'relative', overflow: 'hidden',
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  tierCardSelected: {},
  tierBadge: {
    position: 'absolute', top: 12, right: 12, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  tierBadgeText: { fontSize: 11, fontWeight: '700' as const },
  tierTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  tierNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  tierName: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  tierPriceCol: { alignItems: 'flex-end' },
  tierPrice: { fontSize: 24, fontWeight: '800' as const },
  tierPeriod: { fontSize: 12, color: Colors.textTertiary },
  tierConnects: {
    fontSize: 13, fontWeight: '600' as const, color: Colors.primary, marginTop: 6,
  },
  tierFeatures: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.borderLight, gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, color: Colors.textSecondary },
  featureTextLocked: { color: Colors.textTertiary, textDecorationLine: 'line-through' },
  selectedDot: {
    position: 'absolute', top: 18, left: 18, width: 8, height: 8, borderRadius: 4,
  },
  freeSection: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.tealLight, borderRadius: 12, padding: 14,
    marginTop: 8, flexWrap: 'wrap',
  },
  freeText: { fontSize: 13, color: Colors.teal, flex: 1 },
  freeLink: { fontSize: 13, fontWeight: '700' as const, color: Colors.teal, textDecorationLine: 'underline' },
  trustRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: 16,
  },
  trustText: { fontSize: 12, color: Colors.teal, fontWeight: '500' as const },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  bottomBarInner: { paddingHorizontal: 20, paddingTop: 14 },
  purchaseBtn: {
    backgroundColor: '#F97316', borderRadius: 14, height: 52,
    alignItems: 'center', justifyContent: 'center',
  },
  purchaseBtnDisabled: { opacity: 0.4 },
  purchaseBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
  successContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  successContent: { alignItems: 'center' },
  successIconCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.goldLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  successTitle: { fontSize: 24, fontWeight: '800' as const, color: Colors.text },
  successSub: {
    fontSize: 15, color: Colors.textSecondary, textAlign: 'center',
    marginTop: 8, lineHeight: 22,
  },
  successFeatures: {
    marginTop: 24, gap: 12, backgroundColor: Colors.card, borderRadius: 16,
    padding: 18, width: '100%',
  },
  successFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  successFeatureText: { fontSize: 15, fontWeight: '600' as const, color: Colors.text },
  successBtn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingHorizontal: 40,
    height: 52, alignItems: 'center', justifyContent: 'center', marginTop: 28,
  },
  successBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
});

