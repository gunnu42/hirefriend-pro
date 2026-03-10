import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Users, Shield, Heart, Globe, Mail, Star,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

const stats = [
  { label: 'Active Users', value: '50K+', icon: Users, color: Colors.primary },
  { label: 'Cities', value: '120+', icon: Globe, color: Colors.teal },
  { label: 'Avg Rating', value: '4.8', icon: Star, color: Colors.star },
  { label: 'Safe Sessions', value: '200K+', icon: Shield, color: Colors.success },
];

export default function AboutScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>About Us</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <View style={styles.logoCircle}>
            <Heart size={36} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>HireFriend</Text>
          <Text style={styles.heroVersion}>Version 2.0.0</Text>
          <Text style={styles.heroTagline}>
            Connecting people through shared experiences
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {stats.map((stat, i) => {
            const IconComp = stat.icon;
            return (
              <View key={i} style={styles.statCard}>
                <IconComp size={22} color={stat.color} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.sectionText}>
            HireFriend was founded with a simple belief — nobody should have to explore the world alone. Whether you're new to a city, traveling solo, or just looking for company for an activity, HireFriend connects you with verified, friendly companions who share your interests.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What We Offer</Text>
          <View style={styles.featureList}>
            {[
              'Verified companions in 120+ cities across India',
              'KYC-verified profiles with live selfie match',
              'In-person & virtual friend options',
              'Secure payment with UPI, cards, and wallets',
              'Daily rewards and referral bonuses',
              '24/7 customer support & SOS system',
            ].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={styles.featureDot} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety First</Text>
          <Text style={styles.sectionText}>
            Your safety is our top priority. Every friend on our platform undergoes identity verification including Aadhaar/PAN checks and live selfie matching. We also provide real-time SOS support, mandatory public meeting locations, and a robust reporting system.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Pressable
            style={styles.contactRow}
            onPress={() => Linking.openURL('mailto:support@hirefriend.in')}
            testID="email-contact"
          >
            <Mail size={18} color={Colors.primary} />
            <Text style={styles.contactText}>support@hirefriend.in</Text>
          </Pressable>
          <Pressable
            style={styles.contactRow}
            onPress={() => Linking.openURL('https://hirefriend.in')}
            testID="web-contact"
          >
            <Globe size={18} color={Colors.primary} />
            <Text style={styles.contactText}>www.hirefriend.in</Text>
          </Pressable>
        </View>

        <Text style={styles.legal}>
          © 2026 HireFriend Technologies Pvt. Ltd.{'\n'}All rights reserved.
        </Text>

        <View style={{ height: 30 }} />
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
  heroCard: {
    alignItems: 'center', backgroundColor: Colors.card, borderRadius: 24,
    padding: 32, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF0ED',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  heroTitle: { fontSize: 28, fontWeight: '800' as const, color: Colors.text },
  heroVersion: { fontSize: 13, color: Colors.textTertiary, marginTop: 4 },
  heroTagline: {
    fontSize: 15, color: Colors.textSecondary, textAlign: 'center',
    marginTop: 8, lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20,
  },
  statCard: {
    flex: 1, minWidth: '45%' as unknown as number, backgroundColor: Colors.card,
    borderRadius: 14, padding: 16, alignItems: 'center', gap: 6,
  },
  statValue: { fontSize: 22, fontWeight: '800' as const, color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textTertiary },
  section: { marginTop: 28 },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text, marginBottom: 10 },
  sectionText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  featureList: { gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  featureDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 7,
  },
  featureText: { fontSize: 14, color: Colors.textSecondary, flex: 1, lineHeight: 20 },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  contactText: { fontSize: 15, color: Colors.primary, fontWeight: '500' as const },
  legal: {
    fontSize: 12, color: Colors.textTertiary, textAlign: 'center',
    marginTop: 28, lineHeight: 18,
  },
});

