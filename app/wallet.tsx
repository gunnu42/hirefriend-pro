import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Zap, TrendingUp, TrendingDown, Flame, Gift, Video, Star, AlertTriangle, CreditCard,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWallet, PointTransaction } from '@/contexts/WalletContext';

const typeConfig: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  attendance: { icon: Flame, color: Colors.primary, bg: Colors.tagBg },
  referral: { icon: Gift, color: Colors.indigo, bg: Colors.indigoLight },
  vlog: { icon: Video, color: Colors.teal, bg: Colors.tealLight },
  review: { icon: Star, color: Colors.gold, bg: Colors.goldLight },
  purchase: { icon: CreditCard, color: Colors.success, bg: Colors.successLight },
  penalty: { icon: AlertTriangle, color: Colors.danger, bg: Colors.dangerLight },
};

export default function WalletScreen() {
  const router = useRouter();
  const { points, credits, streak, transactions, pointsToFreeConnection } = useWallet();
  const [filter, setFilter] = useState<string>('all');

  const filters = ['all', 'attendance', 'referral', 'vlog', 'review', 'penalty'];

  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);

  const renderTransaction = useCallback(({ item }: { item: PointTransaction }) => {
    const config = typeConfig[item.type] ?? typeConfig.attendance;
    const IconComp = config.icon;
    const isPositive = item.amount > 0;
    return (
      <View style={styles.txnRow}>
        <View style={[styles.txnIcon, { backgroundColor: config.bg }]}>
          <IconComp size={18} color={config.color} />
        </View>
        <View style={styles.txnInfo}>
          <Text style={styles.txnDesc}>{item.description}</Text>
          <Text style={styles.txnDate}>{item.date}</Text>
        </View>
        <View style={styles.txnAmountCol}>
          <View style={styles.txnAmountRow}>
            {isPositive ? (
              <TrendingUp size={14} color={Colors.success} />
            ) : (
              <TrendingDown size={14} color={Colors.danger} />
            )}
            <Text style={[styles.txnAmount, { color: isPositive ? Colors.success : Colors.danger }]}>
              {isPositive ? '+' : ''}{item.amount}
            </Text>
          </View>
          <Text style={styles.txnType}>{item.type}</Text>
        </View>
      </View>
    );
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Wallet & Rewards</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <View style={styles.balanceIconBg}>
              <Zap size={28} color={Colors.gold} />
            </View>
            <View>
              <Text style={styles.balanceLabel}>Total Points</Text>
              <Text style={styles.balanceValue}>{points}</Text>
            </View>
          </View>
          <View style={styles.balanceGrid}>
            <View style={styles.balanceGridItem}>
              <Text style={styles.gridValue}>{credits}</Text>
              <Text style={styles.gridLabel}>Credits</Text>
            </View>
            <View style={styles.gridDivider} />
            <View style={styles.balanceGridItem}>
              <Text style={styles.gridValue}>{streak}</Text>
              <Text style={styles.gridLabel}>Day Streak</Text>
            </View>
            <View style={styles.gridDivider} />
            <View style={styles.balanceGridItem}>
              <Text style={styles.gridValue}>{pointsToFreeConnection}</Text>
              <Text style={styles.gridLabel}>To Free Unlock</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${((500 - pointsToFreeConnection) / 500) * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{500 - pointsToFreeConnection}/500 points to free connection</Text>
        </View>

        <View style={styles.quickActions}>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/refer-earn')} testID="quick-refer">
            <Gift size={20} color={Colors.indigo} />
            <Text style={styles.quickBtnText}>Refer</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/upload-vibe')} testID="quick-vibe">
            <Video size={20} color={Colors.teal} />
            <Text style={styles.quickBtnText}>Upload Vibe</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/pricing')} testID="quick-buy">
            <CreditCard size={20} color={Colors.gold} />
            <Text style={styles.quickBtnText}>Buy Credits</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/billing-history')} testID="quick-billing">
            <Zap size={20} color={Colors.primary} />
            <Text style={styles.quickBtnText}>Billing</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Points Ledger</Text>
        <View style={styles.redemptionNote}>
          <Zap size={14} color={Colors.gold} />
          <Text style={styles.redemptionText}>500 Points = 1 Free Connection Unlock</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {filters.map((f) => (
            <Pressable
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {filtered.map((item) => (
          <View key={item.id}>
            {renderTransaction({ item })}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    backgroundColor: Colors.card, borderRadius: 20, padding: 24,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  balanceTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  balanceIconBg: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.goldLight,
    alignItems: 'center', justifyContent: 'center',
  },
  balanceLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' as const },
  balanceValue: { fontSize: 34, fontWeight: '800' as const, color: Colors.text },
  balanceGrid: {
    flexDirection: 'row', marginTop: 20, paddingTop: 16,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  balanceGridItem: { flex: 1, alignItems: 'center' },
  gridValue: { fontSize: 20, fontWeight: '800' as const, color: Colors.text },
  gridLabel: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  gridDivider: { width: 1, height: 36, backgroundColor: Colors.borderLight },
  progressBarBg: {
    height: 8, backgroundColor: Colors.surfaceAlt, borderRadius: 4,
    overflow: 'hidden', marginTop: 16,
  },
  progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  progressLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  quickActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  quickBtn: {
    flex: 1, alignItems: 'center', gap: 6, backgroundColor: Colors.card,
    borderRadius: 14, paddingVertical: 14,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  quickBtnText: { fontSize: 11, fontWeight: '600' as const, color: Colors.textSecondary },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, marginTop: 24, marginBottom: 8 },
  redemptionNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.goldLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12,
  },
  redemptionText: { fontSize: 13, fontWeight: '600' as const, color: Colors.goldText },
  filterRow: { gap: 8, paddingBottom: 14 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
  },
  filterChipActive: { backgroundColor: Colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },
  txnRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 8,
  },
  txnIcon: {
    width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  txnInfo: { flex: 1 },
  txnDesc: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  txnDate: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  txnAmountCol: { alignItems: 'flex-end' },
  txnAmountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  txnAmount: { fontSize: 16, fontWeight: '800' as const },
  txnType: { fontSize: 10, color: Colors.textTertiary, marginTop: 2, textTransform: 'capitalize' as const },
});

