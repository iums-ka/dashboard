<?php

namespace App\Services\Contracts;

/**
 * Interface for file parser services.
 * 
 * All parser services should implement this interface to ensure
 * consistent parsing behavior and return structure.
 */
interface ParserInterface
{
    /**
     * Parse file content into structured array.
     *
     * @param string $content Raw file content
     * @return array Parsed data with consistent structure:
     *               - success: bool
     *               - data: array (parsed records)
     *               - total_records: int
     *               - headers: array
     *               - parsed_at: string (ISO timestamp)
     * @throws \Exception When parsing fails
     */
    public function parse(string $content): array;
}
