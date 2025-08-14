import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EmailVerificationPending from '../components/EmailVerificationPending';
import { Button } from '../components/ui/button';
import { ArrowLeft } from 'lucide-react';

const EmailVerificationPendingPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userEmail, userRole } = location.state || {};

  const handleResendEmail = async () => {
    // This would typically call an API to resend verification email
    // For now, just show a message
    alert('Resend functionality will be implemented soon. Please check your email.');
  };

  const handleGoToLogin = () => {
    navigate('/auth');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  if (!userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Invalid Access
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This page is only accessible after registration.
          </p>
          <Button onClick={handleGoBack} variant="outline" className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
          <Button onClick={handleGoToLogin}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <EmailVerificationPending
      userEmail={userEmail}
      onResendEmail={handleResendEmail}
      onGoToLogin={handleGoToLogin}
    />
  );
};

export default EmailVerificationPendingPage; 