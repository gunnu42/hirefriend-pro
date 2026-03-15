import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

const FAVORITES_KEY = 'hirefriend_favorites';

const [FavoritesProviderBase, useFavoritesBase] = createContextHook(() => {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then((stored) => {
      if (stored) {
        try {
          setFavoriteIds(JSON.parse(stored));
        } catch {
          console.log('Failed to parse favorites');
        }
      }
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
    }
  }, [favoriteIds, loaded]);

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const isFavorite = (id: string) => favoriteIds.includes(id);

  // Default value: empty list, with no-op helpers until loaded
  return { favoriteIds, toggleFavorite, isFavorite, loaded };
});

export const FavoritesProvider = FavoritesProviderBase;

export function useFavorites() {
  const context = useFavoritesBase();
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

