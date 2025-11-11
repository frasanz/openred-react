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
      background: '#ffffff',
      py: 4
    }}>
      <Container maxWidth="xl">
        {/* Modern Header */}
        <Box sx={{
          textAlign: 'center',
          mb: 6,
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: -20,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 100,
            height: 4,
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            borderRadius: 2,
          }
        }}>
          <Typography
            variant="h2"
            component="h1"
            fontWeight="800"
            sx={{
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 70%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
              letterSpacing: -1
            }}
          >
            Estadísticas del Proyecto
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              maxWidth: 600,
              mx: 'auto',
              fontWeight: 400,
              lineHeight: 1.6
            }}
          >
            Descubre el impacto y alcance de la comunidad OpenRed a través de datos detallados
          </Typography>
        </Box>

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
                    <Card sx={{
                      boxShadow: 'none',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                      borderRadius: 3,
                      bgcolor: 'background.paper',
                      p: 0,
                      minHeight: 120,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <TimelineIcon sx={{ mr: 1, color: 'primary.main', fontSize: 22 }} />
                          <Typography variant="overline" color="primary" fontWeight="bold" fontSize={13}>
                            TOTAL MEDICIONES
                          </Typography>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ letterSpacing: -1 }}>
                          {globalStats.totals.measurements.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{
                      boxShadow: 'none',
                      border: `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
                      borderRadius: 3,
                      bgcolor: 'background.paper',
                      p: 0,
                      minHeight: 120,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <RouteIcon sx={{ mr: 1, color: 'success.main', fontSize: 22 }} />
                          <Typography variant="overline" color="success.main" fontWeight="bold" fontSize={13}>
                            TRACKS REGISTRADOS
                          </Typography>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ letterSpacing: -1 }}>
                          {globalStats.totals.tracks}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{
                      boxShadow: 'none',
                      border: `1px solid ${alpha(theme.palette.warning.main, 0.12)}`,
                      borderRadius: 3,
                      bgcolor: 'background.paper',
                      p: 0,
                      minHeight: 120,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <RadiationIcon sx={{ mr: 1, color: 'warning.main', fontSize: 22 }} />
                          <Typography variant="overline" color="warning.main" fontWeight="bold" fontSize={13}>
                            DOSIS MÁXIMA
                          </Typography>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" color="warning.main" sx={{ letterSpacing: -1 }}>
                          {globalStats.records.highest_dose_rate.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontSize={12}>
                          µSv/h
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{
                      boxShadow: 'none',
                      border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
                      borderRadius: 3,
                      bgcolor: 'background.paper',
                      p: 0,
                      minHeight: 120,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}>
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PublicIcon sx={{ mr: 1, color: 'info.main', fontSize: 22 }} />
                          <Typography variant="overline" color="info.main" fontWeight="bold" fontSize={13}>
                            CONTRIBUIDORES
                          </Typography>
                        </Box>
                        <Typography variant="h4" fontWeight="bold" color="info.main" sx={{ letterSpacing: -1 }}>
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
                <Card sx={{
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  p: 0,
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <RouteIcon sx={{ mr: 1, color: 'primary.main', fontSize: 22 }} />
                      <Typography variant="overline" color="primary" fontWeight="bold" fontSize={13}>
                        DISTANCIA TOTAL
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ letterSpacing: -1 }}>
                      {globalStats.distance.total_km.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize={12}>
                      km recorridos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={{
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  p: 0,
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TrophyIcon sx={{ mr: 1, color: 'success.main', fontSize: 22 }} />
                      <Typography variant="overline" color="success.main" fontWeight="bold" fontSize={13}>
                        TRACK MÁS LARGO
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ letterSpacing: -1 }}>
                      {globalStats.distance.longest_track_km.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize={12}>
                      km en un track
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Records Statistics */}
              <Grid item xs={12} sm={6}>
                <Card sx={{
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.error.main, 0.12)}`,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  p: 0,
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <RadiationIcon sx={{ mr: 1, color: 'error.main', fontSize: 22 }} />
                      <Typography variant="overline" color="error" fontWeight="bold" fontSize={13}>
                        DOSIS MÍNIMA
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="error.main" sx={{ letterSpacing: -1 }}>
                      {globalStats.records.lowest_dose_rate.toFixed(3)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize={12}>
                      µSv/h
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={{
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.12)}`,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  p: 0,
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <SpeedIcon sx={{ mr: 1, color: 'warning.main', fontSize: 22 }} />
                      <Typography variant="overline" color="warning.main" fontWeight="bold" fontSize={13}>
                        MÁXIMO MEDICIONES
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="warning.main" sx={{ letterSpacing: -1 }}>
                      {globalStats.records.most_measurements_track.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize={12}>
                      en un solo track
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Geographic Coverage */}
              <Grid item xs={12} sm={6}>
                <Card sx={{
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  p: 0,
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PlaceIcon sx={{ mr: 1, color: 'info.main', fontSize: 22 }} />
                      <Typography variant="overline" color="info.main" fontWeight="bold" fontSize={13}>
                        LATITUD MÍNIMA
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="info.main" sx={{ letterSpacing: -1 }}>
                      {globalStats.geographic.bbox.min_lat.toFixed(4)}°
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize={12}>
                      coordenada sur
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={{
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  p: 0,
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PlaceIcon sx={{ mr: 1, color: 'info.main', fontSize: 22 }} />
                      <Typography variant="overline" color="info.main" fontWeight="bold" fontSize={13}>
                        LATITUD MÁXIMA
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="info.main" sx={{ letterSpacing: -1 }}>
                      {globalStats.geographic.bbox.max_lat.toFixed(4)}°
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize={12}>
                      coordenada norte
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={{
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  p: 0,
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PlaceIcon sx={{ mr: 1, color: 'info.main', fontSize: 22 }} />
                      <Typography variant="overline" color="info.main" fontWeight="bold" fontSize={13}>
                        LONGITUD MÍNIMA
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="info.main" sx={{ letterSpacing: -1 }}>
                      {globalStats.geographic.bbox.min_lon.toFixed(4)}°
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize={12}>
                      coordenada oeste
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={{
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  p: 0,
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PlaceIcon sx={{ mr: 1, color: 'info.main', fontSize: 22 }} />
                      <Typography variant="overline" color="info.main" fontWeight="bold" fontSize={13}>
                        LONGITUD MÁXIMA
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="info.main" sx={{ letterSpacing: -1 }}>
                      {globalStats.geographic.bbox.max_lon.toFixed(4)}°
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize={12}>
                      coordenada este
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Fun Facts */}
              <Grid item xs={12} sm={6}>
                <Card sx={{
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.12)}`,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  p: 0,
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <PublicIcon sx={{ mr: 1, color: 'secondary.main', fontSize: 22 }} />
                      <Typography variant="overline" color="secondary" fontWeight="bold" fontSize={13}>
                        VUELTAS A LA TIERRA
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="secondary.main" sx={{ letterSpacing: -1 }}>
                      {globalStats.fun_facts.earth_circumferences.toFixed(4)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize={12}>
                      distancia equivalente
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={{
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  p: 0,
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <TrophyIcon sx={{ mr: 1, color: 'primary.main', fontSize: 22 }} />
                      <Typography variant="overline" color="primary" fontWeight="bold" fontSize={13}>
                        MARATONES
                      </Typography>
                    </Box>
                    <Typography variant="h4" fontWeight="bold" color="primary.main" sx={{ letterSpacing: -1 }}>
                      {globalStats.fun_facts.marathon_equivalents.toFixed(1)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize={12}>
                      distancia recorrida
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Date Range */}
              <Grid item xs={12}>
                <Card sx={{
                  boxShadow: 'none',
                  border: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  p: 0,
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                }}>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <ClockIcon sx={{ mr: 1, color: 'grey.600', fontSize: 22 }} />
                      <Typography variant="overline" color="grey.600" fontWeight="bold" fontSize={13}>
                        PERÍODO DE DATOS
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color="grey.700" sx={{ letterSpacing: -0.5 }}>
                      {formatDate(globalStats.date_range.first)} - {formatDate(globalStats.date_range.last)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontSize={12}>
                      {globalStats.date_range.days_active} {globalStats.date_range.days_active === 1 ? 'día' : 'días'} activo{globalStats.date_range.days_active > 1 ? 's' : ''}
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
              <Paper sx={{ p: 3 }}>
              <Box sx={{ 
                position: 'relative', 
                height: 600, 
                width: '100%',
                borderRadius: 2,
                overflow: 'hidden',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                mb: 2,
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
                  <Box sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'background.paper', p: 2, borderRadius: 1, boxShadow: 1 }}>
                    <Typography variant="body2">Medidas: {hoveredHex.count}</Typography>
                    <Typography variant="body2">Dosis promedio: {hoveredHex.avg_dose_rate.toFixed(3)} µSv/h</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          )}
        </Grid>
      </Grid>
      </Container>
    </Box>
  );
};

export default StatisticsPage;
