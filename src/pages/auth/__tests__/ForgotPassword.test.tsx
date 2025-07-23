import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/components/ThemeProvider'
import ForgotPassword from '../ForgotPassword'

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

describe('ForgotPassword', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('renders the main heading and description', () => {
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      expect(screen.getByText('Esqueceu sua senha?')).toBeInTheDocument()
      expect(screen.getByText(/Não se preocupe, isso acontece com todo mundo/)).toBeInTheDocument()
      expect(screen.getByText(/Digite seu email e enviaremos um link para redefinir sua senha/)).toBeInTheDocument()
    })

    it('renders the email input field with correct attributes', () => {
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText('Email')
      expect(emailInput).toBeInTheDocument()
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('required')
      expect(emailInput).toHaveAttribute('autoComplete', 'email')
      expect(emailInput).toHaveAttribute('placeholder', 'seu@email.com')
    })

    it('renders the submit button with correct text', () => {
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      const submitButton = screen.getByRole('button', { name: 'Enviar' })
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('renders the login link', () => {
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      expect(screen.getByText('Lembrou sua senha?')).toBeInTheDocument()
      expect(screen.getByText('Entrar')).toBeInTheDocument()
    })

    it('renders the logo', () => {
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      const logo = screen.getByAltText('Nexa Logo')
      expect(logo).toBeInTheDocument()
    })

    it('renders theme toggle button', async () => {
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
      })
    })
  })

  describe('Form Interactions', () => {
    it('updates email input value when user types', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText('Email')
      await user.type(emailInput, 'test@example.com')

      expect(emailInput).toHaveValue('test@example.com')
    })

    it('submits form with email value', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText('Email')
      const submitButton = screen.getByRole('button', { name: 'Enviar' })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      // Check that the success message appears
      expect(screen.getByText(/Um email foi enviado para você com um link para redefinir sua senha/)).toBeInTheDocument()
      expect(screen.getByText(/Verifique sua caixa de entrada \(e pasta de spam\)/)).toBeInTheDocument()
    })

    it('shows success message after form submission', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText('Email')
      const submitButton = screen.getByRole('button', { name: 'Enviar' })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      // Verify success state
      expect(screen.getByText(/Um email foi enviado para você com um link para redefinir sua senha/)).toBeInTheDocument()
      expect(screen.getByText('Para voltar')).toBeInTheDocument()
      
      // Verify that form elements are no longer visible
      expect(screen.queryByText('Esqueceu sua senha?')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Enviar' })).not.toBeInTheDocument()
    })

    it('requires email input before submission', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      const submitButton = screen.getByRole('button', { name: 'Enviar' })
      await user.click(submitButton)

      // Form should not submit without email (HTML5 validation)
      expect(screen.queryByText(/Um email foi enviado para você/)).not.toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('navigates to home when logo is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      const logo = screen.getByAltText('Nexa Logo')
      await user.click(logo)

      expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('navigates to auth page when "Para voltar" is clicked after submission', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      // Submit the form first
      const emailInput = screen.getByLabelText('Email')
      const submitButton = screen.getByRole('button', { name: 'Enviar' })
      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      // Click "Para voltar"
      const goBackLink = screen.getByText('Para voltar')
      await user.click(goBackLink)

      expect(mockNavigate).toHaveBeenCalledWith('/auth')
    })

    it('navigates to auth page when login link is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      const loginLink = screen.getByText('Entrar')
      await user.click(loginLink)

      // Since we're using Link component, we need to check if it has the correct href
      expect(loginLink).toHaveAttribute('href', '/auth')
    })
  })

  describe('Accessibility', () => {
    it('has proper form labels and associations', () => {
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText('Email')
      expect(emailInput).toHaveAttribute('id', 'email')
    })

    it('has proper button types', () => {
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      const submitButton = screen.getByRole('button', { name: 'Enviar' })
      expect(submitButton).toHaveAttribute('type', 'submit')
    })

    it('has proper focus management', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText('Email')
      await user.click(emailInput)
      
      expect(emailInput).toHaveFocus()
    })
  })

  describe('Theme Integration', () => {
    it('renders with light theme by default', () => {
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      // Check that dark logo is shown (for light theme)
      const logo = screen.getByAltText('Nexa Logo')
      expect(logo).toHaveAttribute('src', 'dark-logo.png')
    })

    it('renders theme toggle button', async () => {
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles form submission gracefully', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText('Email')
      const submitButton = screen.getByRole('button', { name: 'Enviar' })

      await user.type(emailInput, 'invalid-email')
      await user.click(submitButton)

      // Should still show the form (HTML5 validation will prevent submission)
      expect(screen.getByText('Esqueceu sua senha?')).toBeInTheDocument()
    })
  })

  describe('State Management', () => {
    it('maintains email state during typing', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText('Email')
      
      await user.type(emailInput, 'test')
      expect(emailInput).toHaveValue('test')
      
      await user.type(emailInput, '@example.com')
      expect(emailInput).toHaveValue('test@example.com')
    })

    it('clears form after successful submission', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <ForgotPassword />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText('Email')
      const submitButton = screen.getByRole('button', { name: 'Enviar' })

      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)

      // Form should be replaced with success message
      expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
      expect(screen.getByText(/Um email foi enviado para você/)).toBeInTheDocument()
    })
  })
}) 