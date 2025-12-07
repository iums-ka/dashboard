/**
 * Tasks Component
 * 
 * Dashboard module for displaying Nextcloud Deck tasks.
 * Features automatic board rotation, priority sorting, and board selection.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TaskIcon from '@mui/icons-material/Task';
import BoardSelector from './BoardSelector';
import TasksHeader from './TasksHeader';
import TasksList from './TasksList';
import { loadSelectedBoards, saveSelectedBoards } from '../utils/boardStorage';
import { getTopTasksFromBoard } from '../utils/taskUtils';
import { tasks as tasksApi, REFRESH_INTERVALS } from '../services/api';
import { useBoardRotation } from '../hooks';

export default function Tasks({ instanceId = 'default' }) {
  // Data state
  const [tasksData, setTasksData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Board selection state
  const [selectedBoards, setSelectedBoards] = useState(() => loadSelectedBoards(instanceId) || []);
  const [boardSelectorOpen, setBoardSelectorOpen] = useState(false);
  
  // Board rotation hook
  const boards = tasksData?.boards || [];
  const { 
    currentIndex: currentDeckIndex, 
    progress, 
    isTransitioning,
    reset: resetRotation 
  } = useBoardRotation(boards, { enabled: boards.length > 1 });

  // Fetch tasks data from Laravel backend
  const fetchTasksData = useCallback(async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      setError(null);

      const result = await tasksApi.getAll(selectedBoards);
      
      if (!result.success) {
        throw new Error(result.error || 'Fehler beim Laden der Aufgaben');
      }
      
      setTasksData(result.data);
      setLastUpdated(new Date());
      setError(null);
      
      // Reset rotation when new data is loaded
      resetRotation();
    } catch (err) {
      console.error('Error fetching tasks data:', err);
      setError(err.message || 'Fehler beim Laden der Aufgaben');
    } finally {
      setLoading(false);
    }
  }, [selectedBoards, resetRotation]);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    fetchTasksData();
  }, [fetchTasksData]);

  // Initial load and interval setup
  useEffect(() => {
    fetchTasksData();

    const intervalId = setInterval(() => {
      fetchTasksData(false);
    }, REFRESH_INTERVALS.TASKS);

    return () => clearInterval(intervalId);
  }, [fetchTasksData]);

  // Handle board selection save
  const handleBoardSelectionSave = useCallback((boardIds) => {
    setSelectedBoards(boardIds);
    saveSelectedBoards(instanceId, boardIds);
  }, [instanceId]);

  // Get current board and its tasks
  const currentBoard = boards[currentDeckIndex] || null;
  const tasks = currentBoard ? getTopTasksFromBoard(currentBoard, 5) : [];

  // Loading state
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

  // Error state
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

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <TasksHeader
        currentBoard={currentBoard}
        currentDeckIndex={currentDeckIndex}
        totalBoards={boards.length}
        progress={progress}
        lastUpdated={lastUpdated}
        loading={loading}
        isTransitioning={isTransitioning}
        onRefresh={handleRefresh}
        onOpenSettings={() => setBoardSelectorOpen(true)}
      />

      <TasksList 
        tasks={tasks} 
        isTransitioning={isTransitioning} 
      />

      <BoardSelector
        open={boardSelectorOpen}
        onClose={() => setBoardSelectorOpen(false)}
        onSave={handleBoardSelectionSave}
        currentSelection={selectedBoards}
      />
    </Box>
  );
}
