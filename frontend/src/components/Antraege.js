import React, { useCallback } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import { SvgIcon } from '@mui/material';
import { proposals as proposalsApi, REFRESH_INTERVALS } from '../services/api';
import { useFetch, useAutoRefresh } from '../hooks';

export default function Antraege() {
  // Fetch proposals using custom hook
  const fetchProposals = useCallback(
    () => proposalsApi.getAll(),
    []
  );
  
  const {
    data: proposalsData,
    loading,
    error,
    lastUpdated,
    refresh,
    silentRefresh,
  } = useFetch(fetchProposals, {
    transformResponse: (result) => {
      if (result.success && result.parsing_result?.data) {
        console.log('Proposals data updated:', result.parsing_result.data.length, 'records');
        return result.parsing_result.data;
      }
      throw new Error(result.message || 'Invalid response format');
    },
  });
  
  // Ensure data is always an array
  const data = proposalsData || [];

  // Set up auto-refresh
  useAutoRefresh(silentRefresh, REFRESH_INTERVALS.PROPOSALS, { immediate: false });

  // Get status icon based on proposal status
  const getStatusIcon = (status) => {
    if (!status) return <PendingIcon color="disabled" fontSize="small" />;
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('eingereicht') || statusLower.includes('submitted')) {
      return <CheckCircleIcon color="success" fontSize="small" />;
    }
    if (statusLower.includes('abgelehnt') || statusLower.includes('rejected')) {
      return <ErrorIcon color="error" fontSize="small" />;
    }
    return <PendingIcon color="warning" fontSize="small" />;
  };

  // Format priority display
  const formatPriority = (priority) => {
    if (!priority) return '-';
    const numPriority = parseInt(priority);
    if (!isNaN(numPriority)) {
      let color, bgcolor;
      if (numPriority <= 2) {
        color = '#f56565';
        bgcolor = '#fed7d7';
      } else if (numPriority <= 4) {
        color = '#ed8936';
        bgcolor = '#feebc8';
      } else {
        color = '#0459C9';
        bgcolor = '#9BB8D9';
      }
      return (
        <Chip 
          label={priority} 
          size="small" 
          sx={{ 
            color,
            bgcolor,
            fontWeight: 500,
            fontSize: '0.75rem',
            height: 24
          }} 
        />
      );
    }
    return priority;
  };

  // Format funding amount
  const formatFunding = (amount) => {
    if (!amount) return '-';
    // Try to extract numbers and format as currency
    const numbers = amount.match(/[\d,\.]+/);
    if (numbers) {
      const num = parseFloat(numbers[0].replace(/,/g, ''));
      if (!isNaN(num)) {
        return new Intl.NumberFormat('de-DE', { 
          style: 'currency', 
          currency: 'EUR',
          maximumFractionDigits: 0
        }).format(num);
      }
    }
    return amount;
  };

  // Format deadline to be more compact
  const formatDeadline = (deadline) => {
    if (!deadline) return '-';
    
    // Try to extract date patterns and make them more compact
    const datePattern = /(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{2,4})/;
    const match = deadline.match(datePattern);
    
    if (match) {
      const [, day, month, year] = match;
      const shortYear = year.length === 4 ? year.slice(-2) : year;
      return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${shortYear}`;
    }
    
    // If no date pattern found, truncate to first 10 chars
    return deadline.length > 10 ? deadline.substring(0, 10) + '...' : deadline;
  };

  if (loading && data.length === 0) {
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
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
          Lade Anträge...
        </Typography>
      </Box>
    );
  }

  if (error && data.length === 0) {
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
            <SvgIcon sx={{ fontSize: '1.5rem' }} viewBox="0 0 24 24">
              <path d="M10 19H6.2C5.0799 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2C3 7.07989 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H17.8C18.9201 5 19.4802 5 19.908 5.21799C20.2843 5.40973 20.5903 5.71569 20.782 6.09202C21 6.51984 21 7.0799 21 8.2V8.5M9 9.5V8.5M9 9.5H11.0001M9 9.5C7.88279 9.49998 7.00244 9.62616 7.0001 10.8325C6.99834 11.7328 7.00009 12 9.00009 12C11.0001 12 11.0001 12.2055 11.0001 13.1667C11.0001 13.889 11 14.5 9 14.5M9 15.5V14.5M9 14.5L7.0001 14.5M14 10H17M14 20L16.025 19.595C16.2015 19.5597 16.2898 19.542 16.3721 19.5097C16.4452 19.4811 16.5147 19.4439 16.579 19.399C16.6516 19.3484 16.7152 19.2848 16.8426 19.1574L21 15C21.5523 14.4477 21.5523 13.5523 21 13C20.4477 12.4477 19.5523 12.4477 19 13L14.8426 17.1574C14.7152 17.2848 14.6516 17.3484 14.601 17.421C14.5561 17.4853 14.5189 17.5548 14.4903 17.6279C14.458 17.7102 14.4403 17.7985 14.405 17.975L14 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </SvgIcon>
            Anträge
          </Typography>
          <IconButton 
            onClick={refresh} 
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
          Fehler beim Laden der Anträge: {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        pb: 1.5,
        borderBottom: '2px solid #e2e8f0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SvgIcon sx={{ color: '#0459C9', fontSize: '1.5rem' }} viewBox="0 0 24 24">
            <path d="M10 19H6.2C5.0799 19 4.51984 19 4.09202 18.782C3.71569 18.5903 3.40973 18.2843 3.21799 17.908C3 17.4802 3 16.9201 3 15.8V8.2C3 7.07989 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H17.8C18.9201 5 19.4802 5 19.908 5.21799C20.2843 5.40973 20.5903 5.71569 20.782 6.09202C21 6.51984 21 7.0799 21 8.2V8.5M9 9.5V8.5M9 9.5H11.0001M9 9.5C7.88279 9.49998 7.00244 9.62616 7.0001 10.8325C6.99834 11.7328 7.00009 12 9.00009 12C11.0001 12 11.0001 12.2055 11.0001 13.1667C11.0001 13.889 11 14.5 9 14.5M9 15.5V14.5M9 14.5L7.0001 14.5M14 10H17M14 20L16.025 19.595C16.2015 19.5597 16.2898 19.542 16.3721 19.5097C16.4452 19.4811 16.5147 19.4439 16.579 19.399C16.6516 19.3484 16.7152 19.2848 16.8426 19.1574L21 15C21.5523 14.4477 21.5523 13.5523 21 13C20.4477 12.4477 19.5523 12.4477 19 13L14.8426 17.1574C14.7152 17.2848 14.6516 17.3484 14.601 17.421C14.5561 17.4853 14.5189 17.5548 14.4903 17.6279C14.458 17.7102 14.4403 17.7985 14.405 17.975L14 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </SvgIcon>
          <Typography variant="h6" sx={{ color: '#0459C9', fontWeight: 600 }}>
            Anträge
          </Typography>
          <Chip 
            label={`${data.length} gesamt`} 
            size="small" 
            sx={{ 
              bgcolor: '#9BB8D9', 
              color: '#0459C9',
              fontWeight: 500,
              '& .MuiChip-label': { px: 1 }
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              {lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            </Typography>
          )}
          <IconButton 
            onClick={refresh} 
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
      </Box>

      {/* Error banner if there's an error but we have cached data */}
      {error && data.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 1, 
            py: 0,
            borderRadius: 2,
            '& .MuiAlert-icon': { color: '#ed8936' }
          }}
        >
          <Typography variant="caption">
            Aktualisierung fehlgeschlagen: {error}
          </Typography>
        </Alert>
      )}

      {/* Main content */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <TableContainer component={Paper} sx={{ 
          height: '100%', 
          boxShadow: 'none',
          border: '1px solid #e2e8f0',
          borderRadius: 2
        }}>
          <Table 
            stickyHeader 
            size="small"
            sx={{ 
              tableLayout: 'fixed',
              width: '100%',
              '& .MuiTableBody-root .MuiTableCell-root': {
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }
            }}
          >
            <colgroup>
              <col style={{ width: '6%' }} /> {/* Status */}
              <col style={{ width: '6%' }} /> {/* Priorität */}
              <col style={{ width: '41%' }} /> {/* Ausschreibung */}
              <col style={{ width: '10%' }} /> {/* Fördervolumen */}
              <col style={{ width: '8%' }} /> {/* Deadline */}
              <col style={{ width: '21%' }} /> {/* Themen */}
            </colgroup>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc', color: '#0459C9', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'normal' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc', color: '#0459C9', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'normal' }}>Priorität</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc', color: '#0459C9', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'normal' }}>Ausschreibung</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc', color: '#0459C9', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'normal' }}>Fördervolumen</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc', color: '#0459C9', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'normal' }}>Deadline</TableCell>
                <TableCell sx={{ fontWeight: 600, backgroundColor: '#f8fafc', color: '#0459C9', overflow: 'visible', textOverflow: 'clip', whiteSpace: 'normal' }}>Themen</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((proposal, index) => (
                <TableRow 
                  key={index} 
                  hover
                  sx={{
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#f8fafc',
                      transform: 'scale(1.002)'
                    }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      {getStatusIcon(proposal.Status)}
                      <Typography variant="caption" noWrap>
                        {proposal['Eingereicht?'] || '-'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {formatPriority(proposal.Priorität)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {proposal.Ausschreibungen || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap>
                      {formatFunding(proposal['Fördervolumen in €'])}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap title={proposal['Fristen / Deadline'] || '-'}>
                      {formatDeadline(proposal['Fristen / Deadline'])}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" noWrap>
                      {proposal.Themen || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      Keine Anträge verfügbar
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      
      {loading && (
        <Box sx={{ position: 'absolute', bottom: 8, right: 8 }}>
          <CircularProgress size={16} />
        </Box>
      )}
    </Box>
  );
}