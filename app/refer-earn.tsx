import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, Share, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Gift, Copy, Share2, Flame, Zap, Users, Trophy,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import InteractiveDailyRewards from '@/components/InteractiveDailyRewards';
import { useWallet } from '@/contexts/WalletContext';
import { useDailyRewards } from '@/contexts/DailyRewardsContext';

const referralHistory = [
  { id: '1', name: 'Mike T.', date: 'Feb 20, 2026', pts: 500, status: 'completed' },
  { id: '2', name: 'Jessica L.', date: 'Feb 15, 2026', pts: 500, status: 'completed' },
  { id: '3', name: 'David K.', date: 'Feb 10, 2026', pts: 500, status: 'pending' },
];

export default function ReferEarnScreen() {
  const router = useRouter();
  const [referralCode] = useState<string>('HIRE-ALEX-2026');
  const { credits, claimDailyReward: addPointsToWallet } = useWallet();
  const {
    rewards,
    currentDay,
    canClaimToday,
    streakCount,
    isClaimableDay,
    claimReward,
    loaded,
  } = useDailyRewards();

  const totalPoints = credits; // Use actual credits from wallet
  const totalReferrals = 3;

  const handleCopyCode = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  }, []);

  const handleShare = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Share', `Use code ${referralCode} to join HireFriend and get 500 bonus points!`);
      } else {
        await Share.share({
          message: `Join HireFriend using my code ${referralCode} and get 500 bonus points! Download now: https://hirefriend.app/invite/${referralCode}`,
        });
      }
    } catch (e) {
      console.log('Share error:', e);
    }
  }, [referralCode]);

  const handleClaimDaily = useCallback(async (day: number) => {
    if (!canClaimToday) {
      Alert.alert('Already claimed', 'Come back tomorrow for your next reward!');
      return;
    }

    const result = await claimReward(day);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      addPointsToWallet(result.points);
      Alert.alert('Claimed!', result.message);
    } else {
      Alert.alert('Error', result.message);
    }
  }, [canClaimToday, claimReward, addPointsToWallet]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Refer & Earn</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <View style={styles.heroIconRow}>
            <View style={styles.heroIcon}>
              <Gift size={28} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.heroTitle}>Invite a Friend, Get 500 Points</Text>
          <Text style={styles.heroSub}>That's equivalent to 1 Free Connection Unlock!</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Zap size={18} color={Colors.gold} />
              <Text style={styles.statBoxValue}>{totalPoints}</Text>
              <Text style={styles.statBoxLabel}>Total Points</Text>
            </View>
            <View style={styles.statBox}>
              <Users size={18} color={Colors.primary} />
              <Text style={styles.statBoxValue}>{totalReferrals}</Text>
              <Text style={styles.statBoxLabel}>Referrals</Text>
            </View>
            <View style={styles.statBox}>
              <Flame size={18} color={Colors.primary} />
              <Text style={styles.statBoxValue}>{streakCount}</Text>
              <Text style={styles.statBoxLabel}>Day Streak</Text>
            </View>
          </View>
        </View>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Your Referral Code</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeText}>{referralCode}</Text>
            <Pressable onPress={handleCopyCode} style={styles.copyBtn} testID="copy-code">
              <Copy size={18} color={Colors.primary} />
            </Pressable>
          </View>
          <Pressable style={styles.shareBtn} onPress={handleShare} testID="share-btn">
            <Share2 size={18} color="#fff" />
            <Text style={styles.shareBtnText}>Share on WhatsApp</Text>
          </Pressable>
        </View>

        {loaded && (
          <InteractiveDailyRewards
            rewards={rewards}
            currentDay={currentDay}
            canClaimToday={canClaimToday}
            streakCount={streakCount}
            isClaimableDay={isClaimableDay}
            onClaimReward={handleClaimDaily}
            testID="daily-rewards-refer"
          />
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Trophy size={18} color={Colors.gold} />
            <Text style={styles.sectionTitle}>Referral History</Text>
          </View>
          {referralHistory.map((ref) => (
            <View key={ref.id} style={styles.refRow}>
              <View style={styles.refInfo}>
                <Text style={styles.refName}>{ref.name}</Text>
                <Text style={styles.refDate}>{ref.date}</Text>
              </View>
              <View style={[styles.refBadge, ref.status === 'pending' && styles.refBadgePending]}>
                <Text style={[styles.refBadgeText, ref.status === 'pending' && styles.refBadgeTextPending]}>
                  +{ref.pts} pts
                </Text>
              </View>
            </View>
          ))}
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
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  heroIconRow: {
    marginBottom: 16,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.tagBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    width: '100%',
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  statBoxValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  statBoxLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
  },
  codeCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  codeLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed' as const,
  },
  codeText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    letterSpacing: 1,
  },
  copyBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.tagBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 14,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  streakSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  dailyRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  dailyDot: {
    flex: 1,
    height: 56,
    borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  dailyDotClaimed: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dailyDotNext: {
    borderColor: Colors.primary,
    borderStyle: 'dashed' as const,
  },
  dailyDotDay: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
  },
  dailyDotDayClaimed: {
    color: 'rgba(255,255,255,0.8)',
  },
  dailyDotPts: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 1,
  },
  dailyDotPtsClaimed: {
    color: '#fff',
  },
  progressBarBg: {
    height: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  refInfo: {
    flex: 1,
  },
  refName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  refDate: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  refBadge: {
    backgroundColor: Colors.successLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  refBadgePending: {
    backgroundColor: Colors.goldLight,
  },
  refBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.success,
  },
  refBadgeTextPending: {
    color: Colors.goldText,
  },
});

