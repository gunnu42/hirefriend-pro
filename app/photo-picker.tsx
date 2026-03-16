import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Camera, ImagePlus } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function PhotoPickerScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Change Profile Photo</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <Text style={styles.title}>Select an option</Text>
        <Text style={styles.subtitle}>You can take a new photo or choose one from your library.</Text>

        <Pressable style={styles.option} onPress={() => router.push('/info', { title: 'Take Photo', message: 'Camera access would be requested here.', actionLabel: 'Got it' })} testID="take-photo">
          <View style={styles.optionIcon}><Camera size={20} color={Colors.primary} /></View>
          <Text style={styles.optionText}>Take Photo</Text>
        </Pressable>

        <Pressable style={styles.option} onPress={() => router.push('/info', { title: 'Photo Library', message: 'Library access would be requested here.', actionLabel: 'Got it' })} testID="choose-photo">
          <View style={styles.optionIcon}><ImagePlus size={20} color={Colors.primary} /></View>
          <Text style={styles.optionText}>Choose from Library</Text>
        </Pressable>

        <Pressable style={styles.cancelBtn} onPress={() => router.back()} testID="cancel-button">
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerArea: { backgroundColor: Colors.background },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800' as const, color: Colors.text, marginBottom: 10 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: 24, lineHeight: 20 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: Colors.card, borderRadius: 14, marginBottom: 12, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 2 },
  optionIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  optionText: { fontSize: 16, fontWeight: '700' as const, color: Colors.text },
  cancelBtn: { marginTop: 18, alignSelf: 'center' },
  cancelText: { fontSize: 15, fontWeight: '700' as const, color: Colors.textSecondary },
});
