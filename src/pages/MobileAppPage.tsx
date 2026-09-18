import React from 'react';
import { Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ContentPage } from '../components/ui/ContentPage';
import { Banner } from '../components/ui/Banner';

const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=es.ibercivis.openred';
const APP_STORE_URL = 'https://apps.apple.com/app/open-red/id6772456232';

const MobileAppPage: React.FC = () => {
  const { t } = useTranslation('mobile');

  return (
    <ContentPage kicker={t('kicker')} title={t('title')}>
      <h2>{t('stores.heading')}</h2>
      <p>{t('stores.description')}</p>
      <Box sx={{ my: 2, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Button variant="contained" href={GOOGLE_PLAY_URL} target="_blank" rel="noopener noreferrer">
          {t('stores.googlePlay')}
        </Button>
        <Button variant="contained" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
          {t('stores.appStore')}
        </Button>
      </Box>

      <h2>{t('about.heading')}</h2>
      <p>{t('about.body')}</p>

      <h2>{t('features.heading')}</h2>
      <dl>
        <dt>{t('features.measurementsLabel')}</dt>
        <dd>{t('features.measurementsDesc')}</dd>
        <dt>{t('features.tracksLabel')}</dt>
        <dd>{t('features.tracksDesc')}</dd>
        <dt>{t('features.syncLabel')}</dt>
        <dd>{t('features.syncDesc')}</dd>
        <dt>{t('features.mapLabel')}</dt>
        <dd>{t('features.mapDesc')}</dd>
      </dl>

      <Box sx={{ my: 2 }}>
        <Banner variant="info" title={t('contactBanner.title')}>
          {t('contactBanner.body')}
        </Banner>
      </Box>

      <p>
        <Link to="/">{t('backToHome')}</Link>
      </p>
    </ContentPage>
  );
};

export default MobileAppPage;
