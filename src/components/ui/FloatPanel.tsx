import React from 'react';
import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';
import { darkTokens as T } from '../../theme/tokens';
import { MONO } from '../../theme/theme';

interface FloatPanelProps {
  title: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

// Panel flotante de chrome para overlays del mapa (columna derecha, etc.)
export const FloatPanel: React.FC<FloatPanelProps> = ({ title, right, children, sx }) => (
  <Box
    sx={{
      backgroundColor: 'rgba(18,22,27,0.92)',
      border: `1px solid ${T.border}`,
      borderRadius: '8px',
      overflow: 'hidden',
      backdropFilter: 'blur(8px)',
      pointerEvents: 'auto',
      ...sx,
    }}
  >
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: 1.25,
        py: 0.85,
        borderBottom: `1px solid ${T.hairline}`,
      }}
    >
      <Typography
        sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.8px', color: T.textMid, textTransform: 'uppercase' }}
      >
        {title}
      </Typography>
      {right != null && (
        <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textDim }}>{right}</Typography>
      )}
    </Box>
    <Box sx={{ p: 1.25 }}>{children}</Box>
  </Box>
);

export default FloatPanel;
