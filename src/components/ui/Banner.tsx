import React from 'react';
import { Box, Typography } from '@mui/material';
import { darkTokens as T } from '../../theme/tokens';
import { MONO } from '../../theme/theme';
import { StatusDot, StatusKind } from './StatusDot';

type Variant = 'info' | 'warn' | 'danger';

const VARIANTS: Record<Variant, { bg: string; border: string; text: string }> = {
  info: { bg: 'rgba(31,197,200,0.08)', border: 'rgba(31,197,200,0.25)', text: '#1fc5c8' },
  warn: { bg: 'rgba(240,179,65,0.08)', border: 'rgba(240,179,65,0.25)', text: '#f0b341' },
  danger: { bg: 'rgba(224,82,74,0.08)', border: 'rgba(224,82,74,0.25)', text: '#e0524a' },
};

interface BannerProps {
  variant?: Variant;
  title?: string;
  children: React.ReactNode;
}

export const Banner: React.FC<BannerProps> = ({ variant = 'info', title, children }) => {
  const s = VARIANTS[variant];
  return (
    <Box sx={{ display: 'flex', gap: 1.25, p: '14px 16px', borderRadius: '6px', border: `1px solid ${s.border}`, bgcolor: s.bg }}>
      <Box sx={{ pt: '5px' }}>
        <StatusDot kind={variant as StatusKind} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        {title && (
          <Typography
            component="div"
            sx={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: s.text, mb: 0.5 }}
          >
            {title}
          </Typography>
        )}
        <Typography component="div" sx={{ fontSize: 13.5, lineHeight: 1.55, color: T.textMid }}>
          {children}
        </Typography>
      </Box>
    </Box>
  );
};

export default Banner;
