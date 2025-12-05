
export const SESSION_CONFIG = {
  
  TIMEOUT_MINUTES: 120, 
  
  
  WARNING_MINUTES: 10, 
  
  
  MIN_ACTIVITY_INTERVAL: 1000,
  
  
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
  
  
  EXCLUDED_ROUTES: [
    '/auth',
    '/signup',
    '/forgot-password',
    '/guides',
    '/docs'
  ] as const,
  
  
  SHOW_WARNING: true,
  
  
  EXTEND_ON_API_CALLS: true,
  
  
  BROWSER_CLOSE_LOGOUT: {
    
    ENABLED: false, 
    
    
    CLEAR_ON_TAB_HIDE: false,
    
    
    CLEAR_ON_REFRESH: false,
    
    
    CLEAR_ON_AUTH_PAGES: false 
  }
} as const;

export type SessionConfig = typeof SESSION_CONFIG;
