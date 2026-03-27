/**
 * Fallback/Simple version of InteractiveDailyRewards
 * Used if the main component has any issues
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface InteractiveDailyRewardsProps {
  rewards?: any[];
  currentDay?: number;
  canClaimToday?: boolean;
  streakCount?: number;
  isClaimableDay?: (day: number) => boolean;
  onClaimReward?: (day: number) => void;
  testID?: string;
}

export default function InteractiveDailyRewardsFallback({
  rewards,
  currentDay = 1,
  canClaimToday = false,
  streakCount = 0,
  testID,
}: InteractiveDailyRewardsProps) {
  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Flame size={18} color={Colors.primary} />
          <Text style={styles.title}>Daily Rewards</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>{streakCount} day streak</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>
          {canClaimToday ? "Day " + currentDay + " reward available!" : `Come back tomorrow for Day ${currentDay + 1}!`}
        </Text>
      </View>

      {rewards && rewards.length > 0 && (
        <View style={styles.rewardsPreview}>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardDay}>Day {currentDay}</Text>
            <Text style={styles.rewardPts}>{rewards[currentDay - 1]?.pts || 100} PTS</Text>
          </View>
          <Text style={styles.rewardsText}>
            ... and {Math.max(0, rewards.length - 1)} more days of rewards
          </Text>
        </View>
      )}

      <View style={styles.bottomLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  streakBadge: {
    backgroundColor: Colors.tagBg,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rewardsPreview: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  rewardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rewardDay: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  rewardPts: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  rewardsText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  bottomLine: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 1.5,
    marginTop: 12,
  },
});
