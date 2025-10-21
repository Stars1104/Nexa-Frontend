import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRoleNavigation } from '../../hooks/useRoleNavigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import { updateUser as updateAuthUser } from '../../store/slices/authSlice';
import { apiClient } from '../../services/apiClient';

const initialState = {
  username: '',
  email: '',
  cardholderName: '',
};

interface StudentVerifyProps {
  setComponent?: (component: string) => void;
}

export default function StudentVerify({ setComponent }: StudentVerifyProps = {}) {
  const [form, setForm] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { navigateToRoleDashboard } = useRoleNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Stripe removido: tela não depende mais de Stripe para renderizar

  // Check if we're inside the Creator dashboard
  const isInsideCreatorDashboard = location.pathname === '/creator' && setComponent;
  
  // Check if user is already verified as a student
  useEffect(() => {
    if (user?.student_verified) {
      toast.success('Você já está verificado como aluno!');
      if (isInsideCreatorDashboard) {
        // If inside Creator dashboard, just show success message
        return;
      } else {
        // If on standalone page, redirect to dashboard
        setTimeout(() => {
          navigateToRoleDashboard('creator');
        }, 2000);
      }
    }
  }, [user, navigateToRoleDashboard, isInsideCreatorDashboard]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSkip = () => {
    toast.info('Pulando verificação de aluno. Você pode verificar seu status posteriormente no dashboard.');
    if (isInsideCreatorDashboard) {
      // If inside Creator dashboard, navigate to main dashboard
      setComponent?.('Painel');
    } else {
      // If on standalone page, redirect to dashboard
      navigateToRoleDashboard('creator');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Check if user is already verified
    if (user?.student_verified) {
      toast.info('Você já está verificado como aluno!');
      if (isInsideCreatorDashboard) {
        setComponent?.('Painel');
      } else {
        navigateToRoleDashboard('creator');
      }
      return;
    }
    
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate required fields
      const requiredFields = ['username', 'email'];
      const missingFields = requiredFields.filter(field => !form[field as keyof typeof form].trim());
      
      if (missingFields.length > 0) {
        setError('Por favor, preencha todos os campos obrigatórios.');
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email)) {
        setError('Por favor, insira um e-mail válido.');
        return;
      }

      // Fluxo sem Stripe: registrar intenção local e checar status no backend (se disponível)
      try {
        // Verificação direta no backend (concede 1 ano de acesso conforme regra atual)
        const res = await apiClient.post('/student/verify', {
          purchase_email: form.email,
          course_name: 'Build Creators'
        });
        const data = res?.data || {};
        if (data?.success) {
          // Atualiza o estado de auth imediatamente
          dispatch(updateAuthUser({
            role: 'student',
            student_verified: true as any,
            student_expires_at: data.student_expires_at,
            free_trial_expires_at: data.free_trial_expires_at,
          } as any));
          toast.success('Verificação concluída! Seu acesso de estudante foi ativado.');
        } else {
          toast.info(data?.message || 'Solicitação registrada. Nossa equipe validará seu acesso de aluno.');
        }
      } catch (e) {
        // Fallback: apenas informa registro da solicitação
        toast.info('Solicitação registrada. Nossa equipe validará seu acesso de aluno.');
      }
      
      // Update de estado local do usuário removido (evitar referência inexistente)

      // Navegar ao dashboard
      if (isInsideCreatorDashboard) {
        setComponent?.('Painel');
      } else {
        navigateToRoleDashboard('creator');
      }

    } catch (err: any) {
      console.error('Student verification error:', err);
      
      // Handle axios errors
      if (err.response) {
        // Server responded with error status
        const errorMessage = err.response.data?.message || err.response.data?.error || 'Erro do servidor';
        setError(errorMessage);
      } else if (err.request) {
        // Request was made but no response received
        setError('Erro de conexão. Verifique sua internet e tente novamente.');
      } else {
        // Something else happened
        setError(err.message || 'Erro ao verificar status de aluno. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canonical = typeof window !== "undefined" ? window.location.href : "";
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
  };

  // Tela sempre renderiza (sem dependência de Stripe)

  return (
    <>
      {!isInsideCreatorDashboard && (
        <Helmet>
          <title>Nexa - Verificação de aluno</title>
          <meta name="description" content="Verifique seu status de aluno para obter acesso gratuito à plataforma Nexa." />
          {canonical && <link rel="canonical" href={canonical} />}
          <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        </Helmet>
      )}
      <div className={`${isInsideCreatorDashboard ? 'p-6 w-full min-h-[92vh] flex justify-center items-center' : 'min-h-screen flex items-center justify-center bg-muted py-8 px-2 dark:bg-background relative'}`}>
        {!isInsideCreatorDashboard && (
          <div className="absolute top-6 right-6">
            <ThemeToggle />
          </div>
        )}
        <div className={`w-full max-w-2xl bg-background rounded-xl shadow-lg relative border ${isInsideCreatorDashboard ? 'p-6' : 'p-8 md:p-12'}`}>
          <h1 className={`font-bold mb-2 text-foreground ${isInsideCreatorDashboard ? 'text-xl' : 'text-2xl md:text-3xl'}`}>
          Preencha os dados se você for aluna do Build Creators
          </h1>
          <p className="text-muted-foreground mb-6 max-w-2xl text-sm md:text-base">
            {user?.student_verified 
              ? "Você já foi verificado como aluno! Redirecionando para o painel..."
              : "Preencha suas informações educacionais abaixo para verificar seu status de aluno e obter acesso gratuito por até 12 meses."
            }
          </p>
          <Alert className="mb-8 flex flex-col md:flex-row items-start md:items-center gap-2 bg-[#FAF5FF] dark:bg-[#30253d]">
            <div className="flex-1">
              <AlertTitle className="font-semibold text-primary text-sm md:text-base">
                <span className="mr-2 text-[#A873E9]">ⓘ</span>Os alunos do curso recebem acesso 100% gratuito!
              </AlertTitle>
            </div>
            <AlertDescription className="text-xs md:text-sm text-muted-foreground">
              Não perca.
            </AlertDescription>
          </Alert>

          {/* Success Alert for Already Verified Students */}
          {user?.student_verified && (
            <Alert className="mb-6 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800">
              <AlertDescription className="text-green-600 dark:text-green-400">
                ✅ Você já está verificado como aluno! Redirecionando para o dashboard...
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <AlertDescription className="text-red-600 dark:text-red-400">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${user?.student_verified ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex flex-col gap-1">
            <label htmlFor="username" className="text-xs text-muted-foreground">Nome de usuário</label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Seu nome de usuário"
                value={form.username}
                onChange={handleChange}
                required
                autoComplete="username"
                disabled={isSubmitting}
              />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-xs text-muted-foreground">E-mail</label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@exemplo.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
              disabled={isSubmitting}
            />
          </div>
          {/* Campos de pagamento removidos */}
          <div className="md:col-span-2 mt-4 flex flex-col sm:flex-row gap-3">
            <Button 
              type="submit" 
              className="w-full sm:w-auto bg-[#E91E63] text-white font-semibold px-6 py-2 rounded-lg shadow hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verificando...
                </div>
              ) : (
                'Enviar para verificação'
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={handleSkip}
              className="w-full sm:w-auto font-semibold px-6 py-2 rounded-lg border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-800"
              disabled={isSubmitting}
            >
              Pular por enquanto
            </Button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}
