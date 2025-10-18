import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Card,
  CardContent,
  Divider,
  useTheme
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import NatureIcon from '@mui/icons-material/Nature';
import EuroIcon from '@mui/icons-material/Euro';

const API_BASE_URL = 'http://localhost:8000/api';
const REFRESH_INTERVAL = 10800000; // 3 hours

export default function Mensa() {
  const theme = useTheme();
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch menu data from Laravel backend
  const fetchMenuData = useCallback(async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(`${API_BASE_URL}/mensa/with-images`, {
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
        throw new Error(result.error || 'Fehler beim Laden des Speiseplans');
      }
      
      setMenuData(result.data);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Error fetching menu data:', err);
      setError(err.message || 'Fehler beim Laden des Speiseplans');
    } finally {
      setLoading(false);
    }
  }, []);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  // Initial load and interval setup
  useEffect(() => {
    fetchMenuData();

    // Set up automatic refresh
    const intervalId = setInterval(() => {
      fetchMenuData(false); // Don't show loading spinner for auto-refresh
    }, REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [fetchMenuData]);

  // Get chip color and icon based on menu type
  const getMenuTypeInfo = (zusatz) => {
    if (zusatz?.includes('vegan')) {
      return { 
        color: 'success', 
        icon: <NatureIcon sx={{ fontSize: '0.9rem' }} />,
        bgColor: theme.palette.success.light + '20',
        isVegetarian: false,
        isVegan: true
      };
    }
    if (zusatz?.includes('vegetarisch')) {
      return { 
        color: 'primary', 
        icon: <LocalDiningIcon sx={{ fontSize: '0.9rem' }} />,
        bgColor: theme.palette.primary.light + '20',
        isVegetarian: true,
        isVegan: false
      };
    }
    return { 
      color: 'default', 
      icon: <RestaurantIcon sx={{ fontSize: '0.9rem' }} />,
      bgColor: theme.palette.grey[100],
      isVegetarian: false,
      isVegan: false
    };
  };

  // Get the first day (today) and second day (tomorrow) with menu data
  const todayData = menuData?.days?.[0];
  const tomorrowData = menuData?.days?.[1];
  const todayMenus = todayData?.menues || [];
  const tomorrowMenus = tomorrowData?.menues || [];

  // Get day label
  const getDayLabel = (day) => {
    if (!day) return '';
    if (day.is_today) return 'Heute';
    if (day.is_tomorrow) return 'Morgen';
    return day.weekday;
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column"
        justifyContent="center" 
        alignItems="center" 
        height="100%"
        sx={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
          borderRadius: 2
        }}
      >
        <CircularProgress size={32} thickness={4} sx={{ color: '#0459C9' }} />
        <Typography variant="caption" sx={{ mt: 1, color: 'text.secondary', fontWeight: 500 }}>
          Lade Speiseplan...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert 
        severity="error" 
        sx={{ 
          fontSize: '0.75rem',
          borderRadius: 2,
          '& .MuiAlert-icon': { fontSize: '1rem', color: '#f56565' }
        }}
      >
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        mb: 2,
        pb: 1.5,
        borderBottom: '2px solid #e2e8f0'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <RestaurantIcon sx={{ fontSize: '1.5rem', color: '#0459C9' }} />
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#0459C9' }}>
            Mensa
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
              '&:hover': { 
                backgroundColor: '#9BB8D9',
                transform: 'rotate(180deg)'
              },
              transition: 'all 0.3s ease'
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Content - Today gets 3/4, Tomorrow gets 1/4 */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, height: '100%' }}>
          {/* Left Side - Today (3/4 width) */}
          <Box sx={{ flex: 3, display: 'flex', flexDirection: 'column', borderRight: '1px solid #e2e8f0', minHeight: 0 }}>
            {/* Today Header */}
            <Box sx={{ 
              p: 1.5, 
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              flexShrink: 0,
              height: '56px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0459C9', fontSize: '0.9rem' }}>
                {getDayLabel(todayData) || 'Heute'}
              </Typography>
            </Box>
            
            {/* Today Menu List with Images */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, minHeight: 0 }}>
              {todayMenus.length > 0 ? (
                <List dense sx={{ py: 0, height: '100%' }}>
                  {todayMenus.map((menue, index) => {
                    const typeInfo = getMenuTypeInfo(menue.zusatz);
                    return (
                      <ListItem key={index} sx={{ px: 0, py: 0.8, display: 'block' }}>
                        <Card 
                          elevation={0}
                          sx={{ 
                            width: '100%',
                            backgroundColor: typeInfo.bgColor,
                            border: '1px solid #e2e8f0',
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 4px 6px -1px rgba(4, 89, 201, 0.1)'
                            }
                          }}
                        >
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                              {/* Food Image */}
                              <Box sx={{ flexShrink: 0 }}>
                                {menue.image?.url ? (
                                  <Box sx={{ 
                                    width: 80,
                                    height: 80,
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                    border: '2px solid #e2e8f0',
                                    position: 'relative',
                                    background: '#f1f5f9'
                                  }}>
                                    <img 
                                      src={menue.image.url}
                                      alt={menue.name}
                                      style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        transition: 'transform 0.2s ease'
                                      }}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                      }}
                                    />
                                    <Box sx={{
                                      display: 'none',
                                      position: 'absolute',
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      backgroundColor: '#f1f5f9'
                                    }}>
                                      <RestaurantIcon sx={{ fontSize: '2rem', color: '#9BB8D9' }} />
                                    </Box>
                                  </Box>
                                ) : (
                                  <Box sx={{ 
                                    width: 80,
                                    height: 80,
                                    borderRadius: 2,
                                    border: '2px solid #e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: '#f1f5f9'
                                  }}>
                                    <RestaurantIcon sx={{ fontSize: '2rem', color: '#9BB8D9' }} />
                                  </Box>
                                )}
                              </Box>

                              {/* Menu Info */}
                              <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                  <Box sx={{ position: 'relative' }}>
                                    <Box sx={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      justifyContent: 'center',
                                      width: 28,
                                      height: 28,
                                      borderRadius: '50%',
                                      backgroundColor: '#ffffff',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                      flexShrink: 0
                                    }}>
                                      {React.cloneElement(typeInfo.icon, { sx: { fontSize: '0.9rem' } })}
                                    </Box>
                                    {typeInfo.isVegetarian && (
                                      <Box sx={{ 
                                        position: 'absolute',
                                        bottom: -4,
                                        right: -4,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 16,
                                        height: 16,
                                        borderRadius: '50%',
                                        backgroundColor: '#48bb78',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                      }}>
                                        <NatureIcon sx={{ fontSize: '0.6rem', color: 'white' }} />
                                      </Box>
                                    )}
                                  </Box>
                                  <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        fontWeight: 600, 
                                        fontSize: '0.95rem', 
                                        lineHeight: 1.4,
                                        color: '#1a202c',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden'
                                      }}
                                    >
                                      {menue.name}
                                    </Typography>
                                  </Box>
                                </Box>
                                
                                {/* Additional info like allergens could go here */}
                                {menue.allergene && (
                                  <Typography 
                                    variant="caption" 
                                    sx={{ 
                                      color: '#4a5568',
                                      fontSize: '0.7rem',
                                      fontStyle: 'italic'
                                    }}
                                  >
                                    {menue.allergene}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center'
                }}>
                  <RestaurantIcon sx={{ fontSize: '2.5rem', color: 'text.disabled', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                    Keine Speisen
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Right Side - Tomorrow (1/4 width, compact) */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Tomorrow Header */}
            <Box sx={{ 
              p: 1.5, 
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              flexShrink: 0,
              height: '56px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#0459C9', fontSize: '0.9rem' }}>
                {getDayLabel(tomorrowData) || 'Morgen'}
              </Typography>
            </Box>
            
            {/* Tomorrow Menu List (Compact) */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 1.5, minHeight: 0 }}>
              {tomorrowMenus.length > 0 ? (
                <List dense sx={{ py: 0, height: '100%' }}>
                  {tomorrowMenus.map((menue, index) => {
                    const typeInfo = getMenuTypeInfo(menue.zusatz);
                    return (
                      <ListItem key={index} sx={{ px: 0, py: 0.5, display: 'block' }}>
                        <Card 
                          elevation={0}
                          sx={{ 
                            width: '100%',
                            backgroundColor: typeInfo.bgColor,
                            border: '1px solid #e2e8f0',
                            borderRadius: 2,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-1px)',
                              boxShadow: '0 2px 4px -1px rgba(4, 89, 201, 0.1)'
                            }
                          }}
                        >
                          <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                width: 20,
                                height: 20,
                                borderRadius: '50%',
                                backgroundColor: '#ffffff',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                flexShrink: 0
                              }}>
                                {React.cloneElement(typeInfo.icon, { sx: { fontSize: '0.7rem' } })}
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontWeight: 500, 
                                    fontSize: '0.75rem', 
                                    lineHeight: 1.2,
                                    color: '#1a202c',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}
                                >
                                  {menue.name}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </ListItem>
                    );
                  })}
                </List>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center'
                }}>
                  <RestaurantIcon sx={{ fontSize: '1.5rem', color: 'text.disabled', mb: 0.3 }} />
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    Keine Speisen
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}