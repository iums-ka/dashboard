<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FileParserController;
use App\Http\Controllers\MensaController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\NextcloudUserController;
use App\Services\GoogleImagesService;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'service' => 'laravel-dashboard-api'
    ]);
});

// File parsing endpoints
Route::get('/proposals', [FileParserController::class, 'parse']);
Route::get('/parser/health', [FileParserController::class, 'health']);

// Mensa endpoints
Route::get('/mensa', [MensaController::class, 'index']);
Route::get('/mensa/with-images', [MensaController::class, 'indexWithImages']);

// Debug endpoint for testing Google Custom Search
Route::get('/debug/google-search/{searchTerm}', function (string $searchTerm, GoogleImagesService $googleImagesService) {
    try {
        // Force bypass cache to get fresh results
        $result = $googleImagesService->searchFoodImage($searchTerm, false);
        
        return response()->json([
            'success' => true,
            'search_term' => $searchTerm,
            'simplified_search' => true,
            'result' => $result
        ]);
        } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'search_term' => $searchTerm,
            'error' => $e->getMessage()
        ], 500);
    }
});

// Task endpoints (Nextcloud Deck integration)
Route::get('/tasks', [TaskController::class, 'index']);
Route::get('/tasks/boards', [TaskController::class, 'boards']);
Route::get('/tasks/boards/{boardId}', [TaskController::class, 'board']);
Route::get('/tasks/boards/{boardId}/stacks', [TaskController::class, 'stacks']);
Route::get('/tasks/boards/{boardId}/stacks/{stackId}/cards', [TaskController::class, 'cards']);
Route::get('/tasks/health', [TaskController::class, 'health']);

// Nextcloud User endpoints
Route::get('/users', [NextcloudUserController::class, 'index']);
Route::get('/users/with-avatars', [NextcloudUserController::class, 'indexWithAvatars']);
Route::get('/users/debug', [NextcloudUserController::class, 'debug']);
Route::get('/users/{userId}', [NextcloudUserController::class, 'show']);
Route::get('/users/{userId}/avatar', [NextcloudUserController::class, 'avatar']);
Route::get('/users/{userId}/avatar-base64', [NextcloudUserController::class, 'avatarBase64']);
Route::post('/users/cache/clear', [NextcloudUserController::class, 'clearCache']);
Route::get('/users/health/check', [NextcloudUserController::class, 'health']);