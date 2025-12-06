<?php

namespace App\DTO;

/**
 * Data Transfer Object for a Nextcloud Deck card (task).
 */
readonly class CardDTO implements \JsonSerializable
{
    public function __construct(
        public int $id,
        public string $title,
        public string $description = '',
        public ?string $duedate = null,
        public array $labels = [],
        public array $assignedUsers = [],
        public ?string $createdAt = null,
        public ?string $lastModified = null,
        public bool $archived = false,
        public bool $done = false,
        public int $order = 0,
        public string $type = 'plain',
    ) {}

    /**
     * Create a CardDTO from raw API data.
     */
    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            title: $data['title'],
            description: $data['description'] ?? '',
            duedate: $data['duedate'] ?? null,
            labels: $data['labels'] ?? [],
            assignedUsers: $data['assignedUsers'] ?? [],
            createdAt: $data['createdAt'] ?? null,
            lastModified: $data['lastModified'] ?? null,
            archived: $data['archived'] ?? false,
            done: $data['done'] ?? false,
            order: $data['order'] ?? 0,
            type: $data['type'] ?? 'plain',
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
            'description' => $this->description,
            'duedate' => $this->duedate,
            'labels' => $this->labels,
            'assignedUsers' => $this->assignedUsers,
            'createdAt' => $this->createdAt,
            'lastModified' => $this->lastModified,
            'archived' => $this->archived,
            'done' => $this->done,
            'order' => $this->order,
            'type' => $this->type,
        ];
    }
}
