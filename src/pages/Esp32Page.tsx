import React from 'react';
import 'esp-web-tools';
import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ContentPage } from '../components/ui/ContentPage';
import { Banner } from '../components/ui/Banner';
import { darkTokens as T } from '../theme/tokens';
import { MONO } from '../theme/theme';

const FIRMWARE_MANIFEST_URL = '/firmware/manifest.json';

// El manifest incluye un build por cada placa soportada; el botón de instalación
// detecta el chip conectado (ESP32 u ESP32-S3) y flashea el build correcto solo.
// Estas listas son solo para quien prefiera flashear a mano con esptool: el offset
// del bootloader cambia según el chip, así que van separadas por placa.
const FIRMWARE_BOARDS = [
  {
    id: 'esp32',
    dir: 'esp32',
    labelKey: 'esp32',
    parts: [
      { file: 'bootloader.bin', offset: '0x1000' },
      { file: 'partitions.bin', offset: '0x8000' },
      { file: 'boot_app0.bin', offset: '0xE000' },
      { file: 'firmware.bin', offset: '0x10000' },
    ],
  },
  {
    id: 'esp32s3',
    dir: 'esp32s3',
    labelKey: 'esp32s3',
    parts: [
      { file: 'bootloader.bin', offset: '0x0' },
      { file: 'partitions.bin', offset: '0x8000' },
      { file: 'boot_app0.bin', offset: '0xE000' },
      { file: 'firmware.bin', offset: '0x10000' },
    ],
  },
];

const Esp32Page: React.FC = () => {
  const { t } = useTranslation('esp32');

  return (
    <ContentPage kicker={t('kicker')} title={t('title')}>
      <p>{t('intro')}</p>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
        <Banner variant="warn" title={t('betaBanner.title')}>
          {t('betaBanner.body')}
        </Banner>
        <Banner variant="info" title={t('browserBanner.title')}>
          {t('browserBanner.body')}
        </Banner>
      </Box>

      <h2>{t('prereqs.heading')}</h2>
      <p>{t('prereqs.intro')}</p>
      <dl>
        <dt>{t('prereqs.item1Label')}</dt>
        <dd>
          {t('prereqs.item1Desc')}{' '}
          <Link to="/devices">{t('prereqs.item1Link')}</Link>.{' '}
          {t('prereqs.item1Suffix')}
        </dd>
        <dt>{t('prereqs.item2Label')}</dt>
        <dd>{t('prereqs.item2Desc')}</dd>
        <dt>{t('prereqs.item3Label')}</dt>
        <dd>{t('prereqs.item3Desc')}</dd>
      </dl>

      <h2>{t('install.heading')}</h2>
      <p>{t('install.description')}</p>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 2,
          my: 2,
          p: 2,
          bgcolor: T.surface2,
          border: `1px solid ${T.border}`,
          borderRadius: '8px',
        }}
      >
        <esp-web-install-button manifest={FIRMWARE_MANIFEST_URL}>
          <Button variant="contained" slot="activate">
            {t('install.button')}
          </Button>
          <Typography slot="unsupported" sx={{ fontSize: 13, color: T.textMid, maxWidth: 420 }}>
            {t('install.unsupported')}
          </Typography>
          <Typography slot="not-allowed" sx={{ fontSize: 13, color: T.textMid, maxWidth: 420 }}>
            {t('install.notAllowed')}
          </Typography>
        </esp-web-install-button>
      </Box>

      <p>{t('install.manualFlash')}</p>
      {FIRMWARE_BOARDS.map((board) => (
        <Box key={board.id} sx={{ mb: 2 }}>
          <Typography sx={{ fontWeight: 600, fontSize: 13, color: T.textMid, mb: 0.5 }}>
            {t(`install.boards.${board.labelKey}`)}
          </Typography>
          <Box
            component="ul"
            sx={{ listStyle: 'none', pl: '0 !important', display: 'flex', flexDirection: 'column', gap: 0.5 }}
          >
            {board.parts.map((part) => (
              <Box component="li" key={part.file} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography component="a" href={`/firmware/${board.dir}/${part.file}`} download sx={{ color: T.accent, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                  {part.file}
                </Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 11, color: T.textDim }}>{t('install.offset', { offset: part.offset })}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      ))}

      <h2>{t('manual.heading')}</h2>
      <p>{t('manual.intro')}</p>
      <dl>
        <dt>{t('manual.step1Label')}</dt>
        <dd>{t('manual.step1Desc')}</dd>
        <dt>{t('manual.step2Label')}</dt>
        <dd>{t('manual.step2Desc')}</dd>
        <dt>{t('manual.step3Label')}</dt>
        <dd>{t('manual.step3Desc')}</dd>
      </dl>

      <p>{t('manual.reconfigure')}</p>

      <p>
        <Link to="/">{t('backToHome')}</Link>
      </p>
    </ContentPage>
  );
};

export default Esp32Page;
