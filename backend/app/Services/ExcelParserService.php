<?php

namespace App\Services;

use App\Services\Contracts\ParserInterface;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use Illuminate\Support\Facades\Log;

class ExcelParserService implements ParserInterface
{
    /**
     * Maximum columns to parse (prevents memory issues).
     */
    private const MAX_COLUMNS = 100;
    /**
     * Parse Excel content into structured array.
     * 
     * @param string $content Raw Excel file content
     * @return array Parsed data with headers as keys
     * @throws \Exception
     */
    public function parse(string $content): array
    {
        try {
            Log::info('Starting Excel parsing', [
                'content_length' => strlen($content)
            ]);

            // Create temporary file since PhpSpreadsheet needs a file path
            $tempFile = tempnam(sys_get_temp_dir(), 'excel_parse_');
            if ($tempFile === false) {
                throw new \Exception('Failed to create temporary file');
            }

            // Write content to temporary file
            if (file_put_contents($tempFile, $content) === false) {
                throw new \Exception('Failed to write content to temporary file');
            }

            try {
                // Load the spreadsheet
                $spreadsheet = IOFactory::load($tempFile);
                $worksheet = $spreadsheet->getActiveSheet();
                
                // Get the highest row and column numbers with actual data
                $highestRow = $worksheet->getHighestDataRow();
                $highestColumn = $worksheet->getHighestDataColumn();
                $highestColumnIndex = Coordinate::columnIndexFromString($highestColumn);

                // Limit to reasonable number of columns to prevent memory issues
                if ($highestColumnIndex > self::MAX_COLUMNS) {
                    Log::warning('Excel file has too many columns, limiting to first ' . self::MAX_COLUMNS);
                    $highestColumnIndex = self::MAX_COLUMNS;
                    $highestColumn = Coordinate::stringFromColumnIndex(self::MAX_COLUMNS);
                }

                Log::info('Excel file dimensions', [
                    'rows' => $highestRow,
                    'columns' => $highestColumnIndex,
                    'highest_column' => $highestColumn
                ]);

                // Read headers from first row
                $headers = [];
                for ($col = 1; $col <= $highestColumnIndex; $col++) {
                    $header = $worksheet->getCell([$col, 1])->getFormattedValue();
                    $headers[] = trim($header);
                }

                // Read data rows
                $records = [];
                for ($row = 2; $row <= $highestRow; $row++) {
                    $record = [];
                    $hasData = false;
                    
                    for ($col = 1; $col <= $highestColumnIndex; $col++) {
                        $value = $worksheet->getCell([$col, $row])->getFormattedValue();
                        $cleanValue = trim($value);
                        
                        if (!empty($cleanValue)) {
                            $hasData = true;
                        }
                        
                        $headerKey = $headers[$col - 1] ?? "Column_$col";
                        $record[$headerKey] = $cleanValue;
                    }
                    
                    // Only add rows that have at least some data
                    if ($hasData) {
                        $records[] = $record;
                    }
                }

                Log::info('Excel parsing completed', [
                    'total_records' => count($records),
                    'headers' => $headers
                ]);

                return [
                    'success' => true,
                    'data' => $records,
                    'total_records' => count($records),
                    'headers' => $headers,
                    'sheet_info' => [
                        'name' => $worksheet->getTitle(),
                        'dimensions' => "{$highestColumn}{$highestRow}"
                    ],
                    'parsed_at' => now()->toISOString()
                ];

            } finally {
                // Clean up temporary file
                if (file_exists($tempFile)) {
                    unlink($tempFile);
                }
            }

        } catch (\Exception $e) {
            Log::error('Excel parsing failed', [
                'error' => $e->getMessage(),
                'content_preview' => substr($content, 0, 200)
            ]);

            throw new \Exception('Failed to parse Excel file: ' . $e->getMessage());
        }
    }

    /**
     * Get information about Excel file without parsing all data
     * 
     * @param string $excelContent
     * @return array Basic file information
     */
    public function getFileInfo(string $excelContent): array
    {
        try {
            $tempFile = tempnam(sys_get_temp_dir(), 'excel_info_');
            file_put_contents($tempFile, $excelContent);

            try {
                $spreadsheet = IOFactory::load($tempFile);
                $worksheet = $spreadsheet->getActiveSheet();
                
                $info = [
                    'sheet_count' => $spreadsheet->getSheetCount(),
                    'active_sheet' => $worksheet->getTitle(),
                    'dimensions' => $worksheet->getHighestRowAndColumn(),
                    'file_size' => strlen($excelContent)
                ];

                return $info;

            } finally {
                if (file_exists($tempFile)) {
                    unlink($tempFile);
                }
            }

        } catch (\Exception $e) {
            Log::error('Failed to get Excel file info', [
                'error' => $e->getMessage()
            ]);
            
            return [
                'error' => $e->getMessage(),
                'file_size' => strlen($excelContent)
            ];
        }
    }
}