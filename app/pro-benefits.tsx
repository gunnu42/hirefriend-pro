import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Crown, Zap, Shield, Users, MessageCircle, Star, Rocket, Eye, BadgeCheck,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useWallet } from '@/contexts/WalletContext';

const benefits = [
  { icon: Zap, title: 'Zero Service Fees', desc: 'Keep 100% of what you earn. No hidden charges on any connection.' },
  { icon: Users, title: 'Unlimited Connections', desc: 'Connect with as many friends as you want with Platinum plan.' },
  { icon: Shield, title: 'Priority Verification', desc: 'Get verified faster with our priority review process.' },
  { icon: MessageCircle, title: 'Priority Messaging', desc: 'Your messages appear at the top. Never get lost in the queue.' },
  { icon: Eye, title: 'Profile Boost', desc: 'Appear higher in search results and get up to 5x more profile views.' },
  { icon: Rocket, title: 'Early Access', desc: 'Be the first to try new features before they launch publicly.' },
  { icon: BadgeCheck, title: 'Gold Elite Badge', desc: 'Stand out with an exclusive Gold Elite badge on your profile.' },
  { icon: Star, title: '24/7 Priority Support', desc: 'Get help anytime with dedicated priority support for paid members.' },
];

export default function ProBenefitsScreen() {
  const router = useRouter();
  const { subscription } = useWallet();

  const handleUpgrade = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/pricing');
  }, [router]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>HireFriend PRO</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Crown size={36} color={Colors.gold} />
          </View>
          <Text style={styles.heroTitle}>Go PRO</Text>
          <Text style={styles.heroSub}>Unlock the full HireFriend experience</Text>
          <View style={styles.tierPreview}>
            <View style={styles.tierChip}>
              <Text style={styles.tierChipLabel}>Silver</Text>
              <Text style={styles.tierChipPrice}>₹1,800</Text>
            </View>
            <View style={[styles.tierChip, styles.tierChipGold]}>
              <Text style={[styles.tierChipLabel, styles.tierChipLabelGold]}>Gold</Text>
              <Text style={[styles.tierChipPrice, styles.tierChipPriceGold]}>₹3,500</Text>
            </View>
            <View style={[styles.tierChip, styles.tierChipPlatinum]}>
              <Text style={[styles.tierChipLabel, styles.tierChipLabelPlatinum]}>Platinum</Text>
              <Text style={[styles.tierChipPrice, styles.tierChipPricePlatinum]}>₹5,000/yr</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>PRO Benefits</Text>

        {benefits.map((b, i) => {
          const IconComp = b.icon;
          return (
            <View key={i} style={styles.benefitCard}>
              <View style={styles.benefitIcon}>
                <IconComp size={22} color={Colors.primary} />
              </View>
              <View style={styles.benefitContent}>
                <Text style={styles.benefitTitle}>{b.title}</Text>
                <Text style={styles.benefitDesc}>{b.desc}</Text>
              </View>
            </View>
          );
        })}

        <View style={styles.comparisonCard}>
          <Text style={styles.comparisonTitle}>Free vs Silver vs Gold vs Platinum</Text>
          <View style={styles.compHeader}>
            <Text style={[styles.compLabel, { flex: 1.5 }]}>Feature</Text>
            <Text style={styles.compCol}>Free</Text>
            <Text style={styles.compCol}>Silver</Text>
            <Text style={[styles.compCol, { color: Colors.gold }]}>Gold</Text>
            <Text style={[styles.compCol, { color: '#8B5CF6' }]}>Plat</Text>
          </View>
          <CompRow label="Connections" vals={['1', '10', '25', '∞']} />
          <CompRow label="Service Fee" vals={['15%', '10%', '5%', '0%']} />
          <CompRow label="Profile Boost" vals={['—', '—', '3x', '5x']} />
          <CompRow label="Support" vals={['Basic', 'Std', 'Priority', '24/7']} />
          <CompRow label="Badge" vals={['—', '—', '✓', 'Gold']} />
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <SafeAreaView edges={['bottom']} style={styles.bottomBarInner}>
          <Pressable style={styles.upgradeBtn} onPress={handleUpgrade} testID="upgrade-btn">
            <Crown size={20} color="#fff" />
            <Text style={styles.upgradeBtnText}>
              {subscription === 'free' ? 'View Plans & Upgrade' : 'Manage Subscription'}
            </Text>
          </Pressable>
        </SafeAreaView>
      </View>
    </View>
  );
}

function CompRow({ label, vals }: { label: string; vals: string[] }) {
  return (
    <View style={styles.compRow}>
      <Text style={[styles.compLabel, { flex: 1.5 }]}>{label}</Text>
      {vals.map((v, i) => (
        <Text key={i} style={[styles.compVal, i === 3 && { color: '#8B5CF6', fontWeight: '700' as const }]}>{v}</Text>
      ))}
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
  heroCard: {
    backgroundColor: Colors.goldLight, borderRadius: 24, padding: 28, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.goldBorder,
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: '#FFF0C2',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  heroTitle: { fontSize: 28, fontWeight: '800' as const, color: Colors.goldText },
  heroSub: { fontSize: 15, color: Colors.goldText, opacity: 0.8, marginTop: 4 },
  tierPreview: { flexDirection: 'row', gap: 8, marginTop: 20 },
  tierChip: {
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center',
  },
  tierChipGold: { backgroundColor: Colors.gold },
  tierChipPlatinum: { backgroundColor: '#8B5CF6' },
  tierChipLabel: { fontSize: 11, fontWeight: '600' as const, color: Colors.textSecondary },
  tierChipLabelGold: { color: '#fff' },
  tierChipLabelPlatinum: { color: '#fff' },
  tierChipPrice: { fontSize: 14, fontWeight: '800' as const, color: Colors.text, marginTop: 2 },
  tierChipPriceGold: { color: '#fff' },
  tierChipPricePlatinum: { color: '#fff' },
  sectionTitle: { fontSize: 20, fontWeight: '700' as const, color: Colors.text, marginTop: 28, marginBottom: 14 },
  benefitCard: {
    flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  benefitIcon: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.tagBg,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  benefitContent: { flex: 1 },
  benefitTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  benefitDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginTop: 3 },
  comparisonCard: {
    backgroundColor: Colors.card, borderRadius: 18, padding: 18, marginTop: 20,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  comparisonTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text, marginBottom: 14 },
  compHeader: {
    flexDirection: 'row', alignItems: 'center', paddingBottom: 8,
    borderBottomWidth: 2, borderBottomColor: Colors.borderLight,
  },
  compCol: { flex: 1, fontSize: 11, fontWeight: '700' as const, color: Colors.textSecondary, textAlign: 'center' },
  compRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  compLabel: { flex: 2, fontSize: 13, color: Colors.textSecondary },
  compVal: { flex: 1, fontSize: 13, color: Colors.text, textAlign: 'center' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  bottomBarInner: { paddingHorizontal: 20, paddingTop: 14 },
  upgradeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.gold, borderRadius: 14, height: 52,
  },
  upgradeBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
});

