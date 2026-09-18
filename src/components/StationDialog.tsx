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
  ComposedChart,
  Bar,
  Area,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import apiService from '../services/api';
import { useLocale } from '../utils/i18nFormat';
import { darkTokens as T, ACCENT_HEX } from '../theme/tokens';
import { MONO } from '../theme/theme';
import { StatusDot, StatusKind } from './ui/StatusDot';
import { StationReadingsResponse } from '../types';

interface Props {
  stationId: number | null;
  open: boolean;
  onClose: () => void;
}

const ACCENT = ACCENT_HEX;
const CPM_COLOR = '#c77dff';
const WEATHER_TEMP_COLOR = '#f0b341';
const WEATHER_WIND_COLOR = '#8ce99a';

const CHART_HEIGHT = 320;

const COMPASS_POINTS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const degToCompass = (deg: number): string => COMPASS_POINTS[Math.round(((deg % 360) + 360) % 360 / 22.5) % 16];

// Flecha de viento: apunta hacia donde sopla (dirección meteorológica + 180°, ya que esa
// convención da la dirección de la que VIENE el viento). Su largo no cambia con la
// velocidad -altura en el eje ya la representa-, solo la orientación importa aquí.
const WindArrowShape: React.FC<any> = (props) => {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || payload?.windDirection == null) return null;
  const angle = payload.windDirection + 180;
  return (
    <g transform={`translate(${cx},${cy}) rotate(${angle})`}>
      <line x1={0} y1={5} x2={0} y2={-5} stroke={WEATHER_WIND_COLOR} strokeWidth={1.5} />
      <path d="M0,-5 L-2.5,-1.5 L2.5,-1.5 Z" fill={WEATHER_WIND_COLOR} />
    </g>
  );
};

type Range = '1d' | '1w' | '1m' | '1y' | '4y';
const RANGES: Range[] = ['1d', '1w', '1m', '1y', '4y'];

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

const stationStatusKind = (status?: string): StatusKind => {
  if (status === 'online') return 'ok';
  if (status === 'offline') return 'danger';
  return 'info';
};

// window.interval es el tamaño de bucket ("5m", "1h", "1d", "1w", ...): lo usamos para
// decidir cuándo dos puntos consecutivos representan un hueco real (estación caída) y no
// dos lecturas contiguas, y así cortar la línea en vez de unirla con una recta engañosa.
const parseIntervalSeconds = (interval?: string): number | null => {
  if (!interval) return null;
  const m = /^(\d+)(m|h|d|w)$/.exec(interval.trim());
  if (!m) return null;
  const n = Number(m[1]);
  const unitSeconds: Record<string, number> = { m: 60, h: 3600, d: 86400, w: 604800 };
  return n * unitSeconds[m[2]];
};

const MetaItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Typography component="span" sx={{ fontFamily: MONO, fontSize: 12, color: T.text }}>
    <Box component="span" sx={{ color: T.textMid }}>
      {label}:
    </Box>{' '}
    {value}
  </Typography>
);

const StationDialog: React.FC<Props> = ({ stationId, open, onClose }) => {
  const { t } = useTranslation('filters');
  const { formatNumber, formatDateTime } = useLocale();
  const [data, setData] = useState<StationReadingsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<Range>('1d');
  const [showWind, setShowWind] = useState(false);

  // El rango de fechas se resetea al abrir una estación distinta, no al reabrir la misma.
  useEffect(() => {
    if (open) setRange('1d');
  }, [open, stationId]);

  useEffect(() => {
    if (!open || stationId == null) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    apiService
      .getStationReadings(stationId, { range })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || t('station.loadError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, stationId, range, t]);

  const doseUnit = data?.units?.dose_rate ?? 'µSv/h';
  const cpmUnit = data?.units?.cpm ?? 'counts/min';

  // Serie del gráfico principal: avg + banda mín-máx (el "error") de dosis y cpm a la vez,
  // por bucket, con marcadores de hueco (todo null) insertados donde la distancia entre
  // timestamps supera el tamaño de bucket esperado, para cortar la línea en vez de unirla.
  const chartData = useMemo(() => {
    if (!data) return [];
    const points = data.series
      .map((p) => {
        const dose = p.dose_rate;
        const cpm = p.cpm;
        if (!dose && !cpm) return null;
        return {
          t: new Date(p.t).getTime(),
          doseAvg: dose?.avg ?? null,
          doseRange: dose ? ([dose.min, dose.max] as [number, number]) : null,
          cpmAvg: cpm?.avg ?? null,
          cpmRange: cpm ? ([cpm.min, cpm.max] as [number, number]) : null,
          count: p.count,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => a.t - b.t);

    if (points.length === 0) return [];

    const intervalSec = parseIntervalSeconds(data.window.interval) ?? data.station.expected_interval_seconds ?? 300;
    const gapMs = intervalSec * 1000 * 1.5;

    const withGaps: any[] = [points[0]];
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      if (curr.t - prev.t > gapMs) {
        withGaps.push({ t: (prev.t + curr.t) / 2, doseAvg: null, doseRange: null, cpmAvg: null, cpmRange: null, count: 0 });
      }
      withGaps.push(curr);
    }
    return withGaps;
  }, [data]);

  // Tira de lluvia + temperatura (fijas) y viento (opcional), a la resolución propia de
  // weather (no alineada punto a punto con chartData): cruzar dosis con lluvia es lo más
  // revelador para picos de radón. El viento se pinta como flecha (altura = velocidad,
  // orientación = dirección) sobre un eje propio oculto, activable con el toggle.
  const weatherData = useMemo(() => {
    if (!data) return [];
    return data.weather.map((w) => ({
      t: new Date(w.t).getTime(),
      rain: w.rain_sum ?? 0,
      temperature: w.temperature ?? null,
      windSpeed: w.wind_speed ?? null,
      windDirection: w.wind_direction ?? null,
    }));
  }, [data]);

  const xTickFormatter = (v: number) => {
    if (range === '1d') return formatDateTime(v, { hour: '2-digit', minute: '2-digit', hour12: false });
    if (range === '1w' || range === '1m') return formatDateTime(v, { day: '2-digit', month: '2-digit' });
    return formatDateTime(v, { month: '2-digit', year: 'numeric' });
  };

  const stats = data?.stats;

  // Tooltip del gráfico principal: solo las medias (la banda ya se ve visualmente), una
  // línea por métrica presente en ese bucket.
  const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const doseAvg = payload.find((p: any) => p.dataKey === 'doseAvg')?.value;
    const cpmAvg = payload.find((p: any) => p.dataKey === 'cpmAvg')?.value;
    if (doseAvg == null && cpmAvg == null) return null;
    return (
      <Box sx={{ backgroundColor: '#1d232a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', px: 1.25, py: 1 }}>
        <Typography sx={{ fontSize: 11, color: '#8b949e', mb: 0.5 }}>
          {formatDateTime(label, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
        </Typography>
        {doseAvg != null && (
          <Typography sx={{ fontSize: 12, color: ACCENT, fontFamily: MONO }}>
            {t('station.metric.doseRate')}: {formatNumber(doseAvg, { maximumFractionDigits: 3 })} {doseUnit}
          </Typography>
        )}
        {cpmAvg != null && (
          <Typography sx={{ fontSize: 12, color: CPM_COLOR, fontFamily: MONO }}>
            {t('station.metric.cpm')}: {formatNumber(cpmAvg, { maximumFractionDigits: 1 })} {cpmUnit}
          </Typography>
        )}
      </Box>
    );
  };

  // Tooltip de la tira meteo: lluvia + temperatura siempre, viento solo si el toggle está activo.
  const WeatherTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const rain = payload.find((p: any) => p.dataKey === 'rain')?.value;
    const temperature = payload.find((p: any) => p.dataKey === 'temperature')?.value;
    const windEntry = payload.find((p: any) => p.dataKey === 'windSpeed');
    const windSpeed = windEntry?.value;
    const windDirection = windEntry?.payload?.windDirection;
    return (
      <Box sx={{ backgroundColor: '#1d232a', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', px: 1.25, py: 1 }}>
        <Typography sx={{ fontSize: 11, color: '#8b949e', mb: 0.5 }}>
          {formatDateTime(label, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
        </Typography>
        {rain != null && (
          <Typography sx={{ fontSize: 12, color: '#3d8bfd', fontFamily: MONO }}>
            {t('station.weather.rain')}: {formatNumber(rain, { maximumFractionDigits: 1 })} mm
          </Typography>
        )}
        {temperature != null && (
          <Typography sx={{ fontSize: 12, color: WEATHER_TEMP_COLOR, fontFamily: MONO }}>
            {t('station.weather.temperature')}: {formatNumber(temperature, { maximumFractionDigits: 1 })} °C
          </Typography>
        )}
        {showWind && windSpeed != null && (
          <Typography sx={{ fontSize: 12, color: WEATHER_WIND_COLOR, fontFamily: MONO }}>
            {t('station.weather.wind')}: {formatNumber(windSpeed, { maximumFractionDigits: 1 })} km/h
            {windDirection != null && ` · ${degToCompass(windDirection)} (${Math.round(windDirection)}°)`}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { overflow: 'hidden' } }}>
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
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
        {data?.station && <StatusDot kind={stationStatusKind(data.station.status)} />}
        {data?.station ? t('station.title', { name: data.station.name }) : t('station.titleNoId')}
        <IconButton onClick={onClose} size="small" sx={{ position: 'absolute', top: 8, right: 8, color: T.textMid }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2.5 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6, gap: 1.5 }}>
            <CircularProgress size={20} sx={{ color: ACCENT }} />
            <Typography sx={{ fontFamily: MONO, fontSize: 12, color: T.textMid }}>{t('station.loading')}</Typography>
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && data && (
          <>
            {/* Controles */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 1.5 }}>
              <ToggleButtonGroup size="small" exclusive value={range} onChange={(_, v) => v && setRange(v)} sx={toggleGroupSx}>
                {RANGES.map((r) => (
                  <ToggleButton key={r} value={r}>
                    {t(`station.range.${r}`)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>

            {/* Metadatos en texto compacto */}
            {data.series.length > 0 && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', columnGap: 2.5, rowGap: 0.5, mb: 2 }}>
                {stats?.dose_rate_avg != null && (
                  <MetaItem label={`${t('station.metric.doseRate')} · ${t('station.stats.avg')}`} value={`${formatNumber(stats.dose_rate_avg, { maximumFractionDigits: 3 })} ${doseUnit}`} />
                )}
                {stats?.cpm_avg != null && (
                  <MetaItem label={`${t('station.metric.cpm')} · ${t('station.stats.avg')}`} value={`${formatNumber(stats.cpm_avg, { maximumFractionDigits: 1 })} ${cpmUnit}`} />
                )}
                <MetaItem label={t('station.stats.points')} value={String(data.window.points)} />
              </Box>
            )}

            {data.series.length === 0 ? (
              <Alert severity="info">{t('station.noData')}</Alert>
            ) : (
              <>
                {/* Gráfico principal: dosis y CPM a la vez, cada una con su banda mín-máx (el "error" del bucket) */}
                <Box sx={{ height: CHART_HEIGHT, p: 1.5, bgcolor: T.surface2, border: `1px solid ${T.border}`, borderRadius: '8px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: ACCENT }} />
                      <Typography sx={{ fontFamily: MONO, fontSize: 9, color: T.textDim }}>{t('station.metric.doseRate')} ({doseUnit})</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: CPM_COLOR }} />
                      <Typography sx={{ fontFamily: MONO, fontSize: 9, color: T.textDim }}>{t('station.metric.cpm')} ({cpmUnit})</Typography>
                    </Box>
                  </Box>
                  <ResponsiveContainer width="100%" height="90%">
                    <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="t"
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        tickFormatter={xTickFormatter}
                        tick={{ fill: '#8b949e', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
                      />
                      <YAxis
                        yAxisId="dose"
                        tick={{ fill: '#8b949e', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
                        width={48}
                      />
                      <YAxis
                        yAxisId="cpm"
                        orientation="right"
                        tick={{ fill: '#8b949e', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}
                        width={48}
                      />
                      <Tooltip content={<ChartTooltip />} />
                      <Area yAxisId="dose" dataKey="doseRange" stroke="none" fill={ACCENT} fillOpacity={0.18} isAnimationActive={false} connectNulls={false} />
                      <Line yAxisId="dose" type="monotone" dataKey="doseAvg" stroke={ACCENT} strokeWidth={1.75} dot={false} isAnimationActive={false} connectNulls={false} />
                      <Area yAxisId="cpm" dataKey="cpmRange" stroke="none" fill={CPM_COLOR} fillOpacity={0.18} isAnimationActive={false} connectNulls={false} />
                      <Line yAxisId="cpm" type="monotone" dataKey="cpmAvg" stroke={CPM_COLOR} strokeWidth={1.75} dot={false} isAnimationActive={false} connectNulls={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Box>

                {/* Lluvia + temperatura (fijas) y viento (opcional, clic en la leyenda) */}
                {weatherData.length > 0 && (
                  <Box sx={{ height: CHART_HEIGHT, mt: 1.5, p: 1.5, bgcolor: T.surface2, border: `1px solid ${T.border}`, borderRadius: '8px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                      <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {t('station.weather.title')}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '2px', bgcolor: '#3d8bfd' }} />
                        <Typography sx={{ fontFamily: MONO, fontSize: 9, color: T.textDim }}>{t('station.weather.rain')}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: WEATHER_TEMP_COLOR }} />
                        <Typography sx={{ fontFamily: MONO, fontSize: 9, color: T.textDim }}>{t('station.weather.temperature')}</Typography>
                      </Box>
                      <Box
                        onClick={() => setShowWind((v) => !v)}
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', opacity: showWind ? 1 : 0.45, userSelect: 'none' }}
                      >
                        <Box sx={{ width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: `8px solid ${WEATHER_WIND_COLOR}` }} />
                        <Typography sx={{ fontFamily: MONO, fontSize: 9, color: showWind ? T.text : T.textDim }}>{t('station.weather.wind')}</Typography>
                      </Box>
                    </Box>
                    <ResponsiveContainer width="100%" height="90%">
                      <ComposedChart data={weatherData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                        <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} tickFormatter={xTickFormatter} tick={{ fill: '#8b949e', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} />
                        <YAxis yAxisId="rain" tick={{ fill: '#8b949e', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} width={48} />
                        <YAxis yAxisId="temp" orientation="right" tick={{ fill: '#8b949e', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }} width={48} />
                        {showWind && <YAxis yAxisId="wind" hide domain={[0, 'dataMax']} />}
                        <Tooltip content={<WeatherTooltip />} />
                        <Bar yAxisId="rain" dataKey="rain" fill="#3d8bfd" isAnimationActive={false} />
                        <Line yAxisId="temp" type="monotone" dataKey="temperature" stroke={WEATHER_TEMP_COLOR} strokeWidth={1.5} dot={false} isAnimationActive={false} connectNulls={false} />
                        {showWind && (
                          <Scatter yAxisId="wind" dataKey="windSpeed" shape={<WindArrowShape />} isAnimationActive={false} legendType="none" />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StationDialog;
