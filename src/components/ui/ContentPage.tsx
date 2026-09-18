import React from 'react';
import { Box, Typography } from '@mui/material';
import { darkTokens as T } from '../../theme/tokens';
import { MONO } from '../../theme/theme';

interface ContentPageProps {
  kicker?: string; // mono uppercase, e.g. "LEGAL"
  title: string;
  meta?: string; // e.g. "Última actualización · 10 feb 2026"
  maxWidth?: number;
  children: React.ReactNode;
}

// Layout primitive para páginas de contenido estático. Estiliza la prosa interna
// (h2/h3/p/ul/strong/code/a) vía selectores descendientes, sin reescribir el texto.
export const ContentPage: React.FC<ContentPageProps> = ({ kicker, title, meta, maxWidth = 760, children }) => (
  <Box sx={{ bgcolor: T.bg, color: T.text, minHeight: '100vh' }}>
    <Box sx={{ maxWidth, mx: 'auto', px: 3, pt: 8, pb: 12 }}>
      {kicker && (
        <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: T.textDim, mb: 1.5 }}>
          {kicker}
        </Typography>
      )}
      <Typography component="h1" sx={{ fontSize: 28, fontWeight: 600, letterSpacing: '-0.015em', color: T.text, m: 0, mb: 1 }}>
        {title}
      </Typography>
      {meta && (
        <Typography sx={{ fontFamily: MONO, fontSize: 11, color: T.textDim, mb: 6 }}>
          {meta}
        </Typography>
      )}

      <Box
        sx={{
          '& h1': { fontSize: 28, fontWeight: 600, letterSpacing: '-0.015em', color: T.text, mt: 5, mb: 1 },
          '& h2': { fontSize: 18, fontWeight: 600, color: T.text, mt: 5, mb: 1.5, pb: 1, borderBottom: `1px solid ${T.border}` },
          '& h3': { fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: T.text, mt: 3.5, mb: 1.25 },
          '& p': { fontSize: 14, lineHeight: 1.65, color: T.textMid, my: 1.5 },
          '& ul, & ol': { pl: 2.5, lineHeight: 1.7, color: T.textMid, my: 1.5 },
          '& li': { mb: 0.5, '&::marker': { color: T.textDim } },
          '& strong, & b': { color: T.text, fontWeight: 500 },
          '& p a, & li a': { color: T.accent, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
          '& code': { fontFamily: MONO, fontSize: 12, bgcolor: T.surface2, px: 0.75, py: '1px', borderRadius: '3px' },
          '& hr': { border: 'none', borderTop: `1px solid ${T.border}`, my: 4 },
          '& dl': { m: 0 },
          '& dt': { fontSize: 13.5, fontWeight: 500, color: T.text, mt: 2, pt: 2, borderTop: `1px dashed ${T.hairline}` },
          '& dd': { fontSize: 13, color: T.textMid, ml: 0, mt: 0.5, lineHeight: 1.55 },
        }}
      >
        {children}
      </Box>
    </Box>
  </Box>
);

export default ContentPage;
