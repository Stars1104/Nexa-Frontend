import React, { useEffect } from 'react';
import { useAppSelector } from '../store/hooks';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  fallback = (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Acesso Negado</h1>
        <p className="text-muted-foreground mb-6">Você não tem permissão para acessar esta página.</p>
        <Button 
          onClick={() => window.location.href = '/'}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
        >
          Voltar ao Início
        </Button>
      </div>
    </div>
  )
}) => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    // If not authenticated and we have a user object, check if token is valid
    if (!isAuthenticated && !user?.id) {
      // Check if there's a token in localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        // No token found, redirect to login
        navigate('/login');
      }
    }
  }, [isAuthenticated, user?.id, navigate]);

  // Show fallback if not authenticated
  if (!isAuthenticated || !user?.id) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default AuthGuard; 