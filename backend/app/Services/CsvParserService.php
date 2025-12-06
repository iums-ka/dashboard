<?php

namespace App\Services;

use App\Services\Contracts\ParserInterface;
use League\Csv\Reader;
use Illuminate\Support\Facades\Log;

class CsvParserService implements ParserInterface
{
    /**
     * Default CSV delimiter.
     */
    private const DEFAULT_DELIMITER = ',';
    /**
     * Parse CSV content into structured array.
     * 
     * Uses auto-detected delimiter for best results.
     * 
     * @param string $content Raw CSV file content
     * @return array Parsed data with headers as keys
     * @throws \Exception
     */
    public function parse(string $content): array
    {
        $delimiter = $this->detectDelimiter($content);
        return $this->parseWithDelimiter($content, $delimiter);
    }

    /**
     * Parse CSV content with a specific delimiter.
     * 
     * @param string $csvContent Raw CSV file content
     * @param string $delimiter CSV delimiter
     * @return array Parsed data with headers as keys
     * @throws \Exception
     */
    public function parseWithDelimiter(string $csvContent, string $delimiter = self::DEFAULT_DELIMITER): array
    {
        try {
            Log::info('Starting CSV parsing', [
                'content_length' => strlen($csvContent),
                'delimiter' => $delimiter
            ]);

            // Create CSV reader from string
            $csv = Reader::createFromString($csvContent);
            $csv->setDelimiter($delimiter);
            $csv->setHeaderOffset(0); // First row contains headers

            // Convert to array with headers as keys
            $records = [];
            foreach ($csv->getRecords() as $record) {
                // Clean and normalize the record data
                $cleanRecord = [];
                foreach ($record as $key => $value) {
                    $cleanKey = trim($key);
                    $cleanValue = trim($value);
                    $cleanRecord[$cleanKey] = $cleanValue;
                }
                $records[] = $cleanRecord;
            }

            Log::info('CSV parsing completed', [
                'total_records' => count($records),
                'headers' => array_keys($records[0] ?? [])
            ]);

            return [
                'success' => true,
                'data' => $records,
                'total_records' => count($records),
                'headers' => array_keys($records[0] ?? []),
                'parsed_at' => now()->toISOString()
            ];

        } catch (\Exception $e) {
            Log::error('CSV parsing failed', [
                'error' => $e->getMessage(),
                'content_preview' => substr($csvContent, 0, 200)
            ]);

            throw new \Exception('Failed to parse CSV: ' . $e->getMessage());
        }
    }

    /**
     * Detect CSV delimiter automatically
     * 
     * @param string $csvContent
     * @return string Most likely delimiter
     */
    public function detectDelimiter(string $csvContent): string
    {
        $delimiters = [',', ';', "\t", '|'];
        $delimiterCounts = [];

        // Take first few lines for detection
        $lines = array_slice(explode("\n", $csvContent), 0, 5);
        $sampleContent = implode("\n", $lines);

        foreach ($delimiters as $delimiter) {
            $delimiterCounts[$delimiter] = substr_count($sampleContent, $delimiter);
        }

        // Return delimiter with highest count
        $detectedDelimiter = array_key_first($delimiterCounts);
        $maxCount = 0;

        foreach ($delimiterCounts as $delimiter => $count) {
            if ($count > $maxCount) {
                $maxCount = $count;
                $detectedDelimiter = $delimiter;
            }
        }

        Log::info('CSV delimiter detection', [
            'detected' => $detectedDelimiter,
            'counts' => $delimiterCounts
        ]);

        return $detectedDelimiter;
    }
}