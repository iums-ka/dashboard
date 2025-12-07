/**
 * Task Utilities
 * 
 * Helper functions for task priority, sorting, and date formatting.
 */

import { TASK_PRIORITY, UI } from '../config';

/**
 * Get priority info for a task based on labels and due date
 * @returns {{ color: string, level: string }}
 */
export const getPriorityInfo = (card) => {
  const labels = card.labels || [];
  const duedate = card.duedate;
  
  // Check for priority labels
  const highPriorityLabel = labels.find(label => 
    label.title?.toLowerCase().includes('high') || 
    label.title?.toLowerCase().includes('urgent') ||
    label.title?.toLowerCase().includes('wichtig')
  );
  
  const lowPriorityLabel = labels.find(label => 
    label.title?.toLowerCase().includes('low') || 
    label.title?.toLowerCase().includes('niedrig')
  );

  if (highPriorityLabel) {
    return { color: 'error', level: 'Hoch' };
  }
  
  if (lowPriorityLabel) {
    return { color: 'success', level: 'Niedrig' };
  }

  // Check due date for urgency
  if (duedate) {
    const due = new Date(duedate);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { color: 'error', level: 'Überfällig' };
    } else if (diffDays <= TASK_PRIORITY.URGENT_THRESHOLD) {
      return { color: 'warning', level: 'Dringend' };
    }
  }
  
  return { color: 'default', level: 'Normal' };
};

/**
 * Format due date for display
 * @returns {{ text: string, color: string } | null}
 */
export const formatDueDate = (duedate) => {
  if (!duedate) return null;
  
  const due = new Date(duedate);
  const now = new Date();
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  
  const dateStr = due.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit'
  });
  
  if (diffDays < 0) {
    return { text: `${dateStr} (${Math.abs(diffDays)}d überfällig)`, color: 'error' };
  } else if (diffDays === 0) {
    return { text: `${dateStr} (heute)`, color: 'warning' };
  } else if (diffDays === 1) {
    return { text: `${dateStr} (morgen)`, color: 'warning' };
  } else if (diffDays <= 7) {
    return { text: `${dateStr} (in ${diffDays}d)`, color: 'info' };
  }
  
  return { text: dateStr, color: 'default' };
};

/**
 * Check if a task is urgent/overdue
 * Considers tasks overdue up to OVERDUE_LIMIT_DAYS and due within URGENT_DAYS
 */
export const isTaskUrgent = (card) => {
  if (!card.duedate) return false;
  
  const due = new Date(card.duedate);
  const now = new Date();
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  
  // Overdue tasks (up to configured limit) or due within urgent threshold
  if (diffDays < 0) {
    return Math.abs(diffDays) <= TASK_PRIORITY.MAX_OVERDUE_DAYS;
  }

  return diffDays <= TASK_PRIORITY.UPCOMING_THRESHOLD;
};

/**
 * Count urgent tasks in a board
 */
export const getUrgentTaskCount = (board) => {
  if (!board?.stacks) return 0;
  
  let urgentCount = 0;
  board.stacks.forEach(stack => {
    stack.cards?.forEach(card => {
      if (!card.archived && !card.done && isTaskUrgent(card)) {
        urgentCount++;
      }
    });
  });
  
  return urgentCount;
};

/**
 * Calculate display duration based on urgent task count
 * More urgent tasks = longer display time
 */
export const calculateDisplayDuration = (urgentTaskCount) => {
  const baseTime = 40000; // 40 seconds base display time

  if (urgentTaskCount >= 5) return baseTime;
  if (urgentTaskCount === 4) return baseTime * 0.9;
  if (urgentTaskCount === 3) return baseTime * 0.8;
  if (urgentTaskCount === 2) return baseTime * 0.7;
  if (urgentTaskCount === 1) return baseTime * 0.6;
  return baseTime * 0.5;
};

/**
 * Sort tasks by priority
 * Order: Overdue > Due soon > Assigned > Unassigned
 */
export const sortTasksByPriority = (tasks) => {
  return [...tasks].sort((a, b) => {
    const aDue = a.duedate ? new Date(a.duedate) : null;
    const bDue = b.duedate ? new Date(b.duedate) : null;
    const now = new Date();
    
    const aDiffDays = aDue ? Math.ceil((aDue - now) / (1000 * 60 * 60 * 24)) : null;
    const bDiffDays = bDue ? Math.ceil((bDue - now) / (1000 * 60 * 60 * 24)) : null;
    
    const aIsOverdue = aDiffDays !== null && aDiffDays < 0 && Math.abs(aDiffDays) <= TASK_PRIORITY.MAX_OVERDUE_DAYS;
    const bIsOverdue = bDiffDays !== null && bDiffDays < 0 && Math.abs(bDiffDays) <= TASK_PRIORITY.MAX_OVERDUE_DAYS;
    
    const aHasDueDate = aDue !== null && !aIsOverdue;
    const bHasDueDate = bDue !== null && !bIsOverdue;
    
    const aAssignedCount = a.assignedUsers?.length || 0;
    const bAssignedCount = b.assignedUsers?.length || 0;
    const aIsAssigned = aAssignedCount > 0;
    const bIsAssigned = bAssignedCount > 0;
    
    // 1. Overdue first
    if (aIsOverdue && !bIsOverdue) return -1;
    if (bIsOverdue && !aIsOverdue) return 1;
    if (aIsOverdue && bIsOverdue) return aDue - bDue;
    
    // 2. Due tasks next
    if (aHasDueDate && !bHasDueDate) return -1;
    if (bHasDueDate && !aHasDueDate) return 1;
    if (aHasDueDate && bHasDueDate) return aDue - bDue;
    
    // 3. Assigned tasks
    if (aIsAssigned && !bIsAssigned) return -1;
    if (bIsAssigned && !aIsAssigned) return 1;
    if (aIsAssigned && bIsAssigned && aAssignedCount !== bAssignedCount) {
      return bAssignedCount - aAssignedCount;
    }
    
    // 4. By creation date
    const aCreated = a.createdAt ? new Date(a.createdAt) : new Date(0);
    const bCreated = b.createdAt ? new Date(b.createdAt) : new Date(0);
    return bCreated - aCreated;
  });
};

/**
 * Extract active tasks from a board
 */
export const extractTasksFromBoard = (board) => {
  if (!board?.stacks) return [];
  
  const tasks = [];
  board.stacks.forEach(stack => {
    stack.cards?.forEach(card => {
      if (!card.archived && !card.done) {
        tasks.push({
          ...card,
          boardTitle: board.title || `Board ${board.id}`,
          stackTitle: stack.title,
          boardId: board.id,
          stackId: stack.id
        });
      }
    });
  });
  
  return tasks;
};

/**
 * Get top N tasks from a board, sorted by priority
 */
export const getTopTasksFromBoard = (board, limit = 5) => {
  const tasks = extractTasksFromBoard(board);
  const sorted = sortTasksByPriority(tasks);
  return sorted.slice(0, limit);
};
