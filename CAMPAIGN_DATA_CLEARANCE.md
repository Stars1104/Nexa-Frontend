# Campaign Data Clearance Guide

This guide explains how to remove campaign data from Redux store when there's no campaign data in the database.

## Problem

When there's no campaign data in the database but Redux store still contains campaign data, you need to clear this data to maintain consistency.

## Solutions

### Option 1: Clear Campaign Data from Redux Store (Recommended)

This approach adds a `clearAllCampaignData` action to the campaign slice that resets all campaign-related state to initial values.

#### Implementation

1. **Added `clearAllCampaignData` action to campaign slice** (`src/store/slices/campaignSlice.ts`):

   ```typescript
   clearAllCampaignData: (state) => {
     state.campaigns = [];
     state.pendingCampaigns = [];
     state.userCampaigns = [];
     state.availableCampaigns = [];
     state.approvedCampaigns = [];
     state.searchResults = [];
     state.applications = [];
     state.creatorApplications = [];
     state.categories = [];
     state.types = [];
     state.stats = null;
     state.analytics = null;
     state.selectedCampaign = null;
     state.error = null;
     state.isLoading = false;
     state.isCreating = false;
     state.isSearching = false;
   };
   ```

2. **Created utility functions** (`src/utils/campaignUtils.ts`):

   - `clearCampaignData()` - Clears data from Redux store only
   - `clearCampaignDataFromStorage()` - Clears data from both Redux store and localStorage
   - `hasCampaignData()` - Checks if any campaign data exists

3. **Created example component** (`src/components/CampaignDataManager.tsx`) - Demonstrates usage

#### Usage Examples

**In a React component:**

```typescript
import {
  clearCampaignData,
  clearCampaignDataFromStorage,
} from "../utils/campaignUtils";

// Clear from Redux store only
const handleClearData = () => {
  clearCampaignData();
};

// Clear from both Redux store and localStorage
const handleClearFromStorage = () => {
  clearCampaignDataFromStorage();
  console.log("Campaign data cleared from both Redux store and localStorage");
};
```

**Direct dispatch:**

```typescript
import { useDispatch } from "react-redux";
import { clearAllCampaignData } from "../store/slices/campaignSlice";

const dispatch = useDispatch();

const handleClear = () => {
  dispatch(clearAllCampaignData());
};
```

### Option 2: Remove Campaign Slice Entirely

If you want to completely remove campaign functionality:

1. **Remove campaign slice from store** (`src/store/index.ts`):

   ```typescript
   // Remove this line
   import campaignReducer from "./slices/campaignSlice";

   // Remove from combineReducers
   const rootReducer = combineReducers({
     auth: authReducer,
     user: userReducer,
     // campaign: campaignReducer, // Remove this line
   });
   ```

2. **Update persist config** (`src/store/persistConfig.ts`):

   ```typescript
   export const rootPersistConfig: PersistConfig<any> = {
     key: "root",
     storage,
     whitelist: ["auth", "user"], // Remove 'campaign'
   };
   ```

3. **Remove campaign-related components and imports**

### Option 3: Reset Store on App Initialization

Add logic to clear campaign data when the app starts:

```typescript
// In your main App component or initialization logic
import { useEffect } from 'react';
import { clearCampaignData } from '../utils/campaignUtils';

const App = () => {
  useEffect(() => {
    // Clear campaign data on app start if needed
    clearCampaignData();
  }, []);

  return (
    // Your app components
  );
};
```

## When to Use Each Option

- **Option 1**: When you want to keep campaign functionality but need to clear existing data
- **Option 2**: When you want to completely remove campaign functionality
- **Option 3**: When you want to automatically clear campaign data on app startup

## Testing

Use the `CampaignDataManager` component to test the functionality:

```typescript
import CampaignDataManager from "../components/CampaignDataManager";

// Add to any page to test
<CampaignDataManager />;
```

## Notes

- The `clearAllCampaignData` action resets all campaign state to initial values
- `clearCampaignDataFromStorage` also removes data from localStorage if using redux-persist
- Components using campaign data will automatically re-render when data is cleared
- Make sure to handle loading states appropriately in components that depend on campaign data
