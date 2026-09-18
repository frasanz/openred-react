import React from 'react';
import { Box, Typography, TextField, Button, CircularProgress } from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import { darkTokens as T } from '../../theme/tokens';
import { MONO } from '../../theme/theme';

export const DANGER = '#e0524a';

export const Form: React.FC<{ onSubmit?: React.FormEventHandler; children: React.ReactNode }> = ({ onSubmit, children }) => (
  <Box component="form" onSubmit={onSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {children}
  </Box>
);

export const FieldRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>{children}</Box>
);

export const FieldLabel: React.FC<{ required?: boolean; children: React.ReactNode }> = ({ required, children }) => (
  <Typography
    component="label"
    sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textDim }}
  >
    {children}
    {required && (
      <Box component="span" sx={{ color: DANGER, ml: 0.5 }}>
        *
      </Box>
    )}
  </Typography>
);

export const FieldError: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography sx={{ fontSize: 11, lineHeight: 1.4, color: DANGER }}>{children}</Typography>
);

// Input outlined del SDD (label va aparte con <FieldLabel>). Reenvía ref a RHF vía inputRef.
export const AuthInput = React.forwardRef<HTMLInputElement, TextFieldProps>((props, ref) => (
  <TextField
    {...props}
    inputRef={ref}
    fullWidth
    variant="outlined"
    sx={{
      '& .MuiOutlinedInput-root': {
        height: 40,
        borderRadius: '6px',
        bgcolor: T.surface2,
        fontSize: 13,
        '& fieldset': { borderColor: T.border },
        '&:hover fieldset': { borderColor: T.borderStr },
        '&.Mui-focused': { boxShadow: `0 0 0 3px ${T.accentSoft}` },
        '&.Mui-focused fieldset': { borderColor: T.accent, borderWidth: '1px' },
        '&.Mui-error fieldset': { borderColor: DANGER },
      },
      '& .MuiOutlinedInput-input': { padding: '0 12px', color: T.text },
      '& .MuiOutlinedInput-input::placeholder': { color: T.textDim, opacity: 1 },
      ...props.sx,
    }}
  />
));
AuthInput.displayName = 'AuthInput';

export const PrimaryButton: React.FC<{
  loading?: boolean;
  disabled?: boolean;
  type?: 'submit' | 'button';
  onClick?: () => void;
  children: React.ReactNode;
}> = ({ loading, disabled, type = 'submit', onClick, children }) => (
  <Button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    variant="contained"
    fullWidth
    sx={{ height: 40, fontSize: 13, fontWeight: 600 }}
  >
    {loading ? <CircularProgress size={18} sx={{ color: T.bg }} /> : children}
  </Button>
);

export const GhostButton: React.FC<{
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  startIcon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ loading, disabled, onClick, startIcon, children }) => (
  <Button
    onClick={onClick}
    disabled={disabled || loading}
    variant="outlined"
    fullWidth
    startIcon={loading ? <CircularProgress size={16} sx={{ color: T.text }} /> : startIcon}
    sx={{ height: 40, fontSize: 13, color: T.text, borderColor: T.borderStr, '&:hover': { bgcolor: T.surface2, borderColor: T.borderStr } }}
  >
    {children}
  </Button>
);

export const AuthDivider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 0.5 }}>
    <Box sx={{ flex: 1, borderTop: `1px solid ${T.border}` }} />
    <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textDim }}>
      {children}
    </Typography>
    <Box sx={{ flex: 1, borderTop: `1px solid ${T.border}` }} />
  </Box>
);

export const TermsNotice: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    sx={{
      fontSize: 11,
      lineHeight: 1.5,
      color: T.textDim,
      '& a': { color: T.accent, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } },
    }}
  >
    {children}
  </Typography>
);
