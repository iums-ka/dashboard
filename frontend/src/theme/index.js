/**
 * Dashboard Theme Configuration
 * 
 * Centralized MUI theme with brand colors, typography, and component overrides.
 * Used across the entire dashboard for consistent styling.
 */

import { createTheme } from '@mui/material';

// Brand Colors
export const colors = {
  primary: {
    main: '#0459C9',
    light: '#9BB8D9',
    dark: '#033A9E',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#9BB8D9',
    light: '#C5D5E8',
    dark: '#7A9BC7',
    contrastText: '#000000',
  },
  background: {
    default: '#f8fafc',
    paper: '#ffffff',
  },
  text: {
    primary: '#1a202c',
    secondary: '#4a5568',
  },
  success: {
    main: '#48bb78',
    light: '#68d391',
  },
  warning: {
    main: '#ed8936',
    light: '#f6ad55',
  },
  error: {
    main: '#f56565',
    light: '#fc8181',
  },
  // Additional utility colors
  border: '#e2e8f0',
  hover: '#9BB8D9',
};

// Typography configuration
const typography = {
  fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontWeight: 600, color: colors.text.primary },
  h2: { fontWeight: 600, color: colors.text.primary },
  h3: { fontWeight: 600, color: colors.text.primary },
  h4: { fontWeight: 600, color: colors.text.primary },
  h5: { fontWeight: 600, color: colors.text.primary },
  h6: { fontWeight: 600, color: colors.text.primary },
  subtitle1: { fontWeight: 500, color: colors.primary.main },
  subtitle2: { fontWeight: 500, color: colors.text.secondary },
  body1: { fontWeight: 400, lineHeight: 1.6 },
  body2: { fontWeight: 400, lineHeight: 1.5 },
  button: { textTransform: 'none', fontWeight: 500 },
};

// Shared transition style
const transition = 'all 0.2s ease-in-out';

// Component style overrides
const components = {
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        border: `1px solid ${colors.border}`,
        transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
        '&:hover': {
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
          transform: 'translateY(-1px)',
        },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        border: `1px solid ${colors.border}`,
        transition,
        '&:hover': {
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          transform: 'translateY(-1px)',
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontWeight: 500,
        fontSize: '0.75rem',
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none',
        fontWeight: 500,
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.1)',
          transform: 'translateY(-1px)',
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        transition,
        '&:hover': {
          backgroundColor: colors.hover,
          transform: 'scale(1.05)',
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      head: {
        backgroundColor: '#f7fafc',
        fontWeight: 600,
        color: colors.primary.main,
        borderBottom: `2px solid ${colors.border}`,
      },
      body: {
        fontSize: '0.875rem',
      },
    },
  },
};

// Create and export the theme
const theme = createTheme({
  palette: {
    primary: colors.primary,
    secondary: colors.secondary,
    background: colors.background,
    text: colors.text,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
  },
  typography,
  components,
});

export default theme;
