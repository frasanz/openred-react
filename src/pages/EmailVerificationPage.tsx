import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthShell } from '../components/ui/AuthShell';
import { Banner } from '../components/ui/Banner';
import { StatusDot } from '../components/ui/StatusDot';
import { darkTokens as T } from '../theme/tokens';

const EmailVerificationPage: React.FC = () => {
  const { t } = useTranslation('auth');
  return (
    <AuthShell
      kicker={t('verifyEmail.kicker')}
      title={t('verifyEmail.title')}
      subtitle={t('verifyEmail.subtitle')}
    >
      <Box sx={{ mb: 2 }}>
        <StatusDot kind="ok" />
      </Box>

      <Banner variant="info" title={t('verifyEmail.bannerTitle')}>
        {t('verifyEmail.bannerBody')}
      </Banner>

      <Typography sx={{ fontSize: 12, color: T.textDim, mt: 2, lineHeight: 1.6 }}>
        {t('verifyEmail.notReceived')}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
        <Button component={Link} to="/login" variant="contained" sx={{ height: 40, fontSize: 13, fontWeight: 600, flex: 1 }}>
          {t('common.goToLogin')}
        </Button>
        <Button
          component={Link}
          to="/"
          variant="outlined"
          sx={{ height: 40, fontSize: 13, flex: 1, color: T.text, borderColor: T.borderStr, '&:hover': { bgcolor: T.surface2, borderColor: T.borderStr } }}
        >
          {t('common.backToHome')}
        </Button>
      </Box>
    </AuthShell>
  );
};

export default EmailVerificationPage;
