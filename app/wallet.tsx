import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Zap, TrendingUp, TrendingDown, Flame, Gift, Video, CreditCard,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/supabase';

interface PointTransaction {
  id: string;
  user_id: string;
  type: string;
  points_awarded: number;
  description: string;
  created_at: string;
}

const typeConfig: Record<string, { icon: React.ComponentType<any>; color: string; bg: string }> = {
  daily_reward: { icon: Flame, color: Colors.primary, bg: Colors.tagBg },
  referral: { icon: Gift, color: Colors.indigo, bg: Colors.indigoLight },
  video: { icon: Video, color: Colors.teal, bg: Colors.tealLight },
  purchase: { icon: CreditCard, color: Colors.success, bg: Colors.successLight },
  default: { icon: Zap, color: Colors.gold, bg: Colors.goldLight },
};

export default function WalletScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  const filters = ['all', 'daily_reward', 'referral', 'video', 'purchase'];

  // Load initial data
  useEffect(() => {
    if (!user?.id) return;
    loadWalletData();
  }, [user?.id]);

  // Real-time listeners
  useEffect(() => {
    if (!user?.id) return;

    // Listen to wallet balance updates
    const walletChannel = supabase
      .channel(`wallet-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${user.id}`,
        },
        (payload: any) => {
          const newBalance = payload.new?.wallet_balance;
          if (newBalance !== undefined) {
            setWalletBalance(newBalance);
          }
        }
      )
      .subscribe();

    // Listen to new transactions
    const txnChannel = supabase
      .channel(`transactions-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'points_history',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const newTxn = payload.new as PointTransaction;
          setTransactions((prev) => [newTxn, ...prev]);
        }
      )
      .subscribe();

    return () => {
      walletChannel.unsubscribe();
      txnChannel.unsubscribe();
    };
  }, [user?.id]);

  const loadWalletData = async () => {
    try {
      setLoading(true);

      // Fetch user wallet balance
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', user?.id)
        .single();

      if (userError) throw userError;
      setWalletBalance(userData?.wallet_balance ?? 0);

      // Fetch transaction history
      const { data: txnData, error: txnError } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (txnError) throw txnError;
      setTransactions(txnData ?? []);
    } catch (err) {
      console.error('[Wallet] Load error:', err);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWalletData();
    setRefreshing(false);
  };

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter((t) => t.type === filter);

  const renderTransaction = useCallback(({ item }: { item: PointTransaction }) => {
    const config = typeConfig[item.type] ?? typeConfig.default;
    const IconComp = config.icon;
    const isPositive = item.points_awarded > 0;
    const createdDate = new Date(item.created_at).toLocaleDateString();

    return (
      <View style={styles.txnRow}>
        <View style={[styles.txnIcon, { backgroundColor: config.bg }]}>
          <IconComp size={18} color={config.color} />
        </View>
        <View style={styles.txnInfo}>
          <Text style={styles.txnDesc}>{item.description}</Text>
          <Text style={styles.txnDate}>{createdDate}</Text>
        </View>
        <View style={styles.txnAmountCol}>
          <View style={styles.txnAmountRow}>
            {isPositive ? (
              <TrendingUp size={14} color={Colors.success} />
            ) : (
              <TrendingDown size={14} color={Colors.danger} />
            )}
            <Text style={[styles.txnAmount, { color: isPositive ? Colors.success : Colors.danger }]}>
              {isPositive ? '+' : ''}{item.points_awarded}
            </Text>
          </View>
          <Text style={styles.txnType}>{item.type.replace('_', ' ')}</Text>
        </View>
      </View>
    );
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Wallet & Rewards</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceTop}>
            <View style={styles.balanceIconBg}>
              <Zap size={28} color={Colors.gold} />
            </View>
            <View>
              <Text style={styles.balanceLabel}>Total Points</Text>
              <Text style={styles.balanceValue}>{walletBalance}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/refer-earn' as any)}>
            <Gift size={20} color={Colors.indigo} />
            <Text style={styles.quickBtnText}>Refer</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/upload-vibe' as any)}>
            <Video size={20} color={Colors.teal} />
            <Text style={styles.quickBtnText}>Upload</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push('/pricing' as any)}>
            <CreditCard size={20} color={Colors.gold} />
            <Text style={styles.quickBtnText}>Buy</Text>
          </Pressable>
        </View>

        {/* Transactions */}
        <Text style={styles.sectionTitle}>Points History</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
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

        {filtered.length > 0 ? (
          filtered.map((item) => <View key={item.id}>{renderTransaction({ item })}</View>)
        ) : (
          <Text style={styles.emptyText}>No transactions yet</Text>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16 },
  balanceCard: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  balanceTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  balanceIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' as const },
  balanceValue: { fontSize: 34, fontWeight: '800' as const, color: Colors.text },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickBtnText: { fontSize: 12, fontWeight: '600' as const, color: Colors.text },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginBottom: 12 },
  filterRow: { gap: 8, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
  },
  filterChipActive: { backgroundColor: Colors.primary },
  filterChipText: { fontSize: 12, fontWeight: '600' as const, color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.surface },
  txnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txnInfo: { flex: 1 },
  txnDesc: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  txnDate: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  txnAmountCol: { alignItems: 'flex-end' },
  txnAmountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  txnAmount: { fontSize: 14, fontWeight: '700' as const },
  txnType: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  loadingText: { fontSize: 16, color: Colors.textSecondary },
  emptyText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 20 },
});

