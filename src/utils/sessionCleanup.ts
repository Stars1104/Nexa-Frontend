// Utility functions for cleaning up user sessions
export const clearUserSession = () => {
  // Clear all authentication data from localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('persist:auth');
  localStorage.removeItem('persist:root');
  
  // Clear any other session-related data
  localStorage.removeItem('premium-status');
  localStorage.removeItem('user-preferences');
  
  // Clear sessionStorage as well
  sessionStorage.clear();
  
  console.log('User session cleared completely');
};

// Check if session data exists
export const hasSessionData = (): boolean => {
  return !!(
    localStorage.getItem('token') || 
    localStorage.getItem('user') ||
    localStorage.getItem('persist:auth') ||
    localStorage.getItem('persist:root')
  );
};

// Force logout and redirect to auth page
export const forceLogout = () => {
  clearUserSession();
  
  // Redirect to auth page
  if (window.location.pathname !== '/auth' && window.location.pathname !== '/') {
    window.location.href = '/auth';
  }
};

// Clear session on page refresh (optional)
export const clearSessionOnRefresh = () => {
  // Only clear if this is a page refresh (not initial load)
  if (performance.navigation.type === 1) { // TYPE_RELOAD
    clearUserSession();
  }
};
