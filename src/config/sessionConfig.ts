// Session timeout configuration
export const SESSION_CONFIG = {
  // Session timeout in minutes
  TIMEOUT_MINUTES: 120, // 2 hours
  
  // Warning time in minutes before timeout
  WARNING_MINUTES: 10, // 10 minutes warning
  
  // Minimum activity interval in milliseconds (to prevent excessive timer resets)
  MIN_ACTIVITY_INTERVAL: 1000,
  
  // Events that indicate user activity
  ACTIVITY_EVENTS: [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'keydown',
    'focus',
    'blur'
  ] as const,
  
  // Routes that should not trigger session timeout (e.g., public pages)
  EXCLUDED_ROUTES: [
    '/auth',
    '/signup',
    '/forgot-password',
    '/guides',
    '/docs'
  ] as const,
  
  // Whether to show warning before timeout
  SHOW_WARNING: true,
  
  // Whether to extend session on API calls
  EXTEND_ON_API_CALLS: true,
  
  // Browser close logout settings
  BROWSER_CLOSE_LOGOUT: {
    // Whether to clear session when browser/tab closes
    ENABLED: false, // Disabled to prevent aggressive logout
    
    // Whether to clear session when tab becomes hidden (switches to another tab)
    CLEAR_ON_TAB_HIDE: false,
    
    // Whether to clear session on page refresh
    CLEAR_ON_REFRESH: false,
    
    // Whether to clear session when navigating to auth pages
    CLEAR_ON_AUTH_PAGES: false // Disabled to prevent clearing on auth pages
  }
} as const;

export type SessionConfig = typeof SESSION_CONFIG;
