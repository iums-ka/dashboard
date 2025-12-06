<?php

namespace App\DTO;

/**
 * Data Transfer Object for a Nextcloud Deck stack.
 */
readonly class StackDTO implements \JsonSerializable
{
    /**
     * @param CardDTO[] $cards
     */
    public function __construct(
        public int $id,
        public string $title,
        public int $order = 0,
        public array $cards = [],
    ) {}

    /**
     * Create a StackDTO from raw API data.
     *
     * @param array $data Raw stack data from API
     * @param bool $parseCards Whether to parse cards into DTOs
     */
    public static function fromArray(array $data, bool $parseCards = true): self
    {
        $cards = [];
        if ($parseCards && !empty($data['cards'])) {
            $cards = array_map(
                fn(array $card) => CardDTO::fromArray($card),
                $data['cards']
            );
        }

        return new self(
            id: $data['id'],
            title: $data['title'],
            order: $data['order'] ?? 0,
            cards: $cards,
        );
    }

    /**
     * Create a new StackDTO with cards added.
     *
     * @param CardDTO[] $cards
     */
    public function withCards(array $cards): self
    {
        return new self(
            id: $this->id,
            title: $this->title,
            order: $this->order,
            cards: $cards,
        );
    }

    /**
     * Get the number of cards in this stack.
     */
    public function cardCount(): int
    {
        return count($this->cards);
    }

    /**
     * Convert to array for JSON serialization.
     */
    public function jsonSerialize(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'order' => $this->order,
            'cards' => array_map(
                fn(CardDTO $card) => $card->jsonSerialize(),
                $this->cards
            ),
        ];
    }
}
