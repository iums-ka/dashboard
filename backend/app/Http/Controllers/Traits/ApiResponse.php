<?php

namespace App\Http\Controllers\Traits;

use Illuminate\Http\JsonResponse;

/**
 * Trait for standardized API responses.
 * 
 * Provides consistent JSON response formatting across all controllers.
 */
trait ApiResponse
{
    /**
     * Return a successful response.
     *
     * @param mixed $data The response data
     * @param string $message Success message
     * @param array $extra Additional fields to include
     * @return JsonResponse
     */
    protected function successResponse(mixed $data, string $message = 'Success', array $extra = []): JsonResponse
    {
        return response()->json(array_merge([
            'success' => true,
            'data' => $data,
            'message' => $message,
        ], $extra));
    }

    /**
     * Return an error response.
     *
     * @param string $error Error type/title
     * @param string $message User-friendly error message
     * @param int $statusCode HTTP status code
     * @param array $extra Additional fields to include
     * @return JsonResponse
     */
    protected function errorResponse(
        string $error,
        string $message,
        int $statusCode = 500,
        array $extra = []
    ): JsonResponse {
        $response = array_merge([
            'success' => false,
            'error' => $error,
            'message' => $message,
        ], $extra);

        // Include debug details in non-production environments
        if (config('app.debug') && isset($extra['exception'])) {
            $response['details'] = $extra['exception'];
            unset($response['exception']);
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Return a service unavailable response.
     *
     * @param string $service Name of the unavailable service
     * @param string|null $details Optional error details
     * @return JsonResponse
     */
    protected function serviceUnavailableResponse(string $service, ?string $details = null): JsonResponse
    {
        return $this->errorResponse(
            "Failed to connect to {$service}",
            "Unable to retrieve data. Please check your {$service} connection.",
            503,
            $details ? ['exception' => $details] : []
        );
    }

    /**
     * Return a not found response.
     *
     * @param string $resource Name of the resource not found
     * @param string|null $identifier Resource identifier
     * @return JsonResponse
     */
    protected function notFoundResponse(string $resource, ?string $identifier = null): JsonResponse
    {
        $message = $identifier
            ? "{$resource} '{$identifier}' not found"
            : "{$resource} not found";

        return $this->errorResponse(
            "{$resource} not found",
            $message,
            404
        );
    }

    /**
     * Return a validation error response.
     *
     * @param string $message Validation error message
     * @param array $errors Validation errors array
     * @return JsonResponse
     */
    protected function validationErrorResponse(string $message, array $errors = []): JsonResponse
    {
        return $this->errorResponse(
            'Validation failed',
            $message,
            400,
            $errors ? ['errors' => $errors] : []
        );
    }
}
