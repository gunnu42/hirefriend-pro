import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Zap, Crown, Star, Check, Shield, ShieldCheck, Gift,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useWallet } from '@/contexts/WalletContext';

interface PricingTier {
  id: string;
  name: string;
  price: string;
  priceNote: string;
  connects: string;
  features: string[];
  popular: boolean;
  badge?: string;
  color: string;
}

const tiers: PricingTier[] = [
  {
    id: 'trial',
    name: 'Trial / Free',
    price: 'FREE',
    priceNote: 'one-time',
    connects: '1 Connection',
    features: ['1 free friend connection (one-time)', 'Requires KYC verification', 'Basic chat access', 'Standard support'],
    popular: false,
    color: Colors.teal,
  },
  {
    id: 'silver',
    name: 'Silver',
    price: '₹1,800',
    priceNote: 'one-time',
    connects: '10 Connections',
    features: ['10 friend connections', 'Standard support', 'Profile visibility', 'Basic chat access'],
    popular: false,
    color: Colors.textSecondary,
  },
  {
    id: 'gold',
    name: 'Gold',
    price: '₹3,500',
    priceNote: 'one-time',
    connects: '25 Connections',
    features: ['25 friend connections', 'Priority chat access', 'Verified badge', 'Profile boost (3x views)', 'Priority support'],
    popular: true,
    badge: 'Most Popular',
    color: Colors.gold,
  },
  {
    id: 'platinum',
    name: 'Platinum',
    price: '₹5,000',
    priceNote: '/year',
    connects: 'Unlimited',
    features: ['Unlimited connections (yearly)', 'Gold Elite badge', '24/7 priority support', 'Early access to features', 'Zero service fees', 'Profile boost (5x views)'],
    popular: false,
    badge: 'Best Value',
    color: '#8B5CF6',
  },
];

function getTierIcon(id: string) {
  switch (id) {
    case 'trial': return Gift;
    case 'silver': return Zap;
    case 'gold': return Star;
    case 'platinum': return Crown;
    default: return Zap;
  }
}

export default function PricingScreen() {
  const router = useRouter();
  const { credits, kycStatus, subscription, pointsToFreeConnection } = useWallet();
  const [selectedTier, setSelectedTier] = useState<string>('gold');

  const handlePurchase = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const tier = tiers.find((t) => t.id === selectedTier);

    if (selectedTier === 'trial') {
      if (kycStatus !== 'verified') {
        Alert.alert(
          'KYC Required',
          'Complete identity verification to unlock your free trial connection.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Verify Now', onPress: () => router.push('/kyc-verification') },
          ]
        );
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Free Connection Unlocked!', 'Your 1 free connection has been activated.', [
          { text: 'Great!', onPress: () => router.back() },
        ]);
      }
      return;
    }

    router.push({ pathname: '/checkout', params: { tier: selectedTier } });
  }, [selectedTier, kycStatus, router]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Credits & Pricing</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.balanceCard}>
          <View style={styles.balanceRow}>
            <View style={styles.balanceIcon}>
              <Zap size={24} color={Colors.gold} />
            </View>
            <View style={styles.balanceMid}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceValue}>{credits} Credits</Text>
            </View>
            <Pressable style={styles.walletLink} onPress={() => router.push('/wallet')} testID="wallet-link">
              <Text style={styles.walletLinkText}>Wallet</Text>
            </Pressable>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${((500 - pointsToFreeConnection) / 500) * 100}%` }]} />
          </View>
          <Text style={styles.balanceSub}>{pointsToFreeConnection} credits to next free connection</Text>
        </View>

        {subscription !== 'free' && (
          <View style={styles.currentPlanBadge}>
            <Crown size={16} color={Colors.gold} />
            <Text style={styles.currentPlanText}>
              Current Plan: {subscription.charAt(0).toUpperCase() + subscription.slice(1)}
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Choose Your Plan</Text>

        {tiers.map((tier) => {
          const TierIcon = getTierIcon(tier.id);
          return (
            <Pressable
              key={tier.id}
              style={[
                styles.tierCard,
                selectedTier === tier.id && styles.tierCardSelected,
                tier.id === 'platinum' && styles.tierCardPlatinum,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedTier(tier.id);
              }}
              testID={`tier-${tier.id}`}
            >
              {tier.badge && (
                <View style={[
                  styles.tierBadge,
                  tier.id === 'platinum' ? styles.tierBadgePlatinum : styles.tierBadgePopular,
                ]}>
                  <Text style={[
                    styles.tierBadgeText,
                    tier.id === 'platinum' && styles.tierBadgeTextPlatinum,
                  ]}>{tier.badge}</Text>
                </View>
              )}
              <View style={styles.tierHeader}>
                <View style={styles.tierLeft}>
                  <TierIcon size={22} color={tier.color} />
                  <View>
                    <Text style={styles.tierName}>{tier.name}</Text>
                    <Text style={styles.tierConnects}>{tier.connects}</Text>
                  </View>
                </View>
                <View style={styles.tierPriceCol}>
                  <Text style={[styles.tierPrice, { color: tier.id === 'trial' ? Colors.teal : Colors.text }]}>
                    {tier.price}
                  </Text>
                  {tier.id !== 'trial' && <Text style={styles.tierPriceNote}>{tier.priceNote}</Text>}
                </View>
              </View>
              <View style={styles.tierFeatures}>
                {tier.features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Check size={14} color={Colors.success} />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
              {selectedTier === tier.id && (
                <View style={styles.selectedIndicator}>
                  <View style={styles.selectedDot} />
                </View>
              )}
            </Pressable>
          );
        })}

        <View style={styles.guaranteeRow}>
          <Shield size={16} color={Colors.teal} />
          <Text style={styles.guaranteeText}>100% secure payment · Money-back guarantee</Text>
        </View>

        <Pressable style={styles.billingLink} onPress={() => router.push('/billing-history')} testID="billing-link">
          <Text style={styles.billingLinkText}>View Billing History</Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <SafeAreaView edges={['bottom']} style={styles.bottomBarInner}>
          <View>
            <Text style={styles.bottomPrice}>
              {tiers.find((t) => t.id === selectedTier)?.price}
            </Text>
            <Text style={styles.bottomSub}>
              {tiers.find((t) => t.id === selectedTier)?.name}
            </Text>
          </View>
          <Pressable style={styles.purchaseBtn} onPress={handlePurchase} testID="purchase-btn">
            <Text style={styles.purchaseBtnText}>
              {selectedTier === 'trial' ? 'Claim Free' : 'Purchase Now'}
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
  balanceCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 20,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  balanceRow: { flexDirection: 'row', alignItems: 'center' },
  balanceIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.goldLight,
    alignItems: 'center', justifyContent: 'center',
  },
  balanceMid: { flex: 1, marginLeft: 12 },
  balanceLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' as const },
  balanceValue: { fontSize: 24, fontWeight: '800' as const, color: Colors.text },
  walletLink: {
    backgroundColor: Colors.tagBg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
  },
  walletLinkText: { fontSize: 13, fontWeight: '600' as const, color: Colors.primary },
  progressBarBg: {
    height: 6, backgroundColor: Colors.surfaceAlt, borderRadius: 3,
    overflow: 'hidden', marginTop: 14,
  },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },
  balanceSub: { fontSize: 12, color: Colors.textTertiary, marginTop: 6 },
  currentPlanBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    backgroundColor: Colors.goldLight, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  currentPlanText: { fontSize: 13, fontWeight: '700' as const, color: Colors.goldText },
  sectionTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.text, marginTop: 24, marginBottom: 14 },
  tierCard: {
    backgroundColor: Colors.card, borderRadius: 18, padding: 18, marginBottom: 12,
    borderWidth: 2, borderColor: 'transparent',
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    position: 'relative', overflow: 'hidden',
  },
  tierCardSelected: { borderColor: Colors.primary },
  tierCardPlatinum: { backgroundColor: '#FDFAFF' },
  tierBadge: {
    position: 'absolute', top: 12, right: 12, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  tierBadgePopular: { backgroundColor: Colors.tagBg },
  tierBadgePlatinum: { backgroundColor: '#EDE9FE' },
  tierBadgeText: { fontSize: 11, fontWeight: '700' as const, color: Colors.primary },
  tierBadgeTextPlatinum: { color: '#7C3AED' },
  tierHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tierLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tierName: { fontSize: 17, fontWeight: '700' as const, color: Colors.text },
  tierConnects: { fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  tierPriceCol: { alignItems: 'flex-end' },
  tierPrice: { fontSize: 22, fontWeight: '800' as const, color: Colors.text },
  tierPriceNote: { fontSize: 12, color: Colors.textTertiary },
  tierFeatures: {
    marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.borderLight, gap: 8,
  },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, color: Colors.textSecondary },
  selectedIndicator: { position: 'absolute', top: 18, left: 18 },
  selectedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  guaranteeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16,
  },
  guaranteeText: { fontSize: 13, color: Colors.teal, fontWeight: '500' as const },
  billingLink: { alignItems: 'center', marginTop: 12 },
  billingLinkText: { fontSize: 14, fontWeight: '600' as const, color: Colors.primary },
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
  purchaseBtn: {
    backgroundColor: '#F97316', borderRadius: 14, paddingHorizontal: 28, height: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  purchaseBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
});

