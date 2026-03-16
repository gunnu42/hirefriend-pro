import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Download, CheckCircle2, Clock, XCircle, Receipt,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useWallet, BillingRecord } from '@/contexts/WalletContext';

const statusConfig = {
  completed: { icon: CheckCircle2, color: Colors.success, bg: Colors.successLight, label: 'Completed' },
  pending: { icon: Clock, color: Colors.gold, bg: Colors.goldLight, label: 'Pending' },
  failed: { icon: XCircle, color: Colors.danger, bg: Colors.dangerLight, label: 'Failed' },
};

export default function BillingHistoryScreen() {
  const router = useRouter();
  const { billingHistory } = useWallet();

  const handleDownload = useCallback((record: BillingRecord) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/receipt/${record.id}`);
  }, [router]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Billing History</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {billingHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Receipt size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>No Billing Records</Text>
            <Text style={styles.emptySub}>Your transaction history will appear here after your first purchase.</Text>
          </View>
        ) : (
          billingHistory.map((record) => {
            const status = statusConfig[record.status];
            const StatusIcon = status.icon;
            return (
              <View key={record.id} style={styles.recordCard}>
                <View style={styles.recordTop}>
                  <View>
                    <Text style={styles.recordTier}>HireFriend {record.tier.charAt(0).toUpperCase() + record.tier.slice(1)}</Text>
                    <Text style={styles.recordInvoice}>{record.invoiceId}</Text>
                  </View>
                  <Text style={styles.recordAmount}>{record.amount}</Text>
                </View>
                <View style={styles.recordMid}>
                  <View style={styles.recordDetail}>
                    <Text style={styles.recordDetailLabel}>Date</Text>
                    <Text style={styles.recordDetailValue}>{record.date}</Text>
                  </View>
                  <View style={styles.recordDetail}>
                    <Text style={styles.recordDetailLabel}>Method</Text>
                    <Text style={styles.recordDetailValue}>{record.method}</Text>
                  </View>
                </View>
                <View style={styles.recordBottom}>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <StatusIcon size={14} color={status.color} />
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                  <Pressable
                    style={styles.downloadBtn}
                    onPress={() => handleDownload(record)}
                    testID={`download-${record.id}`}
                  >
                    <Download size={16} color={Colors.primary} />
                    <Text style={styles.downloadText}>PDF</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
  recordCard: {
    backgroundColor: Colors.card, borderRadius: 18, padding: 18, marginBottom: 12,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  recordTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  recordTier: { fontSize: 17, fontWeight: '700' as const, color: Colors.text },
  recordInvoice: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  recordAmount: { fontSize: 20, fontWeight: '800' as const, color: Colors.text },
  recordMid: {
    flexDirection: 'row', gap: 24, marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  recordDetail: {},
  recordDetailLabel: { fontSize: 11, color: Colors.textTertiary, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  recordDetailValue: { fontSize: 14, fontWeight: '600' as const, color: Colors.text, marginTop: 2 },
  recordBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  statusText: { fontSize: 12, fontWeight: '600' as const },
  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.tagBg, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  downloadText: { fontSize: 12, fontWeight: '600' as const, color: Colors.primary },
});
