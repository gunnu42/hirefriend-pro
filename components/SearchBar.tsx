import React from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFilterPress?: () => void;
  showFilter?: boolean;
}

export default React.memo(function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search friends...',
  onFilterPress,
  showFilter = false,
}: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <Search size={18} color={Colors.textTertiary} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          testID="search-input"
        />
      </View>
      {showFilter && onFilterPress && (
        <Pressable onPress={onFilterPress} style={styles.filterBtn} testID="filter-button">
          <SlidersHorizontal size={18} color={Colors.primary} />
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    gap: 10,
  },
  searchRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    height: '100%',
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.tagBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

