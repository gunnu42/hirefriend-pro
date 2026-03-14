import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

const WALLET_KEY = 'hirefriend_wallet';
const KYC_KEY = 'hirefriend_kyc';
const STREAK_KEY = 'hirefriend_streak';
const SUB_KEY = 'hirefriend_subscription';
const SAFETY_KEY = 'hirefriend_safety_agreed';
const THEME_KEY = 'hirefriend_theme';
const CONNECTS_KEY = 'hirefriend_connects';
const BLOCKED_KEY = 'hirefriend_blocked';
const AUTO_RENEW_KEY = 'hirefriend_auto_renew';

export type KycStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type SubscriptionTier = 'free' | 'silver' | 'gold' | 'platinum';
export type ThemeMode = 'light' | 'dark';
export type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed';

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

export interface PaymentSession {
  orderId: string;
  userId: string;
  tier: SubscriptionTier;
  amount: number;
  status: PaymentStatus;
  createdAt: string;
  expiresAt?: string;
  signature?: string;
}

export interface SubscriptionData {
  planType: SubscriptionTier;
  connectsLeft: number;
  connectsTotal: number;
  subscriptionActive: boolean;
  autoRenewEnabled: boolean;
  lastRenewDate?: string;
  expiryDate?: string;
  walletBalance: number;
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
  autoRenewEnabled: boolean;
  pendingPayment: PaymentSession | null;
}

const defaultState: WalletState = {
  points: 320,
  credits: 320,
  streak: 3,
  lastClaimDate: '2026-02-24',
  kycStatus: 'none',
  subscription: 'free',
  safetyAgreed: false,
  connectsRemaining: 2, // FREE PLAN: 2 Profile Connects lifetime demo
  totalConnects: 2,
  blockedUsers: [],
  themeMode: 'light',
  autoRenewEnabled: false,
  pendingPayment: null,
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
    (async () => {
      try {
        const [
          walletStr,
          kycStr,
          subStr,
          safetyStr,
          streakStr,
          themeStr,
          connectsStr,
          blockedStr,
          autoRenewStr,
        ] = await Promise.all([
          AsyncStorage.getItem(WALLET_KEY),
          AsyncStorage.getItem(KYC_KEY),
          AsyncStorage.getItem(SUB_KEY),
          AsyncStorage.getItem(SAFETY_KEY),
          AsyncStorage.getItem(STREAK_KEY),
          AsyncStorage.getItem(THEME_KEY),
          AsyncStorage.getItem(CONNECTS_KEY),
          AsyncStorage.getItem(BLOCKED_KEY),
          AsyncStorage.getItem(AUTO_RENEW_KEY),
        ]);

        const updates: Partial<WalletState> = {};
        if (kycStr) updates.kycStatus = kycStr as KycStatus;
        if (subStr) updates.subscription = subStr as SubscriptionTier;
        if (safetyStr === 'true') updates.safetyAgreed = true;
        if (themeStr) updates.themeMode = themeStr as ThemeMode;
        if (blockedStr) {
          try { updates.blockedUsers = JSON.parse(blockedStr); } catch { /* ignore */ }
        }
        if (autoRenewStr === 'true') updates.autoRenewEnabled = true;
        if (connectsStr) {
          try {
            const parsed = JSON.parse(connectsStr);
            updates.connectsRemaining = parsed.remaining ?? defaultState.connectsRemaining;
            updates.totalConnects = parsed.total ?? defaultState.totalConnects;
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
      } catch (err) {
        console.error('[WalletContext] failed to load from storage', err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await AsyncStorage.setItem(WALLET_KEY, JSON.stringify({
          points: state.points,
          credits: state.credits,
          transactions: state.transactions,
          billingHistory: state.billingHistory,
        }));
        await AsyncStorage.setItem(KYC_KEY, state.kycStatus);
        await AsyncStorage.setItem(SUB_KEY, state.subscription);
        await AsyncStorage.setItem(SAFETY_KEY, String(state.safetyAgreed));
        await AsyncStorage.setItem(STREAK_KEY, JSON.stringify({
          streak: state.streak,
          lastClaimDate: state.lastClaimDate,
        }));
        await AsyncStorage.setItem(THEME_KEY, state.themeMode);
        await AsyncStorage.setItem(CONNECTS_KEY, JSON.stringify({
          remaining: state.connectsRemaining,
          total: state.totalConnects,
        }));
        await AsyncStorage.setItem(AUTO_RENEW_KEY, String(state.autoRenewEnabled));
        await AsyncStorage.setItem(BLOCKED_KEY, JSON.stringify(state.blockedUsers));
      } catch (err) {
        console.error('[WalletContext] failed to persist', err);
      }
    })();
  }, [state, loaded]);

  const claimDailyReward = useCallback((dayPts: number, streakDay: number) => {
    setState((prev) => {
      const txn: PointTransaction = {
        id: `t_${Date.now()}`,
        type: 'attendance',
        amount: dayPts,
        description: `Day ${streakDay} check-in`,
        date: new Date().toISOString().split('T')[0],
      };
      return {
        ...prev,
        points: prev.points + dayPts,
        credits: prev.credits + dayPts,
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

  const createPaymentSession = useCallback((tier: SubscriptionTier, amount: number, userId: string) => {
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: PaymentSession = {
      orderId,
      userId,
      tier,
      amount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60000).toISOString(), // 15 min expiry
    };
    setState((prev) => ({ ...prev, pendingPayment: session }));
    return session;
  }, []);

  const verifyPayment = useCallback((orderId: string, signature: string, verified: boolean) => {
    setState((prev) => {
      if (!prev.pendingPayment || prev.pendingPayment.orderId !== orderId) return prev;
      
      if (verified) {
        const connectsMap = { free: 2, silver: 25, gold: 60, platinum: 250 };
        const newConnects = connectsMap[prev.pendingPayment.tier] || 0;
        return {
          ...prev,
          subscription: prev.pendingPayment.tier,
          connectsRemaining: newConnects,
          totalConnects: prev.totalConnects + newConnects,
          pendingPayment: { ...prev.pendingPayment, status: 'success', signature },
        };
      } else {
        return {
          ...prev,
          pendingPayment: { ...prev.pendingPayment, status: 'failed' },
        };
      }
    });
  }, []);

  const setAutoRenew = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, autoRenewEnabled: enabled }));
  }, []);

  const addConnects = useCallback((count: number, description: string = 'Subscription purchase') => {
    setState((prev) => {
      const txn: PointTransaction = {
        id: `t_${Date.now()}`,
        type: 'purchase',
        amount: count,
        description,
        date: new Date().toISOString().split('T')[0],
      };
      return {
        ...prev,
        connectsRemaining: prev.connectsRemaining + count,
        totalConnects: prev.totalConnects + count,
        transactions: [txn, ...prev.transactions],
      };
    });
  }, []);

  const deductConnects = useCallback((count: number = 1) => {
    setState((prev) => {
      if (prev.connectsRemaining <= 0) return prev;
      return {
        ...prev,
        connectsRemaining: Math.max(0, prev.connectsRemaining - count),
      };
    });
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
    createPaymentSession,
    verifyPayment,
    setAutoRenew,
    addConnects,
    deductConnects,
  };
});

