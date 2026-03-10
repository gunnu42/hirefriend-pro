import React, { useState, useMemo, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { X, ChevronDown } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { friends, categories } from '@/mocks/friends';
import FriendCard from '@/components/FriendCard';
import SearchBar from '@/components/SearchBar';

type SortOption = 'rating' | 'price_low' | 'price_high' | 'reviews';

const sortLabels: Record<SortOption, string> = {
  rating: 'Top Rated',
  price_low: 'Price: Low to High',
  price_high: 'Price: High to Low',
  reviews: 'Most Reviews',
};

export default function ExploreScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(params.category ?? 'All');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [showFilter, setShowFilter] = useState<boolean>(false);

  const allCategories = useMemo(() => ['All', ...categories.map((c) => c.name)], []);

  const filteredFriends = useMemo(() => {
    let result = [...friends];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.location.toLowerCase().includes(q) ||
          f.activities.some((a) => a.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'All') {
      result = result.filter((f) =>
        f.activities.some((a) => a.toLowerCase() === selectedCategory.toLowerCase())
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
  }, [search, selectedCategory, sortBy]);

  const handleCategorySelect = useCallback((cat: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(cat);
  }, []);

  const handleSortSelect = useCallback((option: SortOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortBy(option);
    setShowFilter(false);
  }, []);

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
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No friends found</Text>
            <Text style={styles.emptySubtitle}>Try adjusting your search or filters</Text>
          </View>
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
});
