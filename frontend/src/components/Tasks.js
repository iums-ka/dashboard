import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  LinearProgress,
  useTheme
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TaskIcon from '@mui/icons-material/Task';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import FolderIcon from '@mui/icons-material/Folder';
import SettingsIcon from '@mui/icons-material/Settings';
import BoardSelector from './BoardSelector';
import { loadSelectedBoards, saveSelectedBoards } from '../utils/boardStorage';

/**
 * TODO: REFACTOR - Component Architecture
 * 
 * Current implementation tightly couples data fetching, state management,
 * and UI rendering. Board selection is managed via localStorage utilities.
 * 
 * Issues with current approach:
 * - Mixed concerns (data fetching + UI + business logic)
 * - Props drilling (instanceId passed down)
 * - Duplicate code between multiple Tasks instances
 * - Direct localStorage dependency makes testing harder
 * - No centralized board state (each instance manages independently)
 * 
 * Recommended improvements:
 * - Extract data fetching to custom hooks (useTasks, useBoards)
 * - Create a BoardSelectionProvider context for shared state
 * - Split into smaller components (TasksList, TaskItem, TaskHeader)
 * - Move business logic (sorting, filtering) to separate modules
 * - Use composition pattern for better reusability
 * 
 * See: frontend/docs/REFACTORING_PLAN.md (to be created)
 */

const API_BASE_URL = 'http://localhost:8000/api';
const REFRESH_INTERVAL = 1200000; // 20 minutes

// TODO: TEMPORARY MOCK - Replace with backend API call to /api/users/with-avatars
// Mock user avatar mapping - maps display names to local avatar files in /public
const USER_AVATAR_MAP = {
  'ethan': '/avatar.ethan.png',
  'jonas': '/avatar.jonas.jpg',
  'leon': '/avatar.leon.png',
  'lukas': '/avatar.lukas.png',
  'marie': '/avatar.marie.png',
  'marit': '/avatar.marit.png',
  'riem': '/avatar.riem.png',
  'thomas': '/avatar.thomas.png',
  'waldemar': '/avatar.waldemar.png',
  'blanche': '/avatar.blanche.jpg',
  'bastian': '/avatar.bastian.png',
  'dilara': '/avatar.dilara.png',
  'melanie': '/avatar.melanie.png',
  'maximilian': '/avatar.maximillian.png',
  'julia': '/avatar.julia.png',
  'kirthan': '/avatar.kirthan.png',

};

// Helper function to get local avatar for a user
const getLocalAvatar = (user) => {
  const fullName = user.displayName || user.displayname || user.name || 
                   user.fullName || user.username || user.uid || user.id || '';
  const firstName = fullName.toLowerCase().split(' ')[0];
  
  // Try exact match
  if (USER_AVATAR_MAP[firstName]) {
    return USER_AVATAR_MAP[firstName];
  }
  
  // Try partial match
  for (const [key, avatar] of Object.entries(USER_AVATAR_MAP)) {
    if (firstName.includes(key) || key.includes(firstName)) {
      return avatar;
    }
  }
  
  return null;
};

export default function Tasks({ instanceId = 'default' }) {
  const theme = useTheme();
  const [tasksData, setTasksData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Board selection state
  const [selectedBoards, setSelectedBoards] = useState(() => loadSelectedBoards(instanceId) || []);
  const [boardSelectorOpen, setBoardSelectorOpen] = useState(false);
  
  // Rotation state variables for deck cycling
  const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
  const [displayDuration, setDisplayDuration] = useState(40000); // Default 40 seconds
  const [rotationTimer, setRotationTimer] = useState(null);
  
  // Animation state variables
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progressInterval, setProgressInterval] = useState(null);

  // Fetch tasks data from Laravel backend
  const fetchTasksData = useCallback(async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      setError(null);

      // Build URL with board filter if boards are selected
      let url = `${API_BASE_URL}/tasks`;
      if (selectedBoards.length > 0) {
        url += `?boards=${selectedBoards.join(',')}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Laden der Aufgaben');
      }
      
      setTasksData(result.data);
      setLastUpdated(new Date());
      setError(null);
      
      // Reset rotation state when new data is loaded
      setCurrentDeckIndex(0);
      setProgress(0);
    } catch (err) {
      console.error('Error fetching tasks data:', err);
      setError(err.message || 'Fehler beim Laden der Aufgaben');
    } finally {
      setLoading(false);
    }
  }, [selectedBoards]);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    fetchTasksData();
  }, [fetchTasksData]);

  // Initial load and interval setup
  useEffect(() => {
    fetchTasksData();

    // Set up automatic refresh
    const intervalId = setInterval(() => {
      fetchTasksData(false); // Don't show loading spinner for auto-refresh
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchTasksData]);

  // Handle board selection save
  const handleBoardSelectionSave = useCallback((boardIds) => {
    setSelectedBoards(boardIds);
    saveSelectedBoards(instanceId, boardIds);
  }, [instanceId]);

  // Rotation timer setup with progress animation
  useEffect(() => {
    // Only start rotation if we have data and multiple boards
    if (!tasksData?.boards || tasksData.boards.length <= 1) {
      setProgress(0);
      return;
    }

    // Clear any existing timers
    if (rotationTimer) {
      clearTimeout(rotationTimer);
    }
    if (progressInterval) {
      clearInterval(progressInterval);
    }

    // Get current board and calculate display duration
    const currentBoard = tasksData.boards[currentDeckIndex];
    const urgentCount = currentBoard ? getUrgentTaskCount(currentBoard) : 0;
    const duration = calculateDisplayDuration(urgentCount);
    
    // Reset progress and start animation
    setProgress(0);
    setIsTransitioning(false);
    
    // Progress animation - update every 100ms
    const progressStep = 100 / (duration / 100); // Progress increment per 100ms
    const newProgressInterval = setInterval(() => {
      setProgress((prevProgress) => {
        const newProgress = prevProgress + progressStep;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 100);
    
    // Set new timer for deck rotation
    const newTimer = setTimeout(() => {
      setIsTransitioning(true);
      // Small delay for transition effect
      setTimeout(() => {
        setCurrentDeckIndex((prevIndex) => 
          prevIndex >= tasksData.boards.length - 1 ? 0 : prevIndex + 1
        );
      }, 150); // 150ms transition delay
    }, duration);
    
    setRotationTimer(newTimer);
    setProgressInterval(newProgressInterval);
    setDisplayDuration(duration);

    // Cleanup timers on unmount or dependency change
    return () => {
      if (newTimer) {
        clearTimeout(newTimer);
      }
      if (newProgressInterval) {
        clearInterval(newProgressInterval);
      }
    };
  }, [tasksData, currentDeckIndex]); // Removed rotationTimer and progressInterval from deps to avoid infinite loop

  // Get priority color based on labels or due date
  const getPriorityInfo = (card) => {
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
      } else if (diffDays <= 3) {
        return { color: 'warning', level: 'Dringend' };
      }
    }
    
    return { color: 'default', level: 'Normal' };
  };

  // Format due date
  const formatDueDate = (duedate) => {
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

  // check if a task is urgent/overdue
  const isTaskUrgent = (card) => {
    if (!card.duedate) return false;
    
    const due = new Date(card.duedate);
    const now = new Date();
    const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    
    // Overdue tasks (up to 1 month) or due within 7 days
    if (diffDays < 0) {
      // Only consider overdue tasks up to 1 month old
      return Math.abs(diffDays) <= 30;
    }

    // Tasks due within 7 days are also considered urgent
    return diffDays <= 7;
  };

  // Count urgent tasks per deck
  const getUrgentTaskCount = (board) => {
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

  // Helper function to calculate display duration based on urgent task count
  const calculateDisplayDuration = (urgentTaskCount) => {
    const baseTime = 40000; // 40 seconds

    if (urgentTaskCount >= 5) return baseTime; // 100% = 40 seconds
    if (urgentTaskCount === 4) return baseTime * 0.9; // 90% = 36 seconds
    if (urgentTaskCount === 3) return baseTime * 0.8; // 80% = 32 seconds
    if (urgentTaskCount === 2) return baseTime * 0.7; // 70% = 28 seconds
    if (urgentTaskCount === 1) return baseTime * 0.6; // 60% = 24 seconds
    return baseTime * 0.5; // 50% = 20 seconds (no urgent tasks)
  };

  // Get all tasks in a flat array for display
  const getAllTasks = () => {
    if (!tasksData?.boards) return [];
    
    const allTasks = [];
    tasksData.boards.forEach(board => {
      board.stacks?.forEach(stack => {
        stack.cards?.forEach(card => {
          if (!card.archived && !card.done) { // Only show active tasks
            allTasks.push({
              ...card,
              boardTitle: board.title || `Board ${board.id}`,
              stackTitle: stack.title,
              boardId: board.id,
              stackId: stack.id
            });
          }
        });
      });
    });
    
    // Sort by due date (urgent first), then by priority
    return allTasks.sort((a, b) => {
      const aDue = a.duedate ? new Date(a.duedate) : null;
      const bDue = b.duedate ? new Date(b.duedate) : null;
      const now = new Date();
      
      // Overdue tasks first
      if (aDue && aDue < now && (!bDue || bDue >= now)) return -1;
      if (bDue && bDue < now && (!aDue || aDue >= now)) return 1;
      
      // Then by due date (earliest first)
      if (aDue && bDue) {
        return aDue - bDue;
      }
      if (aDue && !bDue) return -1;
      if (bDue && !aDue) return 1;
      
      // Finally by creation date (newest first)
      const aCreated = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const bCreated = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return bCreated - aCreated;
    });
  };

  // Get tasks from the current deck only (for rotation display)
  const getCurrentDeckTasks = () => {
    if (!tasksData?.boards || tasksData.boards.length === 0) return [];
    
    // Get the current board based on currentDeckIndex
    const currentBoard = tasksData.boards[currentDeckIndex];
    if (!currentBoard) return [];
    
    const tasks = [];
    currentBoard.stacks?.forEach(stack => {
      stack.cards?.forEach(card => {
        if (!card.archived && !card.done) { // Only show active tasks
          tasks.push({
            ...card,
            boardTitle: currentBoard.title || `Board ${currentBoard.id}`,
            stackTitle: stack.title,
            boardId: currentBoard.id,
            stackId: stack.id
          });
        }
      });
    });
    
    // Sort by new priority system:
    // 1. Overdue tasks (up to 30 days)
    // 2. Due tasks (with due date, sorted by remaining time)
    // 3. Tasks assigned to people (more people first)
    // 4. Tasks with no due date and no assignment
    const sortedTasks = tasks.sort((a, b) => {
      const aDue = a.duedate ? new Date(a.duedate) : null;
      const bDue = b.duedate ? new Date(b.duedate) : null;
      const now = new Date();
      
      // Calculate days difference
      const aDiffDays = aDue ? Math.ceil((aDue - now) / (1000 * 60 * 60 * 24)) : null;
      const bDiffDays = bDue ? Math.ceil((bDue - now) / (1000 * 60 * 60 * 24)) : null;
      
      // Check if tasks are overdue (up to 30 days)
      const aIsOverdue = aDiffDays !== null && aDiffDays < 0 && Math.abs(aDiffDays) <= 30;
      const bIsOverdue = bDiffDays !== null && bDiffDays < 0 && Math.abs(bDiffDays) <= 30;
      
      // Check if tasks have due dates (but not overdue)
      const aHasDueDate = aDue !== null && !aIsOverdue;
      const bHasDueDate = bDue !== null && !bIsOverdue;
      
      // Check assignment counts
      const aAssignedCount = a.assignedUsers?.length || 0;
      const bAssignedCount = b.assignedUsers?.length || 0;
      const aIsAssigned = aAssignedCount > 0;
      const bIsAssigned = bAssignedCount > 0;
      
      // 1. OVERDUE TASKS FIRST (up to 30 days)
      if (aIsOverdue && !bIsOverdue) return -1;
      if (bIsOverdue && !aIsOverdue) return 1;
      if (aIsOverdue && bIsOverdue) {
        // Both overdue - sort by how overdue they are (most overdue first)
        return aDue - bDue;
      }
      
      // 2. DUE TASKS (with due date, sorted by remaining time)
      if (aHasDueDate && !bHasDueDate) return -1;
      if (bHasDueDate && !aHasDueDate) return 1;
      if (aHasDueDate && bHasDueDate) {
        // Both have due dates - sort by earliest due date first
        return aDue - bDue;
      }
      
      // 3. ASSIGNED TASKS (more people first)
      if (aIsAssigned && !bIsAssigned) return -1;
      if (bIsAssigned && !aIsAssigned) return 1;
      if (aIsAssigned && bIsAssigned) {
        // Both assigned - sort by number of assigned people (more people first)
        if (aAssignedCount !== bAssignedCount) {
          return bAssignedCount - aAssignedCount;
        }
      }
      
      // 4. TASKS WITH NO DUE DATE AND NO ASSIGNMENT
      // Within this category, sort by creation date (newest first)
      const aCreated = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const bCreated = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return bCreated - aCreated;
    });
    
    // Return only the top 5 most urgent tasks
    return sortedTasks.slice(0, 5);
  };

  // Get current board info for display
  const getCurrentBoard = () => {
    if (!tasksData?.boards || tasksData.boards.length === 0) return null;
    return tasksData.boards[currentDeckIndex];
  };

  if (loading && !tasksData) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100%',
        gap: 2
      }}>
        <CircularProgress sx={{ color: '#0459C9' }} />
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          Lade Aufgaben...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 2,
          pb: 1.5,
          borderBottom: '2px solid #e2e8f0'
        }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#0459C9' }}>
            <TaskIcon sx={{ fontSize: '1.5rem' }} />
            Aufgaben
          </Typography>
          <IconButton 
            onClick={handleRefresh} 
            disabled={loading}
            size="small"
            sx={{ 
              color: '#0459C9',
              '&:hover': { bgcolor: '#9BB8D9' }
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2,
            borderRadius: 2,
            '& .MuiAlert-icon': { color: '#f56565' }
          }}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  // Get current deck tasks (max 5, most urgent first)
  const tasks = getCurrentDeckTasks();
  const currentBoard = getCurrentBoard();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        pb: 1.5,
        borderBottom: '2px solid #e2e8f0',
        position: 'relative'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <TaskIcon sx={{ color: '#0459C9', fontSize: '1.5rem' }} />
          <Typography variant="h6" sx={{ color: '#0459C9', fontWeight: 600 }}>
            Aufgaben
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Board-Auswahl" arrow>
            <IconButton 
              onClick={() => setBoardSelectorOpen(true)}
              size="small"
              sx={{ 
                color: '#0459C9',
                '&:hover': { bgcolor: '#9BB8D9' },
                transition: 'all 0.3s ease'
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          )}
          <IconButton 
            onClick={handleRefresh} 
            disabled={loading} 
            size="small"
            sx={{ 
              color: '#0459C9',
              '&:hover': { bgcolor: '#9BB8D9', transform: 'rotate(180deg)' },
              transition: 'all 0.3s ease'
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
        
        {/* Overlaid Progress Bar */}
        {currentBoard && tasksData?.boards && tasksData.boards.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              height: '2px',
              backgroundColor: '#0459C9',
              width: `${progress}%`,
              transition: 'width 0.1s ease-out',
              boxShadow: progress > 0 ? '0 0 8px rgba(4, 89, 201, 0.4)' : 'none',
              zIndex: 1
            }}
          />
        )}
      </Box>

      {/* Current Deck Display */}
      {currentBoard && tasksData?.boards && tasksData.boards.length > 1 && (
        <Box sx={{ 
          mb: 1,
          pb: 0.5,
          borderBottom: '1px solid #e2e8f0'
        }}>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              color: '#4a5568',
              fontWeight: 500,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              opacity: isTransitioning ? 0.7 : 1,
              transition: 'opacity 0.15s ease-in-out'
            }}
          >
            <FolderIcon sx={{ fontSize: '1.1rem', color: '#0459C9' }} />
            {currentBoard.title || `Deck ${currentBoard.id}`}
            <Chip 
              label={`${currentDeckIndex + 1}/${tasksData.boards.length}`}
              size="small"
              sx={{ 
                fontSize: '0.7rem',
                height: '20px',
                bgcolor: '#0459C9',
                color: 'white',
                '& .MuiChip-label': { px: 1 }
              }}
            />
          </Typography>
        </Box>
      )}

      {/* Tasks List */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        opacity: isTransitioning ? 0.3 : 1,
        transition: 'opacity 0.15s ease-in-out',
        transform: isTransitioning ? 'translateY(5px)' : 'translateY(0px)',
        transitionProperty: 'opacity, transform'
      }}>
        {tasks.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center',
            height: '200px',
            gap: 2,
            color: 'text.secondary'
          }}>
            <CheckCircleIcon sx={{ fontSize: 48, opacity: 0.5 }} />
            <Typography variant="body1">
              Keine aktiven Aufgaben
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {tasks.map((task, index) => {
              const priorityInfo = getPriorityInfo(task);
              const dueDateInfo = formatDueDate(task.duedate);
              
              return (
                <React.Fragment key={`${task.boardId}-${task.stackId}-${task.id}`}>
                  <ListItem 
                    sx={{ 
                      px: 0,
                      py: 1.10,
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      '&:hover': {
                        backgroundColor: '#f8fafc',
                        transform: 'translateX(4px)',
                        boxShadow: '0 2px 8px rgba(4, 89, 201, 0.1)'
                      }
                    }}
                  >
                    <ListItemText
                      sx={{ flex: 1, pr: 0 }}
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              fontWeight: 500,
                              fontSize: '0.95rem',
                              textDecoration: task.done ? 'line-through' : 'none',
                              opacity: task.done ? 0.7 : 1
                            }}
                          >
                            {task.title}
                          </Typography>
                          {dueDateInfo && (
                            <Chip
                              label={dueDateInfo.text}
                              size="small"
                              color={dueDateInfo.color}
                              variant="outlined"
                              icon={<ScheduleIcon sx={{ fontSize: '0.75rem !important' }} />}
                              sx={{ 
                                height: 22, 
                                fontSize: '0.75rem',
                                borderColor: dueDateInfo.color === 'error' ? '#f56565' : '#9BB8D9',
                                color: dueDateInfo.color === 'error' ? '#f56565' : '#0459C9'
                              }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={task.stackTitle}
                            size="small"
                            variant="outlined"
                            icon={<FolderIcon sx={{ fontSize: '0.75rem !important' }} />}
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                          {priorityInfo.level !== 'Normal' && priorityInfo.level !== 'Überfällig' && (
                            <Chip
                              label={priorityInfo.level}
                              size="small"
                              color={priorityInfo.color}
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
                          )}
                        </Box>
                      }
                    />
                    {task.assignedUsers?.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, mr: 1.5 }}>
                        {task.assignedUsers.map((userAssignment, userIndex) => {
                          const user = userAssignment.participant || userAssignment;
                          const fullName = user.displayName || user.displayname || user.name || 
                                         user.fullName || user.username || user.uid || user.id || 'Unbekannt';
                          const firstName = fullName.split(' ')[0];
                          
                          // Use local avatar images (mock)
                          const avatarSrc = getLocalAvatar(user);
                          
                          return (
                            <Tooltip key={userIndex} title={fullName} arrow>
                              <Avatar
                                src={avatarSrc}
                                alt={firstName}
                                sx={{
                                  width: 40,
                                  height: 40,
                                  fontSize: '1rem',
                                  bgcolor: avatarSrc ? 'transparent' : '#0459C9',
                                  border: '2px solid white',
                                  cursor: 'default',
                                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                  marginLeft: userIndex > 0 ? '-10px' : 0,
                                  zIndex: task.assignedUsers.length - userIndex,
                                  transition: 'transform 0.2s ease',
                                  '&:hover': {
                                    transform: 'scale(1.1)',
                                    zIndex: 100
                                  }
                                }}
                              >
                                {!avatarSrc && firstName.charAt(0).toUpperCase()}
                              </Avatar>
                            </Tooltip>
                          );
                        })}
                      </Box>
                    )}
                  </ListItem>
                  {index < tasks.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </List>
        )}
        
        {/* Note: We only show top 5 tasks per deck now, no "more tasks" needed */}
      </Box>

      {/* Board Selector Dialog */}
      <BoardSelector
        open={boardSelectorOpen}
        onClose={() => setBoardSelectorOpen(false)}
        onSave={handleBoardSelectionSave}
        currentSelection={selectedBoards}
      />
    </Box>
  );
}