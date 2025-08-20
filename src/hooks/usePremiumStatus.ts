import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/services/apiClient'
import { useToast } from '../hooks/use-toast'

interface PremiumStatus {
  has_premium: boolean
  premium_expires_at?: string
  is_premium_active: boolean
  days_remaining: number
}

export const usePremiumStatus = () => {
  const [premiumStatus, setPremiumStatus] = useState<PremiumStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const checkPremiumStatus = useCallback(async () => {
    // Check if user is authenticated before making API call
    const token = localStorage.getItem('token');
    if (!token) {
      setPremiumStatus(null);
      setLoading(false);
      return null;
    }

    try {
      setLoading(true)
      const response = await apiClient.get('/payment/subscription-status')
      const status = response.data
      setPremiumStatus(status)
      return status
    } catch (error: any) {
      console.error('Error checking premium status:', error)
      
      // Handle 401 errors specifically - user is not authenticated
      if (error.response?.status === 401) {
        setPremiumStatus(null);
      } else {
        toast({
          title: "Erro",
          description: "Falha ao verificar status premium",
          variant: "destructive",
        })
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [toast])

  const refreshPremiumStatus = useCallback(async () => {
    return await checkPremiumStatus()
  }, [checkPremiumStatus])

  useEffect(() => {
    // Only check premium status if user is authenticated
    const token = localStorage.getItem('token');
    if (token) {
      checkPremiumStatus()
    } else {
      setLoading(false);
    }
  }, [checkPremiumStatus])

  // Listen for custom events to refresh premium status
  useEffect(() => {
    const handlePremiumUpdate = () => {
      refreshPremiumStatus()
    }

    window.addEventListener('premium-status-updated', handlePremiumUpdate)
    
    return () => {
      window.removeEventListener('premium-status-updated', handlePremiumUpdate)
    }
  }, [refreshPremiumStatus])

  return {
    premiumStatus,
    loading,
    refreshPremiumStatus,
    hasPremium: premiumStatus?.has_premium || false,
    isPremiumActive: premiumStatus?.is_premium_active || false
  }
} 