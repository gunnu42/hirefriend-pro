import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft, AlertTriangle, Flag, UserX, ShieldOff, MessageSquareWarning,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const reportReasons = [
  { id: 'impersonation', icon: UserX, label: 'Impersonation / Fake Profile' },
  { id: 'fraud', icon: ShieldOff, label: 'Fraud / Scam' },
  { id: 'noshow', icon: Flag, label: 'No-Show' },
  { id: 'harassment', icon: MessageSquareWarning, label: 'Harassment / Inappropriate Behavior' },
  { id: 'other', icon: AlertTriangle, label: 'Other' },
];

export default function ReportUserScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name: string }>();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [details, setDetails] = useState<string>('');

  const handleSubmit = useCallback(() => {
    if (!selectedReason) {
      Alert.alert('Required', 'Please select a reason for reporting.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      'Report Submitted',
      'Thank you for reporting. Our team will review this within 24 hours. If the report is verified, the user will face penalties including account lock and 500 point deduction.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  }, [selectedReason, router]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Report User</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.warningCard}>
          <AlertTriangle size={24} color={Colors.danger} />
          <Text style={styles.warningTitle}>Report {params.name ?? 'this user'}</Text>
          <Text style={styles.warningSub}>
            False reports may result in penalties to your account. Verified reports lead to account lock and 500 point deduction for the offender.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Reason for Reporting</Text>

        {reportReasons.map((reason) => {
          const IconComp = reason.icon;
          const selected = selectedReason === reason.id;
          return (
            <Pressable
              key={reason.id}
              style={[styles.reasonCard, selected && styles.reasonCardSelected]}
              onPress={() => setSelectedReason(reason.id)}
              testID={`reason-${reason.id}`}
            >
              <View style={[styles.reasonIcon, selected && styles.reasonIconSelected]}>
                <IconComp size={20} color={selected ? Colors.danger : Colors.textSecondary} />
              </View>
              <Text style={[styles.reasonLabel, selected && styles.reasonLabelSelected]}>{reason.label}</Text>
              <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                {selected && <View style={styles.radioInner} />}
              </View>
            </Pressable>
          );
        })}

        <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
        <TextInput
          style={styles.detailsInput}
          value={details}
          onChangeText={setDetails}
          placeholder="Describe what happened..."
          placeholderTextColor={Colors.textTertiary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          testID="report-details"
        />

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <SafeAreaView edges={['bottom']} style={styles.bottomBarInner}>
          <Pressable
            style={[styles.submitBtn, !selectedReason && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!selectedReason}
            testID="submit-report"
          >
            <Flag size={18} color="#fff" />
            <Text style={styles.submitBtnText}>Submit Report</Text>
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
  warningCard: {
    backgroundColor: Colors.dangerLight, borderRadius: 16, padding: 20, alignItems: 'center',
    borderWidth: 1, borderColor: '#FECACA',
  },
  warningTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.danger, marginTop: 8 },
  warningSub: { fontSize: 13, color: '#7F1D1D', textAlign: 'center', lineHeight: 18, marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginTop: 24, marginBottom: 12 },
  reasonCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 16, marginBottom: 8,
    borderWidth: 2, borderColor: 'transparent',
  },
  reasonCardSelected: { borderColor: Colors.danger, backgroundColor: Colors.dangerLight },
  reasonIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  reasonIconSelected: { backgroundColor: '#FECACA' },
  reasonLabel: { flex: 1, fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  reasonLabelSelected: { color: Colors.danger },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: Colors.danger },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.danger },
  detailsInput: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 16, fontSize: 14,
    color: Colors.text, minHeight: 100, borderWidth: 1, borderColor: Colors.border,
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  bottomBarInner: { paddingHorizontal: 16, paddingTop: 14 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.danger, borderRadius: 14, height: 52,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
});

