/**
 * TaskItem Component
 * 
 * Renders a single task item with priority, due date, and assigned users.
 */

import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Avatar,
  ListItem,
  ListItemText,
  Tooltip,
} from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';
import FolderIcon from '@mui/icons-material/Folder';
import { getPriorityInfo, formatDueDate } from '../utils/taskUtils';
import { getLocalAvatar, getDisplayName, getFirstName } from '../utils/avatarUtils';

export default function TaskItem({ task }) {
  const priorityInfo = getPriorityInfo(task);
  const dueDateInfo = formatDueDate(task.duedate);

  return (
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
      
      {/* Assigned Users Avatars */}
      {task.assignedUsers?.length > 0 && (
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0, mr: 1.5 }}>
          {task.assignedUsers.map((userAssignment, userIndex) => {
            const user = userAssignment.participant || userAssignment;
            const fullName = getDisplayName(user) || 'Unbekannt';
            const firstName = getFirstName(user);
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
  );
}
