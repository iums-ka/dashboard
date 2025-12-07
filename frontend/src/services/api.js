/**
 * API Service Layer
 * 
 * Centralized API client for all backend communication.
 * Provides consistent error handling, response parsing, and configuration.
 */

import { API_BASE_URL, REFRESH_INTERVALS } from '../config';

// Re-export for backwards compatibility
export { REFRESH_INTERVALS };

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Default request options
 */
const defaultOptions = {
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * Make an API request with standardized error handling
 * 
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Fetch options
 * @returns {Promise<any>} - Parsed response data
 * @throws {ApiError} - On request failure
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Parse JSON response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // Response is not JSON
      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }
      return null;
    }

    // Check for HTTP errors
    if (!response.ok) {
      throw new ApiError(
        data.message || data.error || `HTTP ${response.status}`,
        response.status,
        data
      );
    }

    // Check for API-level errors (success: false)
    if (data.success === false) {
      throw new ApiError(
        data.message || data.error || 'Request failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Wrap network errors
    throw new ApiError(
      error.message || 'Network error',
      0,
      null
    );
  }
}

/**
 * GET request helper
 */
function get(endpoint, params = {}) {
  const queryString = Object.keys(params).length > 0
    ? '?' + new URLSearchParams(params).toString()
    : '';
  
  return request(`${endpoint}${queryString}`, { method: 'GET' });
}

/**
 * POST request helper
 */
function post(endpoint, data = {}) {
  return request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// =============================================================================
// API Endpoints
// =============================================================================

/**
 * Health check
 */
export const health = {
  check: () => get('/health'),
  parser: () => get('/parser/health'),
  tasks: () => get('/tasks/health'),
};

/**
 * Mensa API
 */
export const mensa = {
  /**
   * Get menu data
   * @param {boolean} withImages - Include food images
   */
  getMenu: (withImages = false) => 
    get(withImages ? '/mensa/with-images' : '/mensa'),
};

/**
 * Tasks API (Nextcloud Deck)
 */
export const tasks = {
  /**
   * Get all tasks
   * @param {number[]} boardIds - Optional array of board IDs to filter
   */
  getAll: (boardIds = []) => {
    const params = boardIds.length > 0 ? { boards: boardIds.join(',') } : {};
    return get('/tasks', params);
  },

  /**
   * Get all available boards
   */
  getBoards: () => get('/tasks/boards'),

  /**
   * Get a specific board
   * @param {number} boardId
   */
  getBoard: (boardId) => get(`/tasks/boards/${boardId}`),

  /**
   * Get stacks for a board
   * @param {number} boardId
   */
  getStacks: (boardId) => get(`/tasks/boards/${boardId}/stacks`),

  /**
   * Get cards for a stack
   * @param {number} boardId
   * @param {number} stackId
   */
  getCards: (boardId, stackId) => 
    get(`/tasks/boards/${boardId}/stacks/${stackId}/cards`),
};

/**
 * Proposals API
 */
export const proposals = {
  /**
   * Get all proposals
   */
  getAll: () => get('/proposals'),
};

/**
 * Users API
 */
export const users = {
  /**
   * Get all users
   */
  getAll: () => get('/users'),

  /**
   * Get users with avatar data
   */
  getAllWithAvatars: () => get('/users/with-avatars'),

  /**
   * Get a specific user
   * @param {string} userId
   */
  getUser: (userId) => get(`/users/${userId}`),

  /**
   * Get user avatar as base64
   * @param {string} userId
   * @param {number} size - Avatar size in pixels
   */
  getAvatarBase64: (userId, size = 64) => 
    get(`/users/${userId}/avatar-base64`, { size }),
};

// Default export with all API modules
const api = {
  health,
  mensa,
  tasks,
  proposals,
  users,
  // Expose utilities
  request,
  get,
  post,
  ApiError,
  REFRESH_INTERVALS,
  // Expose base URL for debugging
  BASE_URL: API_BASE_URL,
};

export default api;
