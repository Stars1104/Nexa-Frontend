import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchUserForEditing, updateUserProfile } from '../store/thunks/userThunks';
import { getUser } from '../api/auth';

interface UseUserReturn {
  user: any;
  isLoading: boolean;
  error: string | null;
  fetchUser: (userId?: string) => Promise<void>;
  updateUser: (userData: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useUser = (): UseUserReturn => {
  const dispatch = useAppDispatch();
  const { profile, isLoading, error } = useAppSelector((state) => state.user);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const fetchUser = useCallback(async (userId?: string) => {
    try {
      setLocalLoading(true);
      setLocalError(null);
      
      await dispatch(fetchUserForEditing(userId)).unwrap();
    } catch (error: any) {
      setLocalError(error.message || 'Failed to fetch user data');
      console.error('Error fetching user:', error);
    } finally {
      setLocalLoading(false);
    }
  }, [dispatch]);

  const updateUser = useCallback(async (userData: any) => {
    try {
      setLocalLoading(true);
      setLocalError(null);
      
      await dispatch(updateUserProfile(userData)).unwrap();
    } catch (error: any) {
      setLocalError(error.message || 'Failed to update user data');
      console.error('Error updating user:', error);
      throw error;
    } finally {
      setLocalLoading(false);
    }
  }, [dispatch]);

  const refreshUser = useCallback(async () => {
    try {
      setLocalLoading(true);
      setLocalError(null);
      
      const response = await getUser();
      if (response.success) {
        // Update the Redux store with fresh data
        await dispatch(fetchUserForEditing(undefined)).unwrap();
      }
    } catch (error: any) {
      setLocalError(error.message || 'Failed to refresh user data');
      console.error('Error refreshing user:', error);
    } finally {
      setLocalLoading(false);
    }
  }, [dispatch]);

  return {
    user: profile,
    isLoading: isLoading || localLoading,
    error: error || localError,
    fetchUser,
    updateUser,
    refreshUser,
  };
}; 