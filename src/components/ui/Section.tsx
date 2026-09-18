import React from 'react';
import { Box, Typography } from '@mui/material';
import { darkTokens as T } from '../../theme/tokens';
import { MONO } from '../../theme/theme';

// Etiqueta de sección: mono, mayúsculas, dim. Con valor opcional a la derecha.
export const SectionLabel: React.FC<{ children: React.ReactNode; right?: React.ReactNode }> = ({
  children,
  right,
}) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
    <Typography
      component="span"
      sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.8px', color: T.textMid, textTransform: 'uppercase' }}
    >
      {children}
    </Typography>
    {right != null && (
      <Typography component="span" sx={{ fontFamily: MONO, fontSize: 10, color: T.textDim }}>
        {right}
      </Typography>
    )}
  </Box>
);

interface SectionProps {
  label: React.ReactNode;
  right?: React.ReactNode;
  divider?: boolean;
  children: React.ReactNode;
}

// Grupo con separador hairline dashed + label mono.
export const Section: React.FC<SectionProps> = ({ label, right, divider = true, children }) => (
  <Box sx={{ pt: divider ? 1.75 : 0, mt: divider ? 1.75 : 0, borderTop: divider ? `1px dashed ${T.hairline}` : 'none' }}>
    <SectionLabel right={right}>{label}</SectionLabel>
    {children}
  </Box>
);

export default Section;
