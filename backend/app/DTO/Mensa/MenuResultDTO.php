<?php

namespace App\DTO\Mensa;

/**
 * Data Transfer Object for the complete menu result.
 */
readonly class MenuResultDTO implements \JsonSerializable
{
    /**
     * @param MenuDayDTO[] $days
     */
    public function __construct(
        public string $mensaName,
        public array $days = [],
    ) {}

    /**
     * Create a MenuResultDTO from raw parsed data.
     */
    public static function fromArray(array $data): self
    {
        $days = [];
        if (!empty($data['days'])) {
            $days = array_map(
                fn(array $day) => MenuDayDTO::fromArray($day),
                $data['days']
            );
        }

        return new self(
            mensaName: $data['mensa_name'] ?? 'Mensa',
            days: $days,
        );
    }

    /**
     * Create a new MenuResultDTO with updated days.
     *
     * @param MenuDayDTO[] $days
     */
    public function withDays(array $days): self
    {
        return new self(
            mensaName: $this->mensaName,
            days: $days,
        );
    }

    /**
     * Get all unique food names from all days.
     *
     * @return string[]
     */
    public function getAllFoodNames(): array
    {
        $names = [];
        foreach ($this->days as $day) {
            foreach ($day->menues as $menu) {
                $name = trim($menu->name);
                if (!empty($name) && !in_array($name, $names)) {
                    $names[] = $name;
                }
            }
        }
        return $names;
    }

    /**
     * Convert to array for JSON serialization.
     */
    public function jsonSerialize(): array
    {
        return [
            'mensa_name' => $this->mensaName,
            'days' => array_map(
                fn(MenuDayDTO $day) => $day->jsonSerialize(),
                $this->days
            ),
        ];
    }
}
