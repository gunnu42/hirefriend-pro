import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft, CreditCard, Plus, Trash2, Check,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface PaymentMethod {
  id: string;
  type: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expiry: string;
  isDefault: boolean;
}

const paymentMethods: PaymentMethod[] = [
  { id: '1', type: 'visa', last4: '4242', expiry: '12/27', isDefault: true },
  { id: '2', type: 'mastercard', last4: '8888', expiry: '06/28', isDefault: false },
];

function getCardColor(type: string) {
  switch (type) {
    case 'visa': return '#1A1F71';
    case 'mastercard': return '#EB001B';
    case 'amex': return '#006FCF';
    default: return Colors.textSecondary;
  }
}

export default function PaymentMethodsScreen() {
  const router = useRouter();

  const handleDelete = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Remove Card', 'Are you sure you want to remove this card?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => console.log('Deleted:', id) },
    ]);
  }, []);

  const handleSetDefault = useCallback((id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Default Card', 'This card has been set as your default payment method.');
  }, []);

  const handleAddCard = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Add Card', 'Card adding functionality would open a secure payment form here.');
  }, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="back-button">
            <ArrowLeft size={22} color={Colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Payment Methods</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Your Cards</Text>

        {paymentMethods.map((card) => (
          <View key={card.id} style={styles.cardItem}>
            <View style={styles.cardLeft}>
              <View style={[styles.cardIcon, { backgroundColor: getCardColor(card.type) + '15' }]}>
                <CreditCard size={22} color={getCardColor(card.type)} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardType}>{card.type.charAt(0).toUpperCase() + card.type.slice(1)}</Text>
                <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>
                <Text style={styles.cardExpiry}>Expires {card.expiry}</Text>
              </View>
            </View>
            <View style={styles.cardActions}>
              {card.isDefault ? (
                <View style={styles.defaultBadge}>
                  <Check size={12} color={Colors.success} />
                  <Text style={styles.defaultText}>Default</Text>
                </View>
              ) : (
                <Pressable onPress={() => handleSetDefault(card.id)} style={styles.setDefaultBtn} testID={`set-default-${card.id}`}>
                  <Text style={styles.setDefaultText}>Set Default</Text>
                </Pressable>
              )}
              <Pressable onPress={() => handleDelete(card.id)} style={styles.deleteBtn} testID={`delete-card-${card.id}`}>
                <Trash2 size={16} color={Colors.danger} />
              </Pressable>
            </View>
          </View>
        ))}

        <Pressable style={styles.addCardBtn} onPress={handleAddCard} testID="add-card">
          <Plus size={20} color={Colors.primary} />
          <Text style={styles.addCardText}>Add New Card</Text>
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
  cardItem: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardType: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  cardNumber: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardExpiry: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.successLight,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  setDefaultBtn: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.surfaceAlt,
  },
  setDefaultText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed' as const,
  },
  addCardText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});

