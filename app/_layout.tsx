import React from 'react';
import { Slot } from 'expo-router';
import { WalletProvider } from '@/contexts/WalletContext';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { DailyRewardsProvider } from '@/contexts/DailyRewardsContext';

export default function RootLayout() {
  return (
    <WalletProvider>
      <FavoritesProvider>
        <DailyRewardsProvider>
          <Slot />
        </DailyRewardsProvider>
      </FavoritesProvider>
    </WalletProvider>
  );
}

