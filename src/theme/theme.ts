import { createTheme } from '@mui/material/styles';

// Material Design 3 Color Tokens
const md3Colors = {
  primary: {
    0: '#000000',
    10: '#001f25',
    20: '#00363d',
    25: '#00424a',
    30: '#004f58',
    35: '#005d67',
    40: '#006b76',
    50: '#008895',
    60: '#00a6b6',
    70: '#00c5d7',
    80: '#4ee6fa',
    90: '#97f0ff',
    95: '#cbf8ff',
    98: '#eafcff',
    99: '#f4feff',
    100: '#ffffff',
  },
  secondary: {
    0: '#000000',
    10: '#0a1f23',
    20: '#1f3439',
    25: '#2a3f44',
    30: '#354a50',
    35: '#40565c',
    40: '#4c6269',
    50: '#647b82',
    60: '#7e959c',
    70: '#98afb6',
    80: '#b3cad1',
    90: '#cfe6ed',
    95: '#ddf4fb',
    98: '#eafcff',
    99: '#f4feff',
    100: '#ffffff',
  },
  tertiary: {
    0: '#000000',
    10: '#1a1c2e',
    20: '#2f3143',
    25: '#3a3c4f',
    30: '#46485c',
    35: '#525469',
    40: '#5e6076',
    50: '#777990',
    60: '#9192ab',
    70: '#acadc6',
    80: '#c7c8e2',
    90: '#e3e4ff',
    95: '#f1f2ff',
    98: '#faf9ff',
    99: '#fefbff',
    100: '#ffffff',
  },
  neutral: {
    0: '#000000',
    4: '#0f1415',
    6: '#131718',
    10: '#191c1d',
    12: '#1d2021',
    17: '#282b2c',
    20: '#2e3132',
    22: '#323536',
    24: '#363a3b',
    25: '#383c3d',
    30: '#444748',
    35: '#4f5354',
    40: '#5c5f60',
    50: '#747778',
    60: '#8e9192',
    70: '#a8abac',
    80: '#c4c6c7',
    87: '#d6d8da',
    90: '#dfe2e3',
    92: '#e5e8e9',
    94: '#ebeef0',
    95: '#eef1f2',
    96: '#f1f4f5',
    98: '#f7fafb',
    99: '#fafdfе',
    100: '#ffffff',
  },
  error: {
    0: '#000000',
    10: '#410e0b',
    20: '#601410',
    25: '#6f1913',
    30: '#7e1f16',
    35: '#8d251a',
    40: '#9c2b1e',
    50: '#bb3a2a',
    60: '#dc4a37',
    70: '#ff5449',
    80: '#ff897d',
    90: '#ffb4ab',
    95: '#ffede9',
    98: '#fff8f6',
    99: '#fffbff',
    100: '#ffffff',
  },
};

// Material Design 3 Theme
export const md3Theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: md3Colors.primary[40],
      light: md3Colors.primary[80],
      dark: md3Colors.primary[20],
      contrastText: md3Colors.primary[100],
    },
    secondary: {
      main: md3Colors.secondary[40],
      light: md3Colors.secondary[80],
      dark: md3Colors.secondary[20],
      contrastText: md3Colors.secondary[100],
    },
    tertiary: {
      main: md3Colors.tertiary[40],
      light: md3Colors.tertiary[80],
      dark: md3Colors.tertiary[20],
      contrastText: md3Colors.tertiary[100],
    },
    error: {
      main: md3Colors.error[40],
      light: md3Colors.error[80],
      dark: md3Colors.error[20],
      contrastText: md3Colors.error[100],
    },
    background: {
      default: md3Colors.neutral[99],
      paper: md3Colors.neutral[100],
    },
    surface: {
      main: md3Colors.neutral[98],
      light: md3Colors.neutral[96],
      dark: md3Colors.neutral[94],
    },
    outline: {
      main: md3Colors.neutral[50],
      variant: md3Colors.neutral[80],
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    // Material Design 3 Type Scale
    displayLarge: {
      fontSize: '57px',
      lineHeight: '64px',
      fontWeight: 400,
      letterSpacing: '-0.25px',
    },
    displayMedium: {
      fontSize: '45px',
      lineHeight: '52px',
      fontWeight: 400,
      letterSpacing: '0px',
    },
    displaySmall: {
      fontSize: '36px',
      lineHeight: '44px',
      fontWeight: 400,
      letterSpacing: '0px',
    },
    headlineLarge: {
      fontSize: '32px',
      lineHeight: '40px',
      fontWeight: 400,
      letterSpacing: '0px',
    },
    headlineMedium: {
      fontSize: '28px',
      lineHeight: '36px',
      fontWeight: 400,
      letterSpacing: '0px',
    },
    headlineSmall: {
      fontSize: '24px',
      lineHeight: '32px',
      fontWeight: 400,
      letterSpacing: '0px',
    },
    titleLarge: {
      fontSize: '22px',
      lineHeight: '28px',
      fontWeight: 400,
      letterSpacing: '0px',
    },
    titleMedium: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 500,
      letterSpacing: '0.15px',
    },
    titleSmall: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 500,
      letterSpacing: '0.1px',
    },
    labelLarge: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 500,
      letterSpacing: '0.1px',
    },
    labelMedium: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 500,
      letterSpacing: '0.5px',
    },
    labelSmall: {
      fontSize: '11px',
      lineHeight: '16px',
      fontWeight: 500,
      letterSpacing: '0.5px',
    },
    bodyLarge: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 400,
      letterSpacing: '0.15px',
    },
    bodyMedium: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 400,
      letterSpacing: '0.25px',
    },
    bodySmall: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 400,
      letterSpacing: '0.4px',
    },
  },
  shape: {
    borderRadius: 12, // MD3 uses more rounded corners
  },
  spacing: 8, // 8px base unit
  components: {
    // Material Design 3 Component Customizations
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '20px', // Pill-shaped buttons
          textTransform: 'none', // No uppercase
          fontWeight: 500,
          paddingX: 24,
          paddingY: 10,
        },
        contained: {
          boxShadow: 'none', // MD3 uses elevation tokens instead
          '&:hover': {
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          },
        },
        outlined: {
          borderWidth: '1px',
          '&:hover': {
            borderWidth: '1px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: `1px solid ${md3Colors.neutral[90]}`,
        },
      },
    },
  },
});

// Dark theme variant
export const md3DarkTheme = createTheme({
  ...md3Theme,
  palette: {
    ...md3Theme.palette,
    mode: 'dark',
    primary: {
      main: md3Colors.primary[80],
      light: md3Colors.primary[60],
      dark: md3Colors.primary[90],
      contrastText: md3Colors.primary[10],
    },
    secondary: {
      main: md3Colors.secondary[80],
      light: md3Colors.secondary[60],
      dark: md3Colors.secondary[90],
      contrastText: md3Colors.secondary[10],
    },
    background: {
      default: md3Colors.neutral[10],
      paper: md3Colors.neutral[20],
    },
    surface: {
      main: md3Colors.neutral[12],
      light: md3Colors.neutral[17],
      dark: md3Colors.neutral[6],
    },
  },
});

export default md3Theme;
