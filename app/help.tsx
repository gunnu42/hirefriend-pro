import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, ChevronDown, ChevronUp, MessageCircle, Mail, Phone,
} from 'lucide-react-native';
import Colors from '@/constants/colors';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How does HireFriend work?',
    answer: 'HireFriend connects you with friendly, verified individuals for various activities. Browse profiles, book a session, and enjoy spending time with your chosen friend. All sessions are monitored for safety.',
  },
  {
    question: 'How do credits work?',
    answer: 'Credits are used to unlock connections with friends. You can earn credits through daily attendance (40 pts/day), referrals (500 pts per invite), or purchase credit packs starting at ₹1,800 for 10 connects.',
  },
  {
    question: 'Is it safe to meet strangers?',
    answer: 'Safety is our top priority. All friends undergo identity verification, and every session includes SOS support, location sharing, and insurance coverage. We recommend meeting in public places.',
  },
  {
    question: 'How do I cancel a booking?',
    answer: 'Go to My Bookings, find the booking you want to cancel, and tap the "Cancel" button. Free cancellation is available up to 24 hours before the session. Late cancellations may incur a fee.',
  },
  {
    question: 'How do I become a Friend?',
    answer: 'Tap "Become a Friend" on your profile page and complete the application. You\'ll need to verify your identity and complete a brief interview. Most applications are reviewed within 24 hours.',
  },
  {
    question: 'What is HireFriend PRO?',
    answer: 'PRO is our premium subscription at $9.99/month. It includes zero service fees, unlimited connections, priority messaging, profile boost, and 24/7 priority support.',
  },
];

export default function HelpScreen() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const handleContact = useCallback((method: string) => {
    Alert.alert('Contact Us', `Opening ${method} support...`);
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        {faqs.map((faq, i) => (
          <Pressable
            key={i}
            style={styles.faqCard}
            onPress={() => setExpandedId(expandedId === i ? null : i)}
            testID={`faq-${i}`}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              {expandedId === i ? (
                <ChevronUp size={18} color={Colors.primary} />
              ) : (
                <ChevronDown size={18} color={Colors.textTertiary} />
              )}
            </View>
            {expandedId === i && (
              <Text style={styles.faqAnswer}>{faq.answer}</Text>
            )}
          </Pressable>
        ))}

        <Text style={styles.sectionTitle}>Contact Us</Text>

        <Pressable style={styles.contactCard} onPress={() => handleContact('Chat')} testID="contact-chat">
          <View style={[styles.contactIcon, { backgroundColor: Colors.tagBg }]}>
            <MessageCircle size={22} color={Colors.primary} />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>Live Chat</Text>
            <Text style={styles.contactDesc}>Chat with our support team in real-time</Text>
          </View>
        </Pressable>

        <Pressable style={styles.contactCard} onPress={() => handleContact('Email')} testID="contact-email">
          <View style={[styles.contactIcon, { backgroundColor: Colors.indigoLight }]}>
            <Mail size={22} color={Colors.indigo} />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>Email Support</Text>
            <Text style={styles.contactDesc}>support@hirefriend.app</Text>
          </View>
        </Pressable>

        <Pressable style={styles.contactCard} onPress={() => handleContact('Phone')} testID="contact-phone">
          <View style={[styles.contactIcon, { backgroundColor: Colors.successLight }]}>
            <Phone size={22} color={Colors.success} />
          </View>
          <View style={styles.contactContent}>
            <Text style={styles.contactTitle}>Phone Support</Text>
            <Text style={styles.contactDesc}>+1 (800) HIRE-NOW</Text>
          </View>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 10,
    marginBottom: 14,
  },
  faqCard: {
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contactContent: {
    flex: 1,
    justifyContent: 'center',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  contactDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});

