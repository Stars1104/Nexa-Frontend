import React from 'react';
import { useAppSelector } from '../store/hooks';
import { usePremiumContext } from '../contexts/PremiumContext';

export const DebugUserState: React.FC = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { hasPremium, isPremiumActive, premiumStatus } = usePremiumContext();

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'rgba(0,0,0,0.8)', 
      color: 'white', 
      padding: '10px', 
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>Estado de Debug do Usuário</h4>
      <div>
        <strong>Estado de Autenticação:</strong>
        <div>Autenticado: {isAuthenticated ? 'Sim' : 'Não'}</div>
        <div>ID do Usuário: {user?.id || 'Nenhum'}</div>
        <div>Função: {user?.role || 'Nenhuma'}</div>
        <div>Tem Premium (Redux): {user?.has_premium ? 'Sim' : 'Não'}</div>
        <div>Premium Expira: {user?.premium_expires_at || 'Nunca'}</div>
      </div>
      <div style={{ marginTop: '10px' }}>
        <strong>Contexto Premium:</strong>
        <div>Tem Premium: {hasPremium ? 'Sim' : 'Não'}</div>
        <div>Premium Ativo: {isPremiumActive ? 'Sim' : 'Não'}</div>
        <div>Status Premium: {JSON.stringify(premiumStatus, null, 2)}</div>
      </div>
      <button 
        onClick={() => window.location.reload()} 
        style={{ 
          marginTop: '10px', 
          padding: '5px 10px', 
          background: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '3px',
          cursor: 'pointer'
        }}
      >
        Recarregar Página
      </button>
    </div>
  );
}; 