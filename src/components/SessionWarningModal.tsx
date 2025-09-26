import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, Clock } from 'lucide-react';
import { useSessionTimeout } from '../hooks/useSessionTimeout';

interface SessionWarningModalProps {
  isOpen: boolean;
  remainingMinutes: number;
  onExtendSession: () => void;
  onLogout: () => void;
}

export const SessionWarningModal: React.FC<SessionWarningModalProps> = ({
  isOpen,
  remainingMinutes,
  onExtendSession,
  onLogout
}) => {
  const [countdown, setCountdown] = useState(remainingMinutes * 60); // Convert to seconds

  useEffect(() => {
    if (!isOpen) return;

    setCountdown(remainingMinutes * 60);
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, remainingMinutes]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <AlertTriangle className="h-12 w-12 text-amber-500" />
          </div>
          <CardTitle className="text-xl">Sessão Expirando</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">
              Sua sessão expirará em:
            </p>
            <div className="flex items-center justify-center gap-2 text-2xl font-bold text-amber-600">
              <Clock className="h-6 w-6" />
              {formatTime(countdown)}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Clique em "Estender Sessão" para continuar ou "Fazer Logout" para sair.
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={onExtendSession}
              className="flex-1"
              variant="default"
            >
              Estender Sessão
            </Button>
            <Button 
              onClick={onLogout}
              className="flex-1"
              variant="outline"
            >
              Fazer Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionWarningModal;
