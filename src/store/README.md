# Redux State Management Guide

This project uses Redux Toolkit for state management. Here's how to use it effectively:

## Project Structure

```
src/store/
├── index.ts              # Main store configuration
├── hooks.ts              # Typed hooks for Redux
├── slices/
│   ├── authSlice.ts      # Authentication state
│   └── userSlice.ts      # User profile and preferences
└── thunks/
    └── authThunks.ts     # Async actions for authentication
```

## Key Concepts

### 1. Store

The main Redux store is configured in `src/store/index.ts` and wrapped around the app in `App.tsx`.

### 2. Slices

Slices contain the state logic and reducers for specific features:

- `authSlice`: Manages authentication state (user, token, loading, errors)
- `userSlice`: Manages user profile and preferences

### 3. Hooks

Use the typed hooks from `src/store/hooks.ts`:

- `useAppDispatch()`: For dispatching actions
- `useAppSelector()`: For selecting state

### 4. Async Thunks

For API calls and async operations, use `createAsyncThunk`:

- `loginUser`: Handles login API calls
- `logoutUser`: Handles logout

## Usage Examples

### Reading State

```tsx
import { useAppSelector } from "../store/hooks";

const MyComponent = () => {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { profile } = useAppSelector((state) => state.user);

  return (
    <div>{isAuthenticated ? `Welcome, ${user?.name}` : "Please login"}</div>
  );
};
```

### Dispatching Actions

```tsx
import { useAppDispatch } from "../store/hooks";
import { loginUser } from "../store/thunks/authThunks";
import { updateProfile } from "../store/slices/userSlice";

const MyComponent = () => {
  const dispatch = useAppDispatch();

  const handleLogin = async () => {
    try {
      await dispatch(loginUser({ email, password })).unwrap();
      // Login successful
    } catch (error) {
      // Handle error
    }
  };

  const handleUpdateProfile = () => {
    dispatch(updateProfile({ name: "New Name" }));
  };
};
```

### Creating New Slices

```tsx
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface MyState {
  data: any[];
  loading: boolean;
  error: string | null;
}

const initialState: MyState = {
  data: [],
  loading: false,
  error: null,
};

const mySlice = createSlice({
  name: "myFeature",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setData: (state, action: PayloadAction<any[]>) => {
      state.data = action.payload;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export const { setLoading, setData, setError } = mySlice.actions;
export default mySlice.reducer;
```

### Creating Async Thunks

```tsx
import { createAsyncThunk } from "@reduxjs/toolkit";

export const fetchData = createAsyncThunk(
  "myFeature/fetchData",
  async (_, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const response = await fetch("/api/data");
      const data = await response.json();
      dispatch(setData(data));
      return data;
    } catch (error) {
      dispatch(setError("Failed to fetch data"));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);
```

## Best Practices

1. **Use TypeScript**: Always define proper types for your state and actions
2. **Keep Slices Focused**: Each slice should handle one specific feature
3. **Use Async Thunks**: For API calls and complex async operations
4. **Normalize State**: For complex data structures, consider normalizing your state
5. **Use Redux DevTools**: Enable in development for debugging
6. **Avoid Mutations**: Redux Toolkit uses Immer, so you can write "mutative" code that's actually immutable

## Redux DevTools

Install the Redux DevTools browser extension to:

- Inspect state changes
- Time-travel debugging
- Action replay
- State persistence

The DevTools are automatically enabled in development mode.

## Migration from Other State Management

If you're migrating from React Query or other state management:

1. Keep React Query for server state (API data)
2. Use Redux for client state (UI state, user preferences, etc.)
3. Consider using RTK Query for API state management if needed
