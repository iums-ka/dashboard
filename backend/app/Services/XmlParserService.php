<?php

namespace App\Services;

use DOMDocument;
use SimpleXMLElement;
use Illuminate\Support\Facades\Log;

class XmlParserService
{
    /**
     * Parse XML content into structured array
     * 
     * @param string $xmlContent Raw XML file content
     * @return array Parsed data structure
     * @throws \Exception
     */
    public function parse(string $xmlContent): array
    {
        try {
            Log::info('Starting XML parsing', [
                'content_length' => strlen($xmlContent)
            ]);

            // Clean and validate XML
            $xmlContent = trim($xmlContent);
            if (empty($xmlContent)) {
                throw new \Exception('Empty XML content provided');
            }

            // Suppress XML errors and handle them manually
            libxml_use_internal_errors(true);
            
            // Try to parse with SimpleXML first
            $xml = simplexml_load_string($xmlContent, 'SimpleXMLElement', LIBXML_NOCDATA);
            
            if ($xml === false) {
                $errors = libxml_get_errors();
                $errorMessages = [];
                foreach ($errors as $error) {
                    $errorMessages[] = trim($error->message);
                }
                throw new \Exception('XML parsing failed: ' . implode(', ', $errorMessages));
            }

            // Convert SimpleXML to array recursively
            $data = $this->xmlToArray($xml);

            Log::info('XML parsing completed', [
                'root_element' => $xml->getName(),
                'structure_keys' => array_keys($data)
            ]);

            return [
                'success' => true,
                'data' => $data,
                'root_element' => $xml->getName(),
                'parsed_at' => now()->toISOString()
            ];

        } catch (\Exception $e) {
            Log::error('XML parsing failed', [
                'error' => $e->getMessage(),
                'content_preview' => substr($xmlContent, 0, 200)
            ]);

            throw new \Exception('Failed to parse XML: ' . $e->getMessage());
        } finally {
            libxml_clear_errors();
        }
    }

    /**
     * Convert SimpleXMLElement to array recursively
     * 
     * @param SimpleXMLElement $xml
     * @return array|string
     */
    private function xmlToArray(SimpleXMLElement $xml): array|string
    {
        $array = [];

        // Handle attributes
        $attributes = $xml->attributes();
        if ($attributes) {
            foreach ($attributes as $key => $value) {
                $array['@attributes'][$key] = (string) $value;
            }
        }

        // Handle child elements
        $children = $xml->children();
        if ($children->count() > 0) {
            foreach ($children as $child) {
                $name = $child->getName();
                $value = $this->xmlToArray($child);

                // Handle multiple elements with same name
                if (isset($array[$name])) {
                    if (!is_array($array[$name]) || !isset($array[$name][0])) {
                        $array[$name] = [$array[$name]];
                    }
                    $array[$name][] = $value;
                } else {
                    $array[$name] = $value;
                }
            }
        } else {
            // Handle text content
            $content = trim((string) $xml);
            if (!empty($content)) {
                if (isset($array['@attributes'])) {
                    $array['@value'] = $content;
                } else {
                    return $content;
                }
            }
        }

        return $array;
    }

    /**
     * Validate XML structure and encoding
     * 
     * @param string $xmlContent
     * @return bool
     */
    public function validateXml(string $xmlContent): bool
    {
        try {
            $doc = new DOMDocument();
            $doc->loadXML($xmlContent);
            return true;
        } catch (\Exception $e) {
            Log::warning('XML validation failed', [
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Extract specific elements from XML by tag name
     * 
     * @param string $xmlContent
     * @param string $tagName
     * @return array Array of matching elements
     */
    public function extractElements(string $xmlContent, string $tagName): array
    {
        try {
            $xml = simplexml_load_string($xmlContent);
            if ($xml === false) {
                return [];
            }

            $elements = [];
            $matches = $xml->xpath("//{$tagName}");
            
            foreach ($matches as $match) {
                $elements[] = $this->xmlToArray($match);
            }

            return $elements;

        } catch (\Exception $e) {
            Log::error('Failed to extract XML elements', [
                'tag_name' => $tagName,
                'error' => $e->getMessage()
            ]);
            return [];
        }
    }
}