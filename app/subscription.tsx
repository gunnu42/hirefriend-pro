import React, { useState } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native'
import { useSubscription, SUBSCRIPTION_PLANS, SubscriptionPlan } from '@/contexts/SubscriptionContextUnified'
import { router } from 'expo-router'

const { width } = Dimensions.get('window')
const cardWidth = width - 32

export default function SubscriptionScreen() {
  const {
    currentPlan,
    connectsRemaining,
    subscriptionActive,
    paymentStatus,
    loading,
    error,
    selectPlan,
    initiatePayment,
    setAutoRenew,
    autoRenewEnabled,
  } = useSubscription()

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)
  const [processingPlan, setProcessingPlan] = useState<SubscriptionPlan | null>(null)

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (plan === 'free') {
      Alert.alert('Already on Free Plan', 'You are already using the Free plan.')
      return
    }

    try {
      setProcessingPlan(plan)
      setSelectedPlan(plan)

      const paymentSession = await initiatePayment(plan)

      router.push({ pathname: '/payment-flow' as any,
        params: {
          orderId: paymentSession.orderId,
          amount: paymentSession.amount,
          planType: plan,
          signature: paymentSession.signature,
        },
      })
    } catch (err) {
      Alert.alert('Payment Error', err instanceof Error ? err.message : 'Failed to initiate payment')
      setProcessingPlan(null)
    }
  }

  const renderPlanCard = (plan: SubscriptionPlan) => {
    const details = SUBSCRIPTION_PLANS[plan]
    const isCurrentPlan = currentPlan === plan
    const isProcessing = processingPlan === plan

    return (
      <View key={plan} style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Text style={styles.planName}>{details.name}</Text>
          {details.tag && <Text style={styles.tag}>{details.tag}</Text>}
        </View>

        <Text style={styles.price}>
          {plan === 'free' ? 'Free' : `₹${details.price}`}
        </Text>

        <Text style={styles.connectCount}>{details.connects} Connects</Text>

        <View style={styles.featuresList}>
          {details.features.map((feature, idx) => (
            <View key={idx} style={styles.featureRow}>
              <Text style={styles.featureBullet}>• </Text>
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.subscribeButton,
            isCurrentPlan && styles.subscribeButtonActive,
            isProcessing && styles.subscribeButtonDisabled,
          ]}
          onPress={() => handleSubscribe(plan)}
          disabled={isCurrentPlan || isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" />
          ) : isCurrentPlan ? (
            <Text style={styles.subscribeButtonText}>Current Plan</Text>
          ) : (
            <Text style={styles.subscribeButtonText}>Subscribe Now</Text>
          )}
        </TouchableOpacity>

        {isCurrentPlan && plan !== 'free' && (
          <View style={styles.autoRenewContainer}>
            <Text style={styles.autoRenewLabel}>Auto Renew</Text>
            <TouchableOpacity
              style={[styles.autoRenewToggle, autoRenewEnabled && styles.autoRenewToggleOn]}
              onPress={() => setAutoRenew(!autoRenewEnabled)}
            >
              <View style={[styles.autoRenewThumb, autoRenewEnabled && styles.autoRenewThumbOn]} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>Get unlimited connects and exclusive features</Text>
      </View>

      {subscriptionActive && currentPlan !== 'free' && (
        <View style={styles.statusBanner}>
          <Text style={styles.statusBannerText}>
            👑 Premium Active • {connectsRemaining} connects remaining
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      )}

      <View style={styles.plansContainer}>
        {loading ? (
          <ActivityIndicator size="large" color="#FF5A75" style={{ marginVertical: 40 }} />
        ) : (
          Object.keys(SUBSCRIPTION_PLANS).map((plan) => renderPlanCard(plan as SubscriptionPlan))
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerTitle}>100% Secure Payment</Text>
        <Text style={styles.footerText}>
          All payments are encrypted and verified. Cancel anytime with no penalty.
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  statusBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  statusBannerText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
  },
  errorBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorBannerText: {
    fontSize: 13,
    color: '#C62828',
    fontWeight: '600',
  },
  plansContainer: {
    paddingHorizontal: 16,
    gap: 14,
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  tag: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF5A75',
    backgroundColor: '#FFE5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
  },
  connectCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF5A75',
    marginBottom: 14,
  },
  featuresList: {
    marginBottom: 16,
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  featureBullet: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF5A75',
    marginRight: 6,
    marginTop: -2,
  },
  featureText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 18,
    flex: 1,
  },
  subscribeButton: {
    backgroundColor: '#FF5A75',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  subscribeButtonActive: {
    backgroundColor: '#E0E0E0',
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  autoRenewContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  autoRenewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  autoRenewToggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  autoRenewToggleOn: {
    backgroundColor: '#FF5A75',
  },
  autoRenewThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  autoRenewThumbOn: {
    alignSelf: 'flex-end',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 20,
  },
  footerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
})


