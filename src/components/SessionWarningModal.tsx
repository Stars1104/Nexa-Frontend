import React from 'react';
import { AlertTriangle, Clock, LogOut, RefreshCw } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-500 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">
            Sessão Expirando
          </h2>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-2">
            Sua sessão expirará em:
          </p>
          <div className="flex items-center text-2xl font-bold text-red-600">
            <Clock className="h-6 w-6 mr-2" />
            {remainingMinutes} minuto{remainingMinutes !== 1 ? 's' : ''}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Para manter sua sessão ativa, clique em "Estender Sessão" ou faça login novamente.
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onExtendSession}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Estender Sessão
          </button>
          <button
            onClick={onLogout}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center justify-center transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionWarningModal;