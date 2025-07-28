# Environment Setup for Nexa Frontend

## Backend URL Configuration

The frontend application now uses environment variables to configure the backend URL instead of hardcoded localhost:8000 values.

### Required Environment Variables

Create a `.env` file in the `Nexa-Frontend` directory with the following variables:

```env
VITE_BACKEND_URL=http://localhost:8000
```

### Environment Variable Usage

The application uses `VITE_BACKEND_URL` in the following ways:

1. **API Client Configuration**: The main API client uses this URL for all API requests
2. **Image URLs**: All image sources (logos, avatars, portfolio items) use this URL
3. **File Downloads**: File download links use this URL
4. **Test Scripts**: Test files also use this environment variable

### Fallback Behavior

If `VITE_BACKEND_URL` is not set, the application will fall back to `http://localhost:8000` as the default backend URL.

### Development vs Production

- **Development**: Set to your local backend URL (e.g., `http://localhost:8000`)
- **Production**: Set to your production backend URL (e.g., `https://api.yourapp.com`)

### Files Updated

The following files have been updated to use the environment variable:

#### API Files

- `src/api/auth/index.ts`
- `src/api/auth/googleAuth.ts`
- `src/api/auth/pagarmeAuth.ts`
- `src/api/campaign/index.ts`
- `src/api/notification/index.ts`
- `src/api/payment/index.ts`
- `src/services/apiClient.ts`

#### Components

- `src/components/admin/CampaignDetail.tsx`
- `src/components/brand/AllowedCampaigns.tsx`
- `src/components/brand/ViewApplication.tsx`
- `src/components/creator/CampaignCard.tsx`
- `src/components/creator/CreatorProfile.tsx`
- `src/components/creator/Portfolio.tsx`
- `src/components/creator/ProjectDetail.tsx`
- `src/components/ui/CampaignLogo.tsx`
- `src/pages/brand/ChatPage.tsx`

#### Test Files

- `test-admin-api.js`
- `test-portfolio.js`
- `test-subscription.js`

### Example Usage

```typescript
// Before (hardcoded)
const backendUrl = "http://localhost:8000";

// After (environment variable)
const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
```

### Vite Environment Variables

Note that Vite requires environment variables to be prefixed with `VITE_` to be exposed to the client-side code. This is why we use `VITE_BACKEND_URL` instead of just `BACKEND_URL`.

### Security Considerations

- The backend URL is exposed to the client-side code, which is normal for frontend applications
- Make sure your backend has proper CORS configuration for the frontend domain
- Use HTTPS in production environments
