import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { stripeApi } from '../../api/stripe';
import { toast } from '../ui/sonner';


export const StripeConnectTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<any>(null);

  const testGetStatus = async () => {
    try {
      setIsLoading(true);
      const result = await stripeApi.getAccountStatus();
      setStatus(result);
      toast.success('Status retrieved successfully');
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      console.error('Status error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testCreateAccountLink = async () => {
    try {
      setIsLoading(true);
      const result = await stripeApi.createAccountLink();
      toast.success('Account link created successfully');
      console.log('Account link:', result);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
      console.error('Account link error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Stripe API Test</CardTitle>
        <CardDescription>
          Test the Stripe Connect API integration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Button 
            onClick={testGetStatus} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Loading...' : 'Test Get Status'}
          </Button>
          
          <Button 
            onClick={testCreateAccountLink} 
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? 'Loading...' : 'Test Create Account Link'}
          </Button>
        </div>

        {status && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <h4 className="font-semibold mb-2">Status Response:</h4>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(status, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StripeConnectTest;
