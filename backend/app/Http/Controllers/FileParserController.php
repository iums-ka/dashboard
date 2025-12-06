<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Traits\ApiResponse;
use App\Services\NextcloudService;
use App\Services\CsvParserService;
use App\Services\XmlParserService;
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
     * Supported file formats.
     */
    private const SUPPORTED_FORMATS = ['csv', 'xml', 'xlsx', 'xls'];

    public function __construct(
        private readonly NextcloudService $nextcloudService,
        private readonly CsvParserService $csvParser,
        private readonly XmlParserService $xmlParser,
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

            // Determine file type and parse accordingly
            $fileExtension = pathinfo($filePath, PATHINFO_EXTENSION);
            $parsedData = null;

            switch (strtolower($fileExtension)) {
                case 'csv':
                    Log::info('Parsing CSV file');
                    $delimiter = $this->csvParser->detectDelimiter($fileContent);
                    $parsedData = $this->csvParser->parse($fileContent, $delimiter);
                    break;

                case 'xml':
                    Log::info('Parsing XML file');
                    $parsedData = $this->xmlParser->parse($fileContent);
                    break;

                case 'xlsx':
                case 'xls':
                    Log::info('Parsing Excel file', ['extension' => $fileExtension]);
                    $parsedData = $this->excelParser->parse($fileContent);
                    break;

                default:
                    return $this->validationErrorResponse(
                        'Unsupported file format',
                        ['supported_formats' => self::SUPPORTED_FORMATS, 'detected_format' => $fileExtension]
                    );
            }

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
}
