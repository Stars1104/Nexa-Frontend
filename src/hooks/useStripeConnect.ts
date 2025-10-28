import { useState, useEffect } from 'react';
import { stripeApi, StripeAccountStatus } from '../api/stripe';

export const useStripeConnect = () => {
  const [accountStatus, setAccountStatus] = useState<StripeAccountStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAccountStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await stripeApi.getAccountStatus();
      setAccountStatus(status);
      return status;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao carregar status da conta Stripe';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createAccountLink = async () => {
    try {
      setError(null);
      const accountLink = await stripeApi.createAccountLink();
      return accountLink;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao criar link de onboarding';
      setError(errorMessage);
      throw err;
    }
  };

  const isAccountReady = () => {
    return accountStatus?.has_account && 
           accountStatus?.verification_status === 'enabled' &&
           accountStatus?.charges_enabled &&
           accountStatus?.payouts_enabled;
  };

  const needsOnboarding = () => {
    return !accountStatus?.has_account || 
           accountStatus?.verification_status !== 'enabled' ||
           !accountStatus?.charges_enabled ||
           !accountStatus?.payouts_enabled;
  };

  const getStatusMessage = () => {
    if (!accountStatus?.has_account) {
      return 'Conta Stripe não configurada';
    }

    if (accountStatus.verification_status === 'pending') {
      return 'Aguardando verificação da conta';
    }

    if (accountStatus.verification_status === 'restricted') {
      return 'Conta restrita - ação necessária';
    }

    if (accountStatus.verification_status === 'disabled') {
      return 'Conta desabilitada';
    }

    if (!accountStatus.charges_enabled) {
      return 'Pagamentos não habilitados';
    }

    if (!accountStatus.payouts_enabled) {
      return 'Saques não habilitados';
    }

    return 'Conta configurada e ativa';
  };

  useEffect(() => {
    loadAccountStatus();
  }, []);

  return {
    accountStatus,
    isLoading,
    error,
    loadAccountStatus,
    createAccountLink,
    isAccountReady,
    needsOnboarding,
    getStatusMessage,
  };
};
