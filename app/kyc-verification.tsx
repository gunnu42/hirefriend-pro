import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, ShieldCheck, Camera, FileText, User, CheckCircle2, AlertTriangle, ChevronRight,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { useWallet } from '@/contexts/WalletContext';

type Step = 'intro' | 'personal' | 'document' | 'selfie' | 'review' | 'done';

const steps: { key: Step; label: string }[] = [
  { key: 'personal', label: 'Personal Info' },
  { key: 'document', label: 'ID Upload' },
  { key: 'selfie', label: 'Face Scan' },
  { key: 'review', label: 'Review' },
];

export default function KycVerificationScreen() {
  const router = useRouter();
  const { kycStatus, setKycStatus } = useWallet();
  const [currentStep, setCurrentStep] = useState<Step>(kycStatus === 'verified' ? 'done' : 'intro');
  const [fullName, setFullName] = useState<string>('Alex Thompson');
  const [aadharNumber, setAadharNumber] = useState<string>('');
  const [panNumber, setPanNumber] = useState<string>('');
  const [docType, setDocType] = useState<'aadhar' | 'pan'>('aadhar');
  const [docUploaded, setDocUploaded] = useState<boolean>(false);
  const [selfieCompleted, setSelfieCompleted] = useState<boolean>(false);

  const stepIndex = steps.findIndex((s) => s.key === currentStep);

  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep === 'intro') setCurrentStep('personal');
    else if (currentStep === 'personal') {
      if (!fullName.trim()) {
        Alert.alert('Required', 'Please enter your full name');
        return;
      }
      setCurrentStep('document');
    } else if (currentStep === 'document') {
      if (!docUploaded) {
        Alert.alert('Required', 'Please upload your ID document');
        return;
      }
      setCurrentStep('selfie');
    } else if (currentStep === 'selfie') {
      if (!selfieCompleted) {
        Alert.alert('Required', 'Please complete the face scan');
        return;
      }
      setCurrentStep('review');
    } else if (currentStep === 'review') {
      setKycStatus('pending');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        setKycStatus('verified');
        setCurrentStep('done');
      }, 2000);
    }
  }, [currentStep, fullName, docUploaded, selfieCompleted, setKycStatus]);

  const handleDocUpload = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Document Upload', 'Simulating Aadhar/PAN card OCR scan...', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Simulate Upload',
        onPress: () => {
          setDocUploaded(true);
          if (docType === 'aadhar') setAadharNumber('XXXX XXXX 4567');
          else setPanNumber('ABCDE1234F');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, [docType]);

  const handleSelfie = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Live Face Scan', 'Simulating real-time face match verification (95%+ match required)...', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Simulate Scan',
        onPress: () => {
          setSelfieCompleted(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
      },
    ]);
  }, []);

  const renderIntro = () => (
    <View style={styles.introContainer}>
      <View style={styles.introIcon}>
        <ShieldCheck size={48} color={Colors.teal} />
      </View>
      <Text style={styles.introTitle}>Identity Verification</Text>
      <Text style={styles.introSub}>
        Complete KYC to unlock all features including free trial connection. Your data is encrypted and secure.
      </Text>
      <View style={styles.introSteps}>
        {steps.map((s, i) => (
          <View key={s.key} style={styles.introStepRow}>
            <View style={styles.introStepNum}>
              <Text style={styles.introStepNumText}>{i + 1}</Text>
            </View>
            <Text style={styles.introStepLabel}>{s.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.trustRow}>
        <ShieldCheck size={14} color={Colors.teal} />
        <Text style={styles.trustText}>256-bit SSL Encrypted · PCI-DSS Compliant</Text>
      </View>
    </View>
  );

  const renderPersonal = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Personal Information</Text>
      <Text style={styles.stepSub}>Enter your details as per your government ID</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Full Name (as per ID)</Text>
        <TextInput
          style={styles.input}
          value={fullName}
          onChangeText={setFullName}
          placeholder="Enter your full name"
          placeholderTextColor={Colors.textTertiary}
          testID="kyc-name-input"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Date of Birth</Text>
        <TextInput
          style={styles.input}
          placeholder="DD/MM/YYYY"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="numeric"
          testID="kyc-dob-input"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Phone Number</Text>
        <TextInput
          style={styles.input}
          placeholder="+91 XXXXX XXXXX"
          placeholderTextColor={Colors.textTertiary}
          keyboardType="phone-pad"
          testID="kyc-phone-input"
        />
      </View>
    </View>
  );

  const renderDocument = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>ID Document Upload</Text>
      <Text style={styles.stepSub}>Upload a valid government-issued ID for automated OCR verification</Text>
      <View style={styles.docTypeRow}>
        <Pressable
          style={[styles.docTypeBtn, docType === 'aadhar' && styles.docTypeBtnActive]}
          onPress={() => { setDocType('aadhar'); setDocUploaded(false); }}
          testID="doc-aadhar"
        >
          <FileText size={20} color={docType === 'aadhar' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.docTypeText, docType === 'aadhar' && styles.docTypeTextActive]}>Aadhar Card</Text>
        </Pressable>
        <Pressable
          style={[styles.docTypeBtn, docType === 'pan' && styles.docTypeBtnActive]}
          onPress={() => { setDocType('pan'); setDocUploaded(false); }}
          testID="doc-pan"
        >
          <FileText size={20} color={docType === 'pan' ? Colors.primary : Colors.textSecondary} />
          <Text style={[styles.docTypeText, docType === 'pan' && styles.docTypeTextActive]}>PAN Card</Text>
        </Pressable>
      </View>
      <Pressable style={styles.uploadBox} onPress={handleDocUpload} testID="upload-doc-btn">
        {docUploaded ? (
          <View style={styles.uploadDone}>
            <CheckCircle2 size={32} color={Colors.success} />
            <Text style={styles.uploadDoneText}>Document Uploaded Successfully</Text>
            <Text style={styles.uploadDoneSub}>
              {docType === 'aadhar' ? `Aadhar: ${aadharNumber}` : `PAN: ${panNumber}`}
            </Text>
          </View>
        ) : (
          <View style={styles.uploadPlaceholder}>
            <Camera size={32} color={Colors.textTertiary} />
            <Text style={styles.uploadPlaceholderText}>Tap to scan your {docType === 'aadhar' ? 'Aadhar' : 'PAN'} Card</Text>
            <Text style={styles.uploadPlaceholderSub}>Auto OCR will extract your details</Text>
          </View>
        )}
      </Pressable>
    </View>
  );

  const renderSelfie = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Live Face Verification</Text>
      <Text style={styles.stepSub}>Take a real-time selfie to match against your ID photo (95%+ match required)</Text>
      <Pressable style={styles.selfieBox} onPress={handleSelfie} testID="selfie-scan-btn">
        {selfieCompleted ? (
          <View style={styles.selfieDone}>
            <CheckCircle2 size={40} color={Colors.success} />
            <Text style={styles.selfieDoneText}>Face Match: 97.3%</Text>
            <Text style={styles.selfieDoneSub}>Verification Successful</Text>
          </View>
        ) : (
          <View style={styles.selfiePlaceholder}>
            <View style={styles.selfieCircle}>
              <User size={48} color={Colors.textTertiary} />
            </View>
            <Text style={styles.selfiePlaceholderText}>Tap to start face scan</Text>
            <Text style={styles.selfiePlaceholderSub}>Optimized for diverse Indian features & attire</Text>
          </View>
        )}
      </Pressable>
      <View style={styles.selfieNotes}>
        <Text style={styles.selfieNote}>• Ensure good lighting on your face</Text>
        <Text style={styles.selfieNote}>• Remove sunglasses but turbans/bindis are fine</Text>
        <Text style={styles.selfieNote}>• Hold steady for 3 seconds</Text>
      </View>
    </View>
  );

  const renderReview = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      <Text style={styles.stepSub}>Please verify all details before submission</Text>
      <View style={styles.reviewCard}>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Full Name</Text>
          <Text style={styles.reviewValue}>{fullName}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Document</Text>
          <Text style={styles.reviewValue}>{docType === 'aadhar' ? 'Aadhar Card' : 'PAN Card'}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Doc Number</Text>
          <Text style={styles.reviewValue}>{docType === 'aadhar' ? aadharNumber : panNumber}</Text>
        </View>
        <View style={styles.reviewRow}>
          <Text style={styles.reviewLabel}>Face Match</Text>
          <Text style={[styles.reviewValue, { color: Colors.success }]}>97.3% ✓</Text>
        </View>
      </View>
      {kycStatus === 'pending' && (
        <View style={styles.pendingBanner}>
          <AlertTriangle size={18} color={Colors.gold} />
          <Text style={styles.pendingText}>Verifying your identity... This takes a few seconds.</Text>
        </View>
      )}
    </View>
  );

  const renderDone = () => (
    <View style={styles.doneContainer}>
      <View style={styles.doneIcon}>
        <CheckCircle2 size={56} color={Colors.success} />
      </View>
      <Text style={styles.doneTitle}>KYC Verified!</Text>
      <Text style={styles.doneSub}>Your identity has been verified successfully. You now have access to all features including your free trial connection.</Text>
      <View style={styles.doneBadge}>
        <ShieldCheck size={18} color="#fff" />
        <Text style={styles.doneBadgeText}>Blue Shield Trust Badge Activated</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>KYC Verification</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      {currentStep !== 'intro' && currentStep !== 'done' && (
        <View style={styles.progressRow}>
          {steps.map((s, i) => (
            <View key={s.key} style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]} />
          ))}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {currentStep === 'intro' && renderIntro()}
        {currentStep === 'personal' && renderPersonal()}
        {currentStep === 'document' && renderDocument()}
        {currentStep === 'selfie' && renderSelfie()}
        {currentStep === 'review' && renderReview()}
        {currentStep === 'done' && renderDone()}
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomBar}>
        <SafeAreaView edges={['bottom']} style={styles.bottomBarInner}>
          {currentStep === 'done' ? (
            <Pressable style={styles.primaryBtn} onPress={() => router.back()} testID="done-btn">
              <Text style={styles.primaryBtnText}>Back to Profile</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.primaryBtn} onPress={handleNext} testID="next-btn">
              <Text style={styles.primaryBtnText}>
                {currentStep === 'intro' ? 'Start Verification' : currentStep === 'review' ? 'Submit for Verification' : 'Continue'}
              </Text>
              <ChevronRight size={18} color="#fff" />
            </Pressable>
          )}
        </SafeAreaView>
      </View>
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
  progressRow: {
    flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 8,
  },
  progressDot: {
    flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border,
  },
  progressDotActive: { backgroundColor: Colors.teal },
  scrollContent: { paddingHorizontal: 16 },
  introContainer: { alignItems: 'center', paddingTop: 40 },
  introIcon: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.tealLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  introTitle: { fontSize: 26, fontWeight: '800' as const, color: Colors.text },
  introSub: {
    fontSize: 15, color: Colors.textSecondary, textAlign: 'center',
    marginTop: 8, lineHeight: 22, paddingHorizontal: 20,
  },
  introSteps: { marginTop: 32, width: '100%', gap: 12 },
  introStepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.card, borderRadius: 14, padding: 16,
  },
  introStepNum: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.teal,
    alignItems: 'center', justifyContent: 'center',
  },
  introStepNumText: { fontSize: 14, fontWeight: '700' as const, color: '#fff' },
  introStepLabel: { fontSize: 16, fontWeight: '600' as const, color: Colors.text },
  trustRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 24,
  },
  trustText: { fontSize: 12, color: Colors.teal, fontWeight: '500' as const },
  stepContent: { paddingTop: 16 },
  stepTitle: { fontSize: 22, fontWeight: '800' as const, color: Colors.text },
  stepSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 6, lineHeight: 20 },
  inputGroup: { marginTop: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 16,
    fontSize: 16, color: Colors.text, borderWidth: 1, borderColor: Colors.border,
  },
  docTypeRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  docTypeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    borderWidth: 2, borderColor: Colors.border,
  },
  docTypeBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.tagBg },
  docTypeText: { fontSize: 14, fontWeight: '600' as const, color: Colors.textSecondary },
  docTypeTextActive: { color: Colors.primary },
  uploadBox: {
    marginTop: 20, backgroundColor: Colors.card, borderRadius: 16,
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed' as const,
    minHeight: 180, alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  uploadPlaceholder: { alignItems: 'center', gap: 8 },
  uploadPlaceholderText: { fontSize: 15, fontWeight: '600' as const, color: Colors.textSecondary },
  uploadPlaceholderSub: { fontSize: 12, color: Colors.textTertiary },
  uploadDone: { alignItems: 'center', gap: 8 },
  uploadDoneText: { fontSize: 16, fontWeight: '700' as const, color: Colors.success },
  uploadDoneSub: { fontSize: 14, color: Colors.textSecondary },
  selfieBox: {
    marginTop: 20, backgroundColor: Colors.card, borderRadius: 16,
    minHeight: 240, alignItems: 'center', justifyContent: 'center', padding: 24,
    borderWidth: 2, borderColor: Colors.border,
  },
  selfiePlaceholder: { alignItems: 'center', gap: 12 },
  selfieCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.border,
    borderStyle: 'dashed' as const,
  },
  selfiePlaceholderText: { fontSize: 15, fontWeight: '600' as const, color: Colors.textSecondary },
  selfiePlaceholderSub: { fontSize: 12, color: Colors.textTertiary },
  selfieDone: { alignItems: 'center', gap: 8 },
  selfieDoneText: { fontSize: 20, fontWeight: '800' as const, color: Colors.success },
  selfieDoneSub: { fontSize: 14, color: Colors.textSecondary },
  selfieNotes: { marginTop: 16, gap: 6 },
  selfieNote: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  reviewCard: {
    marginTop: 20, backgroundColor: Colors.card, borderRadius: 16, padding: 18, gap: 14,
  },
  reviewRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  reviewLabel: { fontSize: 14, color: Colors.textSecondary },
  reviewValue: { fontSize: 14, fontWeight: '700' as const, color: Colors.text },
  pendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16,
    backgroundColor: Colors.goldLight, borderRadius: 12, padding: 14,
  },
  pendingText: { fontSize: 13, color: Colors.goldText, flex: 1 },
  doneContainer: { alignItems: 'center', paddingTop: 60 },
  doneIcon: { marginBottom: 20 },
  doneTitle: { fontSize: 28, fontWeight: '800' as const, color: Colors.success },
  doneSub: {
    fontSize: 15, color: Colors.textSecondary, textAlign: 'center',
    marginTop: 10, lineHeight: 22, paddingHorizontal: 20,
  },
  doneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24,
    backgroundColor: Colors.teal, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12,
  },
  doneBadgeText: { fontSize: 14, fontWeight: '700' as const, color: '#fff' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  bottomBarInner: { paddingHorizontal: 16, paddingTop: 14 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.teal, borderRadius: 14, height: 52,
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700' as const, color: '#fff' },
});

