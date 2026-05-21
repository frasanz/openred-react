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
import apiService from '../services/api';
import { OPENRED_NAVY, OPENRED_ACCENT_RED } from '../styles/boxes';

interface Props {
  spectrumId: number | null;
  open: boolean;
  onClose: () => void;
}

const BRAND = OPENRED_NAVY;

// Toggles con estética OpenRed: borde navy, seleccionado en navy sólido
const toggleGroupSx = {
  '& .MuiToggleButton-root': {
    textTransform: 'none',
    fontWeight: 600,
    color: OPENRED_NAVY,
    border: `1px solid ${OPENRED_NAVY}`,
    px: 1.75,
    py: 0.4,
    '&.Mui-selected': {
      backgroundColor: OPENRED_NAVY,
      color: '#fff',
      '&:hover': { backgroundColor: OPENRED_NAVY },
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
    fill="#475569"
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

const SpectrumDialog: React.FC<Props> = ({ spectrumId, open, onClose }) => {
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
        if (!cancelled) setError(err?.message || 'Error al cargar el espectro');
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      <DialogTitle
        sx={{
          pr: 6,
          fontFamily: '"Bricolage Grotesque", "Montserrat", sans-serif',
          fontWeight: 700,
          fontSize: '22px',
          color: '#fff',
          bgcolor: OPENRED_NAVY,
        }}
      >
        Espectro {spectrumId != null ? `#${spectrumId}` : ''}
        <IconButton
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.9)' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: '#fff', pt: 3 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6, gap: 1.5 }}>
            <CircularProgress size={22} sx={{ color: BRAND }} />
            <Typography variant="body2" color="text.secondary">
              Cargando espectro…
            </Typography>
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {/* Esquema inesperado: mostramos las claves recibidas para descubrir los nombres reales */}
        {!loading && !error && detail && !parsed && (
          <Alert severity="warning">
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              No encontré el array de cuentas en la respuesta.
            </Typography>
            <Typography variant="caption" component="div">
              Campos recibidos: {Object.keys(detail).join(', ')}
            </Typography>
          </Alert>
        )}

        {!loading && !error && parsed && (
          <>
            {/* Metadatos en texto compacto */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2.5, rowGap: 0.5, mb: 2 }}>
              <MetaItem label="Cuentas" value={parsed.total.toLocaleString('es-ES')} />
              <MetaItem label="Canales" value={String(parsed.channelCount)} />
              {parsed.durationSec != null && (
                <MetaItem label="Duración" value={`${parsed.durationSec.toLocaleString('es-ES')} s`} />
              )}
              {parsed.startLat != null && parsed.startLon != null && (
                <MetaItem label="Inicio" value={`${parsed.startLat.toFixed(5)}, ${parsed.startLon.toFixed(5)}`} />
              )}
              {parsed.startAlt != null && <MetaItem label="Alt" value={`${Math.round(parsed.startAlt)} m`} />}
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
                <ToggleButton value="log">Log</ToggleButton>
                <ToggleButton value="linear">Lineal</ToggleButton>
              </ToggleButtonGroup>

              <ToggleButtonGroup
                size="small"
                exclusive
                value={effectiveXMode}
                onChange={(_, v) => v && setXMode(v)}
                disabled={!parsed.calibrated}
                sx={toggleGroupSx}
              >
                <ToggleButton value="energy">keV</ToggleButton>
                <ToggleButton value="channel">Canal</ToggleButton>
              </ToggleButtonGroup>

              {!parsed.calibrated && (
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                  Sin calibración energética → eje por canal
                </Typography>
              )}
            </Box>

            {/* Gráfico */}
            <Box
              sx={{
                height: 380,
                p: 1.5,
                bgcolor: '#fff',
                border: `1px solid ${OPENRED_NAVY}`,
                borderRadius: 3,
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 16, right: 12, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id="spectrumFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BRAND} stopOpacity={0.7} />
                      <stop offset="100%" stopColor={BRAND} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey={effectiveXMode === 'energy' ? 'e' : 'ch'}
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(v: number) => (effectiveXMode === 'energy' ? Math.round(v).toString() : v.toString())}
                    label={{
                      value: effectiveXMode === 'energy' ? 'Energía (keV)' : 'Canal',
                      position: 'insideBottom',
                      offset: -2,
                      fill: '#64748b',
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    scale={logScale ? 'log' : 'linear'}
                    domain={logScale ? [1, 'dataMax'] : [0, 'dataMax']}
                    allowDataOverflow
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    width={48}
                  />
                  <Tooltip
                    formatter={(value: any) => [Number(value).toLocaleString('es-ES'), 'Cuentas']}
                    labelFormatter={(v: any) =>
                      effectiveXMode === 'energy' ? `${Math.round(Number(v))} keV` : `Canal ${v}`
                    }
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Area
                    type="linear"
                    dataKey="count"
                    stroke={BRAND}
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

const MetaItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Typography component="span" sx={{ fontSize: '13px', color: '#475569' }}>
    <Box component="span" sx={{ color: OPENRED_NAVY, fontWeight: 600 }}>
      {label}:
    </Box>{' '}
    {value}
  </Typography>
);

export default SpectrumDialog;
