import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Modal, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { X, ChevronDown, Search } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { supabase } from '@/supabase';
import { friends as mockFriends } from '@/mocks/friends';
import { useAuth } from '@/contexts/AuthContext';
import FriendCard from '@/components/FriendCard';
import SearchBar from '@/components/SearchBar';
import EmptyState from '@/components/EmptyState';

type SortOption = 'rating' | 'price_low' | 'price_high' | 'reviews';

const sortLabels: Record<SortOption, string> = {
  rating: 'Top Rated',
  price_low: 'Price: Low to High',
  price_high: 'Price: High to Low',
  reviews: 'Most Reviews',
};

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const { user } = useAuth();
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(params.category ?? 'All');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [showFilter, setShowFilter] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [users, setUsers] = useState<any[]>(mockFriends);
  const [loading, setLoading] = useState(true);

  // Define categories (you might want to fetch these from Supabase too)
  const allCategories = useMemo(() => [
    'All', 'General', 'Sports', 'Music', 'Food', 'Travel', 'Gaming', 'Art', 'Tech'
  ], []);

  // Fetch users from Supabase
  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, current_city, avatar_url, role')
        .eq('role', 'friend')
        .eq('is_blocked', false)
        .neq('id', user?.id || '') // Exclude current user
        .limit(50);

      if (error) throw error;

      // Transform data to match FriendCard expectations
      const formattedUsers = (data || []).map((user: any) => ({
        id: user.id,
        name: user.full_name || 'Unknown',
        avatar: user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
        location: user.current_city || 'Unknown',
        rating: 4.5, // Placeholder - would need to calculate from reviews
        verified: true, // Placeholder
        isOnline: true, // Placeholder
        activities: ['General'], // Placeholder - would need activities/interests table
        pricePerHour: 500, // Placeholder
        reviewCount: 10, // Placeholder
      }));

      if (formattedUsers.length) {
        setUsers(formattedUsers);
      } else {
        setUsers(mockFriends);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers(mockFriends);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredFriends = useMemo(() => {
    let result = [...users];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.location.toLowerCase().includes(q) ||
          f.activities.some((a: string) => a.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter((f) =>
        f.activities.some((a: string) => a.toLowerCase() === selectedCategory.toLowerCase())
      );
    }

    switch (sortBy) {
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'price_low':
        result.sort((a, b) => a.pricePerHour - b.pricePerHour);
        break;
      case 'price_high':
        result.sort((a, b) => b.pricePerHour - a.pricePerHour);
        break;
      case 'reviews':
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
    }

    return result;
  }, [search, selectedCategory, sortBy, users]);

  const handleCategorySelect = useCallback((cat: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(cat);
  }, []);

  const handleSortSelect = useCallback((option: SortOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortBy(option);
    setShowFilter(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setTimeout(() => setRefreshing(false), 1000);
  }, [fetchUsers]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <Text style={styles.title}>Explore</Text>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, location, activity..."
          showFilter
          onFilterPress={() => setShowFilter(true)}
        />
      </SafeAreaView>

      <View style={styles.categoryRow}>
        <FlatList
          data={allCategories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleCategorySelect(item)}
              style={[
                styles.categoryChip,
                selectedCategory === item && styles.categoryChipActive,
              ]}
              testID={`category-chip-${item}`}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item && styles.categoryChipTextActive,
                ]}
              >
                {item}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <View style={styles.resultHeader}>
        <Text style={styles.resultCount}>{filteredFriends.length} friends found</Text>
        <Pressable
          onPress={() => setShowFilter(true)}
          style={styles.sortBtn}
          testID="sort-button"
        >
          <Text style={styles.sortText}>{sortLabels[sortBy]}</Text>
          <ChevronDown size={14} color={Colors.textSecondary} />
        </Pressable>
      </View>

      <FlatList
        data={filteredFriends}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <FriendCard friend={item} variant="compact" />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Finding friends...</Text>
            </View>
          ) : (
            <EmptyState
              icon={<Search size={40} color={Colors.primary} />}
              title="No friends found"
              subtitle="Try adjusting your search filters or exploring different categories"
            />
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      />

      <Modal visible={showFilter} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalDismiss} onPress={() => setShowFilter(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sort By</Text>
              <Pressable onPress={() => setShowFilter(false)} testID="close-filter">
                <X size={22} color={Colors.text} />
              </Pressable>
            </View>
            {(Object.keys(sortLabels) as SortOption[]).map((option) => (
              <Pressable
                key={option}
                onPress={() => handleSortSelect(option)}
                style={[styles.sortOption, sortBy === option && styles.sortOptionActive]}
                testID={`sort-${option}`}
              >
                <Text
                  style={[
                    styles.sortOptionText,
                    sortBy === option && styles.sortOptionTextActive,
                  ]}
                >
                  {sortLabels[option]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
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
    paddingBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    paddingHorizontal: 16,
    paddingBottom: 14,
    paddingTop: 8,
  },
  categoryRow: {
    paddingVertical: 4,
  },
  categoryList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  resultCount: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalDismiss: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  sortOption: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  sortOptionActive: {
    backgroundColor: Colors.tagBg,
  },
  sortOptionText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  sortOptionTextActive: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
});
