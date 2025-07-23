# Frontend Google OAuth Implementation

This document describes the frontend Google OAuth implementation for the Nexa application.

## Overview

The frontend Google OAuth implementation provides a seamless sign-in and sign-up experience using Google accounts. It integrates with the backend OAuth system and supports role-based authentication.

## Dependencies

- `@react-oauth/google` - Google OAuth React library
- `axios` - HTTP client for API calls
- `react-redux` - State management
- `react-router-dom` - Routing

## Components

### 1. GoogleOAuthButton

**File:** `src/components/GoogleOAuthButton.tsx`

A reusable button component for Google OAuth authentication.

**Props:**

```typescript
interface GoogleOAuthButtonProps {
  role?: "creator" | "brand";
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
  disabled?: boolean;
}
```

**Usage:**

```tsx
<GoogleOAuthButton role="creator" variant="outline" disabled={isLoading}>
  Continue with Google
</GoogleOAuthButton>
```

### 2. GoogleOAuthCallback

**File:** `src/components/GoogleOAuthCallback.tsx`

Handles the OAuth callback from Google and processes the authentication response.

**Features:**

- Loading, success, and error states
- Automatic navigation to appropriate dashboard
- Error handling with retry options
- Toast notifications

## Services

### Google OAuth API Service

**File:** `src/api/auth/googleAuth.ts`

Provides functions for Google OAuth operations:

#### `getGoogleOAuthURL()`

Gets the Google OAuth authorization URL from the backend.

#### `handleGoogleCallback(code: string)`

Handles the OAuth callback with authorization code.

#### `handleGoogleAuthWithRole(role: 'creator' | 'brand')`

Handles OAuth with specific role assignment.

#### `initiateGoogleOAuth(role?: 'creator' | 'brand')`

Initiates the OAuth flow with optional role selection.

#### `handleOAuthCallback()`

Handles OAuth callback from URL parameters.

## Redux Integration

### Thunks

**File:** `src/store/thunks/authThunks.ts`

#### `initiateGoogleOAuthFlow(role?: 'creator' | 'brand')`

Initiates the Google OAuth flow.

#### `handleGoogleOAuthCallback()`

Handles the OAuth callback and updates authentication state.

### State Management

The Google OAuth flow integrates with the existing authentication state:

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
```

## OAuth Flow

### 1. User Clicks Google Button

```tsx
<GoogleOAuthButton role="creator" onClick={handleGoogleOAuth} />
```

### 2. OAuth Initiation

```typescript
const handleGoogleOAuth = async () => {
  try {
    await dispatch(initiateGoogleOAuthFlow(role)).unwrap();
  } catch (error) {
    toast.error("Failed to initiate Google sign-in");
  }
};
```

### 3. Redirect to Google

The user is redirected to Google's OAuth authorization page.

### 4. Google Callback

Google redirects back to `/auth/google/callback` with authorization code.

### 5. Process Callback

```typescript
const handleCallback = async () => {
  const urlParams = new URLSearchParams(location.search);
  const code = urlParams.get("code");

  if (code) {
    const result = await dispatch(handleGoogleOAuthCallback()).unwrap();
    // Navigate to dashboard
  }
};
```

### 6. Authentication Complete

User is authenticated and redirected to appropriate dashboard based on role.

## Routes

### OAuth Callback Route

```tsx
<Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
```

This route handles the OAuth callback and processes the authentication.

## Integration with Existing Auth

### CreatorSignUp Component

The Google OAuth button is integrated into the existing sign-up/sign-in form:

```tsx
// Sign-up section
<GoogleOAuthButton
  role={role as 'creator' | 'brand'}
  disabled={isSigningUp}
  className="py-2 text-base font-medium rounded-full"
>
  Continuar com o Google
</GoogleOAuthButton>

// Sign-in section
<GoogleOAuthButton
  role={role as 'creator' | 'brand'}
  disabled={isLoading}
  className="py-2 text-base font-medium rounded-full"
>
  Continuar com o Google
</GoogleOAuthButton>
```

## Error Handling

### OAuth Errors

- **Invalid OAuth Code**: Redirects to auth page with error message
- **Google API Errors**: Displays error toast and retry options
- **Network Errors**: Shows network error message
- **Authentication Failures**: Handles backend authentication errors

### User Experience

- Loading states during OAuth process
- Success notifications
- Error messages with retry options
- Automatic navigation on success
- Graceful fallback on errors

## Security Features

### Token Management

- Secure token storage in Redux state
- Automatic token validation
- Token refresh handling
- Secure logout process

### OAuth Security

- Stateless OAuth flow
- Secure callback handling
- Role validation
- Session management

## Styling

### Google Button Styling

The Google OAuth button uses the official Google branding:

```tsx
<svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
  {/* Google logo SVG paths */}
</svg>
```

### Responsive Design

- Mobile-friendly button sizing
- Consistent styling with existing UI
- Dark mode support
- Accessibility features

## Testing

### Component Testing

```tsx
// Test Google OAuth button
test("GoogleOAuthButton renders correctly", () => {
  render(<GoogleOAuthButton role="creator" />);
  expect(screen.getByText("Continue with Google")).toBeInTheDocument();
});

// Test OAuth callback
test("GoogleOAuthCallback handles success", async () => {
  // Mock OAuth success response
  // Test navigation and state updates
});
```

### Integration Testing

- Test complete OAuth flow
- Test error scenarios
- Test role-based navigation
- Test token management

## Environment Configuration

### Required Environment Variables

```env
VITE_BACKEND_URL=http://localhost:8000
```

### Google Console Configuration

1. **Authorized JavaScript Origins:**

   - `http://localhost:5000` (development)
   - `https://yourdomain.com` (production)

2. **Authorized Redirect URIs:**
   - `http://localhost:5000/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)

## Production Considerations

### Security

- HTTPS enforcement
- Secure cookie settings
- CSRF protection
- Rate limiting

### Performance

- Lazy loading of OAuth components
- Optimized bundle size
- Caching strategies
- Error boundary implementation

### Monitoring

- OAuth success/failure tracking
- User journey analytics
- Error monitoring
- Performance metrics

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**

   - Check Google Console configuration
   - Verify environment variables

2. **"OAuth error"**

   - Check network connectivity
   - Verify backend OAuth setup

3. **"Authentication failed"**
   - Check backend logs
   - Verify user role assignment

### Debug Mode

Enable debug logging:

```typescript
console.log("OAuth flow:", { step, data });
```

## Best Practices

### Code Organization

- Separate OAuth logic from UI components
- Use TypeScript for type safety
- Implement proper error boundaries
- Follow React best practices

### User Experience

- Clear loading states
- Informative error messages
- Smooth navigation flow
- Consistent branding

### Security

- Validate all OAuth responses
- Implement proper session management
- Use secure token storage
- Follow OAuth 2.0 best practices

## Future Enhancements

### Planned Features

1. **Social Login Expansion**

   - Facebook OAuth
   - Apple Sign-In
   - GitHub OAuth

2. **Advanced Features**

   - OAuth token refresh
   - Multi-account support
   - OAuth account linking

3. **Analytics**
   - OAuth conversion tracking
   - User behavior analytics
   - A/B testing support
