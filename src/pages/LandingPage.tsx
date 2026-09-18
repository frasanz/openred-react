import React from 'react';
import { Box, Typography, Button, Link as MuiLink } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ContentPage } from '../components/ui/ContentPage';
import { darkTokens as T } from '../theme/tokens';
import { MONO } from '../theme/theme';

const FEATURE_KEYS = ['map', 'data', 'community', 'app'] as const;

const footerLinkSx = {
  fontFamily: MONO,
  fontSize: 11,
  color: T.textMid,
  textDecoration: 'none',
  '&:hover': { color: T.text },
};

const LandingPage: React.FC = () => {
  const { t } = useTranslation('landing');

  return (
    <ContentPage kicker={t('kicker')} title={t('title')} meta={t('meta')} maxWidth={880}>
      <p>{t('intro')}</p>

      {/* CTA */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mt: 3 }}>
        <Button component={RouterLink} to="/register" variant="contained" sx={{ fontWeight: 600 }}>
          {t('cta.register')}
        </Button>
        <Button component={RouterLink} to="/login" variant="outlined">
          {t('cta.login')}
        </Button>
        <Button component={RouterLink} to="/" variant="text" sx={{ fontFamily: MONO, fontSize: 12, color: T.textMid }}>
          {t('cta.viewMap')}
        </Button>
      </Box>

      {/* Features 2x2 */}
      <Box sx={{ mt: 6, borderTop: `1px solid ${T.border}` }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
          {FEATURE_KEYS.map((key) => (
            <Box key={key} sx={{ p: 3, borderTop: `1px solid ${T.hairline}` }}>
              <Typography component="div" sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.textDim, mb: 1 }}>
                {t(`features.${key}.kicker`)}
              </Typography>
              <Typography component="div" sx={{ fontSize: 16, fontWeight: 600, color: T.text, mb: 0.75 }}>
                {t(`features.${key}.title`)}
              </Typography>
              <Typography component="div" sx={{ fontSize: 13, lineHeight: 1.6, color: T.textMid }}>
                {t(`features.${key}.body`)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ mt: 6, pt: 4, borderTop: `1px solid ${T.border}`, display: 'flex', gap: 2.5, flexWrap: 'wrap', justifyContent: 'center' }}>
        <MuiLink href="https://github.com/frasanz/openred-react" target="_blank" rel="noopener" sx={footerLinkSx}>
          GitHub
        </MuiLink>
        <MuiLink component={RouterLink} to="/mobile-app" sx={footerLinkSx}>
          {t('footer.mobileApp')}
        </MuiLink>
        <MuiLink component={RouterLink} to="/privacy-policy" sx={footerLinkSx}>
          {t('footer.privacy')}
        </MuiLink>
        <MuiLink component={RouterLink} to="/terms-of-service" sx={footerLinkSx}>
          {t('footer.terms')}
        </MuiLink>
        <MuiLink href="mailto:frasanz@ibercivis.es" sx={footerLinkSx}>
          {t('footer.contact')}
        </MuiLink>
      </Box>
    </ContentPage>
  );
};

export default LandingPage;
