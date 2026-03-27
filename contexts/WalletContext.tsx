import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/supabase';
import { useAuth } from './AuthContext';

export interface PointTransaction {
  id: string;
  user_id: string;
  type: string;
  points_awarded: number;
  description: string;
  created_at: string;
}

export type SubscriptionTier = 'free' | 'silver' | 'gold' | 'platinum';

export interface BillingRecord {
  id: string;
  user_id?: string;
  tier: SubscriptionTier;
  amount: string;
  invoiceId: string;
  date: string;
  method: string;
  status: 'completed' | 'pending' | 'failed';
}

interface WalletState {
  wallet_balance: number;
  current_streak: number;
  transactions: PointTransaction[];
  loading: boolean;
  error: string | null;
}

interface WalletContextType extends WalletState {
  refreshWallet: () => Promise<void>;
  addPoints: (amount: number) => Promise<void>;
  points: number;
  credits: number;
  connectsRemaining: number;
  setSubscription: (subscription: string, connects?: number) => void;
  addBillingRecord: (record: BillingRecord) => void;
  // Additional properties
  subscription: string;
  kycStatus: 'draft' | 'pending' | 'verified' | 'rejected' | 'none';
  billingHistory: BillingRecord[];
  blockedUsers: any[];
  unblockUser: (userId: string) => void;
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
  setKycStatus: (status: 'draft' | 'pending' | 'verified' | 'rejected' | 'none') => void;
  safetyAgreed: boolean;
  agreeSafety: () => void;
  pointsToFreeConnection: number;
}

const defaultState: WalletState = {
  wallet_balance: 0,
  current_streak: 0,
  transactions: [],
  loading: true,
  error: null,
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<WalletState>(defaultState);
  // Additional state
  const [subscription, setSubscription] = useState('free');
  const [connectsRemaining, setConnectsRemaining] = useState(0);

  const setSubscriptionWithConnects = useCallback((newSubscription: string, connects?: number) => {
    setSubscription(newSubscription)
    if (typeof connects === 'number') {
      setConnectsRemaining(connects)
    }
  }, [])
  const [kycStatus, setKycStatus] = useState<'draft' | 'pending' | 'verified' | 'rejected' | 'none'>('none');
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [themeMode, setThemeModeState] = useState<'light' | 'dark'>('light');
  const [safetyAgreed, setSafetyAgreed] = useState(false);
  const [pointsToFreeConnection, setPointsToFreeConnection] = useState(500);

  const loadWalletData = useCallback(async () => {
    if (!user?.id) {
      setState(defaultState);
      return;
    }

    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch user wallet data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('wallet_balance, current_streak, connects_left, plan_type, kyc_status')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // Fetch transactions
      const { data: txnData, error: txnError } = await supabase
        .from('points_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (txnError) throw txnError;

      setState({
        wallet_balance: (userData as any)?.wallet_balance ?? 0,
        current_streak: (userData as any)?.current_streak ?? 0,
        transactions: txnData ?? [],
        loading: false,
        error: null,
      });

      setConnectsRemaining((userData as any)?.connects_left ?? 0);
      setSubscription((userData as any)?.plan_type ?? 'free');
      setKycStatus(((userData as any)?.kyc_status as any) ?? 'none');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load wallet';
      console.error('[WalletContext] Error:', errorMsg);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMsg,
        wallet_balance: prev.wallet_balance || 0,
        current_streak: prev.current_streak || 0,
        transactions: prev.transactions || [],
      }));
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    loadWalletData();
  }, [user?.id, loadWalletData]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    try {
      const channel = supabase
        .channel(`wallet-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${user.id}`,
          },
          (payload: any) => {
            try {
              const userUpdate = payload.new as any;
              setState((prev) => ({
                ...prev,
                wallet_balance: userUpdate.wallet_balance ?? prev.wallet_balance,
                current_streak: userUpdate.current_streak ?? prev.current_streak,
              }));
            } catch (err) {
              console.error('[WalletContext] Error processing user update:', err);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'points_history',
            filter: `user_id=eq.${user.id}`,
          },
          (payload: any) => {
            try {
              const newTxn = payload.new as PointTransaction;
              setState((prev) => ({
                ...prev,
                transactions: [newTxn, ...prev.transactions.slice(0, 19)],
              }));
            } catch (err) {
              console.error('[WalletContext] Error processing transaction:', err);
            }
          }
        )
        .subscribe();

      return () => {
        try {
          channel.unsubscribe();
        } catch (err) {
          console.error('[WalletContext] Error unsubscribing from channel:', err);
        }
      };
    } catch (err) {
      console.error('[WalletContext] Failed to setup realtime subscription:', err);
      return;
    }
  }, [user?.id]);

  const refreshWallet = useCallback(async () => {
    await loadWalletData();
  }, [loadWalletData]);

  const addPoints = useCallback(async (amount: number) => {
    if (!user?.id) return;
    try {
      // Supabase function will handle the actual logic server-side
      const { error } = await (supabase.rpc as any)('add_points', {
        p_user_id: user.id,
        p_points: amount,
      });
      if (error) throw error;
    } catch (err) {
      console.error('[WalletContext] Error adding points:', err);
    }
  }, [user?.id]);

  return (
    <WalletContext.Provider
      value={{
        ...state,
        refreshWallet,
        addPoints,
        points: state.wallet_balance,
        credits: state.wallet_balance,
        connectsRemaining,
        setSubscription: setSubscriptionWithConnects,
        addBillingRecord: (record: BillingRecord) => setBillingHistory((prev) => [record, ...prev]),
        subscription,
        kycStatus,
        setKycStatus,
        billingHistory,
        blockedUsers,
        unblockUser: (userId: string) => setBlockedUsers((prev) => prev.filter((u) => u.id !== userId)),
        themeMode: themeMode,
        setThemeMode: setThemeModeState,
        safetyAgreed,
        agreeSafety: () => setSafetyAgreed(true),
        pointsToFreeConnection,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

