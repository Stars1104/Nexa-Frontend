import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/components/ThemeProvider'
import Index from '../Index'

// Mock the logo imports
vi.mock('@/assets/light-logo.png', () => ({
  default: 'light-logo.png'
}))

vi.mock('@/assets/dark-logo.png', () => ({
  default: 'dark-logo.png'
}))

// Mock the hooks
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn()
}))

vi.mock('@/hooks/use-system-theme', () => ({
  useSystemTheme: () => false
}))

// Mock the components
vi.mock('@/components/brand/BrandSidebar', () => ({
  default: ({ setComponent }: { setComponent: (component: string) => void }) => (
    <div data-testid="brand-sidebar">
      <button onClick={() => setComponent('my campaigns')}>My Campaigns</button>
      <button onClick={() => setComponent('my account')}>My Account</button>
      <button onClick={() => setComponent('new campaign')}>New Campaign</button>
      <button onClick={() => setComponent('conversations')}>Conversations</button>
      <button onClick={() => setComponent('payment')}>Payment</button>
    </div>
  )
}))

vi.mock('@/components/brand/BrandDashboard', () => ({
  default: () => <div data-testid="brand-dashboard">Brand Dashboard Component</div>
}))

vi.mock('@/components/brand/BrandProfile', () => ({
  default: () => <div data-testid="brand-profile">Brand Profile Component</div>
}))

vi.mock('@/components/ComponentNavbar', () => ({
  default: () => <div data-testid="component-navbar">Component Navbar</div>
}))

vi.mock('@/pages/NotFound', () => ({
  default: () => <div data-testid="not-found">Not Found Component</div>
}))

// Mock ResizeObserver for Radix UI components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver for Radix UI components
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock react-router-dom
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal() as any
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Wrapper component for testing
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      {children}
    </ThemeProvider>
  </BrowserRouter>
)

describe('Brand Index', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the main layout structure', () => {
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      expect(screen.getByTestId('component-navbar')).toBeInTheDocument()
      expect(screen.getByTestId('brand-sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('brand-dashboard')).toBeInTheDocument()
    })

    it('renders with correct CSS classes for desktop layout', () => {
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      const mainContainer = screen.getByRole('main')
      expect(mainContainer).toHaveClass('flex-1', 'overflow-y-auto', 'bg-muted/50')
      expect(mainContainer).not.toHaveClass('pb-20')
    })

    it('renders with correct CSS classes for main container', () => {
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      const mainContainer = screen.getByRole('main')
      expect(mainContainer).toHaveClass('flex-1', 'overflow-y-auto', 'bg-muted/50')
    })

    it('renders the main container with correct structure', () => {
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      const container = screen.getByRole('main').parentElement?.parentElement
      expect(container).toHaveClass('flex', 'h-screen', 'bg-background', 'text-foreground')
    })
  })

  describe('Component Switching', () => {
    it('renders BrandDashboard by default', () => {
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      expect(screen.getByTestId('brand-dashboard')).toBeInTheDocument()
      expect(screen.queryByTestId('brand-profile')).not.toBeInTheDocument()
      expect(screen.queryByTestId('not-found')).not.toBeInTheDocument()
    })

    it('switches to BrandProfile when "my account" is selected', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // Initially shows dashboard
      expect(screen.getByTestId('brand-dashboard')).toBeInTheDocument()

      // Click on "My Account" button in sidebar
      const myAccountButton = screen.getByText('My Account')
      await user.click(myAccountButton)

      // Should now show profile
      expect(screen.getByTestId('brand-profile')).toBeInTheDocument()
      expect(screen.queryByTestId('brand-dashboard')).not.toBeInTheDocument()
    })

    it('switches back to BrandDashboard when "my campaigns" is selected', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // Switch to profile first
      const myAccountButton = screen.getByText('My Account')
      await user.click(myAccountButton)
      expect(screen.getByTestId('brand-profile')).toBeInTheDocument()

      // Switch back to dashboard
      const myCampaignsButton = screen.getByText('My Campaigns')
      await user.click(myCampaignsButton)

      // Should show dashboard again
      expect(screen.getByTestId('brand-dashboard')).toBeInTheDocument()
      expect(screen.queryByTestId('brand-profile')).not.toBeInTheDocument()
    })

    it('shows NotFound component for unknown component types', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // Click on "New Campaign" button (unknown component)
      const newCampaignButton = screen.getByText('New Campaign')
      await user.click(newCampaignButton)

      // Should show NotFound component
      expect(screen.getByTestId('not-found')).toBeInTheDocument()
      expect(screen.queryByTestId('brand-dashboard')).not.toBeInTheDocument()
      expect(screen.queryByTestId('brand-profile')).not.toBeInTheDocument()
    })

    it('shows NotFound component for conversations component', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // Click on "Conversations" button
      const conversationsButton = screen.getByText('Conversations')
      await user.click(conversationsButton)

      // Should show NotFound component
      expect(screen.getByTestId('not-found')).toBeInTheDocument()
    })

    it('shows NotFound component for payment component', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // Click on "Payment" button
      const paymentButton = screen.getByText('Payment')
      await user.click(paymentButton)

      // Should show NotFound component
      expect(screen.getByTestId('not-found')).toBeInTheDocument()
    })
  })



  describe('State Management', () => {
    it('maintains component state when switching between components', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // Start with dashboard
      expect(screen.getByTestId('brand-dashboard')).toBeInTheDocument()

      // Switch to profile
      const myAccountButton = screen.getByText('My Account')
      await user.click(myAccountButton)
      expect(screen.getByTestId('brand-profile')).toBeInTheDocument()

      // Switch to unknown component
      const newCampaignButton = screen.getByText('New Campaign')
      await user.click(newCampaignButton)
      expect(screen.getByTestId('not-found')).toBeInTheDocument()

      // Switch back to dashboard
      const myCampaignsButton = screen.getByText('My Campaigns')
      await user.click(myCampaignsButton)
      expect(screen.getByTestId('brand-dashboard')).toBeInTheDocument()
    })

    it('handles multiple rapid component switches', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // Rapidly switch between components
      await user.click(screen.getByText('My Account'))
      await user.click(screen.getByText('My Campaigns'))
      await user.click(screen.getByText('New Campaign'))
      await user.click(screen.getByText('My Account'))

      // Should end up on profile
      expect(screen.getByTestId('brand-profile')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('maintains focus management during component switches', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // Focus on a button and switch components
      const myAccountButton = screen.getByText('My Account')
      myAccountButton.focus()
      await user.click(myAccountButton)

      // Component should still be accessible
      expect(screen.getByTestId('brand-profile')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('gracefully handles unknown component types', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // Try to switch to an unknown component
      const newCampaignButton = screen.getByText('New Campaign')
      await user.click(newCampaignButton)

      // Should show NotFound instead of crashing
      expect(screen.getByTestId('not-found')).toBeInTheDocument()
    })

    it('maintains functionality after error state', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // Go to error state
      await user.click(screen.getByText('New Campaign'))
      expect(screen.getByTestId('not-found')).toBeInTheDocument()

      // Should be able to recover
      await user.click(screen.getByText('My Campaigns'))
      expect(screen.getByTestId('brand-dashboard')).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('integrates properly with ThemeProvider', () => {
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      // Should render without theme-related errors
      expect(screen.getByTestId('brand-dashboard')).toBeInTheDocument()
    })

    it('integrates properly with ComponentNavbar', () => {
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      expect(screen.getByTestId('component-navbar')).toBeInTheDocument()
    })

    it('integrates properly with BrandSidebar', () => {
      render(
        <TestWrapper>
          <Index />
        </TestWrapper>
      )

      expect(screen.getByTestId('brand-sidebar')).toBeInTheDocument()
    })
  })
}) 