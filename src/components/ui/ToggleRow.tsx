import React from 'react';
import { Box, Typography, Switch } from '@mui/material';
import { darkTokens as T } from '../../theme/tokens';
import { MONO } from '../../theme/theme';

interface ToggleRowProps {
  label: React.ReactNode;
  sub?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  right?: React.ReactNode;
  disabled?: boolean;
}

// Fila de capa: switch + etiqueta + sublabel mono + valor opcional a la derecha.
export const ToggleRow: React.FC<ToggleRowProps> = ({ label, sub, checked, onChange, right, disabled }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, py: 0.4 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      <Switch
        size="small"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 12, color: T.text, lineHeight: 1.2 }}>{label}</Typography>
        {sub != null && (
          <Typography sx={{ fontFamily: MONO, fontSize: 9, color: T.textDim, lineHeight: 1.2 }}>{sub}</Typography>
        )}
      </Box>
    </Box>
    {right != null && (
      <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textMid, flexShrink: 0 }}>{right}</Typography>
    )}
  </Box>
);

export default ToggleRow;
