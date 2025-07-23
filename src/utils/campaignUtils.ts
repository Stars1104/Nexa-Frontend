import { store } from '../store';
import { clearAllCampaignData } from '../store/slices/campaignSlice';

/**
 * Clear all campaign data from Redux store
 * This function dispatches the clearAllCampaignData action to reset all campaign-related state
 */
export const clearCampaignData = () => {
  store.dispatch(clearAllCampaignData());
};

/**
 * Clear campaign data and also clear from localStorage (if using redux-persist)
 * This is useful when you want to completely remove campaign data from both memory and storage
 */
export const clearCampaignDataFromStorage = () => {
  // Clear from Redux store
  store.dispatch(clearAllCampaignData());
  
  // Clear from localStorage if using redux-persist
  try {
    const persistedState = localStorage.getItem('persist:root');
    if (persistedState) {
      const parsedState = JSON.parse(persistedState);
      if (parsedState.campaign) {
        // Remove campaign data from persisted state
        delete parsedState.campaign;
        localStorage.setItem('persist:root', JSON.stringify(parsedState));
      }
    }
  } catch (error) {
    console.warn('Failed to clear campaign data from localStorage:', error);
  }
};

/**
 * Check if campaign data exists in Redux store
 * @returns boolean indicating if any campaign data exists
 */
export const hasCampaignData = () => {
  const state = store.getState();
  const campaignState = state.campaign;
  
  return (
    campaignState.campaigns.length > 0 ||
    campaignState.pendingCampaigns.length > 0 ||
    campaignState.userCampaigns.length > 0 ||
    campaignState.availableCampaigns.length > 0 ||
    campaignState.approvedCampaigns.length > 0 ||
    campaignState.applications.length > 0 ||
    campaignState.creatorApplications.length > 0
  );
}; 