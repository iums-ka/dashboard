/**
 * Components Barrel Export
 * 
 * Central export point for all dashboard components.
 * Provides clean imports from a single location.
 * 
 * Usage:
 *   import { Tasks, Mensa, Antraege, GridLayout } from './components';
 * 
 * Component Organization:
 * 
 * Layout Components:
 *   - GridLayout: 16x9 grid container for dashboard modules
 *   - ModuleSlot: Individual module wrapper with consistent styling
 * 
 * Dashboard Modules:
 *   - Tasks: Nextcloud Deck task board with rotation
 *   - Mensa: Cafeteria menu display
 *   - Antraege: Funding proposals table
 * 
 * Tasks Sub-components:
 *   - TasksHeader: Header with board info and controls
 *   - TasksList: Scrollable list of task items
 *   - TaskItem: Individual task with priority and avatars
 *   - BoardSelector: Board selection dialog
 */

// Layout Components
export { default as GridLayout } from './GridLayout';
export { default as ModuleSlot } from './ModuleSlot';

// Dashboard Modules
export { default as Tasks } from './Tasks';
export { default as Mensa } from './Mensa';
export { default as Antraege } from './Antraege';

// Tasks Sub-components (for advanced usage)
export { default as TasksHeader } from './TasksHeader';
export { default as TasksList } from './TasksList';
export { default as TaskItem } from './TaskItem';
export { default as BoardSelector } from './BoardSelector';
