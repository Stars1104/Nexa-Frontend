# Campaign Creation and Approval System

This document explains the complete campaign creation and approval workflow implemented in the Nexa application.

## Overview

The system implements a complete campaign lifecycle with the following key features:

- **Campaign Creation**: Brands can create detailed campaigns with all necessary information
- **Admin Approval**: All campaigns require admin approval before being published
- **Real-time Status Updates**: All stakeholders see real-time status changes
- **Comprehensive Data Management**: Full CRUD operations with proper error handling

## System Architecture

### Redux Store Structure

#### Campaign Slice (`src/store/slices/campaignSlice.ts`)

- Manages all campaign-related state
- Handles async operations through thunks
- Maintains separate arrays for different campaign states:
  - `campaigns`: All campaigns
  - `pendingCampaigns`: Campaigns awaiting approval
  - `userCampaigns`: Campaigns created by the current user

#### Campaign Thunks (`src/store/thunks/campaignThunks.ts`)

- `createCampaign`: Create a new campaign
- `fetchCampaigns`: Fetch all campaigns
- `fetchPendingCampaigns`: Fetch pending campaigns (admin only)
- `fetchUserCampaigns`: Fetch user's campaigns
- `approveCampaign`: Approve a campaign (admin only)
- `rejectCampaign`: Reject a campaign (admin only)

#### Campaign API (`src/api/campaign/index.ts`)

- Complete REST API integration
- File upload support for campaign logos
- Authentication token management
- Proper error handling

## Campaign Creation Workflow

### 1. Brand Creates Campaign

**Location**: `src/components/brand/CreateCampaign.tsx`

**Features**:

- Comprehensive form with validation
- File upload for campaign logo
- Multi-select for states and requirements
- Real-time form validation
- Success/error state management

**Form Fields**:

- **Required Fields**:

  - Title
  - Description
  - Briefing
  - Budget
  - Deadline
  - States (where campaign will be published)
  - Campaign Type (Video, Photo, Review, etc.)

- **Optional Fields**:
  - Logo upload
  - Target audience
  - Deliverables
  - Specific requirements
  - Creator requirements

**Validation**:

- All required fields must be filled
- File size limits (10MB max)
- Image format validation
- Date validation (future dates only)

### 2. Campaign Submission

When a brand submits a campaign:

1. Form data is validated
2. FormData object is created (handles file upload)
3. Campaign is created via API call
4. Campaign status is set to "pending"
5. Success message is displayed
6. Form is reset for next campaign

### 3. Admin Approval Process

**Location**: `src/components/admin/PendingCampaign.tsx`

**Features**:

- Real-time campaign list
- Detailed campaign information
- Approve/Reject actions
- Loading states during processing
- Error handling

**Admin Actions**:

- **View Details**: See complete campaign information
- **Approve**: Change status to "approved", remove from pending list
- **Reject**: Change status to "rejected", remove from pending list

### 4. Status Updates

When admin approves/rejects a campaign:

1. API call is made to update campaign status
2. Redux store is updated immediately
3. All relevant arrays are synchronized
4. Success/error messages are displayed
5. Lists are refreshed to reflect changes

## Campaign Status Lifecycle

```
[Created] → [Pending] → [Approved] or [Rejected]
                    → [Archived] (future feature)
```

### Status Definitions

- **Pending**: Campaign is awaiting admin approval
- **Approved**: Campaign is live and visible to creators
- **Rejected**: Campaign was declined by admin
- **Archived**: Campaign is completed or archived (future feature)

## API Endpoints

### Campaign Creation

```
POST /api/campaign/create
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body: FormData with campaign details and optional logo file
```

### Get Pending Campaigns (Admin Only)

```
GET /api/campaign/pending
Authorization: Bearer {token}
```

### Get User Campaigns

```
GET /api/campaign/user/{userId}
Authorization: Bearer {token}
```

### Approve Campaign (Admin Only)

```
PATCH /api/campaign/{campaignId}/approve
Authorization: Bearer {token}
```

### Reject Campaign (Admin Only)

```
PATCH /api/campaign/{campaignId}/reject
Authorization: Bearer {token}
```

## User Experience

### For Brands

1. Navigate to "Nova campanha" in the brand dashboard
2. Fill out the comprehensive campaign form
3. Upload campaign logo (optional)
4. Submit campaign
5. See success message with approval notice
6. Campaign appears in "Minhas campanhas" with "Pending" status
7. Receive notification when campaign is approved/rejected

### For Admins

1. Navigate to "Campanhas Pendentes" in admin dashboard
2. See list of all pending campaigns
3. View detailed information for each campaign
4. Approve or reject campaigns with single click
5. See real-time updates as campaigns are processed
6. Track campaign metrics and statistics

## Error Handling

The system includes comprehensive error handling:

- Form validation errors
- API request failures
- Network connectivity issues
- Authentication errors
- File upload errors
- Server-side validation errors

## Security Features

- Role-based access control
- JWT token authentication
- Admin-only endpoints protection
- File upload validation
- Input sanitization
- CSRF protection

## Future Enhancements

- Email notifications for status changes
- Campaign analytics and reporting
- Bulk approval/rejection
- Campaign templates
- Advanced filtering and search
- Campaign scheduling
- Automated approval rules
- Integration with payment systems

## Testing

The system is designed to work with mock data when backend is not available:

- Redux store maintains local state
- API calls gracefully handle failures
- Form validation works independently
- Success/error messages provide user feedback

## File Structure

```
src/
├── api/campaign/
│   └── index.ts                    # Campaign API functions
├── components/
│   ├── admin/
│   │   └── PendingCampaign.tsx     # Admin approval interface
│   └── brand/
│       └── CreateCampaign.tsx      # Campaign creation form
├── store/
│   ├── slices/
│   │   └── campaignSlice.ts        # Campaign state management
│   └── thunks/
│       └── campaignThunks.ts       # Async campaign operations
└── types/
    └── campaign.ts                 # TypeScript type definitions
```

## Getting Started

1. Ensure Redux store is properly configured
2. Set up backend API endpoints
3. Configure authentication system
4. Test campaign creation flow
5. Test admin approval workflow
6. Verify real-time updates work correctly

This system provides a complete, production-ready campaign creation and approval workflow with proper error handling, user feedback, and administrative controls.
