# Admin User Management Implementation

## Overview

This document describes the implementation of the admin user management system for the Nexa platform. The system allows administrators to view, filter, and manage users (creators and brands) through a comprehensive admin interface.

## Backend Implementation

### 1. Admin Controller (`backend/app/Http/Controllers/AdminController.php`)

The `AdminController` provides the following endpoints:

#### Endpoints

- `GET /api/admin/users` - Get all users with filtering and pagination
- `GET /api/admin/users/creators` - Get creators with enhanced data
- `GET /api/admin/users/brands` - Get brands with enhanced data
- `GET /api/admin/users/statistics` - Get user statistics
- `PATCH /api/admin/users/{user}/status` - Update user status (activate, block, remove)

#### Features

- **Role-based filtering**: Filter users by role (creator/brand)
- **Status filtering**: Filter by account status (active, blocked, removed, pending)
- **Search functionality**: Search by name, email, or company name
- **Pagination**: Configurable page size and navigation
- **User statistics**: Comprehensive platform statistics
- **User management**: Activate, block, or remove users

### 2. Admin Middleware (`backend/app/Http/Middleware/AdminMiddleware.php`)

Protects admin routes by ensuring only users with admin role can access them.

### 3. Database Updates

#### User Model Updates

- Added `email_verified_at` to fillable array
- Added `SoftDeletes` trait for user removal functionality
- Added `deleted_at` column via migration

#### Migration: `2025_07_20_194632_add_soft_deletes_to_users_table.php`

- Adds `deleted_at` column for soft deletes

### 4. API Routes (`backend/routes/api.php`)

```php
// Admin routes
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::prefix('admin')->group(function () {
        Route::get('/users', [AdminController::class, 'getUsers']);
        Route::get('/users/creators', [AdminController::class, 'getCreators']);
        Route::get('/users/brands', [AdminController::class, 'getBrands']);
        Route::get('/users/statistics', [AdminController::class, 'getUserStatistics']);
        Route::patch('/users/{user}/status', [AdminController::class, 'updateUserStatus']);
    });
});
```

## Frontend Implementation

### 1. Admin API Service (`nexa/src/api/admin/index.ts`)

Provides TypeScript interfaces and API methods for admin operations:

#### Interfaces

- `AdminUser` - Creator user data structure
- `AdminBrand` - Brand user data structure
- `PaginationData` - Pagination information
- `UserStatistics` - Platform statistics
- `UsersResponse` - API response structure

#### API Methods

- `getUsers()` - Get all users with filtering
- `getCreators()` - Get creators only
- `getBrands()` - Get brands only
- `getUserStatistics()` - Get platform statistics
- `updateUserStatus()` - Update user status

### 2. Updated UserList Component (`nexa/src/components/admin/UserList.tsx`)

#### Key Features

- **Real-time data**: Fetches data from backend API instead of mock data
- **Loading states**: Shows loading spinner during API calls
- **Error handling**: Displays error messages with retry functionality
- **User actions**: Activate, block, and remove users
- **Responsive design**: Works on mobile and desktop
- **Dark mode support**: Full dark mode compatibility

#### Data Flow

1. Component mounts → Fetches data based on active tab
2. Tab changes → Fetches new data for selected role
3. Pagination changes → Fetches data for new page
4. User actions → Calls API and refreshes data

## Data Structure

### Creator User Data

```typescript
{
  id: number;
  name: string;
  email: string;
  status: string; // "Criador", "Marca", or "Pagante"
  statusColor: string; // CSS classes for styling
  time: string; // "3 meses", "Ilimitado", etc.
  campaigns: string; // "12 aplicadas / 5 aprovadas"
  accountStatus: string; // "Ativo", "Bloqueado", "Removido", "Pendente"
  created_at: string;
  email_verified_at: string | null;
  has_premium: boolean;
  student_verified: boolean;
  premium_expires_at: string | null;
  free_trial_expires_at: string | null;
}
```

### Brand User Data

```typescript
{
  id: number;
  company: string;
  brandName: string;
  email: string;
  status: string; // "Marca" or "Pagante"
  statusColor: string; // CSS classes for styling
  campaigns: number; // Number of campaigns created
  accountStatus: string;
  created_at: string;
  email_verified_at: string | null;
  has_premium: boolean;
  premium_expires_at: string | null;
  free_trial_expires_at: string | null;
}
```

## User Status Logic

### Account Status Determination

- **Ativo**: User has verified email (`email_verified_at` is set)
- **Bloqueado**: User has no verified email and account is older than 30 days
- **Removido**: User has been soft deleted (`deleted_at` is set)
- **Pendente**: User has no verified email and account is newer than 30 days

### User Type Status

- **Criador**: User with creator role (`role = 'creator'`)
- **Marca**: User with brand role (`role = 'brand'`)
- **Pagante**: User with premium access (`has_premium = true`) - overrides role display

### Time Status

- **Ilimitado**: Premium user with no expiration date
- **X meses**: Based on premium expiration or account creation date

## Testing

### Backend Tests (`backend/tests/Feature/AdminControllerTest.php`)

- Tests all admin endpoints
- Verifies authentication and authorization
- Tests user status updates
- Ensures proper data transformation

### API Test Script (`test-admin-api.js`)

- End-to-end API testing
- Verifies all endpoints work correctly
- Tests user management actions

## Security

### Authentication

- All admin endpoints require authentication via Sanctum
- Admin middleware ensures only admin users can access endpoints

### Authorization

- Admin middleware checks user role
- Returns 403 Forbidden for non-admin users

### Data Protection

- Soft deletes prevent data loss
- Email verification status controls account access
- Premium status tracking for feature access

## Usage Examples

### Getting All Users

```typescript
const response = await adminApi.getUsers({
  per_page: 10,
  page: 1,
  search: "john",
  status: "active",
});
```

### Updating User Status

```typescript
await adminApi.updateUserStatus(userId, "activate");
await adminApi.updateUserStatus(userId, "block");
await adminApi.updateUserStatus(userId, "remove");
```

### Getting Statistics

```typescript
const stats = await adminApi.getUserStatistics();
console.log(`Total users: ${stats.data.total_users}`);
console.log(`Creators: ${stats.data.creators}`);
console.log(`Brands: ${stats.data.brands}`);
```

## Future Enhancements

1. **Advanced Filtering**: Add more filter options (date range, premium status, etc.)
2. **Bulk Actions**: Allow multiple user selection and bulk operations
3. **User Analytics**: Add detailed user activity and engagement metrics
4. **Export Functionality**: Export user data to CSV/Excel
5. **Audit Log**: Track admin actions for compliance
6. **User Communication**: Send notifications or messages to users
7. **Role Management**: Allow admins to change user roles

## Deployment Notes

1. Run migrations: `php artisan migrate`
2. Seed database: `php artisan db:seed`
3. Ensure admin user exists with role = 'admin'
4. Test API endpoints before deploying to production
5. Configure proper CORS settings for frontend communication

## API Documentation

### Authentication

All requests require Bearer token in Authorization header:

```
Authorization: Bearer <token>
```

### Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 10,
    "total": 50,
    "from": 1,
    "to": 10
  }
}
```

### Error Responses

```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": ["Validation error"]
  }
}
```
