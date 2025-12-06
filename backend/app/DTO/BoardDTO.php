<?php

namespace App\DTO;

/**
 * Data Transfer Object for a Nextcloud Deck board.
 */
readonly class BoardDTO implements \JsonSerializable
{
    /**
     * @param StackDTO[] $stacks
     */
    public function __construct(
        public int $id,
        public string $title,
        public ?string $color = null,
        public array $stacks = [],
    ) {}

    /**
     * Create a BoardDTO from raw API data.
     *
     * @param array $data Raw board data from API
     * @param bool $parseStacks Whether to parse stacks into DTOs
     */
    public static function fromArray(array $data, bool $parseStacks = true): self
    {
        $stacks = [];
        if ($parseStacks && !empty($data['stacks'])) {
            $stacks = array_map(
                fn(array $stack) => StackDTO::fromArray($stack),
                $data['stacks']
            );
        }

        return new self(
            id: $data['id'],
            title: $data['title'] ?? 'Untitled Board',
            color: $data['color'] ?? null,
            stacks: $stacks,
        );
    }

    /**
     * Create a new BoardDTO with stacks added.
     *
     * @param StackDTO[] $stacks
     */
    public function withStacks(array $stacks): self
    {
        return new self(
            id: $this->id,
            title: $this->title,
            color: $this->color,
            stacks: $stacks,
        );
    }

    /**
     * Get the total number of cards across all stacks.
     */
    public function totalCards(): int
    {
        return array_reduce(
            $this->stacks,
            fn(int $total, StackDTO $stack) => $total + $stack->cardCount(),
            0
        );
    }

    /**
     * Convert to array for JSON serialization.
     */
    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'color' => $this->color,
            'stacks' => array_map(
                fn(StackDTO $stack) => $stack->jsonSerialize(),
                $this->stacks
            ),
            'total_cards' => $this->totalCards(),
        ];
    }
}
