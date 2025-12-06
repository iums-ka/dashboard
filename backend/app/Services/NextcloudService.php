<?php

namespace App\Services;

use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

/**
 * Service for Nextcloud WebDAV file operations.
 * 
 * Handles file fetching and connection testing via WebDAV protocol.
 */
class NextcloudService extends NextcloudBaseService
{
    private ?string $userId = null;

    /**
     * Get the actual user ID from Nextcloud (which may differ from username).
     *
     * @return string
     * @throws \Exception
     */
    private function getUserId(): string
    {
        if ($this->userId !== null) {
            return $this->userId;
        }

        try {
            $data = $this->makeGetRequest(
                '/ocs/v1.php/cloud/user?format=json',
                [],
                'User ID Fetch'
            );

            if (isset($data['ocs']['data']['id'])) {
                $this->userId = $data['ocs']['data']['id'];
                
                Log::info('Successfully fetched Nextcloud User ID', [
                    'username' => $this->username,
                    'user_id' => $this->userId
                ]);
                
                return $this->userId;
            }

            throw new \Exception('User ID not found in OCS response');

        } catch (\Exception $e) {
            Log::error('Failed to fetch Nextcloud User ID', [
                'error_message' => $e->getMessage(),
                'username' => $this->username
            ]);
            
            throw new \Exception('Failed to fetch user ID from Nextcloud: ' . $e->getMessage());
        }
    }

    /**
     * Fetch file content from Nextcloud via WebDAV.
     *
     * @param string $filePath The path to the file in Nextcloud (e.g., '/Documents/proposals.csv')
     * @return string File content
     * @throws \Exception
     */
    public function getFileContent(string $filePath): string
    {
        $userId = $this->getUserId();
        $encodedUserId = urlencode($userId);
        $path = '/remote.php/dav/files/' . $encodedUserId . $filePath;

        try {
            $content = $this->makeRawGetRequest($path, [], 'WebDAV File');

            Log::info('Nextcloud WebDAV Response Success', [
                'file_size_bytes' => strlen($content),
                'file_path' => $filePath,
                'content_preview' => substr($content, 0, 100) . (strlen($content) > 100 ? '...' : '')
            ]);

            return $content;

        } catch (\Exception $e) {
            Log::error('Nextcloud WebDAV Request Failed', [
                'error_message' => $e->getMessage(),
                'file_path' => $filePath
            ]);
            
            throw new \Exception('Failed to fetch file from Nextcloud: ' . $e->getMessage());
        }
    }

    /**
     * Check if Nextcloud connection is working.
     *
     * @return bool
     */
    public function testConnection(): bool
    {
        try {
            $userId = $this->getUserId();
            $encodedUserId = urlencode($userId);
            $webdavUrl = $this->buildUrl('/remote.php/dav/files/' . $encodedUserId . '/');

            Log::info('Testing Nextcloud Connection', [
                'url' => $webdavUrl,
                'username' => $this->username,
                'user_id' => $userId,
                'method' => 'PROPFIND'
            ]);

            $response = $this->client->request('PROPFIND', $webdavUrl, [
                'auth' => $this->getAuthConfig(),
                'headers' => [
                    'Depth' => '0',
                    'Content-Type' => 'text/xml'
                ]
            ]);

            $isConnected = $response->getStatusCode() === 207;

            Log::info('Nextcloud Connection Test Result', [
                'connected' => $isConnected,
                'status_code' => $response->getStatusCode(),
                'expected_status' => 207
            ]);

            return $isConnected;

        } catch (GuzzleException $e) {
            Log::error('Nextcloud Connection Test Failed', [
                'error_message' => $e->getMessage(),
                'status_code' => method_exists($e, 'getResponse') && $e->getResponse() 
                    ? $e->getResponse()->getStatusCode() 
                    : 'unknown',
                'exception_class' => get_class($e)
            ]);

            return false;
        }
    }
}