import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { friends, categories } from '@/mocks/friends';
import FriendCard from '@/components/FriendCard';

export default function CategoryDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string }>();
  const categoryName = params.name ?? 'All';

  const category = useMemo(() => categories.find((c) => c.name.toLowerCase() === (categoryName ?? '').toLowerCase()), [categoryName]);

  const filteredFriends = useMemo(() => {
    if (!category) return friends;
    return friends.filter((f) => f.activities.some((a) => a.toLowerCase() === category.name.toLowerCase()));
  }, [category]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.title}>{category?.name ?? 'Explore'}</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <View style={styles.descriptionContainer}>
        <Text style={styles.subtitle}>
          {category
            ? `Browse ${filteredFriends.length} friends who offer ${category.name.toLowerCase()} experiences.`
            : 'Browse all available friends and experiences.'
          }
        </Text>
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
            <Text style={styles.emptySubtitle}>Try another category or update your filters.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800' as const, color: Colors.text },
  descriptionContainer: { paddingHorizontal: 16, marginTop: 8, marginBottom: 10 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  listContent: { paddingBottom: 24 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 8, textAlign: 'center', paddingHorizontal: 24 },
});
