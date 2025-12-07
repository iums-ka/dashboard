/**
 * TasksList Component
 * 
 * Renders a list of tasks with transition effects.
 */

import React from 'react';
import {
  Box,
  Typography,
  List,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TaskItem from './TaskItem';

export default function TasksList({ tasks, isTransitioning = false }) {
  if (tasks.length === 0) {
    return (
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
    );
  }

  return (
    <Box sx={{ 
      flexGrow: 1, 
      overflow: 'auto',
      opacity: isTransitioning ? 0.3 : 1,
      transition: 'opacity 0.15s ease-in-out',
      transform: isTransitioning ? 'translateY(5px)' : 'translateY(0px)',
      transitionProperty: 'opacity, transform'
    }}>
      <List sx={{ p: 0 }}>
        {tasks.map((task, index) => (
          <React.Fragment key={`${task.boardId}-${task.stackId}-${task.id}`}>
            <TaskItem task={task} />
            {index < tasks.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
}
