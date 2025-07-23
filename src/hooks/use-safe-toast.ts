import { useCallback } from 'react';
import { toast } from '../components/ui/sonner';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface UseSafeToastReturn {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

export const useSafeToast = (): UseSafeToastReturn => {
  const safeToast = useCallback((type: ToastType, message: string) => {
    try {
      switch (type) {
        case 'success':
          toast.success(message);
          break;
        case 'error':
          toast.error(message);
          break;
        case 'warning':
          toast.warning(message);
          break;
        case 'info':
          toast.info(message);
          break;
        default:
          toast(message);
      }
    } catch (err) {
      console.error('Toast error:', err);
      // Fallback to console or alert if toast fails
      switch (type) {
        case 'error':
          console.error(message);
          break;
        case 'warning':
          console.warn(message);
          break;
        case 'success':
        case 'info':
        default:
          break;
      }
    }
  }, []);

  return {
    success: (message: string) => safeToast('success', message),
    error: (message: string) => safeToast('error', message),
    warning: (message: string) => safeToast('warning', message),
    info: (message: string) => safeToast('info', message),
  };
}; 