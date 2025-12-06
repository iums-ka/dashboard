<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FileParserController;
use App\Http\Controllers\MensaController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\NextcloudUserController;
use App\Services\GoogleImagesService;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Dashboard API endpoints organized by domain:
| - /health - Service health check
| - /proposals, /parser/* - File parsing from Nextcloud
| - /mensa/* - Mensa menu data
| - /tasks/* - Nextcloud Deck integration
| - /users/* - Nextcloud user data
| - /debug/* - Debug endpoints (non-production only)
|
*/

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
        'service' => 'laravel-dashboard-api'
    ]);
});

/*
|--------------------------------------------------------------------------
| File Parser Routes
|--------------------------------------------------------------------------
*/
Route::prefix('parser')->group(function () {
    Route::get('/health', [FileParserController::class, 'health']);
});
Route::get('/proposals', [FileParserController::class, 'parse']);

/*
|--------------------------------------------------------------------------
| Mensa Routes
|--------------------------------------------------------------------------
*/
Route::prefix('mensa')->group(function () {
    Route::get('/', [MensaController::class, 'index']);
    Route::get('/with-images', [MensaController::class, 'indexWithImages']);
});

/*
|--------------------------------------------------------------------------
| Task Routes (Nextcloud Deck Integration)
|--------------------------------------------------------------------------
*/
Route::prefix('tasks')->group(function () {
    Route::get('/', [TaskController::class, 'index']);
    Route::get('/boards', [TaskController::class, 'boards']);
    Route::get('/boards/{boardId}', [TaskController::class, 'board']);
    Route::get('/boards/{boardId}/stacks', [TaskController::class, 'stacks']);
    Route::get('/boards/{boardId}/stacks/{stackId}/cards', [TaskController::class, 'cards']);
    Route::get('/health', [TaskController::class, 'health']);
});

/*
|--------------------------------------------------------------------------
| User Routes (Nextcloud User Integration)
|--------------------------------------------------------------------------
*/
Route::prefix('users')->group(function () {
    Route::get('/', [NextcloudUserController::class, 'index']);
    Route::get('/with-avatars', [NextcloudUserController::class, 'indexWithAvatars']);
    Route::get('/health/check', [NextcloudUserController::class, 'health']);
    Route::post('/cache/clear', [NextcloudUserController::class, 'clearCache']);
    
    // User-specific routes (must come after static routes to avoid conflicts)
    Route::get('/{userId}', [NextcloudUserController::class, 'show']);
    Route::get('/{userId}/avatar', [NextcloudUserController::class, 'avatar']);
    Route::get('/{userId}/avatar-base64', [NextcloudUserController::class, 'avatarBase64']);
});

/*
|--------------------------------------------------------------------------
| Debug Routes (Non-Production Only)
|--------------------------------------------------------------------------
*/
if (app()->environment('local', 'development', 'testing')) {
    Route::prefix('debug')->group(function () {
        Route::get('/google-search/{searchTerm}', function (string $searchTerm, GoogleImagesService $googleImagesService) {
            try {
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

        // User debug endpoint
        Route::get('/users', [NextcloudUserController::class, 'debug']);
    });
}