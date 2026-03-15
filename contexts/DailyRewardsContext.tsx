import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

const DAILY_REWARDS_KEY = 'hirefriend_daily_rewards';

export interface DailyReward {
  day: number;
  pts: number;
  claimed: boolean;
}

interface DailyRewardsState {
  rewards: DailyReward[];
  claimedDays: Set<number>;
  currentDay: number;
  lastClaimedDate: string | null;
  streakCount: number;
  currentReward: number;
}

const generateRewards = (): DailyReward[] => {
  return Array.from({ length: 365 }, (_, i) => {
    const day = i + 1;
    const weekNumber = Math.ceil(day / 7);
    const reward = 20 + (weekNumber - 1) * 5;
    return {
      day,
      pts: reward,
      claimed: false,
    };
  });
};

export const [DailyRewardsProvider, useDailyRewards] = createContextHook(() => {
  const [rewards, setRewards] = useState<DailyReward[]>(generateRewards());
  const [claimedDays, setClaimedDays] = useState<Set<number>>(new Set());
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [lastClaimedDate, setLastClaimedDate] = useState<string | null>(null);
  const [streakCount, setStreakCount] = useState<number>(0);
  const [currentReward, setCurrentReward] = useState<number>(20);
  const [loaded, setLoaded] = useState<boolean>(false);

  // Load initial data from AsyncStorage (fallback until Firebase is set up)
  useEffect(() => {
    AsyncStorage.getItem(DAILY_REWARDS_KEY).then((dataStr) => {
      if (dataStr) {
        try {
          const data = JSON.parse(dataStr);
          const claimedDaysArray = data.claimedDays || [];
          const claimedSet = new Set<number>(claimedDaysArray);

          setCurrentDay(data.currentDay || 1);
          setLastClaimedDate(data.lastClaimedDate || null);
          setStreakCount(data.streakCount || 0);
          setCurrentReward(data.currentReward || 20);

          // Update rewards based on claimed days
          const updatedRewards = generateRewards().map(reward => ({
            ...reward,
            claimed: claimedSet.has(reward.day),
          }));
          setRewards(updatedRewards);
          setClaimedDays(claimedSet);
        } catch (error) {
          console.error('Error loading daily rewards data:', error);
        }
      }
      setLoaded(true);
    });
  }, []);

  // Save data to AsyncStorage whenever it changes
  useEffect(() => {
    if (!loaded) return;

    const data = {
      currentDay,
      lastClaimedDate,
      streakCount,
      claimedDays: Array.from(claimedDays),
      currentReward,
    };

    AsyncStorage.setItem(DAILY_REWARDS_KEY, JSON.stringify(data)).catch((error) => {
      console.error('Error saving daily rewards data:', error);
    });
  }, [currentDay, lastClaimedDate, streakCount, claimedDays, currentReward, loaded]);

  const claimReward = useCallback(
    async (day: number): Promise<{ success: boolean; points: number; message: string }> => {
      const today = new Date().toISOString().split('T')[0];

      // Check if already claimed today
      if (lastClaimedDate === today) {
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

      // Only allow claiming the current day
      if (day !== currentDay) {
        return {
          success: false,
          points: 0,
          message: `Only day ${currentDay} can be claimed now`,
        };
      }

      // Update state
      const newClaimedDays = new Set(claimedDays);
      newClaimedDays.add(day);
      const nextDay = currentDay + 1;
      const nextReward = 20 + (Math.ceil(nextDay / 7) - 1) * 5;

      setClaimedDays(newClaimedDays);
      setCurrentDay(nextDay);
      setStreakCount(prev => prev + 1);
      setLastClaimedDate(today);
      setCurrentReward(nextReward);

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
    [rewards, claimedDays, currentDay, lastClaimedDate]
  );

  const canClaimToday = lastClaimedDate !== new Date().toISOString().split('T')[0];
  const isClaimableDay = (day: number) => day === currentDay && canClaimToday;

  return {
    rewards,
    claimedDays,
    currentDay,
    lastClaimedDate,
    streakCount,
    currentReward,
    loaded,
    canClaimToday,
    isClaimableDay,
    claimReward,
  };
});
