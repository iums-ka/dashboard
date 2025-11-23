<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\NextcloudDeckService;
use Illuminate\Support\Facades\Log;

class TaskController extends Controller
{
    private NextcloudDeckService $deckService;

    public function __construct(NextcloudDeckService $deckService)
    {
        $this->deckService = $deckService;
    }

    /**
     * Get all tasks from Nextcloud Deck
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            // Get optional board IDs from request
            $boardIds = $request->get('boards', []);
            
            if (is_string($boardIds)) {
                $boardIds = explode(',', $boardIds);
            }
            
            // Convert to integers and filter out invalid values
            $boardIds = array_filter(array_map('intval', (array) $boardIds));

            // If no board IDs specified in request, check for default configuration
            if (empty($boardIds)) {
                $defaultBoards = config('services.nextcloud.deck.default_boards');
                if ($defaultBoards) {
                    $boardIds = array_filter(array_map('intval', explode(',', $defaultBoards)));
                }
            }

            Log::info('Task fetch request received', [
                'requested_board_ids' => $boardIds,
                'fetch_all' => empty($boardIds),
                'using_defaults' => !empty($boardIds) && !$request->has('boards')
            ]);

            $tasks = $this->deckService->getAllTasks($boardIds);

            return response()->json([
                'success' => true,
                'data' => $tasks,
                'message' => 'Tasks fetched successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch tasks', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch tasks from Nextcloud Deck',
                'message' => 'Unable to retrieve tasks. Please check your Nextcloud connection and Deck app installation.',
                'details' => config('app.debug') ? $e->getMessage() : null
            ], 503);
        }
    }

    /**
     * Get all available boards
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function boards()
    {
        try {
            Log::info('Board list request received');

            $boards = $this->deckService->getBoards();

            // Get default boards from config if specified
            $defaultBoards = config('services.nextcloud.deck.default_boards');
            $allowedBoardIds = [];
            
            if ($defaultBoards) {
                $allowedBoardIds = array_filter(array_map('intval', explode(',', $defaultBoards)));
            }

            // Format boards for frontend consumption
            $formattedBoards = array_map(function ($board) {
                return [
                    'id' => $board['id'],
                    'title' => $board['title'] ?? 'Untitled Board',
                    'color' => $board['color'] ?? null,
                    'archived' => $board['archived'] ?? false,
                    'permissions' => $board['permissions'] ?? [],
                    'users' => $board['users'] ?? [],
                    'acl' => $board['acl'] ?? []
                ];
            }, $boards);

            // Filter boards to only include those in default config (if specified)
            if (!empty($allowedBoardIds)) {
                $formattedBoards = array_values(array_filter($formattedBoards, function ($board) use ($allowedBoardIds) {
                    return in_array($board['id'], $allowedBoardIds);
                }));
                
                Log::info('Filtered boards by default config', [
                    'allowed_board_ids' => $allowedBoardIds,
                    'total_boards' => count($boards),
                    'filtered_boards' => count($formattedBoards)
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $formattedBoards,
                'message' => 'Boards fetched successfully',
                'count' => count($formattedBoards)
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch boards', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch boards from Nextcloud Deck',
                'message' => 'Unable to retrieve boards. Please check your Nextcloud connection and Deck app installation.',
                'details' => config('app.debug') ? $e->getMessage() : null
            ], 503);
        }
    }

    /**
     * Get stacks for a specific board
     * 
     * @param Request $request
     * @param int $boardId
     * @return \Illuminate\Http\JsonResponse
     */
    public function stacks(Request $request, int $boardId)
    {
        try {
            Log::info('Stack list request received', ['board_id' => $boardId]);

            $stacks = $this->deckService->getStacks($boardId);

            // Format stacks for frontend consumption
            $formattedStacks = array_map(function ($stack) {
                return [
                    'id' => $stack['id'],
                    'title' => $stack['title'],
                    'boardId' => $stack['boardId'] ?? null,
                    'order' => $stack['order'] ?? 0,
                    'archived' => $stack['archived'] ?? false
                ];
            }, $stacks);

            return response()->json([
                'success' => true,
                'data' => $formattedStacks,
                'message' => 'Stacks fetched successfully',
                'count' => count($formattedStacks),
                'board_id' => $boardId
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch stacks', [
                'board_id' => $boardId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch stacks from Nextcloud Deck',
                'message' => 'Unable to retrieve stacks for the specified board.',
                'details' => config('app.debug') ? $e->getMessage() : null,
                'board_id' => $boardId
            ], 503);
        }
    }

    /**
     * Get cards for a specific stack
     * 
     * @param Request $request
     * @param int $boardId
     * @param int $stackId
     * @return \Illuminate\Http\JsonResponse
     */
    public function cards(Request $request, int $boardId, int $stackId)
    {
        try {
            Log::info('Cards list request received', [
                'board_id' => $boardId,
                'stack_id' => $stackId
            ]);

            $cards = $this->deckService->getCards($boardId, $stackId);

            // Format cards for frontend consumption
            $formattedCards = array_map(function ($card) {
                return [
                    'id' => $card['id'],
                    'title' => $card['title'],
                    'description' => $card['description'] ?? '',
                    'stackId' => $card['stackId'] ?? null,
                    'type' => $card['type'] ?? 'plain',
                    'lastModified' => $card['lastModified'] ?? null,
                    'createdAt' => $card['createdAt'] ?? null,
                    'labels' => $card['labels'] ?? [],
                    'assignedUsers' => $card['assignedUsers'] ?? [],
                    'attachmentCount' => $card['attachmentCount'] ?? 0,
                    'commentsCount' => $card['commentsCount'] ?? 0,
                    'order' => $card['order'] ?? 0,
                    'archived' => $card['archived'] ?? false,
                    'done' => $card['done'] ?? false,
                    'duedate' => $card['duedate'] ?? null,
                    'notified' => $card['notified'] ?? false
                ];
            }, $cards);

            return response()->json([
                'success' => true,
                'data' => $formattedCards,
                'message' => 'Cards fetched successfully',
                'count' => count($formattedCards),
                'board_id' => $boardId,
                'stack_id' => $stackId
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch cards', [
                'board_id' => $boardId,
                'stack_id' => $stackId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch cards from Nextcloud Deck',
                'message' => 'Unable to retrieve cards for the specified stack.',
                'details' => config('app.debug') ? $e->getMessage() : null,
                'board_id' => $boardId,
                'stack_id' => $stackId
            ], 503);
        }
    }

    /**
     * Get a complete board with all stacks and cards
     * 
     * @param Request $request
     * @param int $boardId
     * @return \Illuminate\Http\JsonResponse
     */
    public function board(Request $request, int $boardId)
    {
        try {
            Log::info('Complete board request received', ['board_id' => $boardId]);

            $boardData = $this->deckService->getBoardComplete($boardId);

            return response()->json([
                'success' => true,
                'data' => $boardData,
                'message' => 'Board data fetched successfully',
                'board_id' => $boardId
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch complete board', [
                'board_id' => $boardId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to fetch board from Nextcloud Deck',
                'message' => 'Unable to retrieve complete board data.',
                'details' => config('app.debug') ? $e->getMessage() : null,
                'board_id' => $boardId
            ], 503);
        }
    }

    /**
     * Get connection health status
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function health()
    {
        try {
            $status = $this->deckService->testConnection();

            if ($status['connected']) {
                return response()->json([
                    'success' => true,
                    'status' => 'healthy',
                    'message' => 'Nextcloud Deck connection is working',
                    'data' => [
                        'boards_count' => $status['boards_count'],
                        'boards' => $status['boards']
                    ],
                    'timestamp' => now()->toISOString()
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'status' => 'unhealthy',
                    'error' => 'Nextcloud Deck connection failed',
                    'message' => 'Unable to connect to Nextcloud Deck API',
                    'details' => $status['error'],
                    'timestamp' => now()->toISOString()
                ], 503);
            }

        } catch (\Exception $e) {
            Log::error('Deck health check failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'status' => 'unhealthy',
                'error' => 'Health check failed',
                'message' => 'Unable to perform health check for Nextcloud Deck',
                'details' => config('app.debug') ? $e->getMessage() : null,
                'timestamp' => now()->toISOString()
            ], 503);
        }
    }
}