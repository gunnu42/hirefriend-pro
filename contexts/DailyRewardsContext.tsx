import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

const DAILY_REWARDS_KEY = 'hirefriend_daily_rewards';
const CLAIMED_REWARDS_KEY = 'hirefriend_claimed_rewards';

export interface DailyReward {
  day: number;
  pts: number;
  claimed: boolean;
}

interface DailyRewardsState {
  rewards: DailyReward[];
  claimedDays: Set<number>;
  currentStreak: number;
  lastClaimDate: string | null;
}

const POINTS_PER_DAY = 25;

// Generate 365 days of rewards with fixed 25 points each
const generateRewards = (): DailyReward[] => {
  return Array.from({ length: 365 }, (_v, i) => ({
    day: i + 1,
    pts: POINTS_PER_DAY,
    claimed: false,
  }));
};

export const [DailyRewardsProvider, useDailyRewards] = createContextHook(() => {
  const [rewards, setRewards] = useState<DailyReward[]>(generateRewards());
  const [claimedDays, setClaimedDays] = useState<Set<number>>(new Set());
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);

  // Load persisted state on mount
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(DAILY_REWARDS_KEY),
      AsyncStorage.getItem(CLAIMED_REWARDS_KEY),
    ]).then(([rewardsStr, claimedStr]) => {
      let newRewards = generateRewards();
      let newClaimedDays = new Set<number>();
      let newStreak = 0;
      let newLastClaimDate: string | null = null;

      if (rewardsStr) {
        try {
          const parsed = JSON.parse(rewardsStr);
          newStreak = parsed.streak ?? 0;
          newLastClaimDate = parsed.lastClaimDate ?? null;
        } catch {
          /* ignore */
        }
      }

      if (claimedStr) {
        try {
          const parsed = JSON.parse(claimedStr);
          newClaimedDays = new Set(parsed);
          // Update rewards based on claimed days
          newRewards = newRewards.map((r) => ({
            ...r,
            claimed: newClaimedDays.has(r.day),
          }));
        } catch {
          /* ignore */
        }
      }

      setRewards(newRewards);
      setClaimedDays(newClaimedDays);
      setCurrentStreak(newStreak);
      setLastClaimDate(newLastClaimDate);
      setLoaded(true);
    });
  }, []);

  // Persist state whenever it changes
  useEffect(() => {
    if (!loaded) return;

    AsyncStorage.setItem(
      DAILY_REWARDS_KEY,
      JSON.stringify({
        streak: currentStreak,
        lastClaimDate,
      })
    );

    AsyncStorage.setItem(
      CLAIMED_REWARDS_KEY,
      JSON.stringify(Array.from(claimedDays))
    );
  }, [currentStreak, lastClaimDate, claimedDays, loaded]);

  const claimReward = useCallback(
    (day: number): { success: boolean; points: number; message: string } => {
      const today = new Date().toISOString().split('T')[0];

      // Check if already claimed today
      if (lastClaimDate === today) {
        return {
          success: false,
          points: 0,
          message: 'Already claimed today! Come back tomorrow.',
        };
      }

      // Find the reward
      const reward = rewards.find((r) => r.day === day);
      if (!reward) {
        return {
          success: false,
          points: 0,
          message: 'Invalid reward day',
        };
      }

      // Check if already claimed
      if (claimedDays.has(day)) {
        return {
          success: false,
          points: 0,
          message: 'Already claimed this day',
        };
      }

      // Only allow claiming the next day in sequence
      const nextClaimableDay = currentStreak + 1;
      if (day !== nextClaimableDay) {
        return {
          success: false,
          points: 0,
          message: `Only day ${nextClaimableDay} can be claimed now`,
        };
      }

      // Check if it's a future day
      if (day > currentStreak + 1) {
        return {
          success: false,
          points: 0,
          message: 'Cannot claim future days',
        };
      }

      // Claim the reward
      const newClaimedDays = new Set(claimedDays);
      newClaimedDays.add(day);
      setClaimedDays(newClaimedDays);

      const newStreak = currentStreak + 1;
      setCurrentStreak(newStreak);
      setLastClaimDate(today);

      setRewards((prev) =>
        prev.map((r) =>
          r.day === day ? { ...r, claimed: true } : r
        )
      );

      return {
        success: true,
        points: reward.pts,
        message: `+${reward.pts} points claimed!`,
      };
    },
    [rewards, claimedDays, currentStreak, lastClaimDate]
  );

  const canClaimToday = lastClaimDate !== new Date().toISOString().split('T')[0];
  const nextClaimableDay = currentStreak + 1;
  const isClaimableDay = (day: number) => day === nextClaimableDay && canClaimToday;

  return {
    rewards,
    claimedDays,
    currentStreak,
    lastClaimDate,
    loaded,
    canClaimToday,
    nextClaimableDay,
    isClaimableDay,
    claimReward,
  };
});
