<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\NextcloudUserService;
use Illuminate\Support\Facades\Log;

class NextcloudUserController extends Controller
{
    private NextcloudUserService $userService;

    public function __construct(NextcloudUserService $userService)
    {
        $this->userService = $userService;
    }

    /**
     * Get all users from Nextcloud
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $useCache = $request->get('cache', 'true') !== 'false';
            
            Log::info('User list request received', [
                'use_cache' => $useCache
            ]);

            $users = $this->userService->getAllUsers($useCache);

            return response()->json([
                'success' => true,
                'data' => $users,
                'count' => count($users),
                'message' => 'Users fetched successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch users', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch users from Nextcloud',
                'message' => 'Unable to retrieve users. Please check your Nextcloud connection.',
                'details' => config('app.debug') ? $e->getMessage() : null
            ], 503);
        }
    }

    /**
     * Get all users with their avatars (base64 encoded)
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function indexWithAvatars(Request $request)
    {
        try {
            $useCache = $request->get('cache', 'true') !== 'false';
            $avatarSize = (int) $request->get('size', 64);
            
            // Validate avatar size
            if ($avatarSize < 16 || $avatarSize > 512) {
                $avatarSize = 64;
            }
            
            Log::info('User list with avatars request received', [
                'use_cache' => $useCache,
                'avatar_size' => $avatarSize
            ]);

            $users = $this->userService->getAllUsersWithAvatars($avatarSize, $useCache);

            return response()->json([
                'success' => true,
                'data' => $users,
                'count' => count($users),
                'avatar_size' => $avatarSize,
                'message' => 'Users with avatars fetched successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch users with avatars', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch users with avatars from Nextcloud',
                'message' => 'Unable to retrieve users. Please check your Nextcloud connection.',
                'details' => config('app.debug') ? $e->getMessage() : null
            ], 503);
        }
    }

    /**
     * Get details for a specific user
     * 
     * @param Request $request
     * @param string $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Request $request, string $userId)
    {
        try {
            $useCache = $request->get('cache', 'true') !== 'false';
            
            Log::info('User details request received', [
                'user_id' => $userId,
                'use_cache' => $useCache
            ]);

            $user = $this->userService->getUserDetails($userId, $useCache);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => 'User not found',
                    'message' => "User '{$userId}' not found in Nextcloud"
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $user,
                'message' => 'User details fetched successfully'
            ]);

        } catch (\Exception $e) {
            Log::error("Failed to fetch user details for {$userId}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch user details from Nextcloud',
                'message' => 'Unable to retrieve user details. Please check your Nextcloud connection.',
                'details' => config('app.debug') ? $e->getMessage() : null
            ], 503);
        }
    }

    /**
     * Get user avatar/profile picture
     * 
     * @param Request $request
     * @param string $userId
     * @return \Illuminate\Http\Response|\Illuminate\Http\JsonResponse
     */
    public function avatar(Request $request, string $userId)
    {
        try {
            $size = (int) $request->get('size', 64);
            
            // Validate avatar size
            if ($size < 16 || $size > 512) {
                $size = 64;
            }
            
            Log::info('User avatar request received', [
                'user_id' => $userId,
                'size' => $size
            ]);

            $avatar = $this->userService->getUserAvatar($userId, $size);

            return response($avatar['content'])
                ->header('Content-Type', $avatar['content_type'])
                ->header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

        } catch (\Exception $e) {
            Log::error("Failed to fetch avatar for user {$userId}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch user avatar from Nextcloud',
                'message' => 'Unable to retrieve user avatar. Please check your Nextcloud connection.',
                'details' => config('app.debug') ? $e->getMessage() : null
            ], 503);
        }
    }

    /**
     * Get user avatar as base64 encoded string
     * 
     * @param Request $request
     * @param string $userId
     * @return \Illuminate\Http\JsonResponse
     */
    public function avatarBase64(Request $request, string $userId)
    {
        try {
            $size = (int) $request->get('size', 64);
            
            // Validate avatar size
            if ($size < 16 || $size > 512) {
                $size = 64;
            }
            
            Log::info('User avatar (base64) request received', [
                'user_id' => $userId,
                'size' => $size
            ]);

            $avatarBase64 = $this->userService->getUserAvatarBase64($userId, $size);

            if (!$avatarBase64) {
                return response()->json([
                    'success' => false,
                    'error' => 'Avatar not found',
                    'message' => "Avatar for user '{$userId}' could not be retrieved"
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'user_id' => $userId,
                    'avatar' => $avatarBase64,
                    'size' => $size
                ],
                'message' => 'User avatar fetched successfully'
            ]);

        } catch (\Exception $e) {
            Log::error("Failed to fetch base64 avatar for user {$userId}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch user avatar from Nextcloud',
                'message' => 'Unable to retrieve user avatar. Please check your Nextcloud connection.',
                'details' => config('app.debug') ? $e->getMessage() : null
            ], 503);
        }
    }

    /**
     * Clear user cache
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function clearCache(Request $request)
    {
        try {
            $userId = $request->get('user_id');
            
            $this->userService->clearCache($userId);

            return response()->json([
                'success' => true,
                'message' => $userId 
                    ? "Cache cleared for user: {$userId}" 
                    : 'All user cache cleared successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to clear user cache', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to clear user cache',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Health check for Nextcloud user integration
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function health()
    {
        try {
            // Try to fetch users to verify connection
            $users = $this->userService->getAllUsers(false);
            
            return response()->json([
                'success' => true,
                'status' => 'healthy',
                'users_count' => count($users),
                'message' => 'Nextcloud user integration is working correctly',
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
                'message' => 'Nextcloud user integration is not working',
                'timestamp' => now()->toISOString()
            ], 503);
        }
    }

    /**
     * Debug endpoint - Get sample user data structure
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function debug()
    {
        try {
            $users = $this->userService->getAllUsersWithAvatars(64, false);
            
            // Return first 3 users as sample
            $sampleUsers = array_slice($users, 0, 3);
            
            // Extract just the structure info (no avatar data to keep response small)
            $structure = array_map(function($user) {
                return [
                    'id' => $user['id'] ?? null,
                    'userid' => $user['userid'] ?? null,
                    'displayname' => $user['displayname'] ?? null,
                    'email' => $user['email'] ?? null,
                    'has_avatar' => isset($user['avatar']) && $user['avatar'] !== null,
                    'available_fields' => array_keys($user)
                ];
            }, $sampleUsers);

            return response()->json([
                'success' => true,
                'total_users' => count($users),
                'sample_count' => count($structure),
                'samples' => $structure,
                'message' => 'Debug info for user data structure'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
                'message' => 'Failed to fetch debug information'
            ], 500);
        }
    }
}
