import React from 'react';
import { Button, Menu, MenuItem } from '@mui/material';
import { Language } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { darkTokens as T } from '../theme/tokens';
import { MONO } from '../theme/theme';

const LANGS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const current = (i18n.language || 'en').split('-')[0];

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    handleClose();
  };

  return (
    <>
      <Button
        size="small"
        onClick={handleOpen}
        startIcon={<Language fontSize="small" />}
        sx={{
          minWidth: 'auto',
          px: 1,
          color: T.textMid,
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: '0.6px',
          '&:hover': { color: T.text, backgroundColor: 'transparent' },
        }}
      >
        {current.toUpperCase()}
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {LANGS.map((l) => (
          <MenuItem
            key={l.code}
            selected={l.code === current}
            onClick={() => handleSelect(l.code)}
            sx={{ fontSize: 13 }}
          >
            {l.label}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;
