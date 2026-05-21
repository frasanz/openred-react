import type { SxProps, Theme } from '@mui/material/styles';

export const OPENRED_PAGE_BG = '#E4EEFA';
export const OPENRED_NAVY = '#0751A4';
export const OPENRED_ACCENT_RED = '#F05255';
export const OPENRED_BLACK = '#000000';

/**
 * Base "caja" style used across pages (matches Statistics).
 */
export const openredBoxSx: SxProps<Theme> = {
  boxShadow: 'none',
  border: `1px solid ${OPENRED_NAVY}`,
  borderRadius: 3,
  bgcolor: OPENRED_PAGE_BG,
  color: OPENRED_BLACK,
  cursor: 'default',
  transition: 'background-color 120ms ease-in-out, color 120ms ease-in-out',
  '& .statValue': {
    color: OPENRED_ACCENT_RED,
  },
  '& .statNumber': {
    color: OPENRED_ACCENT_RED,
    fontSize: { xs: '2.0rem', sm: '2.2rem' },
    lineHeight: 1,
    letterSpacing: -1,
    fontWeight: 700,
  },
  '& .statUnit': {
    color: OPENRED_BLACK,
    opacity: 0.8,
  },
  '&:hover': {
    bgcolor: OPENRED_NAVY,
    color: OPENRED_PAGE_BG,
    '& .statValue': {
      color: OPENRED_PAGE_BG,
    },
    '& .statNumber': {
      color: OPENRED_PAGE_BG,
    },
    '& .statUnit': {
      color: OPENRED_PAGE_BG,
      opacity: 0.9,
    },
    '& .MuiTypography-root': {
      color: OPENRED_PAGE_BG,
    },
    '& .MuiSvgIcon-root': {
      color: OPENRED_PAGE_BG,
    },
  },
};

/**
 * Same base "caja" style but without hover behavior.
 */
export const openredBoxStaticSx: SxProps<Theme> = {
  boxShadow: 'none',
  border: `1px solid ${OPENRED_NAVY}`,
  borderRadius: 3,
  bgcolor: OPENRED_PAGE_BG,
  color: OPENRED_BLACK,
  cursor: 'default',
};

/**
 * Exact Statistics stat card style (adds layout sizing).
 */
export const openredStatCardSx: SxProps<Theme> = {
  ...openredBoxSx,
  p: 0,
  minHeight: 140,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
};

export const openredStatCardContentSx: SxProps<Theme> = { p: 3 };
