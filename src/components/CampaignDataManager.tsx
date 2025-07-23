import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { clearCampaignData, clearCampaignDataFromStorage, hasCampaignData } from '../utils/campaignUtils';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

const CampaignDataManager: React.FC = () => {
  const campaignState = useSelector((state: RootState) => state.campaign);
  const hasData = hasCampaignData();

  const handleClearData = () => {
    clearCampaignData();
  };

  const handleClearFromStorage = () => {
    clearCampaignDataFromStorage();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Campaign Data Manager</CardTitle>
        <CardDescription>
          Manage campaign data in Redux store
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium">Current Status:</h4>
          <div className="text-sm space-y-1">
            <p>Has Campaign Data: <span className={hasData ? 'text-green-600' : 'text-red-600'}>{hasData ? 'Yes' : 'No'}</span></p>
            <p>Campaigns: {campaignState.campaigns.length}</p>
            <p>Pending Campaigns: {campaignState.pendingCampaigns.length}</p>
            <p>User Campaigns: {campaignState.userCampaigns.length}</p>
            <p>Applications: {campaignState.applications.length}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={handleClearData}
            variant="outline"
            className="w-full"
          >
            Clear Campaign Data (Redux Only)
          </Button>
          
          <Button 
            onClick={handleClearFromStorage}
            variant="destructive"
            className="w-full"
          >
            Clear Campaign Data (Redux + Storage)
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          <p><strong>Redux Only:</strong> Clears data from memory but keeps it in localStorage</p>
          <p><strong>Redux + Storage:</strong> Clears data from both memory and localStorage</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignDataManager; 