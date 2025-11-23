/**
 * Board Storage Utilities
 * 
 * Helper functions for managing board selection persistence in localStorage.
 * Each Tasks module instance maintains its own board selection using an instanceId.
 */

const STORAGE_PREFIX = 'tasks_boards';
const BOARDS_CACHE_KEY = 'nextcloud_boards_cache';

/**
 * Get the localStorage key for a specific instance
 * @param {string} instanceId - Unique identifier for the Tasks module instance
 * @returns {string} - localStorage key
 */
const getStorageKey = (instanceId) => {
  return `${STORAGE_PREFIX}_${instanceId}`;
};

/**
 * Load selected board IDs for a specific instance
 * @param {string} instanceId - Unique identifier for the Tasks module instance
 * @returns {number[]|null} - Array of board IDs or null if not found
 */
export const loadSelectedBoards = (instanceId) => {
  try {
    const key = getStorageKey(instanceId);
    const stored = localStorage.getItem(key);
    
    if (!stored) {
      return null;
    }
    
    const parsed = JSON.parse(stored);
    
    // Validate that it's an array of numbers
    if (Array.isArray(parsed) && parsed.every(id => typeof id === 'number')) {
      return parsed;
    }
    
    console.warn(`Invalid board selection data for instance ${instanceId}, clearing...`);
    localStorage.removeItem(key);
    return null;
  } catch (error) {
    console.error('Error loading selected boards:', error);
    return null;
  }
};

/**
 * Save selected board IDs for a specific instance
 * @param {string} instanceId - Unique identifier for the Tasks module instance
 * @param {number[]} boardIds - Array of board IDs to save
 * @returns {boolean} - Success status
 */
export const saveSelectedBoards = (instanceId, boardIds) => {
  try {
    if (!Array.isArray(boardIds)) {
      console.error('boardIds must be an array');
      return false;
    }
    
    // Filter out invalid IDs and convert to numbers
    const validIds = boardIds
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id) && id > 0);
    
    const key = getStorageKey(instanceId);
    localStorage.setItem(key, JSON.stringify(validIds));
    
    console.log(`Saved board selection for instance ${instanceId}:`, validIds);
    return true;
  } catch (error) {
    console.error('Error saving selected boards:', error);
    return false;
  }
};

/**
 * Clear selected boards for a specific instance
 * @param {string} instanceId - Unique identifier for the Tasks module instance
 * @returns {boolean} - Success status
 */
export const clearSelectedBoards = (instanceId) => {
  try {
    const key = getStorageKey(instanceId);
    localStorage.removeItem(key);
    console.log(`Cleared board selection for instance ${instanceId}`);
    return true;
  } catch (error) {
    console.error('Error clearing selected boards:', error);
    return false;
  }
};

/**
 * Get all stored board selections (useful for debugging)
 * @returns {Object} - Map of instanceId to board arrays
 */
export const getAllStoredSelections = () => {
  const selections = {};
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key && key.startsWith(STORAGE_PREFIX)) {
        const instanceId = key.replace(`${STORAGE_PREFIX}_`, '');
        const value = localStorage.getItem(key);
        
        try {
          selections[instanceId] = JSON.parse(value);
        } catch {
          selections[instanceId] = null;
        }
      }
    }
  } catch (error) {
    console.error('Error getting all selections:', error);
  }
  
  return selections;
};

/**
 * Clear all board selections (useful for reset/cleanup)
 * @returns {number} - Number of items cleared
 */
export const clearAllStoredSelections = () => {
  let count = 0;
  
  try {
    const keys = [];
    
    // Collect all keys first (can't modify during iteration)
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(STORAGE_PREFIX)) {
        keys.push(key);
      }
    }
    
    // Remove all matching keys
    keys.forEach(key => {
      localStorage.removeItem(key);
      count++;
    });
    
    console.log(`Cleared ${count} board selections`);
  } catch (error) {
    console.error('Error clearing all selections:', error);
  }
  
  return count;
};

/**
 * Clear the boards cache
 * Useful when you want to force a fresh fetch from the API
 * @returns {boolean} - Success status
 */
export const clearBoardsCache = () => {
  try {
    localStorage.removeItem(BOARDS_CACHE_KEY);
    console.log('Cleared boards cache');
    return true;
  } catch (error) {
    console.error('Error clearing boards cache:', error);
    return false;
  }
};
