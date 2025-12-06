<?php

namespace App\Services;

use App\DTO\Mensa\MenuDayDTO;
use App\DTO\Mensa\MenuItemDTO;
use App\DTO\Mensa\MenuResultDTO;
use App\DTO\Mensa\PriceDTO;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use DateTime;
use DateInterval;
use DOMDocument;
use DOMXPath;

class MensaService
{
    private ?string $mensaUrl;
    private ?string $apiKey;
    private ?string $locId;

    private GoogleImagesService $googleImagesService;

    public function __construct(GoogleImagesService $googleImagesService)
    {
        $this->mensaUrl = config('services.mensa.api_url');
        $this->apiKey = config('services.mensa.api_key');
        $this->locId = config('services.mensa.location_id');
        $this->googleImagesService = $googleImagesService;
    }


    /**
     * Get menu data with optional images.
     *
     * @param bool $includeImages Whether to include food images
     * @return array Response array with success, data, and metadata
     * @throws Exception
     */
    public function getMenuData(bool $includeImages = false): array
    {
        try {
            $xmlData = $this->fetchMenuXml();
            $menuResult = $this->parseMenuXml($xmlData);
            $menuResult = $this->filterRelevantDays($menuResult);
            
            // Add images if requested
            if ($includeImages) {
                try {
                    $menuResult = $this->addImagesToMenuData($menuResult);
                } catch (Exception $imageException) {
                    Log::warning('Failed to add images to menu data, continuing without images', [
                        'error' => $imageException->getMessage()
                    ]);
                }
            }
            
            return [
                'success' => true,
                'data' => $menuResult->jsonSerialize(),
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

    /**
     * Parse XML data into MenuResultDTO.
     */
    private function parseMenuXml(string $xmlData): MenuResultDTO
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

                    $menues[] = new MenuItemDTO(
                        art: $art,
                        name: $this->fixGermanCharacters($name),
                        zusatz: $zusatz,
                        allergene: $allergene,
                        kennzeichnungen: $kennzeichnungen,
                        preise: new PriceDTO(
                            studierende: $xpath->query('.//preis/studierende', $menueNode)->item(0)?->textContent ?? '',
                            angestellte: $xpath->query('.//preis/angestellte', $menueNode)->item(0)?->textContent ?? '',
                            gaeste: $xpath->query('.//preis/gaeste', $menueNode)->item(0)?->textContent ?? '',
                            schueler: $xpath->query('.//preis/schueler', $menueNode)->item(0)?->textContent ?? ''
                        )
                    );
                }

                $days[] = new MenuDayDTO(
                    datum: $datum,
                    datumFormatted: $this->formatDate($datum),
                    weekday: $this->getWeekday($datum),
                    isToday: $this->isToday($datum),
                    isTomorrow: $this->isTomorrow($datum),
                    menues: $menues
                );
            }

            return new MenuResultDTO(
                mensaName: $mensaName,
                days: $days
            );
        } catch (Exception $e) {
            throw new Exception('Error parsing XML: ' . $e->getMessage());
        }
    }

    /**
     * Filter data to only include current day and next day.
     */
    private function filterRelevantDays(MenuResultDTO $menuResult): MenuResultDTO
    {
        $relevantDays = array_filter(
            $menuResult->days,
            fn(MenuDayDTO $day) => $day->isToday || $day->isTomorrow
        );

        // Sort so today comes first, then tomorrow
        usort($relevantDays, function (MenuDayDTO $a, MenuDayDTO $b) {
            if ($a->isToday) return -1;
            if ($b->isToday) return 1;
            return 0;
        });

        return $menuResult->withDays(array_values($relevantDays));
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
     * Add food images to menu data using GoogleImagesService.
     */
    private function addImagesToMenuData(MenuResultDTO $menuResult): MenuResultDTO
    {
        try {
            // Collect all unique food names using the DTO method
            $foodNames = $menuResult->getAllFoodNames();

            // Search for images for all unique food names
            $foodImages = $this->googleImagesService->searchMultipleFoodImages($foodNames);

            // Create new days with images added to menu items
            $updatedDays = array_map(function (MenuDayDTO $day) use ($foodImages) {
                $updatedMenues = array_map(function (MenuItemDTO $menu) use ($foodImages) {
                    $foodName = trim($menu->name);
                    $image = $foodImages[$foodName] ?? null;
                    return $menu->withImage($image);
                }, $day->menues);
                
                return $day->withMenues($updatedMenues);
            }, $menuResult->days);

            return $menuResult->withDays($updatedDays);
        } catch (Exception $e) {
            Log::warning('Failed to add images to menu data', [
                'error' => $e->getMessage()
            ]);
            
            // Return original data without images if image service fails
            return $menuResult;
        }
    }
}