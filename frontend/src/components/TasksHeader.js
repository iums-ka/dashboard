/**
 * TasksHeader Component
 * 
 * Header for the Tasks module with title, board indicator, and controls.
 */

import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TaskIcon from '@mui/icons-material/Task';
import SettingsIcon from '@mui/icons-material/Settings';
import FolderIcon from '@mui/icons-material/Folder';

export default function TasksHeader({ 
  currentBoard,
  currentDeckIndex,
  totalBoards,
  progress,
  lastUpdated,
  loading,
  isTransitioning,
  onRefresh,
  onOpenSettings,
}) {
  const showBoardIndicator = currentBoard && totalBoards > 1;

  return (
    <>
      {/* Main Header */}
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
              onClick={onOpenSettings}
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
            onClick={onRefresh} 
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
        
        {/* Progress Bar */}
        {showBoardIndicator && (
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

      {/* Board Indicator */}
      {showBoardIndicator && (
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
              label={`${currentDeckIndex + 1}/${totalBoards}`}
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
    </>
  );
}
