import React from "react";
// Font imports (only required weights to reduce bundle). Adjust as needed.
import '@fontsource/poppins/300.css';
import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Typography,
  Box,
} from "@mui/material";
import GridLayout from './components/GridLayout';
import Antraege from './components/Antraege';
import Mensa from './components/Mensa';
import Tasks from './components/Tasks';

// Create a cohesive theme with brand colors and consistent styling
const theme = createTheme({
  palette: {
    primary: { 
      main: "#0459C9",
      light: "#9BB8D9",
      dark: "#033A9E",
      contrastText: "#ffffff"
    },
    secondary: {
      main: "#9BB8D9",
      light: "#C5D5E8",
      dark: "#7A9BC7",
      contrastText: "#000000"
    },
    background: { 
      default: "#f8fafc",
      paper: "#ffffff"
    },
    text: {
      primary: "#1a202c",
      secondary: "#4a5568"
    },
    success: {
      main: "#48bb78",
      light: "#68d391"
    },
    warning: {
      main: "#ed8936",
      light: "#f6ad55"
    },
    error: {
      main: "#f56565",
      light: "#fc8181"
    }
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 600, color: "#1a202c" },
    h2: { fontWeight: 600, color: "#1a202c" },
    h3: { fontWeight: 600, color: "#1a202c" },
    h4: { fontWeight: 600, color: "#1a202c" },
    h5: { fontWeight: 600, color: "#1a202c" },
    h6: { fontWeight: 600, color: "#1a202c" },
    subtitle1: { fontWeight: 500, color: "#0459C9" },
    subtitle2: { fontWeight: 500, color: "#4a5568" },
    body1: { fontWeight: 400, lineHeight: 1.6 },
    body2: { fontWeight: 400, lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
          border: "1px solid #e2e8f0",
          transition: "box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out",
          "&:hover": {
            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
            transform: "translateY(-1px)"
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 2px 4px -1px rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
          border: "1px solid #e2e8f0",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
            transform: "translateY(-1px)"
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
          fontSize: "0.75rem"
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0 2px 4px -1px rgb(0 0 0 / 0.1)",
            transform: "translateY(-1px)"
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "#9BB8D9",
            transform: "scale(1.05)"
          }
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: "#f7fafc",
          fontWeight: 600,
          color: "#0459C9",
          borderBottom: "2px solid #e2e8f0"
        },
        body: {
          fontSize: "0.875rem"
        }
      }
    }
  }
});

const WELCOME_TEXT_SIZE = '1.1rem';



// Each module defines its position (x,y) and size (w,h) in grid cells.
// Grid is 16x9 (16:9 aspect ratio for foyer displays)
const layoutConfig = [
  // Logo and welcome - top left, smaller size
  { id: 'welcome', x: 0, y: 0, w: 6, h: 5, title: '', component: (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        gap: 2,
        height: '100%',
        justifyContent: 'flex-start',
        paddingTop: 4
      }}>
        {/* Top section: IIIUS Logo and Text */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: 1
        }}>
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              // Breathing animation - scale in/out (more subtle)
              animation: 'breathe 4s ease-in-out infinite',
              // Hover effects
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                filter: 'drop-shadow(0 8px 16px rgba(4, 89, 201, 0.3))',
              },
              // Define keyframe animation for breathing (more subtle)
              '@keyframes breathe': {
                '0%, 100%': {
                  transform: 'scale(1)',
                },
                '50%': {
                  transform: 'scale(1.02)',
                },
              },
              // Subtle glow effect that pulses in sync
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '120%',
                height: '120%',
                background: 'radial-gradient(circle, rgba(4, 89, 201, 0.1) 0%, transparent 70%)',
                borderRadius: '50%',
                zIndex: -1,
                animation: 'pulse 4s ease-in-out infinite',
              },
              '@keyframes pulse': {
                '0%, 100%': {
                  opacity: 0.3,
                  transform: 'translate(-50%, -50%) scale(1)',
                },
                '50%': {
                  opacity: 0.5,
                  transform: 'translate(-50%, -50%) scale(1.05)',
                },
              },
            }}
          >
            <img 
              src="/IIIUS_logo.png" 
              alt="IIIUS Logo" 
              style={{ 
                height: 240,
                width: 'auto',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
                transition: 'filter 0.3s ease'
              }} 
            />
          </Box>
          <Typography 
            variant="body2" 
            color="text.secondary" 
            textAlign="center"
            sx={{
              opacity: 0,
              transform: 'translateY(20px)',
              animation: 'fadeInUp 1s ease-out 0.5s forwards',
              fontSize: WELCOME_TEXT_SIZE, 
              lineHeight: 1.3,
              '@keyframes fadeInUp': {
                from: {
                  opacity: 0,
                  transform: 'translateY(20px)',
                },
                to: {
                  opacity: 1,
                  transform: 'translateY(0)',
                },
              },
              // Style for pulsing strong elements (synchronized with logo)
              '& strong': {
                animation: 'textPulse 4s ease-in-out infinite',
                transition: 'color 0.3s ease',
              },
              '@keyframes textPulse': {
                '0%, 100%': {
                  color: 'inherit',
                  textShadow: 'none',
                },
                '50%': {
                  color: '#0459C9',
                  textShadow: '0 0 6px rgba(4, 89, 201, 0.3)',
                },
              },
            }}
          >
            <strong>IIIUS - </strong> <strong>I</strong>nstitut für  <strong>I</strong>ntelligente und  <strong>I</strong>nteraktive  <strong>U</strong>biquitäre  <strong>S</strong>ysteme<br/>
          </Typography>
        </Box>

        {/* Bottom section: Partner Logos */}
        <Box sx={{ 
          display: 'flex', 
          gap: 5,
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginTop: 'auto',
          paddingBottom: 4
        }}>
          <Box
            sx={{
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
              },
            }}
          >
            <img 
              src="/logo_regiokargo.png" 
              alt="RegioCargo Logo" 
              style={{ 
                height: 125,
                width: 'auto',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                transition: 'filter 0.3s ease'
              }} 
            />
          </Box>
          <Box
            sx={{
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
              },
            }}
          >
            <img 
              src="/Logo_iAdapt.png" 
              alt="iAdapt Logo" 
              style={{ 
                height: 80,
                width: 'auto',
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))',
                transition: 'filter 0.3s ease'
              }} 
            />
          </Box>
        </Box>
      </Box>
    ) },
 
  // Tasks module - top middle
  { id: 'tasks', x: 6, y: 0, w: 5, h: 5, title: '', component: <Tasks /> },
   // Tasks module - top middle
  { id: 'tasks', x: 11, y: 0, w: 5, h: 5, title: '', component: <Tasks /> },
  
  // Mensa module - top right
  { id: 'mensa', x: 0, y: 5, w: 6, h: 4, title: '', component: <Mensa /> },
  
  // Anträge module - bottom, full width
  { id: 'antraege', x: 6, y: 5, w: 10, h: 4, title: '', component: <Antraege /> },

  
];

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: 1.5,
        boxSizing: 'border-box',
        background: '#9BB8D9'
      }}>
        <Box sx={{ 
          width: '100%',
          maxWidth: '100vw',
          height: 'calc(100vh - 24px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 30% 20%, rgba(4, 89, 201, 0.05) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(155, 184, 217, 0.08) 0%, transparent 50%)',
            borderRadius: 3,
            zIndex: 0
          }
        }}>
          <GridLayout layout={layoutConfig} gap={2} />
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
