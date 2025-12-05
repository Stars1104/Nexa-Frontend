import { store } from '../store';
import { clearAllCampaignData } from '../store/slices/campaignSlice';

export const clearCampaignData = () => {
  store.dispatch(clearAllCampaignData());
};

export const clearCampaignDataFromStorage = () => {
  store.dispatch(clearAllCampaignData());
  
  try {
    const persistedState = localStorage.getItem('persist:root');
    if (persistedState) {
      const parsedState = JSON.parse(persistedState);
      if (parsedState.campaign) {
        delete parsedState.campaign;
        localStorage.setItem('persist:root', JSON.stringify(parsedState));
      }
    }
  } catch (error) {
    console.warn('Failed to clear campaign data from localStorage:', error);
  }
};

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
