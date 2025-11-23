import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import RefreshIcon from '@mui/icons-material/Refresh';

const API_BASE_URL = 'http://localhost:8000/api';
const BOARDS_CACHE_KEY = 'nextcloud_boards_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Load cached boards from localStorage
 */
const loadCachedBoards = () => {
  try {
    const cached = localStorage.getItem(BOARDS_CACHE_KEY);
    if (!cached) return null;
    
    const { boards, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    // Return cached data if less than CACHE_DURATION old
    if (age < CACHE_DURATION && Array.isArray(boards)) {
      console.log(`Using cached boards (${Math.round(age / 1000)}s old)`);
      return boards;
    }
    
    console.log('Board cache expired, will fetch fresh data');
    return null;
  } catch (error) {
    console.error('Error loading cached boards:', error);
    return null;
  }
};

/**
 * Save boards to localStorage cache
 */
const saveBoardsCache = (boards) => {
  try {
    localStorage.setItem(BOARDS_CACHE_KEY, JSON.stringify({
      boards,
      timestamp: Date.now()
    }));
    console.log('Saved boards to cache');
  } catch (error) {
    console.error('Error saving boards cache:', error);
  }
};

/**
 * BoardSelector Component
 * 
 * Reusable dialog for selecting Nextcloud Deck boards to display.
 * Fetches available boards from backend and allows multi-selection.
 * 
 * @param {boolean} open - Controls dialog visibility
 * @param {function} onClose - Callback when dialog closes
 * @param {function} onSave - Callback with selected board IDs array
 * @param {number[]} currentSelection - Currently selected board IDs
 */
export default function BoardSelector({ open, onClose, onSave, currentSelection = [] }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedBoards, setSelectedBoards] = useState(currentSelection);

  // Fetch available boards when dialog opens
  useEffect(() => {
    if (open) {
      // Try to load from cache first
      const cached = loadCachedBoards();
      if (cached) {
        setBoards(cached);
        setSelectedBoards(currentSelection.length > 0 ? currentSelection : cached.map(b => b.id));
      } else {
        // Cache miss or expired, fetch from API
        fetchBoards();
      }
      
      // Always set current selection
      if (currentSelection.length > 0) {
        setSelectedBoards(currentSelection);
      }
    }
  }, [open, currentSelection]);

  const fetchBoards = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/tasks/boards`, {
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
        throw new Error(result.error || 'Fehler beim Laden der Boards');
      }

      // Filter out archived boards
      const activeBoards = result.data.filter(board => !board.archived);
      setBoards(activeBoards);
      
      // Save to cache
      saveBoardsCache(activeBoards);
      
      // If no boards are currently selected and we have boards, select all by default
      if (currentSelection.length === 0 && activeBoards.length > 0) {
        setSelectedBoards(activeBoards.map(b => b.id));
      }
    } catch (err) {
      console.error('Error fetching boards:', err);
      setError(err.message || 'Fehler beim Laden der Boards');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBoard = (boardId) => {
    setSelectedBoards(prev => {
      if (prev.includes(boardId)) {
        return prev.filter(id => id !== boardId);
      } else {
        return [...prev, boardId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedBoards.length === boards.length) {
      setSelectedBoards([]);
    } else {
      setSelectedBoards(boards.map(b => b.id));
    }
  };

  const handleSave = () => {
    onSave(selectedBoards);
    onClose();
  };

  const handleCancel = () => {
    setSelectedBoards(currentSelection);
    onClose();
  };

  const handleRefreshBoards = () => {
    // Clear cache and force fresh fetch
    localStorage.removeItem(BOARDS_CACHE_KEY);
    fetchBoards();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '80vh'
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: 1, 
        borderColor: 'divider',
        pb: 2
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <FolderIcon color="primary" />
            <Box>
              <Typography variant="h6" component="span">
                Board-Auswahl
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Wählen Sie die Boards aus, die in diesem Modul angezeigt werden sollen
              </Typography>
            </Box>
          </Box>
          <Tooltip title="Boards neu laden" arrow>
            <IconButton 
              onClick={handleRefreshBoards}
              disabled={loading}
              size="small"
              sx={{ 
                color: 'primary.main',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3 }}>
        {loading && (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && boards.length === 0 && (
          <Alert severity="info">
            Keine Boards gefunden. Stellen Sie sicher, dass Sie Zugriff auf Nextcloud Deck haben.
          </Alert>
        )}

        {!loading && !error && boards.length > 0 && (
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="body2" color="text.secondary">
                {selectedBoards.length} von {boards.length} ausgewählt
              </Typography>
              <Button 
                size="small" 
                onClick={handleSelectAll}
                sx={{ textTransform: 'none' }}
              >
                {selectedBoards.length === boards.length ? 'Keine auswählen' : 'Alle auswählen'}
              </Button>
            </Box>

            <FormGroup>
              {boards.map((board) => (
                <FormControlLabel
                  key={board.id}
                  control={
                    <Checkbox
                      checked={selectedBoards.includes(board.id)}
                      onChange={() => handleToggleBoard(board.id)}
                      color="primary"
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body1">
                        {board.title}
                      </Typography>
                      {board.color && (
                        <Box
                          sx={{
                            width: 16,
                            height: 16,
                            borderRadius: '50%',
                            backgroundColor: board.color,
                            border: '1px solid rgba(0,0,0,0.1)'
                          }}
                        />
                      )}
                      <Chip 
                        label={`ID: ${board.id}`} 
                        size="small" 
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                  sx={{
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                />
              ))}
            </FormGroup>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ 
        borderTop: 1, 
        borderColor: 'divider',
        px: 3,
        py: 2
      }}>
        <Button 
          onClick={handleCancel}
          color="inherit"
        >
          Abbrechen
        </Button>
        <Button 
          onClick={handleSave}
          variant="contained"
          disabled={loading || selectedBoards.length === 0}
        >
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}
