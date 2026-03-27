import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Text, Animated, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSubscription, SUBSCRIPTION_PLANS } from '@/contexts/SubscriptionContextUnified'

export default function PaymentSuccessScreen() {
  const { planType, orderId } = useLocalSearchParams()
  const { connectsRemaining, planDetails } = useSubscription()
  const scaleAnim = useRef(new Animated.Value(0)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Animate success state
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()

    // Auto-redirect after 2 seconds
    const timer = setTimeout(() => {
      router.replace('/(tabs)/(home)' as any)
    }, 2000)

    return () => clearTimeout(timer)
  }, [scaleAnim, opacityAnim])

  const subscriptionKey = (planType as keyof typeof SUBSCRIPTION_PLANS) || 'free'
  const plan = SUBSCRIPTION_PLANS[subscriptionKey]

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Crown icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.crownEmoji}>👑</Text>
        </View>

        {/* Success message */}
        <Text style={styles.title}>Premium Activated!</Text>
        <Text style={styles.subtitle}>{plan?.name} Plan Successfully Purchased</Text>

        {/* Plan info */}
        <View style={styles.planCard}>
          <Text style={styles.planNameBold}>{plan?.connects} Connects Added</Text>
          <View style={styles.divider} />
          <Text style={styles.connectsInfo}>
            Total: {connectsRemaining} Connects Available
          </Text>
        </View>

        {/* Action button */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(tabs)/(home)' as any)}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>

        {/* Reference */}
        <Text style={styles.reference}>Order ID: {orderId?.toString().slice(0, 16)}</Text>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFE5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  crownEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  planNameBold: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF5A75',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  connectsInfo: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF5A75',
    marginBottom: 12,
  },
  premiumFeatures: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkmark: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '700',
  },
  featureText: {
    fontSize: 13,
    color: '#555',
    flex: 1,
  },
  button: {
    backgroundColor: '#FF5A75',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  reference: {
    fontSize: 11,
    color: '#999',
    marginTop: 12,
  },
})
