import React, { useState, useEffect } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSubscription } from '@/contexts/SubscriptionContextUnified'

export default function PaymentFlowScreen() {
  const { orderId, amount, planType, signature } = useLocalSearchParams()
  const { verifyPayment, paymentStatus } = useSubscription()
  const [processing, setProcessing] = useState(false)
  const [verificationAttempts, setVerificationAttempts] = useState(0)

  // Auto-verify after payment (simulated webhook callback)
  useEffect(() => {
    const verifyAfterPayment = async () => {
      // In production, webhook from payment gateway calls this
      // For now, simulate 3-second delay to allow external payment
      await new Promise((resolve) => setTimeout(resolve, 3000))

      if (verificationAttempts < 1) {
        setVerificationAttempts((prev) => prev + 1)
        // Auto-verify with generated signature
        const success = await verifyPayment(
          orderId as string,
          (signature as string) || `mock_signature_${Date.now()}`
        )

        if (success) {
          // Show success screen
          router.replace({ pathname: '/payment-success' as any,
            params: { planType, orderId },
          })
        }
      }
    }

    verifyAfterPayment()
  }, [orderId, planType, verifyPayment, verificationAttempts])

  const handleManualVerify = async () => {
    setProcessing(true)
    try {
      const success = await verifyPayment(
        orderId as string,
        (signature as string) || `manual_signature_${Date.now()}`
      )

      if (!success) {
        Alert.alert('Verification Failed', 'Could not verify payment. Please try again.')
        return
      }

      router.replace({ pathname: '/payment-success' as any,
        params: { planType, orderId },
      })
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setProcessing(false)
    }
  }

  const handleRetry = () => {
    router.back()
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment Processing</Text>
        <Text style={styles.subtitle}>Order: {orderId?.toString().slice(0, 20)}...</Text>
      </View>

      <View style={styles.content}>
        {/* Order details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Plan:</Text>
            <Text style={styles.value}>{planType?.toString().toUpperCase()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount:</Text>
            <Text style={styles.value}>₹{amount?.toString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Status:</Text>
            <Text style={[styles.value, { color: paymentStatus === 'success' ? '#4CAF50' : '#FF9800' }]}>
              {paymentStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsCard}>
          <Text style={styles.instructionTitle}>📱 Complete Your Payment</Text>
          <Text style={styles.instructionText}>
            A payment gateway will open automatically. Complete the payment using your preferred method (UPI, Card, Net Banking).
          </Text>
          <Text style={styles.instructionText}>
            Once payment is confirmed, you'll be automatically redirected to activate your subscription.
          </Text>
        </View>

        {/* Processing indicator */}
        {paymentStatus === 'processing' && (
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color="#FF5A75" />
            <Text style={styles.processingText}>Verifying your payment...</Text>
          </View>
        )}

        {/* Success state */}
        {paymentStatus === 'success' && (
          <View style={styles.successCard}>
            <Text style={styles.successEmoji}>✅</Text>
            <Text style={styles.successText}>Payment Verified!</Text>
            <Text style={styles.successSubtext}>Redirecting...</Text>
          </View>
        )}

        {/* Failed state */}
        {paymentStatus === 'failed' && (
          <View style={styles.failedCard}>
            <Text style={styles.failedEmoji}>❌</Text>
            <Text style={styles.failedText}>Payment Failed</Text>
            <Text style={styles.failedSubtext}>Please try again or contact support</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {paymentStatus === 'pending' && (
          <>
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={handleManualVerify}
              disabled={processing}
            >
              {processing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>I've Completed Payment</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.buttonSecondary} onPress={handleRetry}>
              <Text style={styles.buttonSecondaryText}>Back to Plans</Text>
            </TouchableOpacity>

            <Text style={styles.helpText}>Payment taking long? Check your payment app or contact support.</Text>
          </>
        )}

        {paymentStatus === 'failed' && (
          <>
            <TouchableOpacity style={styles.buttonPrimary} onPress={handleRetry}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={() => Alert.alert('Support', 'Contact support@hirefriend.com')}
            >
              <Text style={styles.buttonSecondaryText}>Contact Support</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
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
  content: {
    paddingHorizontal: 16,
    gap: 16,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  label: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  instructionsCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
  },
  instructionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1976D2',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 13,
    color: '#1565C0',
    lineHeight: 19,
    marginBottom: 10,
  },
  processingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  processingText: {
    fontSize: 14,
    color: '#FF5A75',
    fontWeight: '600',
    marginTop: 16,
  },
  successCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  successText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
  },
  successSubtext: {
    fontSize: 13,
    color: '#558B2F',
  },
  failedCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  failedEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  failedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C62828',
    marginBottom: 4,
  },
  failedSubtext: {
    fontSize: 13,
    color: '#AD1457',
  },
  actions: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  buttonPrimary: {
    backgroundColor: '#FF5A75',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonSecondaryText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '700',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
})

