import { createTheme, ThemeOptions } from '@mui/material/styles';
import './theme-types';
import { darkTokens, lightTokens, ACCENT_HEX, ACCENT_DARK_HEX, OK_HEX, Tokens } from './tokens';

// Familias tipográficas. SANS para UI; MONO para cifras, IDs, coordenadas, unidades, timestamps.
export const SANS = "'IBM Plex Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
export const MONO = "'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

// Helper sx para texto técnico monoespaciado con cifras tabulares.
export const monoSx = {
  fontFamily: MONO,
  fontVariantNumeric: 'tabular-nums',
} as const;

const accentSoftHex = 'rgba(31,197,200,0.14)';

// --- Tipografía: IBM Plex Sans, conservando la escala MD3 (nombres usados por componentes) ---
const typography: ThemeOptions['typography'] = {
  fontFamily: SANS,
  button: { textTransform: 'none' as const, fontWeight: 500 },
  displayLarge:  { fontFamily: SANS, fontSize: '57px', lineHeight: '64px', fontWeight: 600, letterSpacing: '-0.25px' },
  displayMedium: { fontFamily: SANS, fontSize: '45px', lineHeight: '52px', fontWeight: 600 },
  displaySmall:  { fontFamily: SANS, fontSize: '36px', lineHeight: '44px', fontWeight: 600 },
  headlineLarge: { fontFamily: SANS, fontSize: '32px', lineHeight: '40px', fontWeight: 600 },
  headlineMedium:{ fontFamily: SANS, fontSize: '28px', lineHeight: '36px', fontWeight: 600 },
  headlineSmall: { fontFamily: SANS, fontSize: '24px', lineHeight: '32px', fontWeight: 600 },
  titleLarge:    { fontFamily: SANS, fontSize: '22px', lineHeight: '28px', fontWeight: 600 },
  titleMedium:   { fontFamily: SANS, fontSize: '16px', lineHeight: '24px', fontWeight: 600, letterSpacing: '0.15px' },
  titleSmall:    { fontFamily: SANS, fontSize: '14px', lineHeight: '20px', fontWeight: 600, letterSpacing: '0.1px' },
  labelLarge:    { fontFamily: SANS, fontSize: '14px', lineHeight: '20px', fontWeight: 500, letterSpacing: '0.1px' },
  labelMedium:   { fontFamily: SANS, fontSize: '12px', lineHeight: '16px', fontWeight: 500, letterSpacing: '0.5px' },
  labelSmall:    { fontFamily: SANS, fontSize: '11px', lineHeight: '16px', fontWeight: 500, letterSpacing: '0.5px' },
  bodyLarge:     { fontFamily: SANS, fontSize: '16px', lineHeight: '24px', fontWeight: 400, letterSpacing: '0.15px' },
  bodyMedium:    { fontFamily: SANS, fontSize: '14px', lineHeight: '20px', fontWeight: 400, letterSpacing: '0.25px' },
  bodySmall:     { fontFamily: SANS, fontSize: '12px', lineHeight: '16px', fontWeight: 400, letterSpacing: '0.4px' },
};

const buildPalette = (t: Tokens, mode: 'dark' | 'light'): ThemeOptions['palette'] => ({
  mode,
  primary:   { main: ACCENT_HEX, light: '#4fd6d8', dark: ACCENT_DARK_HEX, contrastText: '#06262a' },
  secondary: { main: t.textMid, contrastText: t.text },
  success:   { main: OK_HEX, contrastText: '#04140d' },
  error:     { main: '#ff5449', light: '#ff897d', dark: '#9c2b1e', contrastText: '#ffffff' },
  background:{ default: t.bg, paper: t.surface },
  divider:   t.border,
  text:      { primary: t.text, secondary: t.textMid, tertiary: t.textDim, disabled: t.textDim },
  // Claves custom (augmentación en theme-types.ts) — mapeadas a los tokens.
  surface:   { main: t.surface, light: t.surface2, dark: t.surface3, contrastText: t.text },
  tertiary:  { main: ACCENT_HEX, light: '#4fd6d8', dark: ACCENT_DARK_HEX, contrastText: '#06262a' },
  outline:   { main: t.border, variant: t.borderStr },
});

const buildComponents = (t: Tokens): ThemeOptions['components'] => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: { backgroundColor: t.bg, color: t.text },
    },
  },
  MuiAppBar: {
    defaultProps: { elevation: 0, color: 'default' },
    styleOverrides: {
      root: {
        minHeight: 48,
        height: 48,
        backgroundColor: t.surface,
        backgroundImage: 'none',
        color: t.text,
        boxShadow: 'none',
        borderBottom: `1px solid ${t.border}`,
        borderRadius: 0,
      },
    },
  },
  MuiToolbar: {
    styleOverrides: {
      root: { minHeight: '48px !important', height: 48, paddingLeft: 12, paddingRight: 12 },
    },
  },
  MuiButton: {
    defaultProps: { disableElevation: true },
    styleOverrides: {
      root: { borderRadius: 6, textTransform: 'none', fontWeight: 500, boxShadow: 'none' },
      contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
      outlined: {
        borderColor: t.borderStr,
        '&:hover': { borderColor: t.text, backgroundColor: 'rgba(255,255,255,0.04)' },
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: { borderRadius: 8, boxShadow: 'none', border: `1px solid ${t.border}`, backgroundImage: 'none' },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: { borderRadius: 8, backgroundImage: 'none', border: `1px solid ${t.border}` },
    },
  },
  MuiSlider: {
    styleOverrides: {
      root: { color: ACCENT_HEX, height: 2, padding: '12px 0' },
      rail: { height: 2, opacity: 1, backgroundColor: t.borderStr },
      track: { height: 2, border: 'none' },
      thumb: {
        width: 8,
        height: 8,
        backgroundColor: ACCENT_HEX,
        '&:hover, &.Mui-focusVisible': { boxShadow: `0 0 0 6px ${accentSoftHex}` },
        '&:before': { boxShadow: 'none' },
      },
      mark: { width: 1, height: 4, backgroundColor: t.borderStr, opacity: 1 },
      markActive: { backgroundColor: ACCENT_HEX, opacity: 1 },
      markLabel: { fontFamily: MONO, fontSize: 9, color: t.textDim },
      valueLabel: { backgroundColor: t.surface3, color: t.text, fontFamily: MONO, fontSize: 10, borderRadius: 4 },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        backgroundColor: t.surface2,
        '& .MuiOutlinedInput-notchedOutline': { borderColor: t.border },
        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: t.borderStr },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: ACCENT_HEX, borderWidth: 1 },
      },
      input: { fontSize: 13 },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: { color: t.textMid, '&.Mui-focused': { color: ACCENT_HEX } },
    },
  },
  MuiSelect: {
    styleOverrides: {
      icon: { color: t.textMid },
    },
  },
  MuiMenu: {
    styleOverrides: {
      paper: { borderRadius: 8, backgroundColor: t.surface2, backgroundImage: 'none' },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: { borderRadius: 4, border: `1px solid ${t.borderStr}`, backgroundColor: 'transparent' },
      filled: { backgroundColor: 'transparent' },
      label: { fontFamily: MONO, fontSize: 11 },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: t.surface3,
        border: `1px solid ${t.border}`,
        borderRadius: 6,
        fontSize: 11,
        boxShadow: '0 8px 24px rgba(0,0,0,0.32)',
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      switchBase: {
        '&.Mui-checked': { color: ACCENT_HEX },
        '&.Mui-checked + .MuiSwitch-track': { backgroundColor: ACCENT_HEX },
      },
    },
  },
});

const makeTheme = (t: Tokens, mode: 'dark' | 'light') =>
  createTheme({
    palette: buildPalette(t, mode),
    typography,
    shape: { borderRadius: 8 },
    spacing: 8,
    components: buildComponents(t),
  });

export const darkTheme = makeTheme(darkTokens, 'dark');
export const lightTheme = makeTheme(lightTokens, 'light');

// dark = por defecto
export default darkTheme;
