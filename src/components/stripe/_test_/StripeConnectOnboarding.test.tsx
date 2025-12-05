import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StripeConnectOnboarding from '../StripeConnectOnboarding';


jest.mock('../../../api/stripe', () => ({
  stripeApi: {
    getAccountStatus: jest.fn(),
    createAccountLink: jest.fn(),
  },
}));


jest.mock('../../ui/sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('StripeConnectOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', () => {
    const { stripeApi } = require('../../../api/stripe');
    stripeApi.getAccountStatus.mockImplementation(() => new Promise(() => {})); 

    render(
      <TestWrapper>
        <StripeConnectOnboarding />
      </TestWrapper>
    );

    expect(screen.getByText('Carregando status da conta Stripe...')).toBeInTheDocument();
  });

  it('renders account setup when no account exists', async () => {
    const { stripeApi } = require('../../../api/stripe');
    stripeApi.getAccountStatus.mockResolvedValue({
      has_account: false,
    });

    render(
      <TestWrapper>
        <StripeConnectOnboarding />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Conecte sua conta Stripe')).toBeInTheDocument();
      expect(screen.getByText('Conectar Conta Stripe')).toBeInTheDocument();
    });
  });

  it('renders account status when account exists', async () => {
    const { stripeApi } = require('../../../api/stripe');
    stripeApi.getAccountStatus.mockResolvedValue({
      has_account: true,
      verification_status: 'enabled',
      charges_enabled: true,
      payouts_enabled: true,
    });

    render(
      <TestWrapper>
        <StripeConnectOnboarding />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Status da Conta:')).toBeInTheDocument();
      expect(screen.getByText('Ativo')).toBeInTheDocument();
    });
  });

  it('handles account link creation', async () => {
    const { stripeApi } = require('../../../api/stripe');
    stripeApi.getAccountStatus.mockResolvedValue({
      has_account: false,
    });
    stripeApi.createAccountLink.mockResolvedValue({
      url: 'https://connect.stripe.com/setup/test',
      expires_at: Date.now() + 3600000,
    });

    
    const mockOpen = jest.fn();
    Object.defineProperty(window, 'open', {
      value: mockOpen,
      writable: true,
    });

    render(
      <TestWrapper>
        <StripeConnectOnboarding />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Conectar Conta Stripe')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Conectar Conta Stripe'));

    await waitFor(() => {
      expect(stripeApi.createAccountLink).toHaveBeenCalled();
      expect(mockOpen).toHaveBeenCalledWith(
        'https://connect.stripe.com/setup/test',
        'stripe-onboarding',
        'width=800,height=600,scrollbars=yes,resizable=yes'
      );
    });
  });

  it('handles errors gracefully', async () => {
    const { stripeApi } = require('../../../api/stripe');
    stripeApi.getAccountStatus.mockRejectedValue(new Error('API Error'));

    const onError = jest.fn();

    render(
      <TestWrapper>
        <StripeConnectOnboarding onError={onError} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar status da conta Stripe')).toBeInTheDocument();
      expect(onError).toHaveBeenCalledWith('Erro ao carregar status da conta Stripe');
    });
  });
});
