import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Timeline as TimelineIcon,
  Route as RouteIcon,
  Public as PublicIcon,
  EmojiEvents as TrophyIcon,
  Speed as SpeedIcon,
  AccessTime as ClockIcon,
  Place as PlaceIcon,
  Science as RadiationIcon,
} from '@mui/icons-material';
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
import {
  OPENRED_ACCENT_RED,
  OPENRED_NAVY,
  OPENRED_PAGE_BG,
  openredStatCardContentSx,
  openredStatCardSx,
} from '../styles/boxes';

// Color del globo
const GLOBE_RESOLUTION = 100;
const GLOBE_COLOR = [30, 30, 40, 255];
const BACKGROUND_COLOR = [10, 20, 30];
const EARTH_RADIUS_METERS = 6.3e6;
const COUNTRIES = 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_admin_0_scale_rank.geojson';

const StatisticsPage: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [globalStats, setGlobalStats] = useState<GlobalStatistics | null>(null);
  const [heatmapStats, setHeatmapStats] = useState<HeatmapStatistics | null>(null);
  const [hoveredHex, setHoveredHex] = useState<any>(null);

  const pageBg = OPENRED_PAGE_BG;
  const accentRed = OPENRED_ACCENT_RED;
  const navy = OPENRED_NAVY;

  const statCardSx = openredStatCardSx;
  const statCardContentSx = openredStatCardContentSx;

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
      setError('Error al cargar las estadísticas. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
      {/* Black Header with Wave */}
      <Box sx={{
        background: '#000000',
        pt: 8,
        pb: 10,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
            <Typography
              variant="h2"
              component="h1"
              fontFamily="'Bricolage Grotesque', 'Montserrat', sans-serif"
              fontWeight="600"
              sx={{
                color: '#E4EEFA',
                mb: 2,
                letterSpacing: -1
              }}
            >
              Estadísticas del Proyecto
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: '#E4EEFA',
                maxWidth: 600,
                mx: 'auto',
                fontWeight: 400,
                lineHeight: 1.6
              }}
            >
              Descubre el impacto y alcance de la comunidad Openred a través de datos detallados
            </Typography>
          </Box>
        </Container>
        {/* Wave SVG */}
        <Box
          component="svg"
          sx={{
            position: 'absolute',
            bottom: -1,
            left: 0,
            width: '100%',
            height: 180,
            display: 'block',
            pointerEvents: 'none',
            zIndex: 0,
          }}
          viewBox="0 0 1440 180"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 C480,180 960,180 1440,0 L1440,180 L0,180 Z"
            fill={pageBg}
          />
        </Box>
      </Box>

      {/* Content Area */}
      <Container maxWidth="xl" sx={{ mt: 4, pb: 6, position: 'relative', zIndex: 2 }}>

        {/* Main Layout: Stats Left, Map Right */}
        <Grid container spacing={4}>
          {/* LEFT COLUMN - All Statistics */}
          <Grid item xs={12} lg={6}>
            {/* Key Metrics Section */}
            {globalStats && (
              <Box>
                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {/* Tarjetas principales minimalistas */}
                  <Grid item xs={12} sm={6}>
                    <Card sx={statCardSx}>
                      <CardContent sx={statCardContentSx}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <TimelineIcon sx={{ color: 'inherit', fontSize: 18 }} />
                          <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 600, fontSize: 12, letterSpacing: 0.4 }}>
                            TOTAL MEDICIONES
                          </Typography>
                        </Box>
                        <Typography className="statNumber" variant="h2" sx={{}}>
                          {globalStats.totals.measurements.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={statCardSx}>
                      <CardContent sx={statCardContentSx}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <RouteIcon sx={{ color: 'inherit', fontSize: 18 }} />
                          <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 600, fontSize: 12, letterSpacing: 0.4 }}>
                            TRACKS REGISTRADOS
                          </Typography>
                        </Box>
                        <Typography className="statNumber" variant="h2" sx={{}}>
                          {globalStats.totals.tracks}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={statCardSx}>
                      <CardContent sx={statCardContentSx}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <RadiationIcon sx={{ color: 'inherit', fontSize: 18 }} />
                          <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 600, fontSize: 12, letterSpacing: 0.4 }}>
                            DOSIS MÁXIMA
                          </Typography>
                        </Box>
                        <Typography className="statNumber" variant="h2" sx={{}}>
                          {globalStats.records.highest_dose_rate != null ? globalStats.records.highest_dose_rate.toFixed(2) : '—'}
                          <Typography className="statUnit" component="span" variant="body2" sx={{ ml: 1, fontWeight: 400 }}>
                            µSv/h
                          </Typography>
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={statCardSx}>
                      <CardContent sx={statCardContentSx}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <PublicIcon sx={{ color: 'inherit', fontSize: 18 }} />
                          <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 600, fontSize: 12, letterSpacing: 0.4 }}>
                            CONTRIBUIDORES
                          </Typography>
                        </Box>
                        <Typography className="statNumber" variant="h2" sx={{}}>
                          {globalStats.totals.contributors}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  {/* Fin tarjetas principales minimalistas */}
                </Grid>
              </Box>
            )}
            {/* Geographic & Fun Facts Section */}
            {globalStats && (
              <Box sx={{ mb: 4 }}>
                <Grid container spacing={3} sx={{ mb: 4 }}>
              {/* Distance Statistics */}
              <Grid item xs={12} sm={6}>
                <Card sx={statCardSx}>
                  <CardContent sx={statCardContentSx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <RouteIcon sx={{ color: 'inherit', fontSize: 18 }} />
                      <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 600, fontSize: 12, letterSpacing: 0.4 }}>
                        DISTANCIA TOTAL
                      </Typography>
                    </Box>
                    <Typography className="statNumber" variant="h2" sx={{}}>
                      {globalStats.distance.total_km.toFixed(2)}
                      <Typography className="statUnit" component="span" variant="body2" sx={{ ml: 1, fontWeight: 400 }}>
                        km
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={statCardSx}>
                  <CardContent sx={statCardContentSx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <TrophyIcon sx={{ color: 'inherit', fontSize: 18 }} />
                      <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 600, fontSize: 12, letterSpacing: 0.4 }}>
                        TRACK MÁS LARGO
                      </Typography>
                    </Box>
                    <Typography className="statNumber" variant="h2" sx={{}}>
                      {globalStats.distance.longest_track_km.toFixed(2)}
                      <Typography className="statUnit" component="span" variant="body2" sx={{ ml: 1, fontWeight: 400 }}>
                        km
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Records Statistics */}
              <Grid item xs={12} sm={6}>
                <Card sx={statCardSx}>
                  <CardContent sx={statCardContentSx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <RadiationIcon sx={{ color: 'inherit', fontSize: 18 }} />
                      <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 600, fontSize: 12, letterSpacing: 0.4 }}>
                        DOSIS MÍNIMA
                      </Typography>
                    </Box>
                    <Typography className="statNumber" variant="h2" sx={{}}>
                      {globalStats.records.lowest_dose_rate != null ? globalStats.records.lowest_dose_rate.toFixed(3) : '—'}
                      <Typography className="statUnit" component="span" variant="body2" sx={{ ml: 1, fontWeight: 400 }}>
                        µSv/h
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={statCardSx}>
                  <CardContent sx={statCardContentSx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <SpeedIcon sx={{ color: 'inherit', fontSize: 18 }} />
                      <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 600, fontSize: 12, letterSpacing: 0.4 }}>
                        MÁXIMO MEDICIONES
                      </Typography>
                    </Box>
                    <Typography className="statNumber" variant="h2" sx={{}}>
                      {globalStats.records.most_measurements_track.toLocaleString()}
                      <Typography className="statUnit" component="span" variant="body2" sx={{ ml: 1, fontWeight: 400 }}>
                        en un track
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Geographic Coverage */}
              <Grid item xs={12} sm={6}>
                <Card sx={statCardSx}>
                  <CardContent sx={statCardContentSx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PlaceIcon sx={{ color: 'inherit', fontSize: 18 }} />
                      <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 600, fontSize: 12, letterSpacing: 0.4 }}>
                        LATITUD MÍNIMA
                      </Typography>
                    </Box>
                    <Typography className="statNumber" variant="h2" sx={{}}>
                      {globalStats.geographic.bbox.min_lat.toFixed(4)}°
                      <Typography className="statUnit" component="span" variant="body2" sx={{ ml: 1, fontWeight: 400 }}>
                        sur
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={statCardSx}>
                  <CardContent sx={statCardContentSx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PlaceIcon sx={{ color: 'inherit', fontSize: 18 }} />
                      <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 600, fontSize: 12, letterSpacing: 0.4 }}>
                        LATITUD MÁXIMA
                      </Typography>
                    </Box>
                    <Typography className="statNumber" variant="h2" sx={{}}>
                      {globalStats.geographic.bbox.max_lat.toFixed(4)}°
                      <Typography className="statUnit" component="span" variant="body2" sx={{ ml: 1, fontWeight: 400 }}>
                        norte
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={statCardSx}>
                  <CardContent sx={statCardContentSx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PlaceIcon sx={{ color: 'inherit', fontSize: 18 }} />
                      <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 600, fontSize: 12, letterSpacing: 0.4 }}>
                        LONGITUD MÍNIMA
                      </Typography>
                    </Box>
                    <Typography className="statNumber" variant="h2" sx={{}}>
                      {globalStats.geographic.bbox.min_lon.toFixed(4)}°
                      <Typography className="statUnit" component="span" variant="body2" sx={{ ml: 1, fontWeight: 400 }}>
                        oeste
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={statCardSx}>
                  <CardContent sx={statCardContentSx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PlaceIcon sx={{ color: 'inherit', fontSize: 18 }} />
                      <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 600, fontSize: 12, letterSpacing: 0.4 }}>
                        LONGITUD MÁXIMA
                      </Typography>
                    </Box>
                    <Typography className="statNumber" variant="h2" sx={{}}>
                      {globalStats.geographic.bbox.max_lon.toFixed(4)}°
                      <Typography className="statUnit" component="span" variant="body2" sx={{ ml: 1, fontWeight: 400 }}>
                        este
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Fun Facts */}
              <Grid item xs={12} sm={6}>
                <Card sx={statCardSx}>
                  <CardContent sx={statCardContentSx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PublicIcon sx={{ color: 'inherit', fontSize: 18 }} />
                      <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 600, fontSize: 12, letterSpacing: 0.4 }}>
                        VUELTAS A LA TIERRA
                      </Typography>
                    </Box>
                    <Typography className="statNumber" variant="h2" sx={{}}>
                      {globalStats.fun_facts.earth_circumferences.toFixed(4)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={statCardSx}>
                  <CardContent sx={statCardContentSx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <TrophyIcon sx={{ color: 'inherit', fontSize: 18 }} />
                      <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 600, fontSize: 12, letterSpacing: 0.4 }}>
                        MARATONES
                      </Typography>
                    </Box>
                    <Typography className="statNumber" variant="h2" sx={{}}>
                      {globalStats.fun_facts.marathon_equivalents.toFixed(1)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Date Range */}
              <Grid item xs={12}>
                <Card sx={statCardSx}>
                  <CardContent sx={statCardContentSx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <ClockIcon sx={{ color: 'inherit', fontSize: 18 }} />
                      <Typography variant="subtitle2" sx={{ color: 'inherit', fontWeight: 600, fontSize: 12, letterSpacing: 0.4 }}>
                        PERÍODO DE DATOS
                      </Typography>
                    </Box>
                    <Typography className="statValue" variant="h4" fontWeight="700" sx={{ mt: 1, letterSpacing: -0.5 }}>
                      {formatDate(globalStats.date_range.first)} - {formatDate(globalStats.date_range.last)}
                      <Typography className="statUnit" component="span" variant="body2" sx={{ ml: 2, fontWeight: 400 }}>
                        ({globalStats.date_range.days_active} {globalStats.date_range.days_active === 1 ? 'día' : 'días'} activo{globalStats.date_range.days_active > 1 ? 's' : ''})
                      </Typography>
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
            )}
          </Grid>
          {/* RIGHT COLUMN - Map */}
          <Grid item xs={12} lg={6}>
            {heatmapStats && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, px: 1 }}>
                  <PublicIcon sx={{ color: '#000000', fontSize: 18 }} />
                  <Typography variant="subtitle2" sx={{ color: '#000000', fontWeight: 600, fontSize: 12, letterSpacing: 0.4 }}>
                    MAPA
                  </Typography>
                </Box>
                <Box sx={{
                  bgcolor: '#000000',
                  borderRadius: 3,
                  p: 3,
                  boxShadow: 'none',
                }}>
                <Box sx={{ 
                  position: 'relative', 
                  height: 520, 
                  width: '100%',
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: 'none',
                  mb: 0,
                  bgcolor: `rgb(${BACKGROUND_COLOR.join(',')})`,
                }}>
                <DeckGL
                  views={new GlobeView({ 
                    resolution: GLOBE_RESOLUTION
                  })}
                  initialViewState={{
                    longitude: 0,
                    latitude: 20,
                    zoom: 1
                  }}
                  controller={true}
                  layers={heatmapLayer ? [...backgroundLayers, heatmapLayer] : backgroundLayers}
                />
                {hoveredHex && (
                  <Box sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'rgba(0,0,0,0.85)', p: 2, borderRadius: 1, boxShadow: 2 }}>
                    <Typography variant="body2" sx={{ color: '#ffffff' }}>Medidas: {hoveredHex.count}</Typography>
                    <Typography variant="body2" sx={{ color: '#ffffff' }}>Dosis promedio: {hoveredHex.avg_dose_rate.toFixed(3)} µSv/h</Typography>
                  </Box>
                )}
              </Box>
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
