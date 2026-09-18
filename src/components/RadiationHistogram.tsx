import React, { useEffect, useState } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import apiService from '../services/api';
import { getRadiationColor } from '../utils/radiationColors';
import { HistogramFetchParams } from '../hooks/useMeasurementsByZoom';
import { useLocale } from '../utils/i18nFormat';
import { darkTokens as T } from '../theme/tokens';
import { MONO } from '../theme/theme';

interface Props {
  fetchParams?: HistogramFetchParams;
}

// Bins fijos alineados con la leyenda del mapa
const LEGEND_BINS = [
  { label: '0–0.08',    midpoint: 0.04, tick: '0' },
  { label: '0.08–0.12', midpoint: 0.10, tick: '.08' },
  { label: '0.12–0.16', midpoint: 0.14, tick: '.12' },
  { label: '0.16–0.20', midpoint: 0.18, tick: '.16' },
  { label: '0.20–0.30', midpoint: 0.25, tick: '.20' },
  { label: '0.30–0.50', midpoint: 0.40, tick: '.30' },
  { label: '>0.50',     midpoint: 0.51, tick: '.50' },
];

const BIN_COLORS = LEGEND_BINS.map(({ midpoint }) => {
  const [r, g, b] = getRadiationColor(midpoint);
  return `rgb(${r},${g},${b})`;
});

const RadiationHistogram: React.FC<Props> = ({ fetchParams }) => {
  const { t } = useTranslation('filters');
  const { formatNumber } = useLocale();
  const [counts, setCounts] = useState<number[]>(new Array(7).fill(0));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fetchParams?.project) return;

    let cancelled = false;

    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await apiService.getRadiationHistogram(fetchParams);
        if (!cancelled) {
          setCounts(result.bins.map((b) => b.count));
        }
      } catch (err) {
        console.error('Error fetching radiation histogram:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [fetchParams]);

  const total = counts.reduce((acc, c) => acc + (c || 0), 0);
  const maxCount = Math.max(1, ...counts);

  return (
    <Box sx={{ position: 'relative' }}>
      {loading && (
        <CircularProgress size={12} sx={{ position: 'absolute', top: 0, right: 0, color: T.textDim }} />
      )}

      {/* Barras inline */}
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: 60 }}>
        {LEGEND_BINS.map((bin, i) => {
          const c = counts[i] ?? 0;
          const pct = total > 0 ? Math.round((c / total) * 100) : 0;
          const h = (c / maxCount) * 100;
          return (
            <Box
              key={bin.label}
              title={t('histogram.binTooltip', { range: bin.label, value: formatNumber(c) })}
              sx={{
                flex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <Typography sx={{ fontFamily: MONO, fontSize: 8, color: T.textDim, mb: 0.25 }}>{pct}%</Typography>
              <Box
                sx={{
                  width: '100%',
                  height: `${h}%`,
                  minHeight: c > 0 ? 2 : 0,
                  backgroundColor: BIN_COLORS[i],
                  borderRadius: '1px',
                }}
              />
            </Box>
          );
        })}
      </Box>

      {/* Eje X: cota inferior de cada bin */}
      <Box sx={{ display: 'flex', gap: '3px', mt: 0.5 }}>
        {LEGEND_BINS.map((bin) => (
          <Typography
            key={bin.label}
            sx={{ flex: 1, textAlign: 'center', fontFamily: MONO, fontSize: 8, color: T.textDim }}
          >
            {bin.tick}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

export default RadiationHistogram;
