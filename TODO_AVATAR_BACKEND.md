# TODO: Replace Mock Avatars with Backend Integration

## Current State (Mock Implementation)

The Tasks component currently uses **local static images** from `/frontend/public/` for user avatars.

### Location
File: `frontend/src/components/Tasks.js`

### Mock Implementation
- `USER_AVATAR_MAP` object maps first names (lowercase) to avatar files
- `getLocalAvatar()` function matches users to local images
- No backend API calls for user data

### Available Avatar Images
Located in `frontend/public/`:
- avatar.ethan.png
- avatar.jonas.jpg
- avatar.leon.png
- avatar.lukas.png
- avatar.marie.png
- avatar.marit.png
- avatar.riem.png
- avatar.thomas.png
- avatar.waldemar.png

## Proper Implementation (To-Do)

When you have time, replace the mock with the actual backend integration:

### Backend (Already Complete ✓)
- Service: `NextcloudUserService.php` - fetches users and avatars from Nextcloud
- Controller: `NextcloudUserController.php` - exposes API endpoints
- Endpoint: `GET /api/users/with-avatars?size=64` - returns all users with base64 avatars
- Debug endpoint: `GET /api/users/debug` - shows user data structure

### Frontend Changes Needed

1. **Uncomment/Restore User Data Fetching** (around line 55):
```javascript
// User data with avatars
const [usersData, setUsersData] = useState({});

// Fetch users with avatars from Laravel backend
const fetchUsersData = useCallback(async () => {
  // ... fetch from /api/users/with-avatars
}, []);
```

2. **Update useEffect** to call fetchUsersData:
```javascript
useEffect(() => {
  fetchTasksData();
  fetchUsersData();  // Add this back
  // ...
}, [fetchTasksData, fetchUsersData]);
```

3. **Replace `getLocalAvatar()` with backend lookup** (around line 750):
```javascript
// Replace:
const avatarSrc = getLocalAvatar(user);

// With:
const userId = user.uid || user.id || user.username;
let userData = usersData[userId];
// Try multiple ID variations...
const avatarSrc = userData?.avatar;
```

4. **Remove Mock Code**:
   - Delete `USER_AVATAR_MAP` constant
   - Delete `getLocalAvatar()` function

### Testing the Backend

```bash
# Test user endpoint
curl http://localhost:8000/api/users/with-avatars

# Debug user data structure
curl http://localhost:8000/api/users/debug

# Clear cache to refresh
curl -X POST http://localhost:8000/api/users/cache/clear
```

### Troubleshooting

If avatars don't show after backend integration:

1. Check browser console for user ID mismatches
2. Call `/api/users/debug` to see user data structure
3. Verify Nextcloud credentials in `.env`
4. Check Laravel logs: `backend/storage/logs/laravel.log`

### User ID Matching Strategy

The backend service tries multiple ID formats:
- Primary: `user.id` or `user.userid`
- Fallback: `user.displayname`, `user.email` prefix

Frontend tries multiple lookups:
- `user.uid`, `user.id`, `user.username`
- `user.primaryKey`
- `user.displayName`, `user.displayname`

If IDs still don't match, check the debug logs to see the exact format of user IDs in tasks vs. users API.

## Estimated Implementation Time
- 15-30 minutes to switch from mock to backend
- Additional time if debugging ID mismatches needed
