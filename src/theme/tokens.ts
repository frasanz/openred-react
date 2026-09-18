// Sistema de tokens "científico-minimal" (dashboard de observatorio / sensor network).
// dark = modo por defecto. light = opcional (provisional hasta el mockup).

export interface Tokens {
  bg: string;
  surface: string;
  surface2: string;
  surface3: string;
  border: string;
  borderStr: string;
  hairline: string;
  text: string;
  textMid: string;
  textDim: string;
  accent: string;
  accentSoft: string;
  ok: string;
}

export const darkTokens: Tokens = {
  bg:        '#0a0c10',
  surface:   '#12161b',
  surface2:  '#171c22',
  surface3:  '#1d232a',
  border:    'rgba(255,255,255,0.07)',
  borderStr: 'rgba(255,255,255,0.14)',
  hairline:  'rgba(255,255,255,0.04)',
  text:      '#e8eaed',
  textMid:   'rgba(232,234,237,0.62)',
  textDim:   'rgba(232,234,237,0.36)',
  accent:    'oklch(0.78 0.13 195)',     // single cyan accent
  accentSoft:'oklch(0.78 0.13 195 / 0.14)',
  ok:        '#25c98a',
};

// Provisional: lo afinamos cuando lleguemos al modo claro.
export const lightTokens: Tokens = {
  bg:        '#f6f7f9',
  surface:   '#ffffff',
  surface2:  '#f0f2f5',
  surface3:  '#e7eaee',
  border:    'rgba(0,0,0,0.10)',
  borderStr: 'rgba(0,0,0,0.18)',
  hairline:  'rgba(0,0,0,0.06)',
  text:      '#12161b',
  textMid:   'rgba(18,22,27,0.62)',
  textDim:   'rgba(18,22,27,0.40)',
  accent:    'oklch(0.62 0.13 195)',
  accentSoft:'oklch(0.62 0.13 195 / 0.14)',
  ok:        '#1c9e6e',
};

// Equivalente hex del accent cian para la PALETA de MUI.
// MUI hace cálculos de color (alpha/darken/getContrastText) y NO soporta oklch():
// usar la cadena oklch en palette.* lanzaría en runtime. En CSS/sx directo sí puede
// usarse `tokens.accent` (el navegador resuelve oklch sin problema).
export const ACCENT_HEX = '#1fc5c8';
export const ACCENT_DARK_HEX = '#17a9ac';
export const OK_HEX = '#25c98a';
