import React, { useState, useMemo, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl';
import './MapComponent.css';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FilterListIcon from '@mui/icons-material/FilterList';
import { Measurement, Campaign, MapFilters, Project, AdaptiveFilters, CommonFilters, RadiationFilters, LightPollutionFilters } from '../types';
import FiltersPanelMD3 from './FiltersPanelMD3';
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
  pitch: 0,
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
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [viewState, setViewState] = useState<ViewState>(INITIAL_VIEW_STATE);

  const [hoveredObject, setHoveredObject] = useState<HoveredObject | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  // Por defecto colapsado en móvil, expandido en desktop
  const [filtersCollapsed, setFiltersCollapsed] = useState<boolean>(isMobile);
  
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

  const getRadiationColor = useCallback((value: number): [number, number, number] => {
    // value ya viene en µSv/h desde el backend (dividido por 100)
    // Escala de colores:
    // 0-0.10 µSv/h: Verde (normal/bajo)
    // 0.10-0.20 µSv/h: Amarillo a Naranja (moderado a elevado)
    // 0.20-0.50 µSv/h: Rojo (alto)
    // 0.50+ µSv/h: Morado (muy alto)
    
    if (value < 0.10) {
      // Verde (0-0.10 µSv/h) - verde más intenso a medida que sube
      const t = value / 0.10;
      const red = 0;
      const green = Math.round(180 + t * 75); // 180 a 255
      const blue = 0;
      return [red, green, blue];
    } else if (value < 0.20) {
      // Verde a Amarillo a Naranja (0.10-0.20 µSv/h)
      const t = (value - 0.10) / 0.10;
      if (t < 0.5) {
        // Verde a Amarillo (0.10-0.15 µSv/h)
        const t2 = t * 2;
        const red = Math.round(0 + t2 * 255);
        const green = 255;
        const blue = 0;
        return [red, green, blue];
      } else {
        // Amarillo a Naranja (0.15-0.20 µSv/h)
        const t2 = (t - 0.5) * 2;
        const red = 255;
        const green = Math.round(255 - t2 * 90); // 255 a 165
        const blue = 0;
        return [red, green, blue];
      }
    } else if (value < 0.50) {
      // Naranja a Rojo a Morado (0.20-0.50 µSv/h)
      const t = (value - 0.20) / 0.30;
      if (t < 0.3) {
        // Naranja a Rojo (0.20-0.29 µSv/h)
        const t2 = t / 0.3;
        const red = 255;
        const green = Math.round(165 - t2 * 165); // 165 a 0
        const blue = 0;
        return [red, green, blue];
      } else {
        // Rojo a Morado (0.29-0.50 µSv/h)
        const t2 = (t - 0.3) / 0.7;
        const red = Math.round(255 - t2 * 105); // 255 a 150
        const green = 0;
        const blue = Math.round(0 + t2 * 200); // 0 a 200
        return [red, green, blue];
      }
    } else {
      // Morado intenso (0.50+ µSv/h)
      return [150, 0, 200];
    }
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
      <div
        style={{
          position: 'absolute',
          zIndex: 1000,
          pointerEvents: 'none',
          left: x,
          top: y,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '280px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
      >
        {hoveredObject.measurement && (
          <>
            <div><strong>Medición Individual</strong></div>
            {'dose_rate' in hoveredObject.measurement && hoveredObject.measurement.dose_rate !== undefined ? (
              <div><strong>Radiación:</strong> {hoveredObject.measurement.dose_rate.toFixed(2)} µSv/h</div>
            ) : (
              <div><strong>Valor:</strong> {getMeasurementValue(hoveredObject.measurement).toFixed(2)} {getMeasurementUnit(hoveredObject.measurement)}</div>
            )}
            <div><strong>Ubicación:</strong> ({Number(hoveredObject.measurement.latitude).toFixed(4)}, {Number(hoveredObject.measurement.longitude).toFixed(4)})</div>
            <div><strong>Fecha:</strong> {formatDate(new Date(hoveredObject.measurement.dateTime), 'dd/MM/yyyy HH:mm')}</div>
            {hoveredObject.measurement.altitude && <div><strong>Altitud:</strong> {hoveredObject.measurement.altitude}m</div>}
            {hoveredObject.measurement.notes && <div style={{ marginTop: '4px', fontStyle: 'italic' }}>{hoveredObject.measurement.notes}</div>}
          </>
        )}
        {hoveredObject.hexagon && (
          <>
            <div><strong>Cluster de Mediciones</strong></div>
            <div><strong>Cantidad:</strong> {hoveredObject.count || 0} mediciones</div>
            <div><strong>Radiación promedio:</strong> {(hoveredObject.avgRadiation || 0).toFixed(2)} µSv/h</div>
            {(hoveredObject.count || 0) > 1 && (
              <div><strong>Densidad:</strong> {hoveredObject.count || 0} mediciones en esta área</div>
            )}
            <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.8 }}>
              🏗️ Altura = cantidad | Color = radiación promedio<br/>
              💡 Haz zoom (≥16) para ver mediciones individuales
            </div>
          </>
        )}
        {hoveredObject.screenGrid && (
          <>
            <div><strong>Cuadrícula de Datos</strong></div>
            <div><strong>Mediciones:</strong> {hoveredObject.count || 0}</div>
            <div><strong>Valor total:</strong> {(hoveredObject.totalWeight || 0).toFixed(2)} (unidad variable)</div>
            <div><strong>Valor promedio:</strong> {((hoveredObject.totalWeight || 0) / (hoveredObject.count || 1)).toFixed(2)} (unidad variable)</div>
            <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.8 }}>
              📊 Agregación por píxeles de pantalla
            </div>
          </>
        )}
      </div>
    );
  }, [hoveredObject, hoverInfo, getMeasurementValue, getMeasurementUnit]);

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex',
      flexDirection: 'row', // Siempre en fila (lateral)
      position: 'relative'
    }}>
      {/* Backdrop en móvil cuando el panel está abierto */}
      {!filtersCollapsed && isMobile && (
        <Box
          onClick={() => setFiltersCollapsed(true)}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1099,
            transition: 'opacity 0.3s ease-in-out'
          }}
        />
      )}

      {/* Panel lateral izquierdo con filtros */}
      <Box 
        sx={{ 
          width: filtersCollapsed ? 0 : { xs: '85vw', md: 400 }, // En móvil ocupa 85% del ancho
          height: '100vh',
          backgroundColor: '#f8fafc',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.3s ease-in-out',
          position: { xs: 'absolute', md: 'relative' }, // Flotante en móvil, relativo en desktop
          zIndex: { xs: 1100, md: 'auto' }, // Alto z-index en móvil para flotar sobre el mapa
          boxShadow: { xs: filtersCollapsed ? 'none' : '2px 0 8px rgba(0,0,0,0.15)', md: 'none' }
        }}
      >
        {!filtersCollapsed && (
          <>
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
                  display: { xs: 'none', md: 'block' } // Ocultar en móvil
                }}
              >
                <ChevronLeftIcon />
              </IconButton>
            </Box>

            {/* Contenido del panel */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
              <FiltersPanelMD3 
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
          </>
        )}
      </Box>

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

      {/* Mapa principal */}
      <Box sx={{ 
        flexGrow: 1, 
        position: 'relative',
        height: '100vh',
        width: '100%'
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
            />
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
          
          {/* Leyenda de colores */}
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
            <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1, color: '#1a202c', fontSize: { xs: '10px', md: '12px' } }}>
              Tasa de dosis (µSv/h)
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 24, 
                  height: 16, 
                  background: 'linear-gradient(to right, rgb(0,180,0), rgb(0,255,0))',
                  borderRadius: '2px',
                  border: '1px solid rgba(0,0,0,0.1)'
                }} />
                <Typography variant="caption" sx={{ fontSize: '11px' }}>0-0.10 (Bajo)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 24, 
                  height: 16, 
                  background: 'linear-gradient(to right, rgb(0,255,0), rgb(255,255,0))',
                  borderRadius: '2px',
                  border: '1px solid rgba(0,0,0,0.1)'
                }} />
                <Typography variant="caption" sx={{ fontSize: '11px' }}>0.10-0.15</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 24, 
                  height: 16, 
                  background: 'linear-gradient(to right, rgb(255,255,0), rgb(255,165,0))',
                  borderRadius: '2px',
                  border: '1px solid rgba(0,0,0,0.1)'
                }} />
                <Typography variant="caption" sx={{ fontSize: '11px' }}>0.15-0.20</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 24, 
                  height: 16, 
                  background: 'linear-gradient(to right, rgb(255,165,0), rgb(255,0,0))',
                  borderRadius: '2px',
                  border: '1px solid rgba(0,0,0,0.1)'
                }} />
                <Typography variant="caption" sx={{ fontSize: '11px' }}>0.20-0.29</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 24, 
                  height: 16, 
                  background: 'linear-gradient(to right, rgb(255,0,0), rgb(150,0,200))',
                  borderRadius: '2px',
                  border: '1px solid rgba(0,0,0,0.1)'
                }} />
                <Typography variant="caption" sx={{ fontSize: '11px' }}>0.29-0.50</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ 
                  width: 24, 
                  height: 16, 
                  backgroundColor: 'rgb(150,0,200)',
                  borderRadius: '2px',
                  border: '1px solid rgba(0,0,0,0.1)'
                }} />
                <Typography variant="caption" sx={{ fontSize: '11px' }}>0.50+ (Alto)</Typography>
              </Box>
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
