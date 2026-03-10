import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ShieldAlert, MapPin, Phone, Eye, AlertTriangle, CheckCircle2, ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useWallet } from '@/contexts/WalletContext';

const safetyTips = [
  { icon: MapPin, title: 'Meet in Public Places', desc: 'Always choose well-lit, populated locations for your first few meetups.' },
  { icon: Phone, title: 'Share Your Location', desc: 'Share your live location with a family member or trusted friend before meeting.' },
  { icon: Eye, title: 'Stay Alert', desc: 'Trust your instincts. If something feels off, leave immediately and report.' },
  { icon: AlertTriangle, title: 'Report Suspicious Behavior', desc: 'Use the one-tap report button on any profile to flag concerns.' },
];

export default function SafetyAgreementScreen() {
  const router = useRouter();
  const { safetyAgreed, agreeSafety } = useWallet();
  const [checked, setChecked] = useState<boolean>(safetyAgreed);

  const handleAgree = useCallback(() => {
    if (!checked) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    agreeSafety();
    router.back();
  }, [checked, agreeSafety, router]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Safety Agreement</Text>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <ShieldAlert size={48} color={Colors.teal} />
          </View>
          <Text style={styles.heroTitle}>Your Safety is Priority</Text>
          <Text style={styles.heroSub}>Please read and acknowledge the following safety guidelines before making your first connection.</Text>
        </View>

        <View style={styles.disclaimerCard}>
          <Text style={styles.disclaimerTitle}>Legal Disclaimer</Text>
          <Text style={styles.disclaimerText}>
            "HireFriend is strictly a technical platform for connection and earning opportunities."
          </Text>
          <Text style={styles.disclaimerText}>
            "The platform holds ZERO RESPONSIBILITY for any offline activities, disputes, mishaps, or accidents."
          </Text>
          <Text style={styles.disclaimerText}>
            "The decision to meet and personal safety is 100% the user's individual responsibility."
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Safety Protocol</Text>

        {safetyTips.map((tip, i) => {
          const IconComp = tip.icon;
          return (
            <View key={i} style={styles.tipCard}>
              <View style={styles.tipIcon}>
                <IconComp size={22} color={Colors.teal} />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipDesc}>{tip.desc}</Text>
              </View>
            </View>
          );
        })}

        <View style={styles.emergencyCard}>
          <Text style={styles.emergencyTitle}>Emergency SOS</Text>
          <Text style={styles.emergencyText}>If you feel unsafe at any point, use the SOS button available during active bookings to alert emergency contacts and local authorities.</Text>
        </View>

        <Pressable
          style={styles.checkRow}
          onPress={() => setChecked((p) => !p)}
          testID="agree-checkbox"
        >
          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked && <CheckCircle2 size={20} color="#fff" />}
          </View>
          <Text style={styles.checkLabel}>
            I have read, understood, and agree to the safety guidelines and legal disclaimer above. I take full responsibility for my personal safety.
          </Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <SafeAreaView edges={['bottom']} style={styles.bottomBarInner}>
          <Pressable
            style={[styles.agreeBtn, !checked && styles.agreeBtnDisabled]}
            onPress={handleAgree}
            disabled={!checked}
            testID="agree-btn"
          >
            <Text style={styles.agreeBtnText}>I Understand & Agree</Text>
            <ChevronRight size={18} color="#fff" />
          </Pressable>
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.background },
  header: { alignItems: 'center', paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  scrollContent: { paddingHorizontal: 16 },
  heroSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 20 },
  heroIcon: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.tealLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  heroTitle: { fontSize: 24, fontWeight: '800' as const, color: Colors.text },
  heroSub: {
    fontSize: 14, color: Colors.textSecondary, textAlign: 'center',
    marginTop: 8, lineHeight: 20, paddingHorizontal: 10,
  },
  disclaimerCard: {
    backgroundColor: '#FEF3C7', borderRadius: 16, padding: 18,
    borderWidth: 1, borderColor: '#FCD34D',
  },
  disclaimerTitle: { fontSize: 16, fontWeight: '700' as const, color: '#92400E', marginBottom: 12 },
  disclaimerText: { fontSize: 14, color: '#78350F', lineHeight: 20, marginBottom: 8, fontStyle: 'italic' as const },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, marginTop: 24, marginBottom: 14 },
  tipCard: {
    flexDirection: 'row', backgroundColor: Colors.card, borderRadius: 14,
    padding: 16, marginBottom: 10,
  },
  tipIcon: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: Colors.tealLight,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  tipContent: { flex: 1 },
  tipTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.text },
  tipDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginTop: 3 },
  emergencyCard: {
    backgroundColor: Colors.dangerLight, borderRadius: 14, padding: 16, marginTop: 10,
    borderWidth: 1, borderColor: '#FECACA',
  },
  emergencyTitle: { fontSize: 15, fontWeight: '700' as const, color: Colors.danger },
  emergencyText: { fontSize: 13, color: '#7F1D1D', lineHeight: 18, marginTop: 4 },
  checkRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 24,
    backgroundColor: Colors.card, borderRadius: 14, padding: 16,
  },
  checkbox: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  checkboxChecked: { backgroundColor: Colors.teal, borderColor: Colors.teal },
  checkLabel: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  bottomBarInner: { paddingHorizontal: 16, paddingTop: 14 },
  agreeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.teal, borderRadius: 14, height: 52,
  },
  agreeBtnDisabled: { opacity: 0.4 },
  agreeBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
});

