import React, { useState, useMemo, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { Map, Source, Layer } from 'react-map-gl';
import { WebMercatorViewport } from '@deck.gl/core';
import './MapComponent.css';
import { getRadiationColor, RADIATION_LEGEND, getLightPollutionColor, LIGHT_POLLUTION_LEGEND } from '../utils/radiationColors';
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
  Switch,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Measurement, Campaign, Project, AdaptiveFilters, CommonFilters, RadiationFilters, RadiationSpectrumMarker } from '../types';
import { HistogramFetchParams } from '../hooks/useMeasurementsByZoom';
import { useSpectraMarkers } from '../hooks/useSpectraMarkers';
import SpectrumDialog from './SpectrumDialog';
import { OPENRED_NAVY } from '../styles/boxes';
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


interface HoveredObject {
  measurement?: Measurement;
  hexagon?: {
    points: Array<{ radiation: number }>;
    [key: string]: any;
  };
  screenGrid?: {
    [key: string]: any;
  };
  spectrum?: RadiationSpectrumMarker;
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
  onRadiationFiltersChange?: (filters: Partial<RadiationFilters>) => void;

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
  viewBounds?: { north: number; south: number; east: number; west: number };
  onZoomChange?: (zoom: number, bounds?: { north: number; south: number; east: number; west: number }) => void;
  onViewportChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  totalMeasurements?: number;
  histogramFetchParams?: HistogramFetchParams;
  statistics?: {
    global_avg: number;
    global_min: number;
    global_max: number;
    global_std?: number;
  };
}

// --- Estilos compartidos de los tooltips del mapa ---
const TIP_LABEL = '#64748b';
const TIP_VALUE = '#1a202c';

const tipCardSx = {
  position: 'absolute' as const,
  zIndex: 1000,
  pointerEvents: 'none' as const,
  backgroundColor: 'rgba(255,255,255,0.98)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(7,81,164,0.18)',
  borderRadius: '12px',
  boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
  overflow: 'hidden',
  minWidth: 190,
  maxWidth: 300,
  transform: 'translate(14px, 14px)',
};

const tipHeaderSx = {
  bgcolor: OPENRED_NAVY,
  color: '#fff',
  px: 2,
  py: 0.9,
  fontWeight: 700,
  fontSize: '12.5px',
  letterSpacing: '0.3px',
};

const tipBodySx = { px: 2, py: 1.5, display: 'flex', flexDirection: 'column', gap: 0.5 };

const tipSectionSx = {
  mt: 1,
  pt: 1,
  borderTop: '1px solid rgba(0,0,0,0.08)',
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
};

const tipSectionTitleSx = {
  fontSize: '10.5px',
  fontWeight: 700,
  color: OPENRED_NAVY,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.4px',
};

const TipRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
    <Typography sx={{ fontSize: '11.5px', color: TIP_LABEL, whiteSpace: 'nowrap' }}>{label}</Typography>
    <Typography sx={{ fontSize: '11.5px', color: TIP_VALUE, fontWeight: 600, textAlign: 'right' }}>{value}</Typography>
  </Box>
);

const TipHeadline: React.FC<{ value: string; unit: string }> = ({ value, unit }) => (
  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 0.5 }}>
    <Typography sx={{ fontSize: '22px', fontWeight: 700, lineHeight: 1, color: OPENRED_NAVY }}>{value}</Typography>
    <Typography sx={{ fontSize: '12px', color: TIP_LABEL }}>{unit}</Typography>
  </Box>
);

const MapComponent: React.FC<MapComponentProps> = ({
  measurements,
  campaigns,
  loading = false,
  selectedProject = null,
  onProjectChange,
  
  // Props para filtros adaptativos (solo rango temporal)
  adaptiveFilters,
  onCommonFiltersChange,
  onRadiationFiltersChange,

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
  viewBounds,
  onZoomChange,
  onViewportChange,
  totalMeasurements,
  histogramFetchParams,
  statistics,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Ref para zoom en cada frame (no dispara re-render)
  const zoomRef = React.useRef<number>(INITIAL_VIEW_STATE.zoom);
  // Estado solo para el useMemo de layers — solo actualiza al cruzar nivel entero
  const [zoomLevel, setZoomLevel] = useState<number>(Math.round(INITIAL_VIEW_STATE.zoom));

  const [hoveredObject, setHoveredObject] = useState<HoveredObject | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  // Por defecto colapsado en móvil, expandido en desktop
  const [filtersCollapsed, setFiltersCollapsed] = useState<boolean>(isMobile);
  // Estado para la capa MARNA
  const [showMarnaLayer, setShowMarnaLayer] = useState<boolean>(false);
  const [isSatellite, setIsSatellite] = useState<boolean>(false);
  // Estado para la capa de espectros (solo proyectos de radiación)
  const [showSpectra, setShowSpectra] = useState<boolean>(false);
  // Espectro seleccionado (abre el diálogo con el histograma)
  const [selectedSpectrumId, setSelectedSpectrumId] = useState<number | null>(null);

  const isRadiation = selectedProject?.project_type === 'radiation';

  // Marcadores de espectros: se cargan al activar el switch (todos los del proyecto)
  const { spectra } = useSpectraMarkers({
    enabled: showSpectra && isRadiation,
    projectId: selectedProject?.id,
  });

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


  // Crear capas: H3 hexágonos o puntos individuales según zoom (+ espectros opcionales)
  const layers = useMemo(() => {
    console.log('Layer rendering - isUsingH3:', isUsingH3, 'h3Data length:', h3Data.length, 'measurements:', measurements.length);

    const result: any[] = [];

    if (isUsingH3 && h3Data.length > 0) {
      console.log('Rendering H3 hexagons:', h3Data.length);

      // Calcular elevationScale basado en el zoom (inversamente proporcional)
      // Zoom bajo (5) = hexágonos altos, Zoom alto (15) = hexágonos bajos
      const elevationScale = Math.max(1, 20 / (2 * zoomLevel));

      result.push(
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
            // Usar la función de color apropiada según el tipo de proyecto
            if (selectedProject?.project_type === 'light_pollution') {
              return getLightPollutionColor(value);
            } else {
              return getRadiationColor(value);
            }
          },
          getElevation: (d: any) => d.measurement_count * 5,
          opacity: 0.8,
          onHover: (info: any) => {
            if (info.object) {
              console.log('Hexagon data:', info.object);
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
      );
    } else if (!isUsingH3 && measurements.length > 0) {
      // Zoom >= 16: Renderizar puntos individuales
      console.log('Rendering individual points:', measurements.length);

      result.push(
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
            // Usar color según el tipo de proyecto
            if (selectedProject?.project_type === 'light_pollution' && 'lux' in d && d.lux !== undefined) {
              // Para contaminación lumínica, usar lux
              const color = getLightPollutionColor(d.lux as number);
              return [color[0], color[1], color[2], 200];
            } else if ('dose_rate' in d && d.dose_rate !== undefined) {
              // Para radiación, usar dose_rate
              const color = getRadiationColor(d.dose_rate as number);
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
      );
    }

    // Capa de espectros: marcadores azules con borde blanco, por encima del resto.
    // depthTest:false evita que los hexágonos 3D extruidos los oculten con pitch.
    if (showSpectra && spectra.length > 0) {
      result.push(
        new ScatterplotLayer({
          id: 'spectra-markers-layer',
          data: spectra,
          pickable: true,
          stroked: true,
          filled: true,
          billboard: true,
          radiusUnits: 'pixels',
          getRadius: 8,
          radiusMinPixels: 7,
          radiusMaxPixels: 10,
          lineWidthUnits: 'pixels',
          getLineWidth: 2,
          getPosition: (d: RadiationSpectrumMarker) => [Number(d.longitude), Number(d.latitude)],
          getFillColor: [7, 81, 164, 230],   // #0751A4 (azul de marca)
          getLineColor: [255, 255, 255, 255],
          parameters: { depthTest: false },
          onClick: (info: any) => {
            if (info.object) {
              setSelectedSpectrumId(info.object.id);
            }
            return true;
          },
          onHover: (info: any) => {
            if (info.object) {
              setHoveredObject({ spectrum: info.object });
              setHoverInfo({ x: info.x, y: info.y });
            } else {
              setHoveredObject(null);
              setHoverInfo(null);
            }
            return false;
          }
        })
      );
    }

    return result;
  }, [isUsingH3, h3Data, measurements, zoomLevel, selectedProject, showSpectra, spectra]);

  // Renderizar tooltip memoizado
  const renderTooltip = useCallback(() => {
    if (!hoveredObject || !hoverInfo) return null;

    const { x, y } = hoverInfo;
    const m = hoveredObject.measurement;
    const hex = hoveredObject.hexagon;
    const sg = hoveredObject.screenGrid;
    const sp = hoveredObject.spectrum;
    const isLP = selectedProject?.project_type === 'light_pollution';

    return (
      <Paper elevation={0} sx={{ ...tipCardSx, left: x, top: y }}>
        {m && (
          <>
            <Box sx={tipHeaderSx}>Medición</Box>
            <Box sx={tipBodySx}>
              {isLP ? (
                'lux' in m && m.lux != null ? (
                  <TipHeadline value={m.lux.toFixed(4)} unit="lux" />
                ) : null
              ) : 'dose_rate' in m && m.dose_rate !== undefined ? (
                <TipHeadline value={m.dose_rate.toFixed(2)} unit="µSv/h" />
              ) : (
                <TipHeadline value={getMeasurementValue(m).toFixed(2)} unit={getMeasurementUnit(m)} />
              )}

              {isLP && 'cct' in m && m.cct != null && (
                <TipRow label="CCT" value={`${Math.round(m.cct)} K`} />
              )}
              {isLP && 'brightness' in m && m.brightness != null && (
                <TipRow label="Brillo" value={m.brightness.toFixed(2)} />
              )}
              {!isLP && 'count_rate' in m && m.count_rate != null && (
                <TipRow label="Tasa de cuentas" value={`${m.count_rate.toFixed(2)} CPM`} />
              )}
              {'speed' in m && m.speed != null && (
                <TipRow label="Velocidad" value={`${(m.speed * 3.6).toFixed(1)} km/h`} />
              )}
              <TipRow label="Latitud" value={Number(m.latitude).toFixed(6)} />
              <TipRow label="Longitud" value={Number(m.longitude).toFixed(6)} />
              {m.altitude && <TipRow label="Altitud" value={`${Math.round(m.altitude)} m`} />}
              <TipRow label="Fecha" value={formatDate(new Date(m.dateTime), 'dd/MM/yyyy HH:mm')} />

              {m.weather_cache && (
                <Box sx={tipSectionSx}>
                  <Typography sx={tipSectionTitleSx}>Meteorología</Typography>
                  {m.weather_cache.temperature != null && (
                    <TipRow label="Temperatura" value={`${m.weather_cache.temperature.toFixed(1)} °C`} />
                  )}
                  {m.weather_cache.humidity != null && (
                    <TipRow label="Humedad" value={`${m.weather_cache.humidity.toFixed(0)} %`} />
                  )}
                  {m.weather_cache.pressure != null && (
                    <TipRow label="Presión" value={`${m.weather_cache.pressure.toFixed(0)} hPa`} />
                  )}
                  {m.weather_cache.wind_speed != null && m.weather_cache.wind_direction != null && (
                    <TipRow label="Viento" value={`${m.weather_cache.wind_speed.toFixed(1)} m/s (${m.weather_cache.wind_direction.toFixed(0)}°)`} />
                  )}
                  {m.weather_cache.cloud_cover != null && (
                    <TipRow label="Nubosidad" value={`${m.weather_cache.cloud_cover.toFixed(0)} %`} />
                  )}
                </Box>
              )}

              {m.notes && (
                <Typography sx={{ mt: 1, fontSize: '11px', fontStyle: 'italic', color: TIP_LABEL }}>
                  {m.notes}
                </Typography>
              )}
            </Box>
          </>
        )}

        {hex && (
          <>
            <Box sx={tipHeaderSx}>Cluster de mediciones</Box>
            <Box sx={tipBodySx}>
              {isLP ? (
                <TipHeadline value={(hoveredObject.avgRadiation || 0).toFixed(4)} unit="lux (media)" />
              ) : (
                <TipHeadline value={(hoveredObject.avgRadiation || 0).toFixed(3)} unit="µSv/h (media)" />
              )}
              <TipRow label="Mediciones" value={(hoveredObject.count || 0).toLocaleString('es-ES')} />
              {isLP ? (
                <>
                  {hex.min_value !== undefined && <TipRow label="Mínimo" value={`${hex.min_value.toFixed(4)} lux`} />}
                  {hex.max_value !== undefined && <TipRow label="Máximo" value={`${hex.max_value.toFixed(4)} lux`} />}
                  {hex.avg_cct != null && <TipRow label="CCT media" value={`${Math.round(hex.avg_cct)} K`} />}
                  {hex.min_cct != null && <TipRow label="CCT mín." value={`${Math.round(hex.min_cct)} K`} />}
                  {hex.max_cct != null && <TipRow label="CCT máx." value={`${Math.round(hex.max_cct)} K`} />}
                </>
              ) : (
                <>
                  {hex.min_value !== undefined && <TipRow label="Mínimo" value={`${hex.min_value.toFixed(3)} µSv/h`} />}
                  {hex.max_value !== undefined && <TipRow label="Máximo" value={`${hex.max_value.toFixed(3)} µSv/h`} />}
                  {hex.std_value !== undefined && <TipRow label="Desv. estándar" value={`${hex.std_value.toFixed(3)} µSv/h`} />}
                </>
              )}
              <Typography sx={{ mt: 0.75, fontSize: '10.5px', color: TIP_LABEL, fontStyle: 'italic' }}>
                Haz zoom (≥16) para ver mediciones individuales
              </Typography>
            </Box>
          </>
        )}

        {sg && (
          <>
            <Box sx={tipHeaderSx}>Cuadrícula de datos</Box>
            <Box sx={tipBodySx}>
              <TipRow label="Mediciones" value={hoveredObject.count || 0} />
              <TipRow label="Valor total" value={(hoveredObject.totalWeight || 0).toFixed(2)} />
              <TipRow label="Valor promedio" value={((hoveredObject.totalWeight || 0) / (hoveredObject.count || 1)).toFixed(2)} />
            </Box>
          </>
        )}

        {sp && (
          <>
            <Box sx={tipHeaderSx}>Espectro #{sp.id}</Box>
            <Box sx={tipBodySx}>
              <TipRow label="Latitud" value={Number(sp.latitude).toFixed(6)} />
              <TipRow label="Longitud" value={Number(sp.longitude).toFixed(6)} />
              <Typography sx={{ mt: 0.75, fontSize: '10.5px', color: OPENRED_NAVY, fontWeight: 600 }}>
                Haz clic para ver el espectro
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    );
  }, [hoveredObject, hoverInfo, getMeasurementValue, getMeasurementUnit, selectedProject?.project_type]);

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
            border: 'none',
            backgroundColor: '#cddced',
            top: 80,
            height: 'calc(100vh - 80px)',
            borderTopRightRadius: '16px',
            borderBottomRightRadius: 0,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
          },
        }}
      >
        {/* Contenido del panel con botón de colapsar integrado */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 3, position: 'relative' }}>
          {/* Botón para colapsar dentro del drawer */}
          <IconButton 
            onClick={() => setFiltersCollapsed(true)}
            size="small"
            sx={{ 
              position: 'absolute',
              top: 16,
              right: 16,
              color: '#64748b',
              zIndex: 1,
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          
          <Box sx={{ mt: 6 }}>
            <FiltersPanel 
              measurements={measurements}
              filteredMeasurements={filteredMeasurements}
              selectedProject={selectedProject}
              onProjectChange={onProjectChange}
              
              // Pasar filtros adaptativos (solo rango temporal)
              adaptiveFilters={adaptiveFilters}
              onCommonFiltersChange={onCommonFiltersChange}
              onRadiationFiltersChange={onRadiationFiltersChange}

              // Pasar filtros de misión y campaña
              missions={missions}
              campaigns={campaigns}
              selectedMission={selectedMission}
              selectedCampaign={selectedCampaign}
              loadingCampaigns={loadingCampaigns}
              onMissionChange={onMissionChange}
              onCampaignChange={onCampaignChange}
              
              viewBounds={viewBounds}

              // Pasar total de mediciones del servidor
              totalMeasurements={totalMeasurements}
              histogramFetchParams={histogramFetchParams}
            />
          </Box>
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
              backgroundColor: '#cddced',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: 'none',
              '&:hover': {
                backgroundColor: '#b8c9de',
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
              // Actualizar ref sin disparar re-render
              zoomRef.current = newViewState.zoom;

              // Actualizar zoomLevel solo al cruzar un nivel entero (para elevationScale)
              const rounded = Math.round(newViewState.zoom);
              if (rounded !== zoomLevel) {
                setZoomLevel(rounded);
              }

              // Calcular bounds para cualquier cambio de viewport
              try {
                const viewport = new WebMercatorViewport({
                  width: window.innerWidth,
                  height: window.innerHeight,
                  ...newViewState
                });
                
                const nw = viewport.unproject([0, 0]);
                const se = viewport.unproject([viewport.width, viewport.height]);
                
                const bounds = {
                  north: nw[1],
                  south: se[1],
                  west: nw[0],
                  east: se[0]
                };
                
                // Notificar cambios de nivel de zoom con umbral para evitar oscilaciones
                if (onZoomChange) {
                  const currentZoomLevel = Math.round(newViewState.zoom);
                  const zoomDiff = Math.abs(newViewState.zoom - lastNotifiedZoomLevel.current);
                  
                  // Solo notificar si cambió el nivel Y la diferencia es >= 0.4
                  if (currentZoomLevel !== lastNotifiedZoomLevel.current && zoomDiff >= 0.4) {
                    console.log(`Zoom level changed: ${lastNotifiedZoomLevel.current} → ${currentZoomLevel}`);
                    lastNotifiedZoomLevel.current = currentZoomLevel;
                    onZoomChange(currentZoomLevel, bounds);
                  }
                }
                
                // Notificar cambios de viewport (pan/drag) para caché inteligente
                if (onViewportChange) {
                  onViewportChange(bounds);
                }
              } catch (error) {
                console.error('Error calculating bounds:', error);
              }
            }}
            onLoad={() => console.log('DeckGL loaded successfully')}
            onError={(error) => console.error('DeckGL error:', error)}
          >
            <Map
              mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
              mapStyle={isSatellite ? 'mapbox://styles/mapbox/satellite-streets-v12' : 'mapbox://styles/mapbox/light-v10'}
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
          
          {/* Debug info overlay - OCULTO */}
          {false && (
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
              <div>Token: {isValidMapboxToken ? '' : ''}</div>
              <div>Mode: {isUsingH3 ? 'H3 Aggregation' : 'Points'}</div>
              <div>Zoom RAW: {zoomRef.current.toFixed(2)}</div>
              <div>Zoom LEVEL: {zoomLevel}</div>
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
          )}
          
          {/* Control para capa MARNA - Arriba a la derecha - Solo para proyectos de radiación */}
          {selectedProject?.project_type === 'radiation' && (
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
              minWidth: { xs: '140px', md: '180px' },
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
            }}>
              {[
                { label: 'Capa MARNA', checked: showMarnaLayer, onChange: setShowMarnaLayer },
                { label: 'Satélite',   checked: isSatellite,    onChange: setIsSatellite },
                { label: 'Espectros',  checked: showSpectra,    onChange: setShowSpectra },
              ].map(({ label, checked, onChange }) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="caption" sx={{ fontSize: { xs: '10px', md: '12px' }, fontWeight: 'bold', color: '#1a202c' }}>
                    {label}
                  </Typography>
                  <Switch
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    size="small"
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#0751A4' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#0751A4' },
                    }}
                  />
                </Box>
              ))}
            </Box>
          )}
          
          {/* Leyenda de colores */}
          <Box sx={{
            position: 'absolute',
            top: { xs: 114, md: 136 },
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
              {selectedProject?.project_type === 'light_pollution' ? 'Iluminación (lux)' : 'Tasa de dosis (µSv/h)'}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {(selectedProject?.project_type === 'light_pollution' ? LIGHT_POLLUTION_LEGEND : RADIATION_LEGEND).map((item, index) => (
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

      {/* Diálogo con el espectro seleccionado */}
      <SpectrumDialog
        spectrumId={selectedSpectrumId}
        open={selectedSpectrumId !== null}
        onClose={() => setSelectedSpectrumId(null)}
      />
    </Box>
  );
};

// Memoizar el componente para evitar re-renders innecesarios
export default React.memo(MapComponent);
