<?php

namespace App\Services;

use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

/**
 * Service for Nextcloud User API integration.
 * 
 * Handles fetching user details and avatars from Nextcloud.
 */
class NextcloudUserService extends NextcloudBaseService
{
    /**
     * Cache duration in seconds (30 minutes).
     */
    private const CACHE_DURATION = 1800;

    /**
     * Get all users from Nextcloud.
     *
     * @param bool $useCache Whether to use cached data
     * @return array
     * @throws \Exception
     */
    public function getAllUsers(bool $useCache = true): array
    {
        $cacheKey = 'nextcloud_users_all';

        if ($useCache && Cache::has($cacheKey)) {
            Log::info('Returning cached Nextcloud users data');
            return Cache::get($cacheKey);
        }

        $data = $this->makeGetRequest(
            '/ocs/v1.php/cloud/users?format=json',
            [],
            'Users List'
        );

        if (!isset($data['ocs']['data']['users'])) {
            throw new \Exception('Invalid response format from Nextcloud Users API');
        }

        $userIds = $data['ocs']['data']['users'];
        $users = $this->fetchUserDetails($userIds);

        Log::info('Nextcloud Users fetched', [
            'users_count' => count($users)
        ]);

        Cache::put($cacheKey, $users, self::CACHE_DURATION);

        return $users;
    }

    /**
     * Fetch detailed information for multiple users.
     *
     * @param array $userIds
     * @return array
     */
    private function fetchUserDetails(array $userIds): array
    {
        $users = [];

        foreach ($userIds as $userId) {
            try {
                $userDetails = $this->getUserDetails($userId, false);
                if ($userDetails) {
                    if (!isset($userDetails['id'])) {
                        $userDetails['id'] = $userId;
                    }
                    $users[] = $userDetails;
                }
            } catch (\Exception $e) {
                Log::warning("Failed to fetch details for user: {$userId}", [
                    'error' => $e->getMessage()
                ]);
                // Add basic user info even if details fail
                $users[] = [
                    'id' => $userId,
                    'displayname' => $userId,
                    'email' => null,
                    'quota' => null,
                    'enabled' => true
                ];
            }
        }

        return $users;
    }

    /**
     * Get detailed information for a specific user.
     *
     * @param string $userId
     * @param bool $useCache Whether to use cached data
     * @return array|null
     * @throws \Exception
     */
    public function getUserDetails(string $userId, bool $useCache = true): ?array
    {
        $cacheKey = "nextcloud_user_{$userId}";

        if ($useCache && Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }

        try {
            $data = $this->makeGetRequest(
                '/ocs/v1.php/cloud/users/' . urlencode($userId) . '?format=json',
                [],
                'User Details'
            );

            if (!isset($data['ocs']['data'])) {
                return null;
            }

            $userDetails = $data['ocs']['data'];

            // Normalize the user data - ensure 'id' field exists
            if (!isset($userDetails['id'])) {
                $userDetails['id'] = $userId;
            }

            Cache::put($cacheKey, $userDetails, self::CACHE_DURATION);

            return $userDetails;

        } catch (\Exception $e) {
            Log::error("Failed to fetch user details for {$userId}", [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get user avatar/profile picture.
     *
     * @param string $userId
     * @param int $size Avatar size in pixels (default: 64)
     * @return array Contains 'content' (binary data) and 'content_type'
     * @throws \Exception
     */
    public function getUserAvatar(string $userId, int $size = 64): array
    {
        $avatarUrl = $this->buildUrl('/index.php/avatar/' . urlencode($userId) . '/' . $size);

        Log::info('Fetching Nextcloud User Avatar', [
            'url' => $avatarUrl,
            'user_id' => $userId,
            'size' => $size
        ]);

        try {
            $response = $this->client->get($avatarUrl, [
                'auth' => $this->getAuthConfig(),
                'headers' => [
                    'User-Agent' => self::USER_AGENT
                ]
            ]);

            $statusCode = $response->getStatusCode();

            if ($statusCode !== 200) {
                throw new \Exception("Failed to fetch avatar: HTTP {$statusCode}");
            }

            $content = $response->getBody()->getContents();
            $contentType = $response->getHeader('Content-Type')[0] ?? 'image/png';

            Log::info('Successfully fetched user avatar', [
                'user_id' => $userId,
                'size' => $size,
                'content_type' => $contentType,
                'content_length' => strlen($content)
            ]);

            return [
                'content' => $content,
                'content_type' => $contentType
            ];

        } catch (GuzzleException $e) {
            Log::error("Failed to fetch avatar for user {$userId}", [
                'error' => $e->getMessage(),
                'size' => $size
            ]);
            throw new \Exception("Failed to fetch user avatar: " . $e->getMessage());
        }
    }

    /**
     * Get user avatar as base64 encoded string.
     *
     * @param string $userId
     * @param int $size Avatar size in pixels (default: 64)
     * @return string|null Base64 encoded image data URL
     */
    public function getUserAvatarBase64(string $userId, int $size = 64): ?string
    {
        try {
            $avatar = $this->getUserAvatar($userId, $size);
            $base64 = base64_encode($avatar['content']);
            return "data:{$avatar['content_type']};base64,{$base64}";
        } catch (\Exception $e) {
            Log::warning("Could not get base64 avatar for user {$userId}", [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Get all users with their avatars as base64.
     *
     * @param int $avatarSize Avatar size in pixels (default: 64)
     * @param bool $useCache Whether to use cached data
     * @return array
     */
    public function getAllUsersWithAvatars(int $avatarSize = 64, bool $useCache = true): array
    {
        $users = $this->getAllUsers($useCache);

        $successCount = 0;
        $failCount = 0;

        foreach ($users as $key => $user) {
            $userId = $user['id'] ?? $user['userid'] ?? null;
            if ($userId) {
                $avatar = $this->getUserAvatarBase64($userId, $avatarSize);
                $users[$key]['avatar'] = $avatar;

                if ($avatar) {
                    $successCount++;
                } else {
                    $failCount++;
                }
            }
        }

        Log::info('Fetched users with avatars', [
            'total_users' => count($users),
            'avatars_loaded' => $successCount,
            'avatars_failed' => $failCount,
            'avatar_size' => $avatarSize
        ]);

        return $users;
    }

    /**
     * Clear user cache.
     *
     * @param string|null $userId Specific user ID to clear, or null for all users
     * @return void
     */
    public function clearCache(?string $userId = null): void
    {
        if ($userId) {
            Cache::forget("nextcloud_user_{$userId}");
            Log::info("Cleared cache for user: {$userId}");
        } else {
            Cache::forget('nextcloud_users_all');
            Log::info('Cleared all users cache');
        }
    }
}
