<?php

namespace App\Services;

use App\DTO\BoardDTO;
use App\DTO\CardDTO;
use App\DTO\StackDTO;
use App\DTO\TasksResultDTO;
use Illuminate\Support\Facades\Log;

/**
 * Service for Nextcloud Deck API integration.
 * 
 * Handles fetching boards, stacks, and cards from Nextcloud Deck.
 */
class NextcloudDeckService extends NextcloudBaseService
{
    /**
     * Base path for Deck API endpoints.
     */
    private const DECK_API_PATH = '/index.php/apps/deck/api/v1.0';

    /**
     * Get all boards from Nextcloud Deck.
     *
     * @return array
     * @throws \Exception
     */
    public function getBoards(): array
    {
        $data = $this->makeGetRequest(
            self::DECK_API_PATH . '/boards',
            [],
            'Deck Boards'
        );

        Log::info('Nextcloud Deck Boards fetched', [
            'boards_count' => is_array($data) ? count($data) : 0
        ]);

        return $data ?? [];
    }

    /**
     * Get all stacks for a specific board.
     *
     * @param int $boardId
     * @return array
     * @throws \Exception
     */
    public function getStacks(int $boardId): array
    {
        $data = $this->makeGetRequest(
            self::DECK_API_PATH . "/boards/{$boardId}/stacks",
            [],
            'Deck Stacks'
        );

        Log::info('Nextcloud Deck Stacks fetched', [
            'board_id' => $boardId,
            'stacks_count' => is_array($data) ? count($data) : 0
        ]);

        return $data ?? [];
    }

    /**
     * Get all cards for a specific stack.
     *
     * @param int $boardId
     * @param int $stackId
     * @return array
     * @throws \Exception
     */
    public function getCards(int $boardId, int $stackId): array
    {
        try {
            // Try to get stack data which includes cards
            $stackData = $this->makeGetRequest(
                self::DECK_API_PATH . "/boards/{$boardId}/stacks/{$stackId}",
                [],
                'Deck Cards via Stack'
            );

            $cards = $stackData['cards'] ?? [];

            Log::info('Nextcloud Deck Cards fetched via Stack', [
                'board_id' => $boardId,
                'stack_id' => $stackId,
                'cards_count' => count($cards)
            ]);

            return $cards;

        } catch (\Exception $e) {
            Log::warning('First attempt failed, trying direct cards endpoint', [
                'error' => $e->getMessage(),
                'board_id' => $boardId,
                'stack_id' => $stackId
            ]);

            // Fallback to direct cards endpoint
            $cards = $this->makeGetRequest(
                self::DECK_API_PATH . "/boards/{$boardId}/stacks/{$stackId}/cards",
                [],
                'Deck Cards Direct'
            );

            return $cards ?? [];
        }
    }

    /**
     * Get a complete board with all stacks and cards.
     *
     * @param int $boardId
     * @return array
     * @throws \Exception
     */
    public function getBoardComplete(int $boardId): array
    {
        $data = $this->makeGetRequest(
            self::DECK_API_PATH . "/boards/{$boardId}",
            [],
            'Deck Complete Board'
        );

        Log::info('Nextcloud Deck Complete Board fetched', [
            'board_id' => $boardId,
            'stacks_count' => isset($data['stacks']) ? count($data['stacks']) : 0
        ]);

        return $data ?? [];
    }

    /**
     * Get all tasks from all boards (aggregated view).
     *
     * @param array $boardIds Optional array of specific board IDs to fetch
     * @return TasksResultDTO Structured result with boards, stacks, and cards
     * @throws \Exception
     */
    public function getAllTasks(array $boardIds = []): TasksResultDTO
    {
        Log::info('Starting aggregated task fetch from Nextcloud Deck', [
            'specific_board_ids' => $boardIds,
            'fetch_all_boards' => empty($boardIds)
        ]);

        // If no specific board IDs provided, get all boards
        if (empty($boardIds)) {
            $allBoards = $this->getBoards();
            $boardIds = array_column($allBoards, 'id');
            Log::info('Fetching from all available boards', ['board_count' => count($boardIds)]);
        }

        $boards = [];
        foreach ($boardIds as $boardId) {
            $boardResult = $this->fetchBoardTasks($boardId);
            if ($boardResult !== null) {
                $boards[] = $boardResult;
            }
        }

        $result = new TasksResultDTO(
            boards: $boards,
            fetchedAt: now()->toISOString()
        );

        Log::info('Aggregated task fetch complete', [
            'total_boards_processed' => count($boards),
            'total_cards_fetched' => $result->totalCards()
        ]);

        return $result;
    }

    /**
     * Fetch tasks for a single board with fallback handling.
     *
     * @param int $boardId
     * @return BoardDTO|null Board DTO or null if failed
     */
    private function fetchBoardTasks(int $boardId): ?BoardDTO
    {
        try {
            $boardData = $this->getBoardComplete($boardId);
            return $this->processBoardData($boardData, $boardId);

        } catch (\Exception $e) {
            Log::warning('Failed to fetch complete board, trying fallback method', [
                'board_id' => $boardId,
                'error' => $e->getMessage()
            ]);

            return $this->fetchBoardTasksFallback($boardId);
        }
    }

    /**
     * Fallback method to fetch board tasks by fetching stacks and cards separately.
     *
     * @param int $boardId
     * @return BoardDTO|null
     */
    private function fetchBoardTasksFallback(int $boardId): ?BoardDTO
    {
        try {
            $stacks = $this->getStacks($boardId);
            $stackDTOs = [];

            foreach ($stacks as $stack) {
                $cards = [];
                try {
                    $cardsData = $this->getCards($boardId, $stack['id']);
                    $cards = array_map(
                        fn(array $card) => CardDTO::fromArray($card),
                        $cardsData
                    );
                } catch (\Exception $cardError) {
                    Log::warning('Failed to fetch cards for stack', [
                        'board_id' => $boardId,
                        'stack_id' => $stack['id'],
                        'error' => $cardError->getMessage()
                    ]);
                }

                $stackDTOs[] = StackDTO::fromArray($stack, false)->withCards($cards);
            }

            return new BoardDTO(
                id: $boardId,
                title: 'Untitled Board',
                color: null,
                stacks: $stackDTOs
            );

        } catch (\Exception $e) {
            Log::warning('Fallback method also failed for board', [
                'board_id' => $boardId,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Process raw board data into BoardDTO.
     *
     * @param array $boardData
     * @param int $boardId
     * @return BoardDTO
     */
    private function processBoardData(array $boardData, int $boardId): BoardDTO
    {
        $stacks = $boardData['stacks'] ?? [];
        $stackDTOs = [];

        foreach ($stacks as $stack) {
            $cards = $stack['cards'] ?? [];

            if (empty($cards)) {
                // Cards not included, fetch them separately
                try {
                    $cards = $this->getCards($boardId, $stack['id']);
                } catch (\Exception $e) {
                    Log::warning('Failed to fetch cards for stack', [
                        'board_id' => $boardId,
                        'stack_id' => $stack['id'],
                        'error' => $e->getMessage()
                    ]);
                    $cards = [];
                }
            }

            $cardDTOs = array_map(
                fn(array $card) => CardDTO::fromArray($card),
                $cards
            );

            $stackDTOs[] = StackDTO::fromArray($stack, false)->withCards($cardDTOs);
        }

        $board = new BoardDTO(
            id: $boardData['id'] ?? $boardId,
            title: $boardData['title'] ?? 'Untitled Board',
            color: $boardData['color'] ?? null,
            stacks: $stackDTOs
        );

        Log::info('Board processing complete', [
            'board_id' => $boardId,
            'board_title' => $board->title,
            'stacks_count' => count($board->stacks),
            'total_cards' => $board->totalCards()
        ]);

        return $board;
    }

    /**
     * Test connection to Nextcloud Deck API.
     *
     * @return array Connection status and basic info
     */
    public function testConnection(): array
    {
        try {
            $boards = $this->getBoards();
            return [
                'connected' => true,
                'boards_count' => count($boards),
                'boards' => array_map(fn($board) => [
                    'id' => $board['id'],
                    'title' => $board['title'] ?? 'Untitled Board'
                ], $boards)
            ];
        } catch (\Exception $e) {
            return [
                'connected' => false,
                'error' => $e->getMessage()
            ];
        }
    }
}