<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use DateTime;
use DateInterval;
use DOMDocument;
use DOMXPath;

class MensaService
{
    private $mensaUrl;
    private $apiKey;
    private $locId;
  

    private GoogleImagesService $googleImagesService;

    public function __construct(GoogleImagesService $googleImagesService)
    {
        $this->mensaUrl = env('MENSA_API_URL');
        $this->apiKey = env('API_KEY');
        $this->locId = env('ORT_ID');
        $this->googleImagesService = $googleImagesService;
    }


    public function getMenuData(bool $includeImages = false): array
    {
        try {
            $xmlData = $this->fetchMenuXml();
            $parsedData = $this->parseMenuXml($xmlData);
            $filteredData = $this->filterRelevantDays($parsedData);
            
            // Add images if requested - wrapped in separate try-catch to prevent image failures from breaking entire response
            if ($includeImages) {
                try {
                    $filteredData = $this->addImagesToMenuData($filteredData);
                } catch (Exception $imageException) {
                    Log::warning('Failed to add images to menu data, continuing without images', [
                        'error' => $imageException->getMessage()
                    ]);
                    // Continue without images rather than failing completely
                }
            }
            
            return [
                'success' => true,
                'data' => $filteredData,
                'last_updated' => now()->toISOString(),
                'images_included' => $includeImages
            ];
        } catch (Exception $e) {
            Log::error('MensaService error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            throw new Exception('Fehler beim Laden des Speiseplans: ' . $e->getMessage());
        }
    }

    /**
     * Fetch XML data from external Mensa API
     *
     * @return string
     * @throws Exception
     */
    private function fetchMenuXml(): string
    {
        $url = $this->mensaUrl . '?' . http_build_query([
            'type' => '98',
            'tx_speiseplan_pi1[apiKey]' => $this->apiKey,
            'tx_speiseplan_pi1[tage]' => '7', // Get full week as API doesn't respect this parameter anyway
            'tx_speiseplan_pi1[ort]' => $this->locId
        ]);

        // Debug logging
        Log::info('MensaService Debug Info', [
            'mensa_url' => $this->mensaUrl,
            'api_key' => $this->apiKey,
            'loc_id' => $this->locId,
            'full_url' => $url
        ]);

        $response = Http::withOptions([
            'verify' => false,  // Disable SSL certificate verification
            'timeout' => 30
        ])->get($url);

        if (!$response->successful()) {
            throw new Exception('API request failed with status: ' . $response->status());
        }

        $xmlContent = $response->body();
        
        // Log response snippet for debugging
        Log::info('Mensa API Response Snippet', [
            'response_length' => strlen($xmlContent),
            'response_preview' => substr($xmlContent, 0, 500)
        ]);
        
        if (empty($xmlContent)) {
            throw new Exception('Empty response from Mensa API');
        }

        return $xmlContent;
    }

    private function parseMenuXml(string $xmlData): array
    {
        try {
            $dom = new DOMDocument();
            $dom->loadXML($xmlData);
            $xpath = new DOMXPath($dom);

            $mensaName = $xpath->query('//mensa')->item(0)?->textContent ?? 'Mensa Rempartstraße';
            $mensaName = $this->fixGermanCharacters($mensaName);

            $days = [];
            $tagesplanNodes = $xpath->query('//tagesplan');

            foreach ($tagesplanNodes as $tagesplanNode) {
                $datum = $tagesplanNode->getAttribute('datum');
                if (empty($datum)) continue;

                $menues = [];
                $menueNodes = $xpath->query('.//menue', $tagesplanNode);

                foreach ($menueNodes as $menueNode) {
                    $name = $xpath->query('.//name', $menueNode)->item(0)?->textContent ?? '';
                    $art = $menueNode->getAttribute('art') ?? '';
                    $zusatz = $menueNode->getAttribute('zusatz') ?? '';
                    $allergene = $xpath->query('.//allergene', $menueNode)->item(0)?->textContent ?? '';
                    $kennzeichnungen = $xpath->query('.//kennzeichnungen', $menueNode)->item(0)?->textContent ?? '';

                    $preise = [
                        'studierende' => $xpath->query('.//preis/studierende', $menueNode)->item(0)?->textContent ?? '',
                        'angestellte' => $xpath->query('.//preis/angestellte', $menueNode)->item(0)?->textContent ?? '',
                        'gaeste' => $xpath->query('.//preis/gaeste', $menueNode)->item(0)?->textContent ?? '',
                        'schueler' => $xpath->query('.//preis/schueler', $menueNode)->item(0)?->textContent ?? ''
                    ];

                    $menues[] = [
                        'art' => $art,
                        'name' => $this->fixGermanCharacters($name),
                        'zusatz' => $zusatz,
                        'allergene' => $allergene,
                        'kennzeichnungen' => $kennzeichnungen,
                        'preise' => $preise
                    ];
                }

                $days[] = [
                    'datum' => $datum,
                    'datum_formatted' => $this->formatDate($datum),
                    'weekday' => $this->getWeekday($datum),
                    'is_today' => $this->isToday($datum),
                    'is_tomorrow' => $this->isTomorrow($datum),
                    'menues' => $menues
                ];
            }

            return [
                'mensa_name' => $mensaName,
                'days' => $days
            ];
        } catch (Exception $e) {
            throw new Exception('Error parsing XML: ' . $e->getMessage());
        }
    }

    /**
     * Filter data to only include current day and next day
     *
     * @param array $parsedData
     * @return array
     */
    private function filterRelevantDays(array $parsedData): array
    {
        $relevantDays = array_filter($parsedData['days'], function ($day) {
            return $day['is_today'] || $day['is_tomorrow'];
        });

        // Sort so today comes first, then tomorrow
        usort($relevantDays, function ($a, $b) {
            if ($a['is_today']) return -1;
            if ($b['is_today']) return 1;
            return 0;
        });

        return [
            'mensa_name' => $parsedData['mensa_name'],
            'days' => array_values($relevantDays)
        ];
    }

    /**
     * Fix German character encoding issues
     *
     * @param string $text
     * @return string
     */
    private function fixGermanCharacters(string $text): string
    {
        $replacements = [
            'Ã¤' => 'ä',
            'Ã¼' => 'ü',
            'Ã¶' => 'ö',
            'ÃŸ' => 'ß',
            'Ã„' => 'Ä',
            'Ãœ' => 'Ü',
            'Ã–' => 'Ö'
        ];

        return str_replace(array_keys($replacements), array_values($replacements), $text);
    }

    /**
     * Format date string for display
     *
     * @param string $dateString
     * @return string
     */
    private function formatDate(string $dateString): string
    {
        try {
            $date = DateTime::createFromFormat('d.m.Y', $dateString);
            return $date ? $date->format('Y-m-d') : $dateString;
        } catch (Exception $e) {
            return $dateString;
        }
    }

    /**
     * Get weekday name in German
     *
     * @param string $dateString
     * @return string
     */
    private function getWeekday(string $dateString): string
    {
        try {
            $date = DateTime::createFromFormat('d.m.Y', $dateString);
            if (!$date) return '';

            $weekdays = [
                'Monday' => 'Montag',
                'Tuesday' => 'Dienstag',
                'Wednesday' => 'Mittwoch',
                'Thursday' => 'Donnerstag',
                'Friday' => 'Freitag',
                'Saturday' => 'Samstag',
                'Sunday' => 'Sonntag'
            ];

            $englishWeekday = $date->format('l');
            return $weekdays[$englishWeekday] ?? '';
        } catch (Exception $e) {
            return '';
        }
    }

    /**
     * Check if date is today
     *
     * @param string $dateString
     * @return bool
     */
    private function isToday(string $dateString): bool
    {
        try {
            $date = DateTime::createFromFormat('d.m.Y', $dateString);
            $today = new DateTime();
            return $date && $date->format('Y-m-d') === $today->format('Y-m-d');
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Check if date is tomorrow
     *
     * @param string $dateString
     * @return bool
     */
    private function isTomorrow(string $dateString): bool
    {
        try {
            $date = DateTime::createFromFormat('d.m.Y', $dateString);
            $tomorrow = (new DateTime())->add(new DateInterval('P1D'));
            return $date && $date->format('Y-m-d') === $tomorrow->format('Y-m-d');
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Add food images to menu data using GoogleImagesService
     *
     * @param array $menuData
     * @return array
     */
    private function addImagesToMenuData(array $menuData): array
    {
        try {
            // Collect all unique food names
            $foodNames = [];
            foreach ($menuData['days'] as $day) {
                foreach ($day['menues'] as $menu) {
                    $foodName = trim($menu['name']);
                    if (!empty($foodName) && !in_array($foodName, $foodNames)) {
                        $foodNames[] = $foodName;
                    }
                }
            }

            // Search for images for all unique food names
            $foodImages = $this->googleImagesService->searchMultipleFoodImages($foodNames);

            // Add images to menu items
            foreach ($menuData['days'] as &$day) {
                foreach ($day['menues'] as &$menu) {
                    $foodName = trim($menu['name']);
                    $menu['image'] = $foodImages[$foodName] ?? null;
                }
            }

            return $menuData;
        } catch (Exception $e) {
            Log::warning('Failed to add images to menu data', [
                'error' => $e->getMessage()
            ]);
            
            // Return original data without images if image service fails
            return $menuData;
        }
    }
}