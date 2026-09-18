import React from 'react';
import { Box, Typography } from '@mui/material';
import { darkTokens as T } from '../../theme/tokens';
import { MONO } from '../../theme/theme';

interface AuthShellProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({ kicker, title, subtitle, footer, children }) => (
  <Box
    sx={{
      minHeight: 'calc(100vh - 48px)',
      bgcolor: T.bg,
      color: T.text,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3,
    }}
  >
    {/* Lockup logo */}
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 3.5 }}>
      <Typography sx={{ fontWeight: 700, fontSize: 16, letterSpacing: '0.6px', color: T.text }}>OPENRED</Typography>
      <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textDim, letterSpacing: '0.6px', textTransform: 'uppercase' }}>
        / Network
      </Typography>
    </Box>

    {/* Card */}
    <Box sx={{ width: '100%', maxWidth: 420, p: '36px 32px', bgcolor: T.surface, border: `1px solid ${T.border}`, borderRadius: '8px' }}>
      {kicker && (
        <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.textDim, mb: 1 }}>
          {kicker}
        </Typography>
      )}
      <Typography component="h1" sx={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', color: T.text, mb: 0.75 }}>
        {title}
      </Typography>
      {subtitle && <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: T.textMid, mb: 3 }}>{subtitle}</Typography>}
      {children}
    </Box>

    {/* Footer */}
    {footer && (
      <Box
        sx={{
          mt: 3,
          fontFamily: MONO,
          fontSize: 11,
          color: T.textMid,
          textAlign: 'center',
          '& a': { color: T.accent, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
        }}
      >
        {footer}
      </Box>
    )}
  </Box>
);

export default AuthShell;
