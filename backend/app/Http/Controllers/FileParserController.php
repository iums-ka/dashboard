<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Traits\ApiResponse;
use App\Services\Contracts\ParserInterface;
use App\Services\NextcloudService;
use App\Services\CsvParserService;
use App\Services\ExcelParserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Controller for parsing files from Nextcloud.
 */
class FileParserController extends Controller
{
    use ApiResponse;

    /**
     * Supported file formats mapped to their parser services.
     */
    private const FORMAT_PARSERS = [
        'csv' => CsvParserService::class,
        'xlsx' => ExcelParserService::class,
        'xls' => ExcelParserService::class,
    ];

    public function __construct(
        private readonly NextcloudService $nextcloudService,
        private readonly CsvParserService $csvParser,
        private readonly ExcelParserService $excelParser
    ) {}

    /**
     * Parse CSV/XML file from Nextcloud and return structured JSON data
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function parse(Request $request): JsonResponse
    {
        try {
            Log::info('Starting file parsing request');

            // Get file path from configuration
            $filePath = config('services.nextcloud.file_path', '/Documents/proposals.csv');
            
            Log::info('Fetching file from Nextcloud', ['file_path' => $filePath]);

            // Test Nextcloud connection first
            if (!$this->nextcloudService->testConnection()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Unable to connect to Nextcloud server',
                    'message' => 'Please check Nextcloud credentials and server availability'
                ], 503);
            }

            // Fetch file content from Nextcloud
            $fileContent = $this->nextcloudService->getFileContent($filePath);
            
            if (empty($fileContent)) {
                return response()->json([
                    'success' => false,
                    'error' => 'File is empty or could not be read',
                    'file_path' => $filePath
                ], 404);
            }

            // Determine file type and get appropriate parser
            $fileExtension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
            $parser = $this->getParserForFormat($fileExtension);

            if ($parser === null) {
                return $this->validationErrorResponse(
                    'Unsupported file format',
                    ['supported_formats' => array_keys(self::FORMAT_PARSERS), 'detected_format' => $fileExtension]
                );
            }

            Log::info('Parsing file', ['extension' => $fileExtension]);
            $parsedData = $parser->parse($fileContent);

            Log::info('File parsing completed successfully', [
                'file_type' => $fileExtension,
                'records_count' => isset($parsedData['data']) ? count($parsedData['data']) : 0
            ]);

            return response()->json([
                'success' => true,
                'file_info' => [
                    'path' => $filePath,
                    'type' => $fileExtension,
                    'size' => strlen($fileContent)
                ],
                'parsing_result' => $parsedData,
                'timestamp' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            Log::error('File parsing failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'File parsing failed',
                'message' => $e->getMessage(),
                'timestamp' => now()->toISOString()
            ], 500);
        }
    }

    /**
     * Health check endpoint to verify all services are working
     * 
     * @return JsonResponse
     */
    public function health(): JsonResponse
    {
        $status = [
            'nextcloud_connection' => false,
            'services_loaded' => true,
            'supported_formats' => array_keys(self::FORMAT_PARSERS),
            'timestamp' => now()->toISOString()
        ];

        try {
            $status['nextcloud_connection'] = $this->nextcloudService->testConnection();
        } catch (\Exception $e) {
            Log::warning('Health check - Nextcloud connection failed', [
                'error' => $e->getMessage()
            ]);
        }

        $overallStatus = $status['nextcloud_connection'] && $status['services_loaded'];

        return response()->json([
            'status' => $overallStatus ? 'healthy' : 'degraded',
            'checks' => $status
        ], $overallStatus ? 200 : 503);
    }

    /**
     * Get the appropriate parser for a file format.
     *
     * @param string $format File extension (csv, xlsx, xls)
     * @return ParserInterface|null
     */
    private function getParserForFormat(string $format): ?ParserInterface
    {
        return match ($format) {
            'csv' => $this->csvParser,
            'xlsx', 'xls' => $this->excelParser,
            default => null,
        };
    }
}
