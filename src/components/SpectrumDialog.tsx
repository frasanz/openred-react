import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import apiService from '../services/api';
import { useLocale } from '../utils/i18nFormat';
import { darkTokens as T, ACCENT_HEX } from '../theme/tokens';
import { MONO } from '../theme/theme';
import { OPENRED_ACCENT_RED } from '../styles/boxes';

interface Props {
  spectrumId: number | null;
  open: boolean;
  onClose: () => void;
}

const ACCENT = ACCENT_HEX;

// Toggles dark: borde sutil, seleccionado en acento cian
const toggleGroupSx = {
  '& .MuiToggleButton-root': {
    textTransform: 'none',
    fontFamily: MONO,
    fontWeight: 600,
    fontSize: 11,
    color: T.textMid,
    border: `1px solid ${T.border}`,
    px: 1.5,
    py: 0.3,
    '&.Mui-selected': {
      backgroundColor: ACCENT,
      color: '#06262a',
      '&:hover': { backgroundColor: ACCENT },
    },
  },
};

// Líneas de referencia de isótopos (energía keV -> etiqueta), idéntica a la app.
// Solo se dibujan en modo keV y dentro del rango energético del espectro.
const ISOTOPE_LINES = [
  { e: 238.6, label: 'Pb-212' },
  { e: 351.9, label: 'Pb-214' },
  { e: 511, label: 'β+' },
  { e: 609.3, label: 'Bi-214' },
  { e: 661.7, label: 'Cs-137' },
  { e: 911.2, label: 'Ac-228' },
  { e: 1173, label: 'Co-60' },
  { e: 1332.5, label: 'Co-60' },
  { e: 1460.8, label: 'K-40' },
  { e: 1764.5, label: 'Bi-214' },
  { e: 2614.5, label: 'Tl-208' },
];

// Etiqueta vertical pegada a la línea, leída de abajo arriba
const isotopeLabel = (text: string) => ({ viewBox }: any) => (
  <text
    x={viewBox.x}
    y={viewBox.y}
    dx={-3}
    dy={6}
    transform={`rotate(-90, ${viewBox.x}, ${viewBox.y})`}
    textAnchor="end"
    fontSize={9}
    fontFamily="'IBM Plex Mono', monospace"
    fill="#8b949e"
  >
    {text}
  </text>
);

// Lee el primer campo presente (tolerante a snake_case / camelCase)
function pick<T = any>(obj: any, keys: string[]): T | undefined {
  if (!obj) return undefined;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null) return obj[k] as T;
  }
  return undefined;
}

interface ParsedSpectrum {
  counts: number[];
  a0: number;
  a1: number;
  a2: number;
  calibrated: boolean; // true si vino calibración energética en la respuesta
  channelCount?: number;
  durationSec?: number;
  startLat?: number;
  startLon?: number;
  startAlt?: number;
  total: number;
}

function parseSpectrum(detail: any): ParsedSpectrum | null {
  const counts = pick<number[]>(detail, ['counts', 'channels', 'spectrum', 'data', 'histogram']);
  if (!Array.isArray(counts) || counts.length === 0) return null;

  const a0 = pick<number>(detail, ['a0', 'cal_a0', 'calibration_a0', 'energy_a0']);
  const a1 = pick<number>(detail, ['a1', 'cal_a1', 'calibration_a1', 'energy_a1']);
  const a2 = pick<number>(detail, ['a2', 'cal_a2', 'calibration_a2', 'energy_a2']);
  const calibrated = a1 !== undefined; // sin a1 no hay calibración energética útil

  return {
    counts: counts.map(Number),
    a0: a0 ?? 0,
    a1: a1 ?? 1,
    a2: a2 ?? 0,
    calibrated,
    channelCount: pick<number>(detail, ['channelCount', 'channel_count']) ?? counts.length,
    durationSec: pick<number>(detail, ['durationSec', 'duration_sec', 'duration']),
    startLat: pick<number>(detail, ['startLat', 'start_lat', 'start_latitude']),
    startLon: pick<number>(detail, ['startLon', 'start_lon', 'start_longitude']),
    startAlt: pick<number>(detail, ['startAlt', 'start_alt', 'start_altitude']),
    total: counts.reduce((acc: number, c: number) => acc + Number(c || 0), 0),
  };
}

const MetaItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Typography component="span" sx={{ fontFamily: MONO, fontSize: 12, color: T.text }}>
    <Box component="span" sx={{ color: T.textMid }}>
      {label}:
    </Box>{' '}
    {value}
  </Typography>
);

const SpectrumDialog: React.FC<Props> = ({ spectrumId, open, onClose }) => {
  const { t } = useTranslation('filters');
  const { formatNumber } = useLocale();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logScale, setLogScale] = useState(true);
  const [xMode, setXMode] = useState<'energy' | 'channel'>('energy');

  useEffect(() => {
    if (!open || spectrumId == null) return;

    let cancelled = false;
    setLoading(true);
    setError(null);
    setDetail(null);

    apiService
      .getRadiationSpectrumDetail(spectrumId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || t('spectrum.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, spectrumId]);

  const parsed = useMemo(() => (detail ? parseSpectrum(detail) : null), [detail]);

  // Si no hay calibración, forzar eje por canal
  const effectiveXMode = parsed?.calibrated ? xMode : 'channel';

  const chartData = useMemo(() => {
    if (!parsed) return [];
    const { counts, a0, a1, a2 } = parsed;
    return counts.map((count, ch) => ({
      ch,
      e: a0 + a1 * ch + a2 * ch * ch,
      count,
    }));
  }, [parsed]);

  // Líneas de isótopos: solo en modo keV y dentro del rango energético del espectro
  const visibleIsotopes = useMemo(() => {
    if (effectiveXMode !== 'energy' || chartData.length === 0) return [];
    const minE = chartData[0].e;
    const maxE = chartData[chartData.length - 1].e;
    return ISOTOPE_LINES.filter((iso) => iso.e >= minE && iso.e <= maxE);
  }, [effectiveXMode, chartData]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { overflow: 'hidden' } }}>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: MONO,
          fontWeight: 600,
          fontSize: 12,
          letterSpacing: '0.6px',
          textTransform: 'uppercase',
          color: T.text,
          bgcolor: T.surface3,
          borderBottom: `1px solid ${T.hairline}`,
          py: 1.25,
          pr: 6,
        }}
      >
        {spectrumId != null ? t('spectrum.title', { id: `#${spectrumId}` }) : t('spectrum.titleNoId')}
        <IconButton onClick={onClose} size="small" sx={{ position: 'absolute', top: 8, right: 8, color: T.textMid }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6, gap: 1.5 }}>
            <CircularProgress size={20} sx={{ color: ACCENT }} />
            <Typography sx={{ fontFamily: MONO, fontSize: 12, color: T.textMid }}>{t('spectrum.loading')}</Typography>
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {/* Esquema inesperado: mostramos las claves recibidas para descubrir los nombres reales */}
        {!loading && !error && detail && !parsed && (
          <Alert severity="warning">
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              {t('spectrum.noCountsTitle')}
            </Typography>
            <Typography variant="caption" component="div">
              {t('spectrum.fieldsReceived', { fields: Object.keys(detail).join(', ') })}
            </Typography>
          </Alert>
        )}

        {!loading && !error && parsed && (
          <>
            {/* Metadatos en texto compacto */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2.5, rowGap: 0.5, mb: 2 }}>
              <MetaItem label={t('spectrum.meta.counts')} value={formatNumber(parsed.total)} />
              <MetaItem label={t('spectrum.meta.channels')} value={String(parsed.channelCount)} />
              {parsed.durationSec != null && (
                <MetaItem label={t('spectrum.meta.duration')} value={`${formatNumber(parsed.durationSec)} s`} />
              )}
              {parsed.startLat != null && parsed.startLon != null && (
                <MetaItem label={t('spectrum.meta.start')} value={`${parsed.startLat.toFixed(5)}, ${parsed.startLon.toFixed(5)}`} />
              )}
              {parsed.startAlt != null && <MetaItem label={t('spectrum.meta.altitude')} value={`${Math.round(parsed.startAlt)} m`} />}
            </Box>

            {/* Controles */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={logScale ? 'log' : 'linear'}
                onChange={(_, v) => v && setLogScale(v === 'log')}
                sx={toggleGroupSx}
              >
                <ToggleButton value="log">{t('spectrum.scale.log')}</ToggleButton>
                <ToggleButton value="linear">{t('spectrum.scale.linear')}</ToggleButton>
              </ToggleButtonGroup>

              <ToggleButtonGroup
                size="small"
                exclusive
                value={effectiveXMode}
                onChange={(_, v) => v && setXMode(v)}
                disabled={!parsed.calibrated}
                sx={toggleGroupSx}
              >
                <ToggleButton value="energy">{t('spectrum.axis.kev')}</ToggleButton>
                <ToggleButton value="channel">{t('spectrum.axis.channel')}</ToggleButton>
              </ToggleButtonGroup>

              {!parsed.calibrated && (
                <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textDim, alignSelf: 'center' }}>
                  {t('spectrum.noCalibration')}
                </Typography>
              )}
            </Box>

            {/* Gráfico */}
            <Box
              sx={{
                height: 380,
                p: 1.5,
                bgcolor: T.surface2,
                border: `1px solid ${T.border}`,
                borderRadius: '8px',
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 16, right: 12, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="spectrumFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ACCENT} stopOpacity={0.65} />
                      <stop offset="100%" stopColor={ACCENT} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis
                    dataKey={effectiveXMode === 'energy' ? 'e' : 'ch'}
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tick={{ fill: '#8b949e', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
                    tickFormatter={(v: number) => (effectiveXMode === 'energy' ? Math.round(v).toString() : v.toString())}
                    label={{
                      value: effectiveXMode === 'energy' ? t('spectrum.axis.energy') : t('spectrum.axis.channel'),
                      position: 'insideBottom',
                      offset: -2,
                      fill: '#8b949e',
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    scale={logScale ? 'log' : 'linear'}
                    domain={logScale ? [1, 'dataMax'] : [0, 'dataMax']}
                    allowDataOverflow
                    tick={{ fill: '#8b949e', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
                    width={48}
                  />
                  <Tooltip
                    formatter={(value: any) => [formatNumber(Number(value)), t('spectrum.tooltip.counts')]}
                    labelFormatter={(v: any) =>
                      effectiveXMode === 'energy'
                        ? t('spectrum.tooltip.kev', { value: Math.round(Number(v)) })
                        : t('spectrum.tooltip.channel', { value: v })
                    }
                    contentStyle={{
                      backgroundColor: '#1d232a',
                      border: '1px solid rgba(255,255,255,0.07)',
                      borderRadius: 6,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#e8eaed' }}
                    itemStyle={{ color: '#e8eaed' }}
                  />
                  <Area
                    type="linear"
                    dataKey="count"
                    stroke={ACCENT}
                    strokeWidth={1}
                    fill="url(#spectrumFill)"
                    isAnimationActive={false}
                    dot={false}
                  />
                  {visibleIsotopes.map((iso) => (
                    <ReferenceLine
                      key={`${iso.label}-${iso.e}`}
                      x={iso.e}
                      stroke={OPENRED_ACCENT_RED}
                      strokeDasharray="4 3"
                      strokeOpacity={0.6}
                      label={isotopeLabel(iso.label)}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SpectrumDialog;
