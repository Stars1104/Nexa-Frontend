import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/components/ThemeProvider'
import CreatorSignUp from '../CreatorSignUp'

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
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ role: 'creator' })
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

// Helper function to find the signin toggle button
const findSignInToggleButton = () => {
  const toggleButtons = screen.getAllByRole('button')
  return toggleButtons.find(button => 
    button.textContent === 'Entrar' && 
    button.closest('div')?.className?.includes('border') &&
    button.closest('div')?.className?.includes('rounded-full')
  )
}

// Helper function to find the signup toggle button
const findSignUpToggleButton = () => {
  const toggleButtons = screen.getAllByRole('button')
  return toggleButtons.find(button => 
    button.textContent === 'Cadastrar' && 
    button.closest('div')?.className?.includes('border') &&
    button.closest('div')?.className?.includes('rounded-full')
  )
}

describe('CreatorSignUp', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the signup form by default', () => {
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      expect(screen.getByText('Registrar')).toBeInTheDocument()
      expect(screen.getByText('Crie sua conta para começar')).toBeInTheDocument()
      expect(screen.getByLabelText('Nome')).toBeInTheDocument()
      expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
      expect(screen.getByLabelText('WhatsApp')).toBeInTheDocument()
      expect(screen.getByLabelText('Senha')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirmar Senha')).toBeInTheDocument()
    })

    it('renders the student checkbox when role is creator', () => {
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      expect(screen.getByText('Sou um aluno e quero verificar meu status')).toBeInTheDocument()
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('renders theme toggle button', () => {
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
    })

    it('renders the logo', () => {
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      const logo = screen.getByAltText('Nexa logo')
      expect(logo).toBeInTheDocument()
    })
  })

  describe('Form Interactions', () => {
    it('allows typing in form fields', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      const nameInput = screen.getByLabelText('Nome')
      const emailInput = screen.getByLabelText('E-mail')
      const whatsappInput = screen.getByLabelText('WhatsApp')
      const passwordInput = screen.getByLabelText('Senha')
      const confirmPasswordInput = screen.getByLabelText('Confirmar Senha')

      await user.type(nameInput, 'João Silva')
      await user.type(emailInput, 'joao@example.com')
      await user.type(whatsappInput, '(11) 99999-9999')
      await user.type(passwordInput, 'Password123!')
      await user.type(confirmPasswordInput, 'Password123!')

      expect(nameInput).toHaveValue('João Silva')
      expect(emailInput).toHaveValue('joao@example.com')
      expect(whatsappInput).toHaveValue('(11) 99999-9999')
      expect(passwordInput).toHaveValue('Password123!')
      expect(confirmPasswordInput).toHaveValue('Password123!')
    })

    it('allows toggling the student checkbox', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).not.toBeChecked()

      await user.click(checkbox)
      expect(checkbox).toBeChecked()

      await user.click(checkbox)
      expect(checkbox).not.toBeChecked()
    })
  })

  describe('Form Validation', () => {
    it('shows validation error for required name field', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      const nameInput = screen.getByLabelText('Nome')
      // Type something and then clear it to trigger validation
      await user.type(nameInput, 'a')
      await user.clear(nameInput)
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument()
      })
    })

    it('shows validation error for name with less than 5 characters', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      const nameInput = screen.getByLabelText('Nome')
      await user.type(nameInput, 'João')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Nome deve ter pelo menos 5 caracteres')).toBeInTheDocument()
      })
    })

    it('shows validation error for name without space', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      const nameInput = screen.getByLabelText('Nome')
      await user.type(nameInput, 'JoãoSilva')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Nome deve conter pelo menos um espaço')).toBeInTheDocument()
      })
    })

    it('shows validation error for invalid email', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      const emailInput = screen.getByLabelText('E-mail')
      await user.type(emailInput, 'invalid-email')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('E-mail deve conter o símbolo @')).toBeInTheDocument()
      })
    })

    it('shows validation error for weak password', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      const passwordInput = screen.getByLabelText('Senha')
      await user.type(passwordInput, 'weak')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais')).toBeInTheDocument()
      })
    })

    it('shows validation error for mismatched passwords', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      const passwordInput = screen.getByLabelText('Senha')
      const confirmPasswordInput = screen.getByLabelText('Confirmar Senha')
      
      await user.type(passwordInput, 'Password123!')
      await user.type(confirmPasswordInput, 'DifferentPassword123!')
      await user.tab()

      await waitFor(() => {
        expect(screen.getByText('Senhas não coincidem')).toBeInTheDocument()
      })
    })
  })

  describe('Form Submission', () => {
    it('submits form with correct data and navigates to student verify when student checkbox is checked', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      // Fill out the form with valid data
      await user.type(screen.getByLabelText('Nome'), 'João Silva')
      await user.type(screen.getByLabelText('E-mail'), 'joao@example.com')
      await user.type(screen.getByLabelText('WhatsApp'), '(11) 99999-9999')
      await user.type(screen.getByLabelText('Senha'), 'Password123!')
      await user.type(screen.getByLabelText('Confirmar Senha'), 'Password123!')
      await user.click(screen.getByRole('checkbox'))

      // Submit the form
      const form = screen.getByLabelText('Nome').closest('form')
      const submitButton = form?.querySelector('button[type="submit"]')
      expect(submitButton).toBeInTheDocument()
      await user.click(submitButton!)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/student-verify')
      })
    })

    it('submits form without student checkbox and navigates to creator dashboard', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      // Fill out the form without checking student checkbox
      await user.type(screen.getByLabelText('Nome'), 'Maria Silva')
      await user.type(screen.getByLabelText('E-mail'), 'maria@example.com')
      await user.type(screen.getByLabelText('WhatsApp'), '(11) 88888-8888')
      await user.type(screen.getByLabelText('Senha'), 'Password456!')
      await user.type(screen.getByLabelText('Confirmar Senha'), 'Password456!')

      // Submit the form
      const form = screen.getByLabelText('Nome').closest('form')
      const submitButton = form?.querySelector('button[type="submit"]')
      expect(submitButton).toBeInTheDocument()
      await user.click(submitButton!)

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/creator/dashboard')
      })
    })
  })

  describe('Auth Type Toggle', () => {
    it('switches to signin form when signin button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      // Initially shows signup form
      expect(screen.getByText('Registrar')).toBeInTheDocument()
      expect(screen.getByText('Crie sua conta para começar')).toBeInTheDocument()

      // Click signin button (the toggle button, not the link)
      const signInToggleButton = findSignInToggleButton()
      expect(signInToggleButton).toBeInTheDocument()
      await user.click(signInToggleButton!)

      // Should now show signin form
      expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument()
      expect(screen.getByText('Entre na sua conta')).toBeInTheDocument()
      // Check for the submit button specifically
      const emailInput = screen.getByLabelText('E-mail')
      const form = emailInput.closest('form')
      const submitButton = form?.querySelector('button[type="submit"]')
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toHaveTextContent('Entrar')
    })

    it('switches back to signup form when signup button is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      // Switch to signin first
      const signInToggleButton = findSignInToggleButton()
      expect(signInToggleButton).toBeInTheDocument()
      await user.click(signInToggleButton!)
      expect(screen.getByText('Entre na sua conta')).toBeInTheDocument()

      // Switch back to signup
      const signUpToggleButton = findSignUpToggleButton()
      expect(signUpToggleButton).toBeInTheDocument()
      await user.click(signUpToggleButton!)
      expect(screen.getByText('Crie sua conta para começar')).toBeInTheDocument()
    })
  })

  describe('Signin Form', () => {
    it('renders signin form fields', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      // Switch to signin
      const signInToggleButton = findSignInToggleButton()
      expect(signInToggleButton).toBeInTheDocument()
      await user.click(signInToggleButton!)

      expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
      expect(screen.getByLabelText('Senha')).toBeInTheDocument()
      expect(screen.getByText('Lembrar-me')).toBeInTheDocument()
      expect(screen.getByText('Esqueceu a senha?')).toBeInTheDocument()
    })

    it('submits signin form and navigates to creator dashboard', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      // Switch to signin
      const signInToggleButton = findSignInToggleButton()
      expect(signInToggleButton).toBeInTheDocument()
      await user.click(signInToggleButton!)

      // Fill out signin form
      await user.type(screen.getByLabelText('E-mail'), 'test@example.com')
      await user.type(screen.getByLabelText('Senha'), 'password123')

      // Submit the form by finding the submit button within the form
      const form = screen.getByDisplayValue('test@example.com').closest('form')
      expect(form).toBeInTheDocument()
      const submitButton = form?.querySelector('button[type="submit"]')
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toHaveTextContent('Entrar')
      
      // Click the submit button
      await user.click(submitButton!)

      // Wait for navigation to be called
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/creator/dashboard')
      }, { timeout: 3000 })
    })

    it('navigates to forgot password page when clicked', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      // Switch to signin
      const signInToggleButton = findSignInToggleButton()
      expect(signInToggleButton).toBeInTheDocument()
      await user.click(signInToggleButton!)

      // Click forgot password link
      await user.click(screen.getByText('Esqueceu a senha?'))

      expect(mockNavigate).toHaveBeenCalledWith('/forgot-password')
    })
  })

  describe('Navigation Links', () => {
    it('has working "Entrar" link in signup form', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      // Find the specific "Entrar" link in the signup form by looking for the container with "Já tem uma conta?"
      const container = screen.getByText('Já tem uma conta?').closest('div')
      const signInLink = container?.querySelector('div[class*="font-semibold text-pink-500"]')
      expect(signInLink).toBeInTheDocument()
      expect(signInLink).toHaveTextContent('Entrar')
      await user.click(signInLink!)

      expect(screen.getByText('Entre na sua conta')).toBeInTheDocument()
    })

    it('has working "Criar conta" link in signin form', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      // Switch to signin first
      const signInToggleButton = findSignInToggleButton()
      expect(signInToggleButton).toBeInTheDocument()
      await user.click(signInToggleButton!)

      // Find the specific "Criar conta" link in the signin form
      const container = screen.getByText('Não tem uma conta?').closest('div')
      const createAccountLink = container?.querySelector('div[class*="font-semibold text-pink-500"]')
      expect(createAccountLink).toBeInTheDocument()
      expect(createAccountLink).toHaveTextContent('Criar conta')
      await user.click(createAccountLink!)

      expect(screen.getByText('Crie sua conta para começar')).toBeInTheDocument()
    })

    it('navigates to home page when logo is clicked', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      const logo = screen.getByAltText('Nexa logo')
      await user.click(logo)

      expect(mockNavigate).toHaveBeenCalledWith('/')
    })
  })

  describe('Google OAuth Buttons', () => {
    it('renders Google OAuth button in signup form', () => {
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      expect(screen.getByText('Continuar com o Google')).toBeInTheDocument()
    })

    it('renders Google OAuth button in signin form', async () => {
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      // Switch to signin
      const signInToggleButton = findSignInToggleButton()
      expect(signInToggleButton).toBeInTheDocument()
      await user.click(signInToggleButton!)

      expect(screen.getByText('Continuar com o Google')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      expect(screen.getByLabelText('Nome')).toBeInTheDocument()
      expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
      expect(screen.getByLabelText('WhatsApp')).toBeInTheDocument()
      expect(screen.getByLabelText('Senha')).toBeInTheDocument()
      expect(screen.getByLabelText('Confirmar Senha')).toBeInTheDocument()
    })

    it('has proper button roles', () => {
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      // Check for the submit button specifically
      const form = screen.getByLabelText('Nome').closest('form')
      const submitButton = form?.querySelector('button[type="submit"]')
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toHaveTextContent('Criar conta')
      expect(screen.getByRole('button', { name: 'Continuar com o Google' })).toBeInTheDocument()
    })

    it('has proper form structure with form element', () => {
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      // Check for form element by finding an input and getting its parent form
      const nameInput = screen.getByLabelText('Nome')
      const form = nameInput.closest('form')
      expect(form).toBeInTheDocument()
      expect(form).toHaveAttribute('class', 'w-full flex flex-col gap-3')
    })
  })

  describe('Theme Integration', () => {
    it('renders with theme toggle functionality', () => {
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      // Verify the theme toggle is present and functional
      const themeToggle = screen.getByRole('button', { name: /toggle theme/i })
      expect(themeToggle).toBeInTheDocument()
      expect(themeToggle).toBeEnabled()
    })
  })

  describe('Error Handling', () => {
    it('handles form submission errors gracefully', async () => {
      const user = userEvent.setup()
      
      // Mock console.error to prevent test noise
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(
        <TestWrapper>
          <CreatorSignUp />
        </TestWrapper>
      )

      // Try to submit form with invalid data
      await user.click(screen.getByRole('button', { name: 'Criar conta' }))

      // Should show validation errors instead of crashing
      await waitFor(() => {
        expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })
  })
}) 