import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Mail, MessageCircle, Phone } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function ContactSupportScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ method?: string }>();
  const method = params.method ?? 'Chat';

  const getDetails = () => {
    switch (method.toLowerCase()) {
      case 'email':
        return { title: 'Email Support', subtitle: 'support@hirefriend.app', icon: Mail };
      case 'phone':
        return { title: 'Phone Support', subtitle: '+1 (800) 447-3369', icon: Phone };
      default:
        return { title: 'Live Chat', subtitle: 'Chat with our support team in real-time.', icon: MessageCircle };
    }
  };

  const { title, subtitle, icon: Icon } = getDetails();

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Contact Support</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.primaryLight }]}> 
            <Icon size={26} color={Colors.primary} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text style={styles.note}>Our support team is available 24/7 to help with bookings, safety, and refunds.</Text>
          <Pressable style={styles.chatButton} onPress={() => router.push('/help')} testID="open-help">
            <Text style={styles.chatButtonText}>Back to Help</Text>
          </Pressable>
        </View>
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
  card: { width: '100%', backgroundColor: Colors.card, borderRadius: 18, padding: 24, alignItems: 'center', shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 3 },
  iconCircle: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { fontSize: 20, fontWeight: '800' as const, color: Colors.text, marginBottom: 6 },
  subtitle: { fontSize: 15, color: Colors.textSecondary, textAlign: 'center', marginBottom: 14 },
  note: { fontSize: 13, color: Colors.textTertiary, textAlign: 'center', marginBottom: 20 },
  chatButton: { backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24 },
  chatButtonText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
});
