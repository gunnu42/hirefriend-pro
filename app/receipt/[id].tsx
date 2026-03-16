import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Receipt, Calendar, CreditCard } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWallet } from '@/contexts/WalletContext';

export default function ReceiptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const { billingHistory } = useWallet();
  const receipt = useMemo(() => billingHistory.find((r) => r.id === params.id), [billingHistory, params.id]);

  if (!receipt) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeTop}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
              <ArrowLeft size={22} color={Colors.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Receipt</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
        <View style={styles.emptyState}>
          <Receipt size={48} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>Receipt not found</Text>
          <Text style={styles.emptySub}>Try again from Billing History.</Text>
        </View>
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
          <Text style={styles.headerTitle}>Receipt</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.iconBox}>
              <Receipt size={18} color={Colors.primary} />
            </View>
            <View style={styles.line} />
            <View>
              <Text style={styles.label}>Invoice</Text>
              <Text style={styles.value}>{receipt.invoiceId}</Text>
            </View>
          </View>

          <View style={styles.row}> 
            <View style={styles.iconBox}><Calendar size={18} color={Colors.primary} /></View>
            <View style={styles.line} />
            <View>
              <Text style={styles.label}>Date</Text>
              <Text style={styles.value}>{receipt.date}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.iconBox}><CreditCard size={18} color={Colors.primary} /></View>
            <View style={styles.line} />
            <View>
              <Text style={styles.label}>Method</Text>
              <Text style={styles.value}>{receipt.method}</Text>
            </View>
          </View>

          <View style={styles.row}> 
            <View style={styles.iconBox}><Receipt size={18} color={Colors.primary} /></View>
            <View style={styles.line} />
            <View>
              <Text style={styles.label}>Amount</Text>
              <Text style={styles.value}>{receipt.amount}</Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View style={[styles.statusBadge, { backgroundColor: receipt.status === 'completed' ? Colors.successLight : receipt.status === 'pending' ? Colors.goldLight : Colors.dangerLight }]}>
              <Text style={[styles.statusText, { color: receipt.status === 'completed' ? Colors.success : receipt.status === 'pending' ? Colors.gold : Colors.danger }]}>
                {receipt.status.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.doneBtn} onPress={() => router.back()} testID="close-button">
          <Text style={styles.doneText}>Close</Text>
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
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 24 },
  card: { backgroundColor: Colors.card, borderRadius: 18, padding: 18, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  line: { width: 12 },
  label: { fontSize: 12, color: Colors.textSecondary, textTransform: 'uppercase' as const },
  value: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginTop: 2 },
  statusRow: { alignItems: 'flex-start', marginTop: 14 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  statusText: { fontSize: 12, fontWeight: '700' as const },
  doneBtn: { marginTop: 28, backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  doneText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, marginTop: 14 },
  emptySub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 8 },
});
