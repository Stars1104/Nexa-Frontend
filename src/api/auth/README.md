# User Management API Documentation

## Overview

This document describes the user management functionality including the `getUser` function for editing user profiles.

## API Functions

### 1. getUser(userId?: string)

Fetches comprehensive user data for profile editing purposes.

**Parameters:**

- `userId` (optional): The ID of the user to fetch. If not provided, fetches the current authenticated user.

**Returns:**

```typescript
{
  success: boolean;
  user: UserProfile;
  message: string;
}
```

**Usage Examples:**

```typescript
import { getUser } from "../api/auth";

// Fetch current user
const currentUser = await getUser();

// Fetch specific user by ID
const specificUser = await getUser("123");
```

### 2. getProfile()

Fetches the current user's profile data.

**Returns:**

```typescript
{
  success: boolean;
  profile: UserProfile;
  message: string;
}
```

### 3. profileUpdate(data: any)

Updates user profile data. Supports both JSON and FormData for file uploads.

**Parameters:**

- `data`: Profile data to update. Can be JSON object or FormData for file uploads.

**Returns:**

```typescript
{
  success: boolean;
  profile: UserProfile;
  message: string;
}
```

## Redux Integration

### Thunks

#### fetchUserForEditing(userId?: string)

Redux thunk for fetching user data for editing purposes.

```typescript
import { fetchUserForEditing } from "../store/thunks/userThunks";

// In a component
const dispatch = useAppDispatch();
await dispatch(fetchUserForEditing("123")).unwrap();
```

#### updateUserProfile(profileData: any)

Redux thunk for updating user profile.

```typescript
import { updateUserProfile } from "../store/thunks/userThunks";

// In a component
const dispatch = useAppDispatch();
await dispatch(updateUserProfile(profileData)).unwrap();
```

## Custom Hook

### useUser()

A custom hook that provides user management functionality.

**Returns:**

```typescript
{
  user: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  fetchUser: (userId?: string) => Promise<void>;
  updateUser: (userData: any) => Promise<void>;
  refreshUser: () => Promise<void>;
}
```

**Usage:**

```typescript
import { useUser } from "../hooks/useUser";

const MyComponent = () => {
  const { user, isLoading, error, fetchUser, updateUser } = useUser();

  useEffect(() => {
    fetchUser(); // Fetch current user
  }, [fetchUser]);

  const handleUpdate = async (data) => {
    try {
      await updateUser(data);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>{user?.name}</h1>
      {/* Your component content */}
    </div>
  );
};
```

## UserProfile Interface

```typescript
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "creator" | "brand" | "admin";
  whatsapp?: string;
  avatar_url?: string;
  bio?: string;
  company_name?: string;
  student_verified?: boolean;
  student_expires_at?: string;
  gender?: string;
  state?: string;
  language?: string;
  has_premium?: boolean;
  premium_expires_at?: string;
  free_trial_expires_at?: string;
}
```

## Example Components

### UserProfileEditor

A complete profile editing component that demonstrates the usage of all user management features.

**Features:**

- Fetch user data on mount
- Edit mode toggle
- Form validation
- File upload support
- Error handling
- Loading states

**Usage:**

```typescript
import { UserProfileEditor } from "../components/UserProfileEditor";

const ProfilePage = () => {
  return (
    <UserProfileEditor
      onSave={(userData) => console.log("Profile saved:", userData)}
      onCancel={() => console.log("Edit cancelled")}
    />
  );
};
```

## Error Handling

All functions include comprehensive error handling:

1. **API Errors**: Network errors, server errors, validation errors
2. **Authentication Errors**: Token expiration, unauthorized access
3. **Validation Errors**: Invalid data format, missing required fields

**Error Response Format:**

```typescript
{
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
```

## Best Practices

1. **Always handle errors**: Use try-catch blocks when calling API functions
2. **Show loading states**: Use the `isLoading` state from hooks
3. **Validate data**: Validate form data before sending to API
4. **Use TypeScript**: Leverage TypeScript interfaces for type safety
5. **Handle authentication**: Check if user is authenticated before making requests
6. **Optimistic updates**: Update UI immediately, then sync with server
7. **Debounce updates**: Debounce frequent updates to avoid excessive API calls

## File Upload

For profile pictures and other file uploads:

```typescript
const handleFileUpload = async (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);
  formData.append("name", "John Doe");

  try {
    await updateUser(formData);
  } catch (error) {
    console.error("Upload failed:", error);
  }
};
```

## Security Considerations

1. **Token Management**: Tokens are automatically included in requests
2. **Input Validation**: Always validate user input on both client and server
3. **File Upload Security**: Validate file types and sizes
4. **Authorization**: Check user permissions before allowing updates
5. **CSRF Protection**: Use appropriate CSRF tokens for state-changing operations

## Testing

Example test for the getUser function:

```typescript
import { getUser } from "../api/auth";

describe("getUser", () => {
  it("should fetch current user when no userId provided", async () => {
    const result = await getUser();
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
  });

  it("should fetch specific user when userId provided", async () => {
    const result = await getUser("123");
    expect(result.success).toBe(true);
    expect(result.user.id).toBe("123");
  });
});
```
