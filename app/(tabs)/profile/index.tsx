import React, { useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Settings, ChevronRight, CreditCard, Shield, CircleHelp as HelpCircle,
  LogOut, Star, Users, Edit3, Bell, Heart, Crown, HandCoins, Gift, BadgeCheck,
  Wallet, ShieldCheck, Video, FileText, AlertTriangle, Info,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useWallet } from '@/contexts/WalletContext';

interface MenuItem {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value?: string;
  onPress: () => void;
  color?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { kycStatus, subscription, points, credits, connectsRemaining } = useWallet();

  const isVerified = kycStatus === 'verified';
  const subLabel = subscription === 'free' ? null : subscription.charAt(0).toUpperCase() + subscription.slice(1);

  const handleLogout = useCallback(() => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => console.log('Logged out') },
    ]);
  }, []);

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: 'Account',
      items: [
        { icon: Heart, label: 'Favorites', onPress: () => router.push('/favorites-list') },
        { icon: Wallet, label: 'Wallet & Rewards', value: `${credits} pts`, onPress: () => router.push('/wallet') },
        { icon: CreditCard, label: 'Payment Methods', value: 'Visa •••• 4242', onPress: () => router.push('/payment-methods') },
        { icon: Gift, label: 'Refer & Earn', value: '500 pts/invite', onPress: () => router.push('/refer-earn') },
        { icon: Bell, label: 'Notifications', onPress: () => router.push('/notifications') },
        { icon: FileText, label: 'Billing History', onPress: () => router.push('/billing-history') },
      ],
    },
    {
      title: 'Verification & Safety',
      items: [
        {
          icon: ShieldCheck,
          label: 'KYC Verification',
          value: isVerified ? 'Verified ✓' : 'Not Verified',
          onPress: () => router.push('/kyc-verification'),
          color: isVerified ? Colors.success : Colors.gold,
        },
        { icon: Shield, label: 'Safety Agreement', onPress: () => router.push('/safety-agreement') },
        { icon: Video, label: 'Upload Vibe', value: '+400 pts', onPress: () => router.push('/upload-vibe') },
      ],
    },
    {
      title: 'General',
      items: [
        { icon: Shield, label: 'Privacy & Safety', onPress: () => router.push('/privacy') },
        { icon: HelpCircle, label: 'Help & Support', onPress: () => router.push('/help') },
        { icon: Settings, label: 'Settings', onPress: () => router.push('/settings') },
        { icon: Info, label: 'About Us', onPress: () => router.push('/about') },
      ],
    },
    {
      title: '',
      items: [
        { icon: LogOut, label: 'Log Out', onPress: handleLogout, color: '#EF4444' },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Profile</Text>
          <Pressable
            onPress={() => router.push('/settings')}
            style={styles.settingsBtn}
            testID="settings-button"
          >
            <Settings size={22} color={Colors.text} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&crop=face' }}
              style={styles.profileAvatar}
            />
            {subLabel && (
              <View style={styles.subBadgeAvatar}>
                <Crown size={10} color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.nameRow}>
            <Text style={styles.profileName}>Alex Thompson</Text>
            {isVerified && <BadgeCheck size={20} color={Colors.primary} />}
            {subLabel && (
              <View style={styles.subBadge}>
                <Crown size={12} color={Colors.gold} />
                <Text style={styles.subBadgeText}>{subLabel}</Text>
              </View>
            )}
          </View>
          {!isVerified && (
            <Pressable
              style={styles.kycWarningBadge}
              onPress={() => router.push('/kyc-verification')}
              testID="kyc-badge"
            >
              <AlertTriangle size={14} color={Colors.gold} />
              <Text style={styles.kycWarningText}>Not Verified — Tap to complete KYC</Text>
            </Pressable>
          )}
          <Text style={styles.profileLocation}>New York, NY</Text>
          {subscription !== 'free' && (
            <View style={styles.connectsBadge}>
              <Text style={styles.connectsText}>You have {connectsRemaining} connects left</Text>
            </View>
          )}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>13</Text>
              <Text style={styles.statLabel}>Bookings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Friends</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.statIconRow}>
                <Star size={14} color={Colors.star} fill={Colors.star} />
                <Text style={styles.statValue}>4.9</Text>
              </View>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
          <Pressable
            style={styles.editBtn}
            onPress={() => router.push('/edit-profile')}
            testID="edit-profile-button"
          >
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </Pressable>
        </View>

        <Pressable style={styles.proBanner} onPress={() => router.push('/subscription')} testID="go-pro-banner">
          <View style={styles.proBannerLeft}>
            <View style={styles.proBannerIcon}>
              <Crown size={22} color={Colors.gold} />
            </View>
            <View style={styles.proBannerContent}>
              <Text style={styles.proBannerTitle}>
                {subscription === 'free' ? 'Go PRO' : `${subLabel} Member`}
              </Text>
              <Text style={styles.proBannerSub}>
                {subscription === 'free'
                  ? 'Silver ₹1,800 · Gold ₹3,500 · Platinum ₹5,000'
                  : 'View benefits & manage subscription'}
              </Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.goldText} />
        </Pressable>

        <Pressable style={styles.friendBanner} onPress={() => router.push('/become-friend')} testID="become-friend-banner">
          <View style={styles.friendBannerLeft}>
            <View style={styles.friendBannerIcon}>
              <HandCoins size={22} color={Colors.mint} />
            </View>
            <View style={styles.friendBannerContent}>
              <Text style={styles.friendBannerTitle}>Become a Friend</Text>
              <Text style={styles.friendBannerSub}>Earn money by sharing your time</Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.mintText} />
        </Pressable>

        {menuSections.map((section, sIdx) => (
          <View key={sIdx} style={styles.menuSection}>
            {section.title ? <Text style={styles.menuSectionTitle}>{section.title}</Text> : null}
            <View style={styles.menuCard}>
              {section.items.map((item, idx) => (
                <MenuRow key={idx} item={item} isLast={idx === section.items.length - 1} />
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.versionText}>HireFriend v2.0.0</Text>
      </ScrollView>
    </View>
  );
}

function MenuRow({ item, isLast }: { item: MenuItem; isLast: boolean }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const IconComp = item.icon;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 60, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
    ]).start();
    item.onPress();
  }, [item, scaleAnim]);

  return (
    <Pressable onPress={handlePress} testID={`menu-${item.label.replace(/\s/g, '-')}`}>
      <Animated.View
        style={[
          styles.menuRow,
          !isLast && styles.menuRowBorder,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <IconComp size={20} color={item.color ?? Colors.textSecondary} />
        <Text style={[styles.menuLabel, item.color ? { color: item.color } : undefined]}>
          {item.label}
        </Text>
        <View style={styles.menuRight}>
          {item.value && <Text style={[styles.menuValue, item.color ? { color: item.color } : undefined]}>{item.value}</Text>}
          <ChevronRight size={16} color={Colors.textTertiary} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.background },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 8, paddingTop: 8,
  },
  title: { fontSize: 28, fontWeight: '800' as const, color: Colors.text },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  scrollContent: { paddingBottom: 40 },
  profileCard: {
    alignItems: 'center', backgroundColor: Colors.card, marginHorizontal: 16,
    borderRadius: 20, padding: 24,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 3,
  },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  profileAvatar: { width: 88, height: 88, borderRadius: 44 },
  subBadgeAvatar: {
    position: 'absolute', bottom: 0, right: 0,
    width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  profileName: { fontSize: 22, fontWeight: '700' as const, color: Colors.text },
  subBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.goldLight, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  subBadgeText: { fontSize: 11, fontWeight: '700' as const, color: Colors.goldText },
  kycWarningBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    backgroundColor: Colors.goldLight, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
  },
  kycWarningText: { fontSize: 12, fontWeight: '600' as const, color: Colors.goldText },
  profileLocation: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  connectsBadge: {
    marginTop: 10, backgroundColor: Colors.tagBg, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  connectsText: { fontSize: 13, fontWeight: '600' as const, color: Colors.primary },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, gap: 20 },
  statItem: { alignItems: 'center' },
  statIconRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  editBtn: {
    marginTop: 18, backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 32, paddingVertical: 10,
  },
  editBtnText: { fontSize: 14, fontWeight: '600' as const, color: '#fff' },
  proBanner: {
    marginHorizontal: 16, marginTop: 20, backgroundColor: Colors.goldLight,
    borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.goldBorder,
  },
  proBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  proBannerIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFF0C2',
    alignItems: 'center', justifyContent: 'center',
  },
  proBannerContent: { flex: 1 },
  proBannerTitle: { fontSize: 17, fontWeight: '800' as const, color: Colors.goldText },
  proBannerSub: { fontSize: 12, color: Colors.goldText, marginTop: 2, opacity: 0.85, flexWrap: 'wrap' },
  friendBanner: {
    marginHorizontal: 16, marginTop: 10, backgroundColor: Colors.mintLight,
    borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderWidth: 1, borderColor: Colors.mintBorder,
  },
  friendBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  friendBannerIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#D1FAE5',
    alignItems: 'center', justifyContent: 'center',
  },
  friendBannerContent: { flex: 1 },
  friendBannerTitle: { fontSize: 17, fontWeight: '800' as const, color: Colors.mintText },
  friendBannerSub: { fontSize: 12, color: Colors.mintText, marginTop: 2, opacity: 0.85 },
  menuSection: { marginTop: 24, paddingHorizontal: 16 },
  menuSectionTitle: {
    fontSize: 14, fontWeight: '600' as const, color: Colors.textTertiary,
    marginBottom: 8, marginLeft: 4, textTransform: 'uppercase' as const, letterSpacing: 0.5,
  },
  menuCard: { backgroundColor: Colors.card, borderRadius: 14, overflow: 'hidden' },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    paddingHorizontal: 16, gap: 12,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  menuLabel: { flex: 1, fontSize: 15, color: Colors.text, fontWeight: '500' as const },
  menuRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuValue: { fontSize: 13, color: Colors.textTertiary },
  versionText: { textAlign: 'center', fontSize: 12, color: Colors.textTertiary, marginTop: 30 },
});
