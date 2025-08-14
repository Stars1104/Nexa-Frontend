import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Mail, CheckCircle } from 'lucide-react';

interface EmailVerificationPendingProps {
  userEmail: string;
  onResendEmail: () => void;
  onGoToLogin: () => void;
}

const EmailVerificationPending: React.FC<EmailVerificationPendingProps> = ({
  userEmail,
  onResendEmail,
  onGoToLogin,
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <Mail className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            We've sent a verification link to
          </CardDescription>
          <p className="font-medium text-gray-900 dark:text-gray-100 mt-2">
            {userEmail}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-medium">Next steps:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Check your email inbox (and spam folder)</li>
                  <li>Click the verification link in the email</li>
                  <li>Complete your account setup</li>
                </ol>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={onResendEmail}
              className="w-full"
              variant="outline"
            >
              Resend Verification Email
            </Button>
            <Button 
              onClick={onGoToLogin}
              className="w-full"
            >
              Go to Login
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Didn't receive the email? Check your spam folder or try resending.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerificationPending; 