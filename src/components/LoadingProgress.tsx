import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../utils/i18nFormat';

interface LoadingProgressProps {
  loaded: number;
  total: number;
  percentage: number;
  isLoading: boolean;
}

// Estado del mensaje de velocidad: clave de traducción + parámetros (reactivo al idioma)
type SpeedMessage = { key: string; params?: Record<string, number> } | null;

const LoadingProgress: React.FC<LoadingProgressProps> = ({
  loaded,
  total,
  percentage,
  isLoading
}) => {
  const { t } = useTranslation('map');
  const { formatNumber } = useLocale();

  // Hooks deben estar SIEMPRE al inicio, antes de cualquier return
  const [startTime] = React.useState(Date.now());
  const [speed, setSpeed] = React.useState<SpeedMessage>(null);
  const [lastLoaded, setLastLoaded] = React.useState(0);

  // Efecto para debug - log de cambios en props
  React.useEffect(() => {
    console.log(`LoadingProgress render: loaded=${loaded}, total=${total}, percentage=${percentage.toFixed(1)}%, isLoading=${isLoading}`);
  }, [loaded, total, percentage, isLoading]);

  // Calcular velocidad aproximada de carga
  React.useEffect(() => {
    if (loaded > 0 && loaded !== lastLoaded) {
      setLastLoaded(loaded);
      const elapsed = (Date.now() - startTime) / 1000; // segundos

      if (elapsed > 1) { // Solo calcular después de al menos 1 segundo
        const itemsPerSecond = loaded / elapsed;
        const remainingItems = total - loaded;
        const estimatedTime = remainingItems / itemsPerSecond;

        if (remainingItems > 0 && estimatedTime > 0 && estimatedTime < 3600) { // menos de 1 hora
          const minutes = Math.floor(estimatedTime / 60);
          const seconds = Math.floor(estimatedTime % 60);
          if (minutes > 0) {
            setSpeed({ key: 'loading.minutesLeft', params: { minutes, seconds } });
          } else if (seconds > 5) {
            setSpeed({ key: 'loading.secondsLeft', params: { seconds } });
          } else {
            setSpeed({ key: 'loading.finishing' });
          }
        } else if (loaded === total) {
          setSpeed({ key: 'loading.completed' });
        } else {
          setSpeed({ key: 'loading.rate', params: { rate: Math.round(itemsPerSecond) } });
        }
      } else {
        setSpeed({ key: 'loading.starting' });
      }
    }
  }, [loaded, total, startTime, lastLoaded]);

  // Return condicional DESPUÉS de todos los hooks
  if (!isLoading || total === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        p: 3,
        m: '16px auto',
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: 2,
        maxWidth: 400,
        minWidth: 320,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body1" fontWeight={500}>
          {t('loading.title')}
        </Typography>
        <Typography variant="body2" fontWeight={600} color="primary">
          {percentage.toFixed(1)}%
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={percentage}
        sx={{
          height: 8,
          borderRadius: 1,
          bgcolor: 'action.hover',
        }}
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
          {t('loading.progress', { loaded: formatNumber(loaded), total: formatNumber(total) })}
        </Typography>
        {speed && (
          <Typography variant="caption" color="primary" sx={{ opacity: 0.8 }}>
            {speed.key === 'loading.rate' && speed.params
              ? t('loading.rate', { rate: formatNumber(speed.params.rate) })
              : t(speed.key, speed.params)}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default LoadingProgress;
