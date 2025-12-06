<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Traits\ApiResponse;
use App\Services\MensaService;
use Illuminate\Http\JsonResponse;

/**
 * Controller for Mensa menu data.
 */
class MensaController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly MensaService $mensaService
    ) {}

    /**
     * Get current and next day menu data.
     */
    public function index(): JsonResponse
    {
        try {
            $data = $this->mensaService->getMenuData();
            return response()->json($data);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Mensa API error',
                $e->getMessage(),
                500
            );
        }
    }

    /**
     * Get current and next day menu data with food images.
     */
    public function indexWithImages(): JsonResponse
    {
        try {
            $data = $this->mensaService->getMenuData(true);
            return response()->json($data);
        } catch (\Exception $e) {
            return $this->errorResponse(
                'Mensa API error',
                $e->getMessage(),
                500
            );
        }
    }
}