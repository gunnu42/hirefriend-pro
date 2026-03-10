import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

const WALLET_KEY = 'hirefriend_wallet';
const KYC_KEY = 'hirefriend_kyc';
const STREAK_KEY = 'hirefriend_streak';
const SUB_KEY = 'hirefriend_subscription';
const SAFETY_KEY = 'hirefriend_safety_agreed';

export type KycStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type SubscriptionTier = 'free' | 'silver' | 'gold' | 'platinum';
export type ThemeMode = 'light' | 'dark';

export interface PointTransaction {
  id: string;
  type: 'attendance' | 'referral' | 'vlog' | 'review' | 'purchase' | 'penalty';
  amount: number;
  description: string;
  date: string;
}

export interface BillingRecord {
  id: string;
  tier: SubscriptionTier;
  amount: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  method: string;
  invoiceId: string;
}

interface WalletState {
  points: number;
  credits: number;
  streak: number;
  lastClaimDate: string | null;
  kycStatus: KycStatus;
  subscription: SubscriptionTier;
  safetyAgreed: boolean;
  transactions: PointTransaction[];
  billingHistory: BillingRecord[];
  connectsRemaining: number;
  totalConnects: number;
  blockedUsers: string[];
  themeMode: ThemeMode;
}

const THEME_KEY = 'hirefriend_theme';
const CONNECTS_KEY = 'hirefriend_connects';
const BLOCKED_KEY = 'hirefriend_blocked';

const defaultState: WalletState = {
  points: 320,
  credits: 320,
  streak: 3,
  lastClaimDate: '2026-02-24',
  kycStatus: 'none',
  subscription: 'free',
  safetyAgreed: false,
  connectsRemaining: 0,
  totalConnects: 0,
  blockedUsers: [],
  themeMode: 'light',
  transactions: [
    { id: 't1', type: 'attendance', amount: 40, description: 'Day 1 check-in', date: '2026-02-22' },
    { id: 't2', type: 'attendance', amount: 45, description: 'Day 2 check-in', date: '2026-02-23' },
    { id: 't3', type: 'attendance', amount: 50, description: 'Day 3 check-in', date: '2026-02-24' },
    { id: 't4', type: 'referral', amount: 500, description: 'Referred Mike T.', date: '2026-02-20' },
    { id: 't5', type: 'referral', amount: 500, description: 'Referred Jessica L.', date: '2026-02-15' },
    { id: 't6', type: 'review', amount: 50, description: 'Review for Sarah M.', date: '2026-02-18' },
    { id: 't7', type: 'vlog', amount: 400, description: 'Uploaded meetup vibe', date: '2026-02-19' },
    { id: 't8', type: 'penalty', amount: -500, description: 'No-show penalty', date: '2026-02-10' },
  ],
  billingHistory: [
    { id: 'b1', tier: 'silver', amount: '₹1,800', date: '2026-01-15', status: 'completed', method: 'UPI (GPay)', invoiceId: 'INV-2026-001' },
    { id: 'b2', tier: 'gold', amount: '₹3,500', date: '2026-02-01', status: 'completed', method: 'Visa •••• 4242', invoiceId: 'INV-2026-002' },
  ],
};

export const [WalletProvider, useWallet] = createContextHook(() => {
  const [state, setState] = useState<WalletState>(defaultState);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(WALLET_KEY),
      AsyncStorage.getItem(KYC_KEY),
      AsyncStorage.getItem(SUB_KEY),
      AsyncStorage.getItem(SAFETY_KEY),
      AsyncStorage.getItem(STREAK_KEY),
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(CONNECTS_KEY),
      AsyncStorage.getItem(BLOCKED_KEY),
    ]).then(([walletStr, kycStr, subStr, safetyStr, streakStr, themeStr, connectsStr, blockedStr]) => {
      const updates: Partial<WalletState> = {};
      if (kycStr) updates.kycStatus = kycStr as KycStatus;
      if (subStr) updates.subscription = subStr as SubscriptionTier;
      if (safetyStr === 'true') updates.safetyAgreed = true;
      if (themeStr) updates.themeMode = themeStr as ThemeMode;
      if (blockedStr) {
        try { updates.blockedUsers = JSON.parse(blockedStr); } catch { /* ignore */ }
      }
      if (connectsStr) {
        try {
          const parsed = JSON.parse(connectsStr);
          updates.connectsRemaining = parsed.remaining ?? 0;
          updates.totalConnects = parsed.total ?? 0;
        } catch { /* ignore */ }
      }
      if (streakStr) {
        try {
          const parsed = JSON.parse(streakStr);
          updates.streak = parsed.streak ?? defaultState.streak;
          updates.lastClaimDate = parsed.lastClaimDate ?? defaultState.lastClaimDate;
        } catch { /* ignore */ }
      }
      if (walletStr) {
        try {
          const parsed = JSON.parse(walletStr);
          updates.points = parsed.points ?? defaultState.points;
          updates.credits = parsed.credits ?? defaultState.credits;
          updates.transactions = parsed.transactions ?? defaultState.transactions;
          updates.billingHistory = parsed.billingHistory ?? defaultState.billingHistory;
        } catch { /* ignore */ }
      }
      setState((prev) => ({ ...prev, ...updates }));
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(WALLET_KEY, JSON.stringify({
      points: state.points,
      credits: state.credits,
      transactions: state.transactions,
      billingHistory: state.billingHistory,
    }));
    AsyncStorage.setItem(KYC_KEY, state.kycStatus);
    AsyncStorage.setItem(SUB_KEY, state.subscription);
    AsyncStorage.setItem(SAFETY_KEY, String(state.safetyAgreed));
    AsyncStorage.setItem(STREAK_KEY, JSON.stringify({
      streak: state.streak,
      lastClaimDate: state.lastClaimDate,
    }));
    AsyncStorage.setItem(THEME_KEY, state.themeMode);
    AsyncStorage.setItem(CONNECTS_KEY, JSON.stringify({
      remaining: state.connectsRemaining,
      total: state.totalConnects,
    }));
    AsyncStorage.setItem(BLOCKED_KEY, JSON.stringify(state.blockedUsers));
  }, [state, loaded]);

  const claimDailyReward = useCallback((dayPts: number) => {
    const today = new Date().toISOString().split('T')[0];
    setState((prev) => {
      if (prev.lastClaimDate === today) return prev;
      const newStreak = prev.streak + 1;
      const txn: PointTransaction = {
        id: `t_${Date.now()}`,
        type: 'attendance',
        amount: dayPts,
        description: `Day ${newStreak} check-in`,
        date: today,
      };
      return {
        ...prev,
        points: prev.points + dayPts,
        credits: prev.credits + dayPts,
        streak: newStreak,
        lastClaimDate: today,
        transactions: [txn, ...prev.transactions],
      };
    });
  }, []);

  const addPoints = useCallback((amount: number, type: PointTransaction['type'], description: string) => {
    setState((prev) => {
      const txn: PointTransaction = {
        id: `t_${Date.now()}`,
        type,
        amount,
        description,
        date: new Date().toISOString().split('T')[0],
      };
      return {
        ...prev,
        points: prev.points + amount,
        credits: prev.credits + amount,
        transactions: [txn, ...prev.transactions],
      };
    });
  }, []);

  const deductPoints = useCallback((amount: number, description: string) => {
    setState((prev) => {
      const txn: PointTransaction = {
        id: `t_${Date.now()}`,
        type: 'penalty',
        amount: -amount,
        description,
        date: new Date().toISOString().split('T')[0],
      };
      return {
        ...prev,
        points: Math.max(0, prev.points - amount),
        credits: Math.max(0, prev.credits - amount),
        transactions: [txn, ...prev.transactions],
      };
    });
  }, []);

  const setKycStatus = useCallback((status: KycStatus) => {
    setState((prev) => ({ ...prev, kycStatus: status }));
  }, []);

  const setSubscription = useCallback((tier: SubscriptionTier, connects?: number) => {
    setState((prev) => {
      const newConnects = connects ?? prev.connectsRemaining;
      const newTotal = connects ? (prev.totalConnects + connects) : prev.totalConnects;
      return { ...prev, subscription: tier, connectsRemaining: newConnects, totalConnects: newTotal };
    });
  }, []);

  const useConnect = useCallback(() => {
    setState((prev) => {
      if (prev.connectsRemaining <= 0) return prev;
      return { ...prev, connectsRemaining: prev.connectsRemaining - 1 };
    });
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setState((prev) => ({ ...prev, themeMode: mode }));
  }, []);

  const blockUser = useCallback((userId: string) => {
    setState((prev) => {
      if (prev.blockedUsers.includes(userId)) return prev;
      return { ...prev, blockedUsers: [...prev.blockedUsers, userId] };
    });
  }, []);

  const unblockUser = useCallback((userId: string) => {
    setState((prev) => ({
      ...prev,
      blockedUsers: prev.blockedUsers.filter(id => id !== userId),
    }));
  }, []);

  const agreeSafety = useCallback(() => {
    setState((prev) => ({ ...prev, safetyAgreed: true }));
  }, []);

  const addBillingRecord = useCallback((record: BillingRecord) => {
    setState((prev) => ({
      ...prev,
      billingHistory: [record, ...prev.billingHistory],
    }));
  }, []);

  const resetStreak = useCallback(() => {
    setState((prev) => ({ ...prev, streak: 0, lastClaimDate: null }));
  }, []);

  const canClaimToday = state.lastClaimDate !== new Date().toISOString().split('T')[0];
  const pointsToFreeConnection = Math.max(0, 500 - (state.points % 500));

  return {
    ...state,
    loaded,
    canClaimToday,
    pointsToFreeConnection,
    claimDailyReward,
    addPoints,
    deductPoints,
    setKycStatus,
    setSubscription,
    agreeSafety,
    addBillingRecord,
    resetStreak,
    useConnect,
    setThemeMode,
    blockUser,
    unblockUser,
  };
});

