import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, Video, Upload, Zap, CheckCircle2, Clock,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useWallet } from '@/contexts/WalletContext';

export default function UploadVibeScreen() {
  const router = useRouter();
  const { addPoints } = useWallet();
  const [uploaded, setUploaded] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const simulateUploadProgress = useCallback(() => {
    setUploading(true);
    setProgress(0);
    progressAnim.setValue(0);

    const steps = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 0.95, 1.0];
    let stepIndex = 0;

    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        const val = steps[stepIndex];
        setProgress(Math.round(val * 100));
        Animated.timing(progressAnim, {
          toValue: val,
          duration: 300,
          useNativeDriver: false,
        }).start();
        stepIndex++;
      } else {
        clearInterval(interval);
        setUploading(false);
        setUploaded(true);
        addPoints(400, 'vlog', 'Uploaded meetup vibe video');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 400);
  }, [addPoints, progressAnim]);

  const handleUpload = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Upload Vibe',
      'Select a 15-30 second meetup video to upload.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose Video',
          onPress: simulateUploadProgress,
        },
      ]
    );
  }, [simulateUploadProgress]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Upload Vibe</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Video size={36} color={Colors.teal} />
          </View>
          <Text style={styles.heroTitle}>Share Your Experience</Text>
          <Text style={styles.heroSub}>Upload a 15-30 second video of your meetup and earn 400 Points instantly!</Text>
          <View style={styles.rewardBadge}>
            <Zap size={16} color={Colors.gold} />
            <Text style={styles.rewardText}>+400 Points</Text>
          </View>
        </View>

        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>Guidelines</Text>
          <Text style={styles.rule}>• Video must be 15-30 seconds long</Text>
          <Text style={styles.rule}>• Must show your actual meetup experience</Text>
          <Text style={styles.rule}>• Both participants should be visible (with consent)</Text>
          <Text style={styles.rule}>• No inappropriate content</Text>
          <Text style={styles.rule}>• Points awarded after review (usually within 1 hour)</Text>
        </View>

        {uploading ? (
          <View style={styles.uploadingCard}>
            <Video size={32} color={Colors.primary} />
            <Text style={styles.uploadingTitle}>Uploading...</Text>
            <Text style={styles.uploadingPercent}>{progress}%</Text>
            <View style={styles.uploadProgressBg}>
              <Animated.View style={[styles.uploadProgressFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
            </View>
            <Text style={styles.uploadingSub}>Please wait while your video is being uploaded</Text>
          </View>
        ) : uploaded ? (
          <View style={styles.successCard}>
            <CheckCircle2 size={40} color={Colors.success} />
            <Text style={styles.successTitle}>Vibe Uploaded!</Text>
            <Text style={styles.successSub}>400 points have been added to your wallet. Your video is being reviewed.</Text>
            <Pressable style={styles.walletBtn} onPress={() => router.push('/wallet')} testID="go-wallet">
              <Zap size={16} color="#fff" />
              <Text style={styles.walletBtnText}>View Wallet</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.uploadBox} onPress={handleUpload} testID="upload-vibe-btn">
            <Upload size={36} color={Colors.primary} />
            <Text style={styles.uploadText}>Tap to upload your vibe video</Text>
            <Text style={styles.uploadSub}>MP4, MOV · Max 30 seconds</Text>
          </Pressable>
        )}

        <View style={styles.previousVibes}>
          <Text style={styles.prevTitle}>Previous Vibes</Text>
          <View style={styles.vibeRow}>
            <View style={styles.vibeThumb}>
              <Video size={20} color={Colors.textTertiary} />
            </View>
            <View style={styles.vibeInfo}>
              <Text style={styles.vibeName}>Coffee with Sarah M.</Text>
              <Text style={styles.vibeDate}>Feb 19, 2026</Text>
            </View>
            <View style={styles.vibeStatus}>
              <CheckCircle2 size={14} color={Colors.success} />
              <Text style={styles.vibeStatusText}>+400 pts</Text>
            </View>
          </View>
          <View style={styles.vibeRow}>
            <View style={styles.vibeThumb}>
              <Video size={20} color={Colors.textTertiary} />
            </View>
            <View style={styles.vibeInfo}>
              <Text style={styles.vibeName}>Hiking with James C.</Text>
              <Text style={styles.vibeDate}>Feb 14, 2026</Text>
            </View>
            <View style={styles.vibeStatus}>
              <Clock size={14} color={Colors.gold} />
              <Text style={[styles.vibeStatusText, { color: Colors.gold }]}>Reviewing</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  safeTop: { backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  scrollContent: { paddingHorizontal: 16 },
  heroCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 24, alignItems: 'center',
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 3,
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.tealLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  heroTitle: { fontSize: 22, fontWeight: '800' as const, color: Colors.text },
  heroSub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  rewardBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16,
    backgroundColor: Colors.goldLight, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
  },
  rewardText: { fontSize: 16, fontWeight: '800' as const, color: Colors.goldText },
  rulesCard: {
    marginTop: 16, backgroundColor: Colors.card, borderRadius: 16, padding: 18,
  },
  rulesTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginBottom: 10 },
  rule: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  uploadBox: {
    marginTop: 20, alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 16, padding: 32,
    borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed' as const,
  },
  uploadText: { fontSize: 16, fontWeight: '600' as const, color: Colors.primary },
  uploadSub: { fontSize: 12, color: Colors.textTertiary },
  uploadingCard: {
    marginTop: 20, alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 16, padding: 28,
    borderWidth: 1, borderColor: Colors.border,
  },
  uploadingTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.text },
  uploadingPercent: { fontSize: 28, fontWeight: '800' as const, color: Colors.primary },
  uploadProgressBg: {
    width: '100%', height: 8, backgroundColor: Colors.surfaceAlt,
    borderRadius: 4, overflow: 'hidden', marginTop: 4,
  },
  uploadProgressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  uploadingSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  successCard: {
    marginTop: 20, alignItems: 'center', gap: 10,
    backgroundColor: Colors.successLight, borderRadius: 16, padding: 28,
    borderWidth: 1, borderColor: '#A7F3D0',
  },
  successTitle: { fontSize: 20, fontWeight: '800' as const, color: Colors.success },
  successSub: { fontSize: 14, color: '#065F46', textAlign: 'center', lineHeight: 20 },
  walletBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    backgroundColor: Colors.success, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10,
  },
  walletBtnText: { fontSize: 14, fontWeight: '700' as const, color: '#fff' },
  previousVibes: { marginTop: 24 },
  prevTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.text, marginBottom: 12 },
  vibeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 8,
  },
  vibeThumb: {
    width: 44, height: 44, borderRadius: 10, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  vibeInfo: { flex: 1 },
  vibeName: { fontSize: 14, fontWeight: '600' as const, color: Colors.text },
  vibeDate: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  vibeStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vibeStatusText: { fontSize: 12, fontWeight: '700' as const, color: Colors.success },
});

