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
      <h4>Debug User State</h4>
      <div>
        <strong>Auth State:</strong>
        <div>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
        <div>User ID: {user?.id || 'None'}</div>
        <div>Role: {user?.role || 'None'}</div>
        <div>Has Premium (Redux): {user?.has_premium ? 'Yes' : 'No'}</div>
        <div>Premium Expires: {user?.premium_expires_at || 'None'}</div>
      </div>
      <div style={{ marginTop: '10px' }}>
        <strong>Premium Context:</strong>
        <div>Has Premium: {hasPremium ? 'Yes' : 'No'}</div>
        <div>Is Premium Active: {isPremiumActive ? 'Yes' : 'No'}</div>
        <div>Premium Status: {JSON.stringify(premiumStatus, null, 2)}</div>
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
        Reload Page
      </button>
    </div>
  );
}; 