<?php

namespace App\DTO;

/**
 * Data Transfer Object for aggregated tasks result.
 */
readonly class TasksResultDTO implements \JsonSerializable
{
    /**
     * @param BoardDTO[] $boards
     */
    public function __construct(
        public array $boards,
        public string $fetchedAt,
    ) {}

    /**
     * Get the total number of cards across all boards.
     */
    public function totalCards(): int
    {
        return array_reduce(
            $this->boards,
            fn(int $total, BoardDTO $board) => $total + $board->totalCards(),
            0
        );
    }

    /**
     * Convert to array for JSON serialization.
     */
    public function jsonSerialize(): array
    {
        return [
            'boards' => array_map(
                fn(BoardDTO $board) => $board->jsonSerialize(),
                $this->boards
            ),
            'total_cards' => $this->totalCards(),
            'fetched_at' => $this->fetchedAt,
        ];
    }
}
