export const clearUserSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('persist:auth');
  localStorage.removeItem('persist:root');
  
  localStorage.removeItem('premium-status');
  localStorage.removeItem('user-preferences');
  
  sessionStorage.clear();
};

export const hasSessionData = (): boolean => {
  return !!(
    localStorage.getItem('token') || 
    localStorage.getItem('user') ||
    localStorage.getItem('persist:auth') ||
    localStorage.getItem('persist:root')
  );
};

export const forceLogout = () => {
  clearUserSession();
  
  if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
    window.location.href = '/auth';
  }
};

export const clearSessionOnRefresh = () => {
  if (performance.navigation.type === 1) {
    clearUserSession();
  }
};
