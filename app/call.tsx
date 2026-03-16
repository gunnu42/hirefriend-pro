import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Phone, Video, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { friends } from '@/mocks/friends';

export default function CallScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ friendId?: string; method?: string }>();
  const friend = useMemo(() => friends.find((f) => f.id === params.friendId), [params.friendId]);
  const method = (params.method || 'voice').toLowerCase();
  const isVideo = method === 'video';

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{isVideo ? 'Video Call' : 'Voice Call'}</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <View style={styles.avatarCircle}>
          {isVideo ? <Video size={32} color={Colors.primary} /> : <Phone size={32} color={Colors.primary} />}
        </View>
        <Text style={styles.name}>{friend?.name ?? 'Friend'}</Text>
        <Text style={styles.status}>Connecting you now...</Text>

        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn} onPress={() => router.back()} testID="end-call">
            <X size={18} color="#fff" />
            <Text style={styles.actionText}>End</Text>
          </Pressable>
        </View>

        <Text style={styles.note}>This is a demo call screen. In a real app, you would connect via WebRTC or a voice/video provider.</Text>
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
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  avatarCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 20, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  name: { fontSize: 22, fontWeight: '800' as const, color: Colors.text, marginBottom: 10 },
  status: { fontSize: 14, color: Colors.textSecondary, marginBottom: 30 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.danger, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 16 },
  actionText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
  note: { marginTop: 30, fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
});
