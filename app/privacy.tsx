import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Shield, BadgeCheck, AlertTriangle, Phone, MapPin, Eye,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

const safetyFeatures = [
  {
    icon: BadgeCheck,
    title: 'Verified Profiles',
    desc: 'All friends undergo identity verification including government ID check and selfie verification.',
    color: Colors.primary,
  },
  {
    icon: AlertTriangle,
    title: 'SOS Button',
    desc: 'Emergency SOS button available during every session. Alert local authorities instantly.',
    color: Colors.danger,
  },
  {
    icon: Phone,
    title: '24/7 Support',
    desc: 'Our safety team is available around the clock. Call or chat for immediate assistance.',
    color: Colors.teal,
  },
  {
    icon: MapPin,
    title: 'Session Tracking',
    desc: 'Share your live location with trusted contacts during any booking session.',
    color: Colors.success,
  },
  {
    icon: Eye,
    title: 'Activity Monitoring',
    desc: 'AI-powered monitoring to detect unusual patterns and ensure session safety.',
    color: Colors.indigo,
  },
  {
    icon: Shield,
    title: 'Insurance Coverage',
    desc: 'Every session is covered by our comprehensive safety insurance policy.',
    color: Colors.gold,
  },
];

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Privacy & Safety</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Shield size={32} color={Colors.teal} />
          </View>
          <Text style={styles.heroTitle}>Your Safety Matters</Text>
          <Text style={styles.heroSub}>We take multiple steps to keep every session safe and secure for all users.</Text>
        </View>

        <Text style={styles.sectionTitle}>Safety Features</Text>

        {safetyFeatures.map((f, i) => {
          const IconComp = f.icon;
          return (
            <View key={i} style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: f.color + '15' }]}>
                <IconComp size={22} color={f.color} />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          );
        })}

        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>Safety Tips</Text>
          <Text style={styles.tipItem}>• Always meet in public places for your first session</Text>
          <Text style={styles.tipItem}>• Share your session details with a trusted friend</Text>
          <Text style={styles.tipItem}>• Use the in-app chat instead of sharing personal numbers</Text>
          <Text style={styles.tipItem}>• Report any suspicious behavior immediately</Text>
          <Text style={styles.tipItem}>• Trust your instincts — cancel if something feels off</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeTop: {
    backgroundColor: Colors.background,
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  heroCard: {
    backgroundColor: Colors.tealLight,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.tealBorder,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.teal,
  },
  heroSub: {
    fontSize: 14,
    color: Colors.teal,
    opacity: 0.85,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 28,
    marginBottom: 14,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  featureDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 3,
  },
  tipsCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  tipsTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 4,
  },
});

