/**
 * Frontend Constants & Configuration
 * 
 * Centralized configuration for the dashboard frontend.
 * Import from here instead of hardcoding values in components.
 */

// =============================================================================
// API Configuration
// =============================================================================

/**
 * Base URL for API requests
 * Can be overridden via REACT_APP_API_URL environment variable
 */
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// =============================================================================
// Refresh Intervals (in milliseconds)
// =============================================================================

export const REFRESH_INTERVALS = {
  /** Mensa menu refresh - 1 hour */
  MENSA: 3600000,
  
  /** Proposals/Anträge refresh - 5 minutes */
  PROPOSALS: 300000,
  
  /** Tasks refresh - 20 minutes */
  TASKS: 1200000,
  
  /** Board list cache duration - 5 minutes */
  BOARDS_CACHE: 300000,
};

// =============================================================================
// UI Configuration
// =============================================================================

export const UI = {
  /** Maximum tasks to display per board */
  MAX_TASKS_PER_BOARD: 5,
  
  /** Base rotation duration for boards (ms) */
  BOARD_ROTATION_BASE_TIME: 40000,
  
  /** Transition duration for animations (ms) */
  TRANSITION_DURATION: 150,
  
  /** Progress bar update interval (ms) */
  PROGRESS_UPDATE_INTERVAL: 100,
};

// =============================================================================
// Grid Layout Configuration
// =============================================================================

export const GRID = {
  /** Number of columns in the grid */
  COLUMNS: 16,
  
  /** Number of rows in the grid */
  ROWS: 9,
  
  /** Grid gap in pixels */
  GAP: 16,
};

// =============================================================================
// Theme Colors (for use outside MUI theme context)
// =============================================================================

export const COLORS = {
  primary: '#0459C9',
  primaryLight: '#9BB8D9',
  primaryDark: '#033A9E',
  
  secondary: '#9BB8D9',
  secondaryLight: '#C5D5E8',
  secondaryDark: '#7A9BC7',
  
  background: '#f8fafc',
  paper: '#ffffff',
  
  textPrimary: '#1a202c',
  textSecondary: '#4a5568',
  
  border: '#e2e8f0',
  
  success: '#48bb78',
  warning: '#ed8936',
  error: '#f56565',
};

// =============================================================================
// LocalStorage Keys
// =============================================================================

export const STORAGE_KEYS = {
  /** Board selection cache */
  BOARDS_CACHE: 'nextcloud_boards_cache',
  
  /** Selected boards per instance prefix */
  SELECTED_BOARDS_PREFIX: 'selected_boards_',
};

// =============================================================================
// Date/Time Formatting
// =============================================================================

export const DATE_FORMAT = {
  /** Locale for date formatting */
  LOCALE: 'de-DE',
  
  /** Time display options */
  TIME_OPTIONS: { hour: '2-digit', minute: '2-digit' },
  
  /** Short date options */
  DATE_SHORT_OPTIONS: { day: '2-digit', month: '2-digit' },
  
  /** Full date options */
  DATE_FULL_OPTIONS: { day: '2-digit', month: '2-digit', year: 'numeric' },
};

// =============================================================================
// Task Priority Thresholds (in days)
// =============================================================================

export const TASK_PRIORITY = {
  /** Days until due to consider "urgent" */
  URGENT_THRESHOLD: 3,
  
  /** Days until due to show in "upcoming" */
  UPCOMING_THRESHOLD: 7,
  
  /** Maximum days overdue to still display */
  MAX_OVERDUE_DAYS: 30,
};
