import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppDispatch } from '../store';
import { handleGoogleOAuthCallback } from '../store/thunks/authThunks';
import { useRoleNavigation } from '../hooks/useRoleNavigation';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const GoogleOAuthCallback: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { navigateToRoleDashboard, navigateToSubscription, navigateToStudentVerification } = useRoleNavigation();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isNewRegistration, setIsNewRegistration] = useState(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple executions
      if (isProcessing) {
        return;
      }
      
      try {
        setIsProcessing(true);
        setStatus('loading');
        
        // Check if we have OAuth parameters
        const urlParams = new URLSearchParams(location.search);
        const code = urlParams.get('code');
        const oauthError = urlParams.get('error');
        
        if (oauthError) {
          throw new Error(`OAuth error: ${oauthError}`);
        }
        
        if (!code) {
          // No OAuth parameters, redirect to auth page
          navigate('/auth');
          return;
        }
        
        // Handle the OAuth callback
        const result = await dispatch(handleGoogleOAuthCallback()).unwrap();
        
        if (result && result.user) {
          setStatus('success');
          
          // Check if this is a new registration by checking if the user has premium access
          // New users typically don't have premium access
          const isNewUser = !result.user.has_premium && result.user.role === 'creator';
          setIsNewRegistration(isNewUser);
          
          if (result.user.role === 'student') {
            toast.success('Conta de aluno criada! Complete o formulário de verificação para obter acesso gratuito.');
          } else {
            toast.success(isNewUser ? 'Conta criada com sucesso!' : 'Login realizado com sucesso com Google!');
          }
          
          // Clean up URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Navigate to appropriate page
          setTimeout(() => {
            if (result.user.role === 'student') {
              // Redirect students to student verification page
              navigateToStudentVerification();
            } else if (isNewUser) {
              // Redirect new Creator registrations to subscription page
              navigateToSubscription();
            } else {
              // Navigate to appropriate dashboard for existing users or non-creators
              navigateToRoleDashboard(result.user.role);
            }
          }, 1000);
        } else {
          throw new Error('Falha na autenticação');
        }
      } catch (error: any) {
        setStatus('error');
        setError(error.message || 'Falha na autenticação');
        toast.error(error.message || 'Falha ao fazer login com Google');
        
        // Redirect to auth page after error
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, []); // Remove dependencies to prevent multiple executions

  const handleRetry = () => {
    navigate('/auth');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#171717] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Fazendo seu login...'}
            {status === 'success' && 'Sucesso!'}
            {status === 'error' && 'Falha na Autenticação'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="text-gray-600 dark:text-gray-400">
                Aguarde enquanto completamos seu login...
              </p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-gray-600 dark:text-gray-400">
                Login realizado com sucesso com Google!
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Redirecionando para seu painel...
              </p>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500" />
              <p className="text-gray-600 dark:text-gray-400">
                {error}
              </p>
              <div className="flex space-x-2">
                <Button onClick={handleRetry} variant="outline">
                  Tentar Novamente
                </Button>
                <Button onClick={handleGoHome}>
                  Ir para Início
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleOAuthCallback; 