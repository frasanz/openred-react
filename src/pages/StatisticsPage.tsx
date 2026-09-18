import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import DeckGL from '@deck.gl/react';
import { _GlobeView as GlobeView } from '@deck.gl/core';
import { SolidPolygonLayer, GeoJsonLayer } from '@deck.gl/layers';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { apiService } from '../services/api';
import {
  ActivityStatistics,
  GlobalStatistics,
  RecordsStatistics,
  HeatmapStatistics,
} from '../types/statistics';
import { darkTokens as T } from '../theme/tokens';
import { MONO } from '../theme/theme';
import { RADIATION_LEGEND } from '../utils/radiationColors';
import { FloatPanel } from '../components/ui/FloatPanel';
import { useLocale } from '../utils/i18nFormat';

// Celda KPI: label mono arriba, valor mono tabular abajo. Sin iconos, sin acento.
const KpiCell: React.FC<{ label: string; value: string; unit?: string; dim?: boolean }> = ({ label, value, unit, dim }) => (
  <Box sx={{ p: 2.25, borderRight: `1px solid ${T.border}`, borderBottom: `1px dashed ${T.hairline}` }}>
    <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.8px', textTransform: 'uppercase', color: T.textMid, mb: 1 }}>
      {label}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
      <Typography
        sx={{
          fontFamily: MONO,
          fontWeight: 500,
          fontSize: 28,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          color: dim ? T.textDim : T.text,
        }}
      >
        {value}
      </Typography>
      {unit && <Typography sx={{ fontFamily: MONO, fontSize: 12, color: T.textDim }}>{unit}</Typography>}
    </Box>
  </Box>
);

// Color del globo
const GLOBE_RESOLUTION = 100;
const GLOBE_COLOR = [30, 30, 40, 255];
const BACKGROUND_COLOR = [10, 20, 30];
const EARTH_RADIUS_METERS = 6.3e6;
const COUNTRIES = 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_scale_rank.geojson';

const StatisticsPage: React.FC = () => {
  const { t } = useTranslation('statistics');
  const { formatNumber, formatDate } = useLocale();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [globalStats, setGlobalStats] = useState<GlobalStatistics | null>(null);
  const [heatmapStats, setHeatmapStats] = useState<HeatmapStatistics | null>(null);
  const [hoveredHex, setHoveredHex] = useState<any>(null);

  const pageBg = T.bg;

  const getRadiationColor = useCallback((value: number): [number, number, number, number] => {
    // value en µSv/h (ya dividido por 100 desde el backend)
    // Escala de colores: Azul → Verde → Amarillo → Naranja → Rojo → Morado
    if (value < 0.08) {
      // Azul a Verde (0-0.08 µSv/h)
      const t = value / 0.08;
      const red = 0;
      const green = Math.round(100 + t * 155);
      const blue = Math.round(255 - t * 255);
      return [red, green, blue, 200];
    } else if (value < 0.12) {
      // Verde (0.08-0.12 µSv/h)
      return [0, 255, 0, 200];
    } else if (value < 0.16) {
      // Verde a Amarillo (0.12-0.16 µSv/h)
      const t = (value - 0.12) / 0.04;
      const red = Math.round(0 + t * 255);
      const green = 255;
      const blue = 0;
      return [red, green, blue, 200];
    } else if (value < 0.20) {
      // Amarillo a Naranja (0.16-0.20 µSv/h)
      const t = (value - 0.16) / 0.04;
      const red = 255;
      const green = Math.round(255 - t * 90);
      const blue = 0;
      return [red, green, blue, 200];
    } else if (value < 0.30) {
      // Naranja a Rojo (0.20-0.30 µSv/h)
      const t = (value - 0.20) / 0.10;
      const red = 255;
      const green = Math.round(165 - t * 165);
      const blue = 0;
      return [red, green, blue, 200];
    } else if (value < 0.50) {
      // Rojo a Morado (0.30-0.50 µSv/h)
      const t = (value - 0.30) / 0.20;
      const red = Math.round(255 - t * 105);
      const green = 0;
      const blue = Math.round(0 + t * 200);
      return [red, green, blue, 200];
    } else {
      // Morado intenso (0.50+ µSv/h)
      return [150, 0, 200, 200];
    }
  }, []);
  


  const backgroundLayers = useMemo(() => [
    new GeoJsonLayer({
      id: 'base-map',
      data: COUNTRIES,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 1,
      getLineColor: [120, 120, 120],
      getFillColor: [150, 150, 150]
    })
  ], []);

  const heatmapLayer = useMemo(() => heatmapStats ? new H3HexagonLayer({
    id: 'heatmap',
    data: heatmapStats.cells,
    getHexagon: d => d.h3,
    getFillColor: d => getRadiationColor(d.avg_dose_rate),
    getLineColor: d => getRadiationColor(d.avg_dose_rate).slice(0, 3) as [number, number, number],
    getElevation: d => d.count * 1000,
    extruded: true,
    wireframe: true,
    pickable: true,
    onHover: (info) => setHoveredHex(info.object || null)
  }) : null, [heatmapStats, getRadiationColor]);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const global = await apiService.getGlobalStatistics('radiation');
      const heatmap = await apiService.getHeatmapStatistics(3, 'radiation');
      
      console.log('Heatmap data:', heatmap);
      console.log('Cells count:', heatmap.cells?.length);
      console.log('Sample cells:', heatmap.cells?.slice(0, 3));
      
      setGlobalStats(global);
      setHeatmapStats(heatmap);
    } catch (err: any) {
      console.error('Error loading statistics:', err);
      setError(t('errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Container>
    );
  }
  return (
    <Box sx={{
      minHeight: '100vh',
      background: pageBg,
    }}>
      {/* Header compacto (alineado con topbar/paneles) */}
      <Box sx={{
        background: T.bg,
        borderBottom: `1px solid ${T.border}`,
        px: { xs: 2, md: 4 },
        py: 2.5,
      }}>
        <Container maxWidth="xl" disableGutters>
          <Typography
            sx={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              color: T.textMid,
              mb: 0.5,
            }}
          >
            {t('header.kicker')}
          </Typography>
          <Typography component="h1" sx={{ fontFamily: MONO, fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: '-0.015em', lineHeight: 1.1 }}>
            {t('header.title')}
          </Typography>
          <Typography sx={{ fontFamily: MONO, mt: 0.5, fontSize: 13, color: T.textDim }}>
            {t('header.subtitle')}
          </Typography>
        </Container>
      </Box>

      {/* Content Area */}
      <Container maxWidth="xl" sx={{ mt: 4, pb: 6, position: 'relative', zIndex: 2 }}>

        {/* Main Layout: Stats Left, Map Right */}
        <Grid container spacing={4}>
          {/* LEFT COLUMN - All Statistics */}
          <Grid item xs={12} lg={6}>
            {globalStats && (
              <Box
                sx={{
                  border: `1px solid ${T.border}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                }}
              >
                {([
                  { label: t('kpis.totalMeasurements'), value: formatNumber(globalStats.totals.measurements) },
                  { label: t('kpis.contributors'), value: formatNumber(globalStats.totals.contributors) },
                  { label: t('kpis.registeredTracks'), value: formatNumber(globalStats.totals.tracks) },
                  { label: t('kpis.totalDistance'), value: globalStats.distance.total_km.toFixed(2), unit: 'km' },
                  { label: t('kpis.longestTrack'), value: globalStats.distance.longest_track_km.toFixed(2), unit: 'km' },
                  { label: t('kpis.maxPerTrack'), value: formatNumber(globalStats.records.most_measurements_track) },
                  { label: t('kpis.maxDose'), value: globalStats.records.highest_dose_rate != null ? globalStats.records.highest_dose_rate.toFixed(2) : '—', unit: 'µSv/h', dim: globalStats.records.highest_dose_rate == null },
                  { label: t('kpis.minDose'), value: globalStats.records.lowest_dose_rate != null ? globalStats.records.lowest_dose_rate.toFixed(3) : '—', unit: 'µSv/h', dim: globalStats.records.lowest_dose_rate == null },
                  { label: t('kpis.minLatitude'), value: `${globalStats.geographic.bbox.min_lat.toFixed(4)}°`, unit: t('units.south') },
                  { label: t('kpis.maxLatitude'), value: `${globalStats.geographic.bbox.max_lat.toFixed(4)}°`, unit: t('units.north') },
                  { label: t('kpis.minLongitude'), value: `${globalStats.geographic.bbox.min_lon.toFixed(4)}°`, unit: t('units.west') },
                  { label: t('kpis.maxLongitude'), value: `${globalStats.geographic.bbox.max_lon.toFixed(4)}°`, unit: t('units.east') },
                  { label: t('kpis.earthCircumferences'), value: globalStats.fun_facts.earth_circumferences.toFixed(4) },
                  { label: t('kpis.marathons'), value: globalStats.fun_facts.marathon_equivalents.toFixed(1) },
                ] as Array<{ label: string; value: string; unit?: string; dim?: boolean }>).map((k) => (
                  <KpiCell key={k.label} label={k.label} value={k.value} unit={k.unit} dim={k.dim} />
                ))}

                {/* Período de datos - fila completa */}
                <Box sx={{ gridColumn: '1 / -1', p: 2.25 }}>
                  <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.8px', textTransform: 'uppercase', color: T.textMid, mb: 1 }}>
                    {t('dataPeriod.label')}
                  </Typography>
                  <Typography sx={{ fontFamily: MONO, fontSize: 14, color: T.text, fontVariantNumeric: 'tabular-nums' }}>
                    {formatDate(globalStats.date_range.first, dateOptions)} — {formatDate(globalStats.date_range.last, dateOptions)}
                    <Box component="span" sx={{ ml: 1, color: T.textDim, fontSize: 12 }}>
                      ({globalStats.date_range.days_active} {t('dataPeriod.days', { count: globalStats.date_range.days_active })})
                    </Box>
                  </Typography>
                </Box>
              </Box>
            )}
          </Grid>
          {/* RIGHT COLUMN - Map */}
          <Grid item xs={12} lg={6}>
            {heatmapStats && (
              <Box sx={{ position: { lg: 'sticky' }, top: 16 }}>
                <Box sx={{ bgcolor: T.surface, border: `1px solid ${T.border}`, borderRadius: '8px', p: 1.5 }}>
                  <Box sx={{ position: 'relative', height: 520, width: '100%', borderRadius: '6px', overflow: 'hidden', bgcolor: `rgb(${BACKGROUND_COLOR.join(',')})` }}>
                    <DeckGL
                      views={new GlobeView({ resolution: GLOBE_RESOLUTION })}
                      initialViewState={{ longitude: 0, latitude: 20, zoom: 1 }}
                      controller={true}
                      layers={heatmapLayer ? [...backgroundLayers, heatmapLayer] : backgroundLayers}
                    />
                    {hoveredHex && (
                      <Box sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'rgba(18,22,27,0.96)', border: `1px solid ${T.border}`, p: 1.5, borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.32)' }}>
                        <Typography sx={{ fontFamily: MONO, fontSize: 12, color: T.text }}>{t('map.measurements')}: {hoveredHex.count}</Typography>
                        <Typography sx={{ fontFamily: MONO, fontSize: 12, color: T.text }}>{t('map.dose')}: {hoveredHex.avg_dose_rate.toFixed(3)} µSv/h</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Leyenda de la escala de radiación */}
                <Box sx={{ mt: 2 }}>
                  <FloatPanel title={t('map.doseRateTitle')} right="µSv/h">
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                      {RADIATION_LEGEND.map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 20, height: 10, background: item.gradient, borderRadius: '2px', flexShrink: 0 }} />
                          <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textMid }}>{item.label}</Typography>
                        </Box>
                      ))}
                    </Box>
                  </FloatPanel>
                </Box>
              </Box>
            )}
          </Grid>
      </Grid>
      </Container>
    </Box>
  );
};

export default StatisticsPage;
