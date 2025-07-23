import { useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

export const useSafeToast = () => {
    const isMountedRef = useRef(true);
    const toastQueueRef = useRef<Array<() => void>>([]);

    // Track component mount state
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Process toast queue
    const processQueue = useCallback(() => {
        if (!isMountedRef.current) return;
        
        const queue = toastQueueRef.current;
        if (queue.length === 0) return;

        // Process all queued toasts
        queue.forEach(toastFn => {
            try {
                toastFn();
            } catch (error) {
                console.warn('Toast error (non-critical):', error);
            }
        });
        
        // Clear queue
        toastQueueRef.current = [];
    }, []);

    const safeToast = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string, delay: number = 500) => {
        if (!isMountedRef.current) return;

        const toastFn = () => {
            if (!isMountedRef.current) return;
            
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
            } catch (error) {
                console.warn('Toast error (non-critical):', error);
            }
        };

        // Add to queue and process after delay
        toastQueueRef.current.push(toastFn);
        
        setTimeout(() => {
            if (isMountedRef.current) {
                processQueue();
            }
        }, delay);
    }, [processQueue]);

    return {
        success: (message: string, delay?: number) => safeToast('success', message, delay),
        error: (message: string, delay?: number) => safeToast('error', message, delay),
        warning: (message: string, delay?: number) => safeToast('warning', message, delay),
        info: (message: string, delay?: number) => safeToast('info', message, delay),
    };
}; 