<?php

namespace App\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

/**
 * Base service class for Nextcloud integrations.
 * 
 * Provides common HTTP client configuration, authentication, and request methods
 * shared across all Nextcloud services (WebDAV, Deck, Users).
 */
abstract class NextcloudBaseService
{
    protected Client $client;
    protected string $baseUrl;
    protected string $username;
    protected string $password;

    /**
     * HTTP request timeout in seconds.
     */
    protected const REQUEST_TIMEOUT = 30;

    /**
     * User agent string for API requests.
     */
    protected const USER_AGENT = 'Dashboard-API/1.0';

    public function __construct()
    {
        $this->baseUrl = config('services.nextcloud.url', 'https://your-nextcloud-server.com');
        $this->username = config('services.nextcloud.username', 'your-username');
        $this->password = config('services.nextcloud.password', 'your-password');
        
        $this->client = $this->createHttpClient();
    }

    /**
     * Create and configure the Guzzle HTTP client.
     */
    protected function createHttpClient(): Client
    {
        return new Client([
            'timeout' => static::REQUEST_TIMEOUT,
            'verify' => false, // Set to true in production with proper SSL
        ]);
    }

    /**
     * Get default headers for OCS API requests.
     */
    protected function getOcsHeaders(): array
    {
        return [
            'OCS-APIRequest' => 'true',
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
            'User-Agent' => static::USER_AGENT,
        ];
    }

    /**
     * Get default headers for WebDAV requests.
     */
    protected function getWebDavHeaders(): array
    {
        return [
            'Accept' => '*/*',
            'User-Agent' => static::USER_AGENT,
        ];
    }

    /**
     * Get authentication configuration for Guzzle requests.
     */
    protected function getAuthConfig(): array
    {
        return [$this->username, $this->password];
    }

    /**
     * Build full URL from base URL and path.
     */
    protected function buildUrl(string $path): string
    {
        return rtrim($this->baseUrl, '/') . $path;
    }

    /**
     * Make a GET request to the Nextcloud API.
     *
     * @param string $path URL path (will be appended to base URL)
     * @param array $headers Additional headers to send
     * @param string $context Description for logging
     * @return array Decoded JSON response
     * @throws \Exception
     */
    protected function makeGetRequest(string $path, array $headers = [], string $context = 'API'): array
    {
        $url = $this->buildUrl($path);
        
        Log::info("Starting Nextcloud {$context} Request", [
            'url' => $url,
            'method' => 'GET'
        ]);

        $startTime = microtime(true);

        try {
            $response = $this->client->get($url, [
                'auth' => $this->getAuthConfig(),
                'headers' => array_merge($this->getOcsHeaders(), $headers),
            ]);

            $duration = (microtime(true) - $startTime) * 1000;
            $statusCode = $response->getStatusCode();

            if ($statusCode !== 200) {
                throw new \Exception("Nextcloud API returned status code: {$statusCode}");
            }

            $content = $response->getBody()->getContents();
            $data = json_decode($content, true);

            Log::info("Nextcloud {$context} Request Complete", [
                'status_code' => $statusCode,
                'duration_ms' => round($duration, 2),
                'content_length' => strlen($content)
            ]);

            return $data ?? [];

        } catch (GuzzleException $e) {
            Log::error("Nextcloud {$context} Request Failed", [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'url' => $url
            ]);
            throw new \Exception("Failed to complete {$context} request: " . $e->getMessage());
        }
    }

    /**
     * Make a raw GET request and return the body content as string.
     *
     * @param string $path URL path (will be appended to base URL)
     * @param array $headers Additional headers to send
     * @param string $context Description for logging
     * @return string Raw response body
     * @throws \Exception
     */
    protected function makeRawGetRequest(string $path, array $headers = [], string $context = 'API'): string
    {
        $url = $this->buildUrl($path);
        
        Log::info("Starting Nextcloud {$context} Request", [
            'url' => $url,
            'method' => 'GET'
        ]);

        $startTime = microtime(true);

        try {
            $response = $this->client->get($url, [
                'auth' => $this->getAuthConfig(),
                'headers' => array_merge($this->getWebDavHeaders(), $headers),
            ]);

            $duration = (microtime(true) - $startTime) * 1000;
            $content = $response->getBody()->getContents();

            Log::info("Nextcloud {$context} Request Complete", [
                'status_code' => $response->getStatusCode(),
                'duration_ms' => round($duration, 2),
                'content_length' => strlen($content)
            ]);

            return $content;

        } catch (GuzzleException $e) {
            Log::error("Nextcloud {$context} Request Failed", [
                'error' => $e->getMessage(),
                'code' => $e->getCode(),
                'url' => $url
            ]);
            throw new \Exception("Failed to complete {$context} request: " . $e->getMessage());
        }
    }
}
