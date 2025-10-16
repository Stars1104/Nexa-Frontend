/**
 * Browser utilities for safe client-side operations
 * Prevents hydration mismatches by checking for browser environment
 */

/**
 * Check if code is running in browser environment
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined';
};

/**
 * Safely get item from localStorage
 * Returns null if not in browser environment
 */
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

/**
 * Safely set item in localStorage
 * No-op if not in browser environment
 */
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

/**
 * Safely remove item from localStorage
 * No-op if not in browser environment
 */
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

/**
 * Safely dispatch custom event
 * No-op if not in browser environment
 */
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

/**
 * Safely add event listener
 * No-op if not in browser environment
 */
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

/**
 * Safely remove event listener
 * No-op if not in browser environment
 */
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

/**
 * Get token safely from localStorage
 */
export const getAuthToken = (): string | null => {
  return safeGetLocalStorage('token');
};

/**
 * Dispatch premium status update event safely
 */
export const dispatchPremiumStatusUpdate = (): void => {
  safeDispatchEvent('premium-status-updated');
};
