import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { loginSuccess, clearEmailVerificationRequired } from '@/store/slices/authSlice';
import { apiClient } from '@/services/apiClient';
const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const id = searchParams.get('id');
        const hash = searchParams.get('hash');
        const signature = searchParams.get('signature');
        const expires = searchParams.get('expires');

        if (!id || !hash || !signature || !expires) {
          setVerificationStatus('error');
          setMessage('Link de verificação inválido. Por favor, verifique seu email e tente novamente.');
          setIsLoading(false);
          return;
        }

        // Check if link has expired
        if (Date.now() > parseInt(expires) * 1000) {
          setVerificationStatus('error');
          setMessage('Link de verificação expirou. Por favor, solicite um novo.');
          setIsLoading(false);
          return;
        }

        // Call the backend verification endpoint directly
        const response = await apiClient.get(`/verify-email/${id}/${hash}?signature=${signature}&expires=${expires}`);

        const data = response.data;

        if (response.status === 200 && data.success) {
          setVerificationStatus('success');
          setMessage('Email verificado com sucesso! Você pode agora fazer login em sua conta.');
          
          // Store the user data and token
          dispatch(loginSuccess({
            user: data.user,
            token: data.token,
          }));
          
          // Clear email verification requirement
          dispatch(clearEmailVerificationRequired());
          
          // Redirect to appropriate dashboard after a short delay
          setTimeout(() => {
            const role = data.user.role;
            if (role === 'brand') {
              navigate('/brand');
            } else if (role === 'creator') {
              navigate('/creator');
            } else {
              navigate('/');
            }
          }, 3000);
        } else {
          setVerificationStatus('error');
          setMessage(data.message || 'Verificação falhou. Tente novamente ou entre em contato com o suporte.');
        }
      } catch (error) {
        console.error('Email verification error:', error);
        setVerificationStatus('error');
        setMessage('Ocorreu um erro durante a verificação. Tente novamente ou entre em contato com o suporte.');
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, dispatch, navigate]);

  const handleResendEmail = async () => {
    // This would typically require the user to be logged in
    // For now, redirect to login page
    navigate('/auth');
  };

  const handleGoToLogin = () => {
    navigate('/auth');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-center text-gray-600 dark:text-gray-300">
                Verificando seu email...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          {verificationStatus === 'success' ? (
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          )}
          <CardTitle className="text-2xl font-bold">
            {verificationStatus === 'success' ? 'Email Verificado!' : 'Verificação Falhou'}
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verificationStatus === 'success' ? (
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Redirecionando você para seu painel...
              </p>
              <Button 
                onClick={handleGoToLogin}
                className="w-full"
                variant="outline"
              >
                Ir para Login
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Button 
                onClick={handleResendEmail}
                className="w-full"
                variant="outline"
              >
                Reenviar Email de Verificação
              </Button>
              <Button 
                onClick={handleGoToLogin}
                className="w-full"
              >
                Ir para Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerification; 