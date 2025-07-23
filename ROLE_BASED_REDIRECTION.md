# Role-Based Redirection System

This document explains how the role-based redirection system works in the Nexa application.

## Overview

The application implements a comprehensive role-based redirection system that automatically directs users to their appropriate dashboard based on their role after signup or login.

## User Roles

The application supports the following user roles:

- **Creator**: Content creators and influencers
- **Brand**: Companies and businesses
- **Admin**: Platform administrators
- **Student**: Special creator role for students (requires verification)

## Authentication Flow

### 1. Initial Role Selection

Users start at `/auth` where they choose their account type:

- **Sou uma empresa** → `/signup/brand`
- **Sou um influenciador** → `/signup/creator`

### 2. Signup Process

Users fill out the signup form at `/signup/:role` with the following fields:

- Name
- Email
- WhatsApp
- Password
- Confirm Password
- Student checkbox (only for creators)

### 3. Role-Based Redirection After Signup

After successful signup, users are automatically redirected based on their role:

#### Creator Users

- **Regular creators**: Redirected to `/creator`
- **Student creators**: Redirected to `/student-verify` for verification

#### Brand Users

- Redirected to `/brand`

#### Admin Users

- Redirected to `/admin`
- Note: Admin users are typically created by other admins, not through public signup

### 4. Student Verification Flow

Students must complete additional verification:

1. Redirected to `/student-verify` after signup
2. Fill out academic information
3. After verification, redirected to `/creator` dashboard

## Implementation Details

### Key Components

#### 1. ProtectedRoute Component

Enhanced with role-based access control:

```typescript
<ProtectedRoute allowedRoles={["creator", "student"]}>
  <CreatorIndex />
</ProtectedRoute>
```

#### 2. useRoleNavigation Hook

Centralized navigation logic:

```typescript
const { navigateToRoleDashboard, navigateToStudentVerification } =
  useRoleNavigation();
```

#### 3. Role-Based Routing in App.tsx

```typescript
// Creator routes (accessible by creators and students)
<Route path="/creator" element={
  <ProtectedRoute allowedRoles={['creator', 'student']}>
    <CreatorIndex />
  </ProtectedRoute>
} />

// Brand routes (accessible only by brands)
<Route path="/brand" element={
  <ProtectedRoute allowedRoles={['brand']}>
    <BrandIndex />
  </ProtectedRoute>
} />

// Admin routes (accessible only by admins)
<Route path="/admin" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminIndex />
  </ProtectedRoute>
} />
```

### Redirection Logic

The redirection logic is implemented in `CreatorSignUp.tsx`:

```typescript
useEffect(() => {
  if (isAuthenticated && user) {
    // Handle student verification flow
    if (user.isStudent && user.role === "creator") {
      navigateToStudentVerification();
    } else {
      // Check if there's a redirect location from ProtectedRoute
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        navigateToRoleDashboard(user.role);
      }
    }
  }
}, [
  isAuthenticated,
  user,
  role,
  navigateToRoleDashboard,
  navigateToStudentVerification,
  location,
]);
```

## Dashboard URLs

- **Creator Dashboard**: `/creator`
- **Brand Dashboard**: `/brand`
- **Admin Dashboard**: `/admin`
- **Student Verification**: `/student-verify`

## Security Features

1. **Role-Based Access Control**: Users can only access routes appropriate for their role
2. **Automatic Redirection**: Users are automatically redirected if they try to access unauthorized routes
3. **Session Persistence**: User roles and authentication state are persisted across sessions
4. **Protected Routes**: All dashboard routes are protected and require authentication

## Testing

The role-based redirection system is thoroughly tested with the following scenarios:

1. Creator signup → Creator dashboard
2. Brand signup → Brand dashboard
3. Student creator signup → Student verification → Creator dashboard
4. Unauthorized access attempts → Automatic redirection to appropriate dashboard
5. Login with existing accounts → Role-appropriate dashboard

## Future Enhancements

1. **Multi-role Support**: Allow users to have multiple roles
2. **Role Upgrade Flow**: Allow users to upgrade their role (e.g., student to creator)
3. **Custom Redirect URLs**: Allow configuration of custom redirect URLs per role
4. **Role-Based Features**: Implement role-specific features and UI elements
