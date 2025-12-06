<?php

namespace App\DTO\Mensa;

/**
 * Data Transfer Object for meal prices.
 */
readonly class PriceDTO implements \JsonSerializable
{
    public function __construct(
        public string $studierende = '',
        public string $angestellte = '',
        public string $gaeste = '',
        public string $schueler = '',
    ) {}

    /**
     * Create a PriceDTO from raw API data.
     */
    public static function fromArray(array $data): self
    {
        return new self(
            studierende: $data['studierende'] ?? '',
            angestellte: $data['angestellte'] ?? '',
            gaeste: $data['gaeste'] ?? '',
            schueler: $data['schueler'] ?? '',
        );
    }

    /**
     * Convert to array for JSON serialization.
     */
    public function jsonSerialize(): array
    {
        return [
            'studierende' => $this->studierende,
            'angestellte' => $this->angestellte,
            'gaeste' => $this->gaeste,
            'schueler' => $this->schueler,
        ];
    }
}
