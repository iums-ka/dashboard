<?php

namespace App\DTO\Mensa;

/**
 * Data Transfer Object for a menu item (meal).
 */
readonly class MenuItemDTO implements \JsonSerializable
{
    public function __construct(
        public string $art,
        public string $name,
        public string $zusatz = '',
        public string $allergene = '',
        public string $kennzeichnungen = '',
        public PriceDTO $preise = new PriceDTO(),
        public ?array $image = null,
    ) {}

    /**
     * Create a MenuItemDTO from raw API data.
     */
    public static function fromArray(array $data): self
    {
        return new self(
            art: $data['art'] ?? '',
            name: $data['name'] ?? '',
            zusatz: $data['zusatz'] ?? '',
            allergene: $data['allergene'] ?? '',
            kennzeichnungen: $data['kennzeichnungen'] ?? '',
            preise: isset($data['preise']) ? PriceDTO::fromArray($data['preise']) : new PriceDTO(),
            image: $data['image'] ?? null,
        );
    }

    /**
     * Create a new MenuItemDTO with an image added.
     */
    public function withImage(?array $image): self
    {
        return new self(
            art: $this->art,
            name: $this->name,
            zusatz: $this->zusatz,
            allergene: $this->allergene,
            kennzeichnungen: $this->kennzeichnungen,
            preise: $this->preise,
            image: $image,
        );
    }

    /**
     * Convert to array for JSON serialization.
     */
    public function jsonSerialize(): array
    {
        return [
            'art' => $this->art,
            'name' => $this->name,
            'zusatz' => $this->zusatz,
            'allergene' => $this->allergene,
            'kennzeichnungen' => $this->kennzeichnungen,
            'preise' => $this->preise->jsonSerialize(),
            'image' => $this->image,
        ];
    }
}
