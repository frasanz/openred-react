import React, { useState, useMemo, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { Map, Source, Layer } from 'react-map-gl';
import './MapComponent.css';
import { getRadiationColor, RADIATION_LEGEND } from '../utils/radiationColors';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  useMediaQuery,
  useTheme,
  Drawer,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FilterListIcon from '@mui/icons-material/FilterList';
import { Measurement, Campaign, MapFilters, Project, AdaptiveFilters, CommonFilters, RadiationFilters, LightPollutionFilters } from '../types';
import FiltersPanel from './FiltersPanel';
import { Mission } from '../types';

// Helper function to format dates without date-fns
const formatDate = (date: Date, format: string): string => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  
  switch (format) {
    case 'dd/MM/yyyy HH:mm':
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    case 'dd MMM yyyy':
      return `${day} ${monthNames[d.getMonth()]} ${year}`;
    case 'dd/MM/yy':
      return `${day}/${month}/${year.toString().slice(-2)}`;
    default:
      return d.toLocaleDateString('es-ES');
  }
};

// Mapbox token - verificar si es válido
const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';
const isValidMapboxToken = MAPBOX_ACCESS_TOKEN && 
  MAPBOX_ACCESS_TOKEN.startsWith('pk.') && 
  !MAPBOX_ACCESS_TOKEN.includes('example_token_here');

// Configuración inicial del mapa - España completa incluyendo Canarias
const INITIAL_VIEW_STATE = {
  longitude: -5.5,  // Centro de España (incluyendo Canarias)
  latitude: 36.5,   // Centro de España (incluyendo Canarias) 
  zoom: 5.5,        // Zoom para mostrar toda España y Canarias
  pitch: 45,        // Inclinación de la cámara (0-60)
  bearing: 0
};

interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

interface HoveredObject {
  measurement?: Measurement;
  hexagon?: {
    points: Array<{ radiation: number }>;
    [key: string]: any;
  };
  screenGrid?: {
    [key: string]: any;
  };
  count?: number;
  avgRadiation?: number;
  totalWeight?: number;
}

interface HoverInfo {
  x: number;
  y: number;
}

interface MapComponentProps {
  measurements: Measurement[];
  campaigns: Campaign[];
  loading?: boolean;
  selectedProject?: Project | null;
  onProjectChange?: (project: Project) => void;
  
  // Props para filtros adaptativos (solo rango temporal)
  adaptiveFilters?: AdaptiveFilters;
  onCommonFiltersChange?: (filters: Partial<CommonFilters>) => void;
  
  // Props para filtros de misión y campaña
  missions?: Mission[];
  selectedMission?: number;
  selectedCampaign?: number;
  loadingCampaigns?: boolean;
  onMissionChange?: (missionId: number | undefined) => void;
  onCampaignChange?: (campaignId: number | undefined) => void;
  
  // Props para datos H3 y zoom
  h3Data?: any[];
  h3Resolution?: number;
  isUsingH3?: boolean;
  onZoomChange?: (zoom: number) => void;
  totalMeasurements?: number;
  statistics?: {
    global_avg: number;
    global_min: number;
    global_max: number;
    global_std?: number;
  };
}

const MapComponent: React.FC<MapComponentProps> = ({
  measurements,
  campaigns,
  loading = false,
  selectedProject = null,
  onProjectChange,
  
  // Props para filtros adaptativos (solo rango temporal)
  adaptiveFilters,
  onCommonFiltersChange,
  
  // Props para filtros de misión y campaña
  missions = [],
  selectedMission,
  selectedCampaign,
  loadingCampaigns = false,
  onMissionChange,
  onCampaignChange,
  
  // Props para datos H3 y zoom
  h3Data = [],
  h3Resolution,
  isUsingH3 = false,
  onZoomChange,
  totalMeasurements,
  statistics,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);

  const [hoveredObject, setHoveredObject] = useState<HoveredObject | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  // Por defecto colapsado en móvil, expandido en desktop
  const [filtersCollapsed, setFiltersCollapsed] = useState<boolean>(isMobile);
  // Estado para la capa MARNA
  const [showMarnaLayer, setShowMarnaLayer] = useState<boolean>(false);
  
  // Ref para guardar el último nivel de zoom notificado al padre
  const lastNotifiedZoomLevel = React.useRef<number>(Math.round(INITIAL_VIEW_STATE.zoom));

  // Ya no necesitamos filtrar mediciones, usamos solo H3
  const filteredMeasurements = measurements;

  // Función para obtener el valor de medición independientemente del tipo
  const getMeasurementValue = useCallback((measurement: Measurement): number => {
    if ('dose_rate' in measurement) {
      return measurement.dose_rate;
    } else if ('sky_brightness' in measurement) {
      return measurement.sky_brightness;
    }
    return 0; // Fallback
  }, []);

  // Función para obtener la unidad de medición
  const getMeasurementUnit = useCallback((measurement: Measurement): string => {
    if ('radiation_unit' in measurement) {
      return measurement.radiation_unit;
    } else if ('brightness_unit' in measurement) {
      return measurement.brightness_unit;
    }
    return '';
  }, []);

  const handleFiltersToggle = useCallback((collapsed: boolean) => {
    setFiltersCollapsed(collapsed);
  }, []);

  // Crear capas: H3 hexágonos o puntos individuales según zoom
  const layers = useMemo(() => {
    console.log('🔍 Layer rendering - isUsingH3:', isUsingH3, 'h3Data length:', h3Data.length, 'measurements:', measurements.length);
    
    if (isUsingH3 && h3Data.length > 0) {
      console.log('📐 Rendering H3 hexagons:', h3Data.length);
      
      // Calcular elevationScale basado en el zoom (inversamente proporcional)
      // Zoom bajo (5) = hexágonos altos, Zoom alto (15) = hexágonos bajos
      const currentZoom = viewState.zoom;
      const elevationScale = Math.max(1, 20 / (2*currentZoom)); // 50/5=10, 50/10=5, 50/15=3.33
      
      console.log(`🎚️ Zoom: ${currentZoom.toFixed(1)}, elevationScale: ${elevationScale.toFixed(2)}`);
      
      return [
        new H3HexagonLayer({
          id: 'h3-hexagon-layer',
          data: h3Data,
          pickable: true,
          wireframe: false,
          filled: true,
          extruded: true,
          elevationScale: elevationScale,
          getHexagon: (d: any) => d.h3_index,
          getFillColor: (d: any) => {
            const value = d.avg_value || 0;
            // avg_value ya viene en µSv/h desde el backend
            return getRadiationColor(value);
          },
          getElevation: (d: any) => d.measurement_count * 5,
          opacity: 0.8,
          onHover: (info: any) => {
            if (info.object) {
              setHoveredObject({ 
                hexagon: info.object,
                count: info.object.measurement_count,
                avgRadiation: info.object.avg_value
              });
              setHoverInfo({ x: info.x, y: info.y });
            } else {
              setHoveredObject(null);
              setHoverInfo(null);
            }
            return false;
          }
        })
      ];
    } else if (!isUsingH3 && measurements.length > 0) {
      // Zoom >= 16: Renderizar puntos individuales
      console.log('📍 Rendering individual points:', measurements.length);
      
      return [
        new ScatterplotLayer({
          id: 'measurements-points-layer',
          data: measurements,
          pickable: true,
          opacity: 0.8,
          stroked: false,
          filled: true,
          radiusScale: 1,
          radiusMinPixels: 6,
          radiusMaxPixels: 6,
          lineWidthMinPixels: 0,
          getPosition: (d: Measurement) => {
            const lng = typeof d.longitude === 'number' ? d.longitude : parseFloat(d.longitude as string);
            const lat = typeof d.latitude === 'number' ? d.latitude : parseFloat(d.latitude as string);
            return [lng, lat];
          },
          getRadius: 6,
          getFillColor: (d: Measurement) => {
            // Usar color basado en dose_rate para mediciones de radiación
            if ('dose_rate' in d && d.dose_rate !== undefined) {
              const color = getRadiationColor(d.dose_rate);
              return [color[0], color[1], color[2], 200];
            }
            // Color por defecto (naranja)
            return [255, 140, 0, 200];
          },
          onHover: (info: any) => {
            if (info.object) {
              setHoveredObject({ 
                measurement: info.object
              });
              setHoverInfo({ x: info.x, y: info.y });
            } else {
              setHoveredObject(null);
              setHoverInfo(null);
            }
            return false;
          }
        })
      ];
    }

    return [];
  }, [isUsingH3, h3Data, measurements, viewState.zoom]); // Agregado viewState.zoom para recalcular elevación

  // Renderizar tooltip memoizado
  const renderTooltip = useCallback(() => {
    if (!hoveredObject || !hoverInfo) return null;

    const { x, y } = hoverInfo;

    return (
      <Paper
        elevation={3}
        sx={{
          position: 'absolute',
          zIndex: 1000,
          pointerEvents: 'none',
          left: x,
          top: y,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '12px 16px',
          borderRadius: 2,
          maxWidth: '280px',
        }}
      >
        {hoveredObject.measurement && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Medición Individual
            </Typography>
            {'dose_rate' in hoveredObject.measurement && hoveredObject.measurement.dose_rate !== undefined ? (
              <Typography variant="caption" component="div" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                ☢️ {hoveredObject.measurement.dose_rate.toFixed(2)} µSv/h
              </Typography>
            ) : (
              <Typography variant="caption" component="div">
                {getMeasurementValue(hoveredObject.measurement).toFixed(2)} {getMeasurementUnit(hoveredObject.measurement)}
              </Typography>
            )}
            {'speed' in hoveredObject.measurement && hoveredObject.measurement.speed !== undefined && hoveredObject.measurement.speed !== null && (
              <Typography variant="caption" component="div" sx={{ color: 'primary.main' }}>
                🚀 {(hoveredObject.measurement.speed * 3.6).toFixed(2)} km/h
              </Typography>
            )}
            {'count_rate' in hoveredObject.measurement && hoveredObject.measurement.count_rate && (
              <Typography variant="caption" component="div" sx={{ color: 'info.main' }}>
                📊 {hoveredObject.measurement.count_rate.toFixed(2)} CPM
              </Typography>
            )}
            <Typography variant="caption" component="div">
              📍 Lat: {Number(hoveredObject.measurement.latitude).toFixed(6)}
            </Typography>
            <Typography variant="caption" component="div">
              📍 Lng: {Number(hoveredObject.measurement.longitude).toFixed(6)}
            </Typography>
            {hoveredObject.measurement.altitude && (
              <Typography variant="caption" component="div">
                ⛰️ {hoveredObject.measurement.altitude}m
              </Typography>
            )}
            <Typography variant="caption" component="div" color="text.secondary">
              🕐 {formatDate(new Date(hoveredObject.measurement.dateTime), 'dd/MM/yyyy HH:mm')}
            </Typography>
            
            {/* Datos del tiempo */}
            {hoveredObject.measurement.weather_cache && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                  ☁️ Condiciones Meteorológicas
                </Typography>
                {hoveredObject.measurement.weather_cache.temperature != null && (
                  <Typography variant="caption" component="div">
                    🌡️ {hoveredObject.measurement.weather_cache.temperature.toFixed(1)}°C
                  </Typography>
                )}
                {hoveredObject.measurement.weather_cache.humidity != null && (
                  <Typography variant="caption" component="div">
                    💧 Humedad: {hoveredObject.measurement.weather_cache.humidity.toFixed(0)}%
                  </Typography>
                )}
                {hoveredObject.measurement.weather_cache.pressure != null && (
                  <Typography variant="caption" component="div">
                    🔽 Presión: {hoveredObject.measurement.weather_cache.pressure.toFixed(1)} hPa
                  </Typography>
                )}
                {hoveredObject.measurement.weather_cache.wind_speed != null && hoveredObject.measurement.weather_cache.wind_direction != null && (
                  <Typography variant="caption" component="div">
                    💨 Viento: {hoveredObject.measurement.weather_cache.wind_speed.toFixed(1)} m/s ({hoveredObject.measurement.weather_cache.wind_direction.toFixed(0)}°)
                  </Typography>
                )}
                {hoveredObject.measurement.weather_cache.cloud_cover != null && (
                  <Typography variant="caption" component="div">
                    ☁️ Nubosidad: {hoveredObject.measurement.weather_cache.cloud_cover.toFixed(0)}%
                  </Typography>
                )}
              </Box>
            )}
            
            {hoveredObject.measurement.notes && (
              <Typography variant="caption" component="div" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                {hoveredObject.measurement.notes}
              </Typography>
            )}
          </>
        )}
        {hoveredObject.hexagon && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Cluster de Mediciones
            </Typography>
            <Typography variant="caption" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              📊 {hoveredObject.count || 0} mediciones
            </Typography>
            <Typography variant="caption" component="div" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
              ☢️ Promedio: {(hoveredObject.avgRadiation || 0).toFixed(3)} µSv/h
            </Typography>
            {hoveredObject.hexagon.min_value !== undefined && (
              <Typography variant="caption" component="div" sx={{ color: 'success.main' }}>
                📉 Mínimo: {hoveredObject.hexagon.min_value.toFixed(3)} µSv/h
              </Typography>
            )}
            {hoveredObject.hexagon.max_value !== undefined && (
              <Typography variant="caption" component="div" sx={{ color: 'error.main' }}>
                📈 Máximo: {hoveredObject.hexagon.max_value.toFixed(3)} µSv/h
              </Typography>
            )}
            {hoveredObject.hexagon.std_value !== undefined && (
              <Typography variant="caption" component="div" sx={{ color: 'info.main' }}>
                📊 Desv. estándar: {hoveredObject.hexagon.std_value.toFixed(3)} µSv/h
              </Typography>
            )}
            <Typography variant="caption" component="div" sx={{ mt: 1, fontSize: '11px', color: 'text.secondary', fontStyle: 'italic' }}>
              💡 Haz zoom (≥16) para ver mediciones individuales
            </Typography>
          </>
        )}
        {hoveredObject.screenGrid && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Cuadrícula de Datos
            </Typography>
            <Typography variant="caption" component="div">
              <strong>Mediciones:</strong> {hoveredObject.count || 0}
            </Typography>
            <Typography variant="caption" component="div">
              <strong>Valor total:</strong> {(hoveredObject.totalWeight || 0).toFixed(2)} (unidad variable)
            </Typography>
            <Typography variant="caption" component="div">
              <strong>Valor promedio:</strong> {((hoveredObject.totalWeight || 0) / (hoveredObject.count || 1)).toFixed(2)} (unidad variable)
            </Typography>
            <Typography variant="caption" component="div" sx={{ mt: 1, fontSize: '11px', opacity: 0.8 }}>
              📊 Agregación por píxeles de pantalla
            </Typography>
          </>
        )}
      </Paper>
    );
  }, [hoveredObject, hoverInfo, getMeasurementValue, getMeasurementUnit]);

  return (
    <Box sx={{ 
      height: '100vh', 
      width: '100%',
      position: 'relative'
    }}>
      {/* Drawer - Panel lateral con filtros */}
      <Drawer
        anchor="left"
        open={!filtersCollapsed}
        onClose={() => setFiltersCollapsed(true)}
        hideBackdrop
        ModalProps={{
          keepMounted: true,
          style: { pointerEvents: 'none' },
        }}
        PaperProps={{
          style: { pointerEvents: 'auto' },
        }}
        sx={{
          zIndex: 1100,
          '& .MuiDrawer-paper': {
            width: { xs: '85vw', md: 400 },
            boxSizing: 'border-box',
            borderRight: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            top: 64,
            height: 'calc(100vh - 64px)',
          },
        }}
      >
        {/* Header del panel con botón para colapsar */}
        <Box 
          sx={{ 
            p: 2,
            backgroundColor: 'white',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}
        >
          <IconButton 
            onClick={() => setFiltersCollapsed(true)}
            size="small"
            sx={{ 
              color: '#64748b',
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Box>

        {/* Contenido del panel */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
          <FiltersPanel 
            measurements={measurements}
            filteredMeasurements={filteredMeasurements}
            selectedProject={selectedProject}
            onProjectChange={onProjectChange}
            
            // Pasar filtros adaptativos (solo rango temporal)
            adaptiveFilters={adaptiveFilters}
            onCommonFiltersChange={onCommonFiltersChange}
            
            // Pasar filtros de misión y campaña
            missions={missions}
            campaigns={campaigns}
            selectedMission={selectedMission}
            selectedCampaign={selectedCampaign}
            loadingCampaigns={loadingCampaigns}
            onMissionChange={onMissionChange}
            onCampaignChange={onCampaignChange}
            
            // Pasar total de mediciones del servidor
            totalMeasurements={totalMeasurements}
          />
        </Box>
      </Drawer>

      {/* Botón para expandir filtros cuando están colapsados */}
      {filtersCollapsed && (
        <Box
          sx={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1000
          }}
        >
          <IconButton
            onClick={() => setFiltersCollapsed(false)}
            sx={{
              backgroundColor: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0',
              '&:hover': {
                backgroundColor: '#f8fafc',
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
              }
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}

      {/* Mapa principal - Siempre ocupa toda la pantalla */}
      <Box sx={{ 
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}>
        {loading && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 20, 
              left: '50%', 
              transform: 'translateX(-50%)', 
              zIndex: 1000,
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: 3,
              p: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <CircularProgress size={20} />
            <Typography variant="body2">Cargando mediciones...</Typography>
          </Box>
        )}
        
        <Paper elevation={0} sx={{ height: '100%', borderRadius: 0, overflow: 'hidden' }}>
          <DeckGL
            initialViewState={INITIAL_VIEW_STATE}
            controller={{
              dragPan: true,
              dragRotate: true, // Permitir rotación del mapa
              scrollZoom: true,
              touchZoom: true,
              touchRotate: true, // Permitir rotación táctil
              keyboard: true,
              doubleClickZoom: true
            }}
            layers={layers}
            onViewStateChange={({viewState: newViewState}: any) => {
              // 🎯 Actualizar estado local solo para debug overlay
              setViewState(newViewState);
              
              // 🎯 Notificar cambios de nivel de zoom con umbral para evitar oscilaciones
              if (onZoomChange) {
                const currentZoomLevel = Math.round(newViewState.zoom);
                const zoomDiff = Math.abs(newViewState.zoom - lastNotifiedZoomLevel.current);
                
                // Solo notificar si cambió el nivel Y la diferencia es >= 0.4
                if (currentZoomLevel !== lastNotifiedZoomLevel.current && zoomDiff >= 0.4) {
                  console.log(`🔍 Zoom level changed: ${lastNotifiedZoomLevel.current} → ${currentZoomLevel}`);
                  lastNotifiedZoomLevel.current = currentZoomLevel;
                  onZoomChange(currentZoomLevel);
                }
              }
            }}
            onLoad={() => console.log('DeckGL loaded successfully')}
            onError={(error) => console.error('DeckGL error:', error)}
          >
            <Map
              mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
              mapStyle="mapbox://styles/mapbox/light-v10"
              reuseMaps
            >
              {showMarnaLayer && (
                <>
                  <Source
                    id="marna-tiles"
                    type="raster"
                    tiles={['https://map.open-red.es/marna_tiles/{z}/{x}/{y}.png']}
                    tileSize={256}
                    scheme="tms"
                  />
                  <Layer
                    id="marna-layer"
                    type="raster"
                    source="marna-tiles"
                    paint={{
                      'raster-opacity': 0.7
                    }}
                  />
                </>
              )}
            </Map>
          </DeckGL>
          
          {/* Debug info overlay */}
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: window.innerWidth < 768 ? '6px' : '10px',
            borderRadius: '8px',
            fontSize: window.innerWidth < 768 ? '10px' : '12px',
            zIndex: 1000,
            fontFamily: 'monospace'
          }}>
            <div>Token: {isValidMapboxToken ? '✅' : '❌'}</div>
            <div>Mode: {isUsingH3 ? '🔷 H3 Aggregation' : '📍 Points'}</div>
            <div>Zoom RAW: {viewState.zoom.toFixed(2)}</div>
            <div>Zoom LEVEL: {Math.round(viewState.zoom)}</div>
            <div>Last Notified: {lastNotifiedZoomLevel.current}</div>
            {isUsingH3 ? (
              <>
                <div style={{ fontWeight: 'bold', color: '#4ade80' }}>H3 Resolution: {h3Resolution !== undefined ? h3Resolution : '?'}</div>
                <div>H3 Hexagons: {h3Data.length}</div>
              </>
            ) : (
              <>
                <div>Measurements: {measurements.length}</div>
                <div>Filtered: {filteredMeasurements.length}</div>
              </>
            )}
            <div>Layers: {layers.length}</div>
          </div>
          
          {/* Control para capa MARNA - Arriba a la derecha */}
          <Box sx={{
            position: 'absolute',
            top: { xs: 10, md: 20 },
            right: { xs: 10, md: 20 },
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            padding: { xs: '12px', md: '16px' },
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: { xs: '140px', md: '180px' }
          }}>
            <FormControlLabel
              sx={{ 
                margin: 0,
                '& .MuiFormControlLabel-label': {
                  paddingLeft: '8px'
                }
              }}
              control={
                <Checkbox
                  checked={showMarnaLayer}
                  onChange={(e) => setShowMarnaLayer(e.target.checked)}
                  size="small"
                  sx={{ padding: 0 }}
                />
              }
              label={
                <Typography variant="caption" sx={{ fontSize: { xs: '10px', md: '12px' }, fontWeight: 'bold', color: '#1a202c' }}>
                  Capa MARNA
                </Typography>
              }
            />
          </Box>
          
          {/* Panel de Estadísticas Globales - Solo visible cuando se usan hexágonos H3 */}
          {isUsingH3 && statistics && (
            <Box sx={{
              position: 'absolute',
              top: { xs: 78, md: 96 },
              right: { xs: 10, md: 20 },
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              padding: { xs: '12px', md: '16px' },
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              zIndex: 1000,
              minWidth: { xs: '140px', md: '180px' }
            }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, color: '#1a202c', fontSize: { xs: '11px', md: '12px' } }}>
                Tasa de dosis:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
                <Typography variant="caption" component="div" sx={{ fontSize: '11px' }}>
                  Media: {statistics.global_avg.toFixed(3)} µSv/h
                </Typography>
                <Typography variant="caption" component="div" sx={{ fontSize: '11px' }}>
                  Máxima: {statistics.global_max.toFixed(3)} µSv/h
                </Typography>
                <Typography variant="caption" component="div" sx={{ fontSize: '11px' }}>
                  Mínima: {statistics.global_min.toFixed(3)} µSv/h
                </Typography>
                {statistics.global_std !== undefined && (
                  <Typography variant="caption" component="div" sx={{ fontSize: '11px' }}>
                    Desv. std: {statistics.global_std.toFixed(3)} µSv/h
                  </Typography>
                )}
              </Box>
            </Box>
          )}
          
          {/* Leyenda de colores */}
          <Box sx={{
            position: 'absolute',
            top: isUsingH3 && statistics ? { xs: 208, md: 242 } : { xs: 78, md: 96 },
            right: { xs: 10, md: 20 },
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            padding: { xs: '12px', md: '16px' },
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            zIndex: 1000,
            minWidth: { xs: '140px', md: '180px' }
          }}>
            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, color: '#1a202c', fontSize: { xs: '10px', md: '12px' } }}>
              Tasa de dosis (µSv/h)
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {RADIATION_LEGEND.map((item, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ 
                    width: 24, 
                    height: 16, 
                    background: item.gradient,
                    borderRadius: '2px',
                    border: '1px solid rgba(0,0,0,0.1)'
                  }} />
                  <Typography variant="caption" sx={{ fontSize: '11px' }}>{item.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
          
          {/* Render tooltip */}
          {renderTooltip()}
        </Paper>
      </Box>

      {/* Alerta si no hay token válido de Mapbox */}
      {!isValidMapboxToken && (
        <Alert 
          severity="warning" 
          sx={{ 
            position: 'absolute',
            bottom: 20,
            left: filtersCollapsed ? 20 : 420,
            maxWidth: 400,
            zIndex: 1000,
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            transition: 'left 0.3s ease-in-out'
          }}
        >
          <Typography variant="body2">
            <strong>Token de Mapbox no configurado</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Para mapas detallados, configura REACT_APP_MAPBOX_TOKEN
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

// Memoizar el componente para evitar re-renders innecesarios
export default React.memo(MapComponent);
