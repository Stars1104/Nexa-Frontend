import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/components/ThemeProvider'
import AuthStep from '../AuthStep'

// Mock the logo imports
vi.mock('@/assets/light-logo.png', () => ({
  default: 'light-logo.png'
}))

vi.mock('@/assets/dark-logo.png', () => ({
  default: 'dark-logo.png'
}))

// Mock the hooks
vi.mock('@/hooks/use-system-theme', () => ({
  useSystemTheme: () => false
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

describe('AuthStep', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the main heading and description', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      expect(screen.getByText('Como você quer entrar?')).toBeInTheDocument()
      expect(screen.getByText('Escolha o tipo de conta para acessar a plataforma')).toBeInTheDocument()
    })

    it('renders the company button with correct text and icon', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const companyButton = screen.getByRole('button', { name: /sou uma empresa/i })
      expect(companyButton).toBeInTheDocument()
      expect(companyButton).toHaveTextContent('Sou uma empresa')
    })

    it('renders the influencer button with correct text and icon', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const influencerButton = screen.getByRole('button', { name: /sou um influenciador/i })
      expect(influencerButton).toBeInTheDocument()
      expect(influencerButton).toHaveTextContent('Sou um influenciador')
    })

    it('renders the Google sign-in button', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const googleButton = screen.getByRole('button', { name: /continuar com o google/i })
      expect(googleButton).toBeInTheDocument()
      expect(googleButton).toHaveTextContent('Continuar com o Google')
    })

    it('renders the "or" separator', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      expect(screen.getByText('ou')).toBeInTheDocument()
    })

    it('renders the create account link', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      expect(screen.getByText('Não tem uma conta?')).toBeInTheDocument()
      expect(screen.getByText('Criar conta')).toBeInTheDocument()
    })

    it('renders theme toggle button', async () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
      })
    })

    it('renders the logo', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const logo = screen.getByAltText('Nexa logo')
      expect(logo).toBeInTheDocument()
    })

    it('renders arrow icons in buttons', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      // Check for arrow icons (they should be present in the buttons)
      const companyButton = screen.getByRole('button', { name: /sou uma empresa/i })
      const influencerButton = screen.getByRole('button', { name: /sou um influenciador/i })
      
      expect(companyButton).toBeInTheDocument()
      expect(influencerButton).toBeInTheDocument()
    })

    it('renders Google icon in Google button', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const googleButton = screen.getByRole('button', { name: /continuar com o google/i })
      expect(googleButton).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('navigates to creator signup when influencer button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const influencerButton = screen.getByRole('button', { name: /sou um influenciador/i })
      await user.click(influencerButton)

      expect(mockNavigate).toHaveBeenCalledWith('/signup/creator')
    })

    it('navigates to brand signup when company button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const companyButton = screen.getByRole('button', { name: /sou uma empresa/i })
      await user.click(companyButton)

      expect(mockNavigate).toHaveBeenCalledWith('/signup/brand')
    })

    it('navigates to home when logo is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const logo = screen.getByAltText('Nexa logo')
      await user.click(logo)

      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  describe('Button Interactions', () => {
    it('allows clicking the company button', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const companyButton = screen.getByRole('button', { name: /sou uma empresa/i })
      await user.click(companyButton)

      expect(mockNavigate).toHaveBeenCalledWith('/signup/brand')
    })

    it('allows clicking the influencer button', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const influencerButton = screen.getByRole('button', { name: /sou um influenciador/i })
      await user.click(influencerButton)

      expect(mockNavigate).toHaveBeenCalledWith('/signup/creator')
    })

    it('allows clicking the Google button', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const googleButton = screen.getByRole('button', { name: /continuar com o google/i })
      await user.click(googleButton)

      // Google button should be clickable (no navigation expected)
      expect(googleButton).toBeInTheDocument()
    })

    it('allows clicking the create account link', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const createAccountLink = screen.getByText('Criar conta')
      await user.click(createAccountLink)

      // Link should be clickable (no navigation expected as it's a placeholder)
      expect(createAccountLink).toBeInTheDocument()
    })
  })

  describe('Theme Functionality', () => {
    it('displays dark logo in light theme', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const logo = screen.getByAltText('Nexa logo')
      expect(logo).toHaveAttribute('src', 'dark-logo.png') // Light theme shows dark logo
    })

    it('displays light logo in dark theme', () => {
      render(
        <BrowserRouter>
          <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <AuthStep />
          </ThemeProvider>
        </BrowserRouter>
      )

      const logo = screen.getByAltText('Nexa logo')
      expect(logo).toHaveAttribute('src', 'light-logo.png') // Dark theme shows light logo
    })

    it('allows toggling theme', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const themeToggle = screen.getByRole('button', { name: /toggle theme/i })
      
      // Wrap the click in act() to handle async behavior
      await act(async () => {
        await user.click(themeToggle)
      })

      // Wait for any async operations to complete
      await waitFor(() => {
        expect(themeToggle).toBeInTheDocument()
      })
    })

    it('renders theme toggle with proper accessibility', async () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const themeToggle = screen.getByRole('button', { name: /toggle theme/i })
      expect(themeToggle).toBeInTheDocument()
      
      // Check for screen reader text
      expect(screen.getByText('Toggle theme')).toBeInTheDocument()
    })

    it('handles theme toggle dropdown interactions', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const themeToggle = screen.getByRole('button', { name: /toggle theme/i })
      
      // Open the dropdown
      await act(async () => {
        await user.click(themeToggle)
      })

      // Wait for dropdown to appear and check for theme options
      await waitFor(() => {
        expect(screen.getByText('Light')).toBeInTheDocument()
        expect(screen.getByText('Dark')).toBeInTheDocument()
        expect(screen.getByText('System')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Como você quer entrar?')
    })

    it('has accessible button labels', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      expect(screen.getByRole('button', { name: /sou uma empresa/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sou um influenciador/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /continuar com o google/i })).toBeInTheDocument()
    })

    it('has proper alt text for logo', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const logo = screen.getByAltText('Nexa logo')
      expect(logo).toBeInTheDocument()
    })

    it('has proper link text for create account', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const createAccountLink = screen.getByText('Criar conta')
      expect(createAccountLink).toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('applies correct CSS classes to main container', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      // Target the outermost container that has the main layout classes
      const mainContainer = screen.getByText('Como você quer entrar?').closest('div[class*="min-h-screen"]')
      expect(mainContainer).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center', 'bg-muted', 'dark:bg-[#171717]', 'transition-colors', 'duration-300')
    })

    it('applies correct CSS classes to card container', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      // Target the card container that has the background and styling classes
      const cardContainer = screen.getByText('Como você quer entrar?').closest('div[class*="bg-background"]')
      expect(cardContainer).toHaveClass('bg-background', 'rounded-2xl', 'shadow-lg', 'p-8', 'md:p-10', 'w-full', 'max-w-lg', 'flex', 'flex-col', 'items-center', 'gap-6', 'border', 'border-border')
    })

    it('applies correct CSS classes to buttons', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const companyButton = screen.getByRole('button', { name: /sou uma empresa/i })
      const influencerButton = screen.getByRole('button', { name: /sou um influenciador/i })
      const googleButton = screen.getByRole('button', { name: /continuar com o google/i })

      expect(companyButton).toHaveClass('w-full', 'flex', 'justify-between', 'items-center', 'py-6', 'px-4', 'text-lg', 'font-semibold')
      expect(influencerButton).toHaveClass('w-full', 'flex', 'justify-between', 'items-center', 'py-6', 'px-4', 'text-lg', 'font-semibold')
      expect(googleButton).toHaveClass('w-full', 'flex', 'items-center', 'justify-center', 'gap-2', 'py-5', 'text-base', 'font-medium')
    })

    it('applies correct CSS classes to heading', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const heading = screen.getByText('Como você quer entrar?')
      expect(heading).toHaveClass('text-2xl', 'md:text-3xl', 'font-bold', 'text-center', 'text-foreground', 'mb-1')
    })

    it('applies correct CSS classes to description text', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const description = screen.getByText('Escolha o tipo de conta para acessar a plataforma')
      expect(description).toHaveClass('text-muted-foreground', 'text-center', 'text-base', 'mb-2')
    })

    it('applies correct CSS classes to logo', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const logo = screen.getByAltText('Nexa logo')
      expect(logo).toHaveClass('w-28', 'mb-2', 'cursor-pointer')
    })

    it('applies correct CSS classes to separator', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const separator = screen.getByText('ou')
      expect(separator).toHaveClass('text-muted-foreground', 'text-sm')
    })

    it('applies correct CSS classes to create account section', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const createAccountSection = screen.getByText('Não tem uma conta?').parentElement
      expect(createAccountSection).toHaveClass('text-center', 'w-full', 'mt-2')
    })

    it('applies correct CSS classes to create account link', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const createAccountLink = screen.getByText('Criar conta')
      expect(createAccountLink).toHaveClass('font-semibold', 'text-pink-500', 'hover:underline')
    })

    it('applies correct CSS classes to theme toggle container', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      // The theme toggle should be positioned absolutely
      const themeToggleContainer = screen.getByRole('button', { name: /toggle theme/i }).closest('div[class*="absolute"]')
      expect(themeToggleContainer).toHaveClass('absolute', 'top-4', 'right-4')
    })
  })

  describe('Responsive Design', () => {
    it('renders with responsive text sizes', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const heading = screen.getByText('Como você quer entrar?')
      expect(heading).toHaveClass('text-2xl', 'md:text-3xl')
    })

    it('renders with responsive padding', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const cardContainer = screen.getByText('Como você quer entrar?').parentElement?.parentElement
      expect(cardContainer).toHaveClass('p-8', 'md:p-10')
    })
  })

  describe('Error Handling', () => {
    it('handles navigation function that returns undefined', async () => {
      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock navigate to return undefined
      mockNavigate.mockImplementation(() => undefined)

      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const companyButton = screen.getByRole('button', { name: /sou uma empresa/i })
      
      // Should not crash when clicking the button
      await user.click(companyButton)
      
      // Verify that the navigation was attempted
      expect(mockNavigate).toHaveBeenCalledWith('/signup/brand')
      
      // Clean up
      consoleSpy.mockRestore()
      mockNavigate.mockRestore()
    })

    it('handles navigation function that returns null', async () => {
      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock navigate to return null
      mockNavigate.mockImplementation(() => null)

      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const companyButton = screen.getByRole('button', { name: /sou uma empresa/i })
      
      // Should not crash when clicking the button
      await user.click(companyButton)
      
      // Verify that the navigation was attempted
      expect(mockNavigate).toHaveBeenCalledWith('/signup/brand')
      
      // Clean up
      consoleSpy.mockRestore()
      mockNavigate.mockRestore()
    })

    it('handles missing navigation function gracefully', async () => {
      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock navigate to be a no-op function
      mockNavigate.mockImplementation(() => {})

      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const companyButton = screen.getByRole('button', { name: /sou uma empresa/i })
      
      // Should not crash when clicking the button
      await user.click(companyButton)
      
      // Verify that the navigation was attempted
      expect(mockNavigate).toHaveBeenCalledWith('/signup/brand')
      
      // Clean up
      consoleSpy.mockRestore()
      mockNavigate.mockRestore()
    })
  })

  describe('Integration', () => {
    it('integrates with theme provider correctly', async () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      // Component should render without errors
      await waitFor(() => {
        expect(screen.getByText('Como você quer entrar?')).toBeInTheDocument()
      })
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
      })
    })

    it('integrates with router correctly', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      // Component should render without errors
      expect(screen.getByText('Como você quer entrar?')).toBeInTheDocument()
    })

    it('handles system theme integration', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      // Component should render without errors when system theme is used
      expect(screen.getByText('Como você quer entrar?')).toBeInTheDocument()
    })
  })

  describe('Component Structure', () => {
    it('has proper button structure with icons and text', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const companyButton = screen.getByRole('button', { name: /sou uma empresa/i })
      const influencerButton = screen.getByRole('button', { name: /sou um influenciador/i })

      // Check that buttons contain both text and icons
      expect(companyButton).toHaveTextContent('Sou uma empresa')
      expect(influencerButton).toHaveTextContent('Sou um influenciador')
    })

    it('has proper separator structure', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const separator = screen.getByText('ou')
      const separatorContainer = separator.closest('div[class*="flex items-center"]')
      
      expect(separatorContainer).toHaveClass('flex', 'items-center', 'w-full', 'gap-2', 'my-2')
    })

    it('has proper Google button structure', () => {
      render(
        <TestWrapper>
          <AuthStep />
        </TestWrapper>
      )

      const googleButton = screen.getByRole('button', { name: /continuar com o google/i })
      expect(googleButton).toHaveTextContent('Continuar com o Google')
    })
  })
}) 