import React from 'react';
import { Box } from '@mui/material';

const COLORS = {
  info: '#1fc5c8',
  warn: '#f0b341',
  danger: '#e0524a',
  ok: '#25c98a',
} as const;

export type StatusKind = keyof typeof COLORS;

export const StatusDot: React.FC<{ kind?: StatusKind; size?: number }> = ({ kind = 'info', size = 7 }) => (
  <Box sx={{ width: size, height: size, borderRadius: '50%', bgcolor: COLORS[kind], flexShrink: 0 }} />
);

export default StatusDot;
