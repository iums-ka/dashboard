# Nextcloud User Integration

This document describes the Nextcloud user integration that fetches user data and avatars for display in the dashboard.

## Backend Components

### Service: `NextcloudUserService.php`

Located in: `backend/app/Services/NextcloudUserService.php`

**Features:**
- Fetches all users from Nextcloud via OCS API
- Retrieves detailed user information (display name, email, quota, etc.)
- Downloads user avatars/profile pictures
- Converts avatars to base64 for easy frontend consumption
- Implements caching (30 minutes) to reduce API load
- Supports cache clearing for specific users or all users

**Key Methods:**
- `getAllUsers($useCache = true)` - Get all Nextcloud users
- `getUserDetails($userId, $useCache = true)` - Get details for a specific user
- `getUserAvatar($userId, $size = 64)` - Get user avatar as binary data
- `getUserAvatarBase64($userId, $size = 64)` - Get avatar as base64 data URL
- `getAllUsersWithAvatars($avatarSize = 64, $useCache = true)` - Get all users with embedded avatars
- `clearCache($userId = null)` - Clear cache for user(s)

### Controller: `NextcloudUserController.php`

Located in: `backend/app/Http/Controllers/NextcloudUserController.php`

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (without avatars) |
| GET | `/api/users/with-avatars` | Get all users with base64 avatars |
| GET | `/api/users/{userId}` | Get specific user details |
| GET | `/api/users/{userId}/avatar` | Get user avatar as image (binary) |
| GET | `/api/users/{userId}/avatar-base64` | Get avatar as base64 JSON |
| POST | `/api/users/cache/clear` | Clear user cache |
| GET | `/api/users/health/check` | Health check for user integration |

**Query Parameters:**
- `cache` (boolean, default: true) - Use cached data
- `size` (int, default: 64, range: 16-512) - Avatar size in pixels
- `user_id` (string, for cache clear) - Specific user to clear cache

**Example Requests:**

```bash
# Get all users with 64px avatars
curl http://localhost:8000/api/users/with-avatars

# Get all users with 128px avatars, bypass cache
curl http://localhost:8000/api/users/with-avatars?size=128&cache=false

# Get specific user details
curl http://localhost:8000/api/users/john.doe

# Get user avatar image (returns binary image)
curl http://localhost:8000/api/users/john.doe/avatar?size=64

# Clear all user cache
curl -X POST http://localhost:8000/api/users/cache/clear

# Clear specific user cache
curl -X POST http://localhost:8000/api/users/cache/clear?user_id=john.doe
```

**Response Format:**

```json
{
  "success": true,
  "data": [
    {
      "id": "john.doe",
      "displayname": "John Doe",
      "email": "john.doe@example.com",
      "quota": {...},
      "enabled": true,
      "avatar": "data:image/png;base64,iVBORw0KGgoAAAANS..."
    }
  ],
  "count": 1,
  "avatar_size": 64,
  "message": "Users with avatars fetched successfully"
}
```

## Frontend Integration

### Component: `Tasks.js`

Located in: `frontend/src/components/Tasks.js`

**Changes Made:**
1. Added `usersData` state to store user information indexed by user ID
2. Added `fetchUsersData()` function to fetch users with avatars
3. Updated `useEffect` to fetch users on initial load and refresh interval
4. Replaced text-based user names with avatar display
5. Added support for multiple user avatars (up to 3 shown, "+N" for overflow)

**User Avatar Display:**
- Displays circular avatars instead of names in task assignments
- Shows up to 3 user avatars inline
- Displays "+N" badge for additional users beyond 3
- Falls back to initials if avatar is unavailable
- Tooltips show full names on hover
- Avatar size: 20px for compact display

**Example Usage:**

The component now automatically:
1. Fetches all users with avatars when mounted
2. Creates a lookup map (userId → userData) for quick access
3. Displays user avatars next to task assignments
4. Shows tooltips with full names on hover
5. Handles missing avatars gracefully with initials

## Environment Configuration

No additional environment variables are required. The service uses existing Nextcloud credentials:

```env
NEXTCLOUD_URL=https://your-nextcloud-server.com
NEXTCLOUD_USERNAME=username
NEXTCLOUD_PASSWORD=password
```

## Caching Strategy

- **Cache Duration:** 30 minutes per user
- **Cache Key Format:** 
  - All users: `nextcloud_users_all`
  - Individual user: `nextcloud_user_{userId}`
- **Cache Provider:** Laravel Cache (default: file)
- **Manual Clear:** Available via `/api/users/cache/clear` endpoint

## Performance Considerations

1. **Initial Load:** Fetching all users + avatars can take time (depends on user count)
2. **Avatar Size:** Smaller avatars (64px) recommended for faster loading
3. **Caching:** 30-minute cache significantly reduces API load
4. **Batch Fetching:** Frontend receives all users at once, no per-task API calls

## Error Handling

- Service logs all API errors to Laravel log
- Controller returns consistent JSON error responses
- Frontend gracefully handles missing user data (shows initials)
- Avatar fetch failures don't break user list (returns null)

## Future Enhancements

Potential improvements:
- [ ] Add user groups/teams support
- [ ] Implement avatar upload/update functionality
- [ ] Add user search/filter in admin interface
- [ ] Support for custom avatar placeholders
- [ ] WebSocket support for real-time user status
- [ ] Lazy loading for large user lists
