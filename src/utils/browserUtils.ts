export const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

export const safeGetLocalStorage = (key: string): string | null => {
  if (!isBrowser()) {
    return null;
  }
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn('Error accessing localStorage:', error);
    return null;
  }
};

export const safeSetLocalStorage = (key: string, value: string): void => {
  if (!isBrowser()) {
    return;
  }
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn('Error setting localStorage:', error);
  }
};

export const safeRemoveLocalStorage = (key: string): void => {
  if (!isBrowser()) {
    return;
  }
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Error removing from localStorage:', error);
  }
};

export const safeDispatchEvent = (eventName: string, detail?: any): void => {
  if (!isBrowser()) {
    return;
  }
  try {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  } catch (error) {
    console.warn('Error dispatching event:', error);
  }
};

export const safeAddEventListener = (
  eventName: string, 
  handler: EventListener, 
  options?: AddEventListenerOptions
): void => {
  if (!isBrowser()) {
    return;
  }
  try {
    window.addEventListener(eventName, handler, options);
  } catch (error) {
    console.warn('Error adding event listener:', error);
  }
};

export const safeRemoveEventListener = (
  eventName: string, 
  handler: EventListener
): void => {
  if (!isBrowser()) {
    return;
  }
  try {
    window.removeEventListener(eventName, handler);
  } catch (error) {
    console.warn('Error removing event listener:', error);
  }
};


export const getAuthToken = (): string | null => {
  return safeGetLocalStorage('token');
};


export const dispatchPremiumStatusUpdate = (): void => {
  safeDispatchEvent('premium-status-updated');
};
