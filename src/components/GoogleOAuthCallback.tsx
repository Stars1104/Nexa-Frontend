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
  const { navigateToRoleDashboard } = useRoleNavigation();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

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
          toast.success('Successfully signed in with Google!');
          
          // Clean up URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Navigate to appropriate dashboard
          setTimeout(() => {
            navigateToRoleDashboard(result.user.role);
          }, 1000);
        } else {
          throw new Error('Authentication failed');
        }
      } catch (error: any) {
        setStatus('error');
        setError(error.message || 'Authentication failed');
        toast.error(error.message || 'Failed to sign in with Google');
        
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
            {status === 'loading' && 'Signing you in...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Authentication Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="text-gray-600 dark:text-gray-400">
                Please wait while we complete your sign-in...
              </p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-gray-600 dark:text-gray-400">
                Successfully signed in with Google!
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Redirecting to your dashboard...
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
                  Try Again
                </Button>
                <Button onClick={handleGoHome}>
                  Go Home
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