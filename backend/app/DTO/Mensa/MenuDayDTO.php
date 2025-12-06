<?php

namespace App\DTO\Mensa;

/**
 * Data Transfer Object for a menu day.
 */
readonly class MenuDayDTO implements \JsonSerializable
{
    /**
     * @param MenuItemDTO[] $menues
     */
    public function __construct(
        public string $datum,
        public string $datumFormatted,
        public string $weekday,
        public bool $isToday,
        public bool $isTomorrow,
        public array $menues = [],
    ) {}

    /**
     * Create a MenuDayDTO from raw API data.
     */
    public static function fromArray(array $data): self
    {
        $menues = [];
        if (!empty($data['menues'])) {
            $menues = array_map(
                fn(array $menu) => MenuItemDTO::fromArray($menu),
                $data['menues']
            );
        }

        return new self(
            datum: $data['datum'],
            datumFormatted: $data['datum_formatted'],
            weekday: $data['weekday'],
            isToday: $data['is_today'] ?? false,
            isTomorrow: $data['is_tomorrow'] ?? false,
            menues: $menues,
        );
    }

    /**
     * Create a new MenuDayDTO with updated menus.
     *
     * @param MenuItemDTO[] $menues
     */
    public function withMenues(array $menues): self
    {
        return new self(
            datum: $this->datum,
            datumFormatted: $this->datumFormatted,
            weekday: $this->weekday,
            isToday: $this->isToday,
            isTomorrow: $this->isTomorrow,
            menues: $menues,
        );
    }

    /**
     * Convert to array for JSON serialization.
     */
    public function jsonSerialize(): array
    {
        return [
            'datum' => $this->datum,
            'datum_formatted' => $this->datumFormatted,
            'weekday' => $this->weekday,
            'is_today' => $this->isToday,
            'is_tomorrow' => $this->isTomorrow,
            'menues' => array_map(
                fn(MenuItemDTO $menu) => $menu->jsonSerialize(),
                $this->menues
            ),
        ];
    }
}
