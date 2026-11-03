import React, { useState, useMemo, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { H3HexagonLayer } from '@deck.gl/geo-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { Map, Source, Layer } from 'react-map-gl';
import { WebMercatorViewport, LinearInterpolator } from '@deck.gl/core';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../utils/i18nFormat';
import './MapComponent.css';
import { getRadiationColor, RADIATION_LEGEND, getLightPollutionColor, LIGHT_POLLUTION_LEGEND, getCCTColor, LIGHT_POLLUTION_CCT_LEGEND } from '../utils/radiationColors';
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
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { MapPoint, Campaign, Project, AdaptiveFilters, CommonFilters, RadiationFilters, RadiationSpectrumMarker, PublicStation } from '../types';
import { HistogramFetchParams } from '../hooks/useMeasurementsByZoom';
import { useSpectraMarkers } from '../hooks/useSpectraMarkers';
import { useStationMarkers } from '../hooks/useStationMarkers';
import { useMeasurementDetail } from '../hooks/useMeasurementDetail';
import SpectrumDialog from './SpectrumDialog';
import StationDialog from './StationDialog';
import { darkTokens as T } from '../theme/tokens';
import { MONO } from '../theme/theme';
import { FloatPanel } from './ui/FloatPanel';
import { ToggleRow } from './ui/ToggleRow';
import { StatusDot } from './ui/StatusDot';
import FiltersPanel from './FiltersPanel';
import { Mission } from '../types';

// Capa SDGSAT-1 (Lost at Night). Teselas TMS, cobertura Europa y UK, zoom 5 a 13.
// lostatnight.org no envia cabeceras CORS, asi que las teselas se piden al propio
// origen de la app bajo /sdgsat_tiles/ (proxy en src/setupProxy.js en desarrollo,
// nginx en produccion). REACT_APP_SDGSAT_TILES_URL permite apuntar a otro servidor.
const SDGSAT_TILES_URL =
  process.env.REACT_APP_SDGSAT_TILES_URL ||
  `${window.location.origin}/sdgsat_tiles/{z}/{x}/{y}.png`;
const SDGSAT_BOUNDS: [number, number, number, number] = [-25, 34, 45, 72];
const SDGSAT_ATTRIBUTION = '<a href="https://lostatnight.org" target="_blank" rel="noopener">Lost at Night</a> / SDGSAT-1';

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

// Modo de vista 2D (cenital, hexágonos planos) / 3D (inclinada, hexágonos extruidos).
// Se recuerda por navegador; por defecto 3D.
type ViewMode = '2d' | '3d';
const VIEW_MODE_STORAGE_KEY = 'openred_map_view_mode';
const VIEW_MODE_PITCH: Record<ViewMode, number> = { '2d': 0, '3d': INITIAL_VIEW_STATE.pitch };
const VIEW_MODE_TRANSITION_MS = 600;

const readStoredViewMode = (): ViewMode => {
  try {
    return localStorage.getItem(VIEW_MODE_STORAGE_KEY) === '2d' ? '2d' : '3d';
  } catch {
    return '3d';
  }
};

// Selector segmentado compacto (2D/3D, iluminación/CCT)
const segmentedToggleSx = {
  '& .MuiToggleButton-root': {
    fontFamily: MONO,
    fontSize: 9,
    letterSpacing: '0.5px',
    color: T.textDim,
    border: `1px solid ${T.hairline}`,
    px: 1,
    py: 0.25,
    textTransform: 'uppercase',
    '&.Mui-selected': {
      color: T.text,
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
  },
};

// Estado de estación → kind de StatusDot (mismos colores que el resto de la app).
const stationStatusKind = (status?: string): 'ok' | 'danger' | 'info' => {
  if (status === 'online') return 'ok';
  if (status === 'offline') return 'danger';
  return 'info';
};


interface HoveredObject {
  measurement?: MapPoint;
  hexagon?: {
    points: Array<{ radiation: number }>;
    [key: string]: any;
  };
  screenGrid?: {
    [key: string]: any;
  };
  spectrum?: RadiationSpectrumMarker;
  station?: PublicStation;
  count?: number;
  avgRadiation?: number;
  totalWeight?: number;
}

interface HoverInfo {
  x: number;
  y: number;
}

interface MapComponentProps {
  measurements: MapPoint[];
  pointsTruncated?: boolean;
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

// --- Estilos compartidos de los tooltips del mapa (dark) ---
const TIP_LABEL = T.textMid;
const TIP_VALUE = T.text;

const tipCardSx = {
  position: 'absolute' as const,
  zIndex: 1000,
  pointerEvents: 'none' as const,
  backgroundColor: 'rgba(18,22,27,0.96)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${T.border}`,
  borderRadius: '8px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.32)',
  overflow: 'hidden',
  minWidth: 190,
  maxWidth: 300,
  transform: 'translate(14px, 14px)',
  color: T.text,
};

const tipHeaderSx = {
  bgcolor: T.surface3,
  color: T.text,
  px: 1.5,
  py: 0.75,
  fontFamily: MONO,
  fontWeight: 600,
  fontSize: '10.5px',
  letterSpacing: '0.6px',
  textTransform: 'uppercase' as const,
  borderBottom: `1px solid ${T.hairline}`,
};

const tipBodySx = { px: 1.5, py: 1.25, display: 'flex', flexDirection: 'column', gap: 0.5 };

const tipSectionSx = {
  mt: 1,
  pt: 1,
  borderTop: `1px dashed ${T.hairline}`,
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
};

const tipSectionTitleSx = {
  fontFamily: MONO,
  fontSize: '10px',
  fontWeight: 600,
  color: T.textMid,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const TipRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2 }}>
    <Typography sx={{ fontSize: '11.5px', color: TIP_LABEL, whiteSpace: 'nowrap' }}>{label}</Typography>
    <Typography sx={{ fontFamily: MONO, fontSize: '11.5px', color: TIP_VALUE, fontWeight: 500, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
  </Box>
);

const TipHeadline: React.FC<{ value: string; unit: string }> = ({ value, unit }) => (
  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, mb: 0.5 }}>
    <Typography sx={{ fontFamily: MONO, fontSize: '22px', fontWeight: 600, lineHeight: 1, color: T.accent, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
    <Typography sx={{ fontFamily: MONO, fontSize: '12px', color: TIP_LABEL }}>{unit}</Typography>
  </Box>
);

// --- Marcador persistente de estación (mismo lenguaje visual que el tooltip: tipCardSx) ---
const stationBadgeSx = {
  position: 'relative' as const,
  pointerEvents: 'auto' as const,
  cursor: 'pointer',
  backgroundColor: 'rgba(18,22,27,0.96)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${T.border}`,
  borderRadius: '6px',
  boxShadow: '0 4px 14px rgba(0,0,0,0.32)',
  overflow: 'visible',
  color: T.text,
  minWidth: 60,
};

const stationBadgeHeaderSx = {
  bgcolor: T.surface3,
  display: 'flex',
  alignItems: 'center',
  gap: 0.5,
  px: 0.75,
  py: 0.375,
  borderBottom: `1px solid ${T.hairline}`,
  borderTopLeftRadius: '6px',
  borderTopRightRadius: '6px',
};

const stationBadgeBodySx = { px: 0.75, py: 0.5, display: 'flex', flexDirection: 'column', gap: 0.125 };

const stationBadgeTailSx = {
  position: 'absolute' as const,
  left: '50%',
  bottom: -6,
  width: 0,
  height: 0,
  transform: 'translateX(-50%)',
  borderLeft: '6px solid transparent',
  borderRight: '6px solid transparent',
  borderTop: '6px solid rgba(18,22,27,0.96)',
};

// Fila de estadística para el panel DOSE STATISTICS
const StatRow: React.FC<{ label: string; value: string; unit?: string; valueColor?: string }> = ({ label, value, unit, valueColor }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', py: 0.3 }}>
    <Typography sx={{ fontSize: 11, color: T.textMid }}>{label}</Typography>
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
      <Typography sx={{ fontFamily: MONO, fontSize: 11, color: valueColor || T.text, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
      {unit && <Typography sx={{ fontFamily: MONO, fontSize: 9, color: T.textDim }}>{unit}</Typography>}
    </Box>
  </Box>
);

// Helpers de chrome del mapa
const fmtLat = (lat: number) => `${Math.abs(lat).toFixed(2)}°${lat >= 0 ? 'N' : 'S'}`;
const fmtLon = (lon: number) => `${Math.abs(lon).toFixed(2)}°${lon >= 0 ? 'E' : 'W'}`;

// Escala (metros/píxel -> distancia "redonda" y su ancho en px)
// formatNumber se inyecta desde el componente para respetar el locale activo.
const computeScale = (
  lat: number,
  zoom: number,
  formatNumber: (value: number) => string,
): { px: number; label: string } => {
  const mpp = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
  const target = mpp * 100; // ~100px
  const pow = Math.pow(10, Math.floor(Math.log10(target)));
  const f = target / pow;
  const nice = f >= 5 ? 5 : f >= 2 ? 2 : 1;
  const dist = nice * pow; // metros
  const px = dist / mpp;
  const label = dist >= 1000 ? `${formatNumber(dist / 1000)} km` : `${Math.round(dist)} m`;
  return { px, label };
};

const MapComponent: React.FC<MapComponentProps> = ({
  measurements,
  pointsTruncated = false,
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
  const { t } = useTranslation('map');
  const { formatNumber, formatDateTime } = useLocale();

  // Ref para zoom en cada frame (no dispara re-render)
  const zoomRef = React.useRef<number>(INITIAL_VIEW_STATE.zoom);
  // Estado solo para el useMemo de layers — solo actualiza al cruzar nivel entero
  const [zoomLevel, setZoomLevel] = useState<number>(Math.round(INITIAL_VIEW_STATE.zoom));

  const [hoveredObject, setHoveredObject] = useState<HoveredObject | null>(null);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  // Contenedor del mapa: para reenviar la rueda del ratón al canvas de deck.gl cuando
  // pasa por encima de un badge de estación (el badge sí debe atrapar el click, pero
  // no debe bloquear el zoom del mapa).
  const mapPaperRef = React.useRef<HTMLDivElement>(null);
  const forwardWheelToMap = useCallback((e: React.WheelEvent) => {
    const canvas = mapPaperRef.current?.querySelector('canvas');
    if (!canvas) return;
    canvas.dispatchEvent(
      new WheelEvent('wheel', {
        deltaX: e.deltaX,
        deltaY: e.deltaY,
        deltaMode: e.deltaMode,
        clientX: e.clientX,
        clientY: e.clientY,
        bubbles: true,
        cancelable: true,
      })
    );
  }, []);
  // Por defecto colapsado en móvil, expandido en desktop
  const [filtersCollapsed, setFiltersCollapsed] = useState<boolean>(isMobile);
  // Estado para la capa MARNA
  const [showMarnaLayer, setShowMarnaLayer] = useState<boolean>(false);
  // Estado para la capa SDGSAT (Lost at Night, solo proyectos de contaminacion luminica)
  const [showSdgsatLayer, setShowSdgsatLayer] = useState<boolean>(false);
  const [isSatellite, setIsSatellite] = useState<boolean>(false);
  // Estado para la capa de espectros (solo proyectos de radiación)
  const [showSpectra, setShowSpectra] = useState<boolean>(false);
  // Estado para la capa de estaciones estáticas (solo proyectos de radiación); visible por defecto
  const [showStations, setShowStations] = useState<boolean>(true);
  // Espectro seleccionado (abre el diálogo con el histograma)
  const [selectedSpectrumId, setSelectedSpectrumId] = useState<number | null>(null);
  // Estación seleccionada (abre el diálogo con el histórico de lecturas)
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  // Modo de color para contaminación lumínica: iluminación (lux) o temperatura (CCT)
  const [lightPollutionColorMode, setLightPollutionColorMode] = useState<'illumination' | 'cct'>('illumination');

  // Cámara NO controlada (initialViewState) para que el zoom con rueda vaya 100% suave.
  // viewState solo se usa para refrescar los overlays (coordinate readout / scale bar);
  // NO se le pasa a deck.gl, así sus re-renders no tocan la cámara.
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);
  const is3D = viewMode === '3d';

  // Vista que se le da a deck.gl. Solo cambia al alternar 2D/3D: deck.gl resetea la cámara
  // cuando cambia initialViewState, y el resto del tiempo la cámara sigue sin controlar.
  const [cameraTarget, setCameraTarget] = useState<any>(() => ({
    ...INITIAL_VIEW_STATE,
    pitch: VIEW_MODE_PITCH[readStoredViewMode()],
  }));
  const [viewState, setViewState] = useState<any>(cameraTarget);

  // true entre el cambio de initialViewState y la primera notificación de deck.gl
  const cameraResetPendingRef = React.useRef(false);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    cameraResetPendingRef.current = true;
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
    } catch {
      // Sin almacenamiento: el modo vale solo para esta sesión
    }
    // Misma posición y zoom; solo cambian inclinación y rotación, con transición
    setCameraTarget({
      longitude: viewState.longitude,
      latitude: viewState.latitude,
      zoom: viewState.zoom,
      pitch: VIEW_MODE_PITCH[mode],
      bearing: 0,
      transitionDuration: VIEW_MODE_TRANSITION_MS,
      transitionInterpolator: new LinearInterpolator(['pitch', 'bearing']),
    });
  }, [viewState.longitude, viewState.latitude, viewState.zoom]);

  // Controller memoizado para no reinicializar la interacción en cada render.
  // En 2D no se puede rotar ni inclinar: el arrastre con botón derecho o dos dedos
  // volvería a inclinar la cámara.
  const deckController = useMemo(
    () => ({
      dragPan: true,
      dragRotate: is3D,
      scrollZoom: true,
      touchZoom: true,
      touchRotate: is3D,
      keyboard: true,
      doubleClickZoom: true,
    }),
    [is3D]
  );

  const isRadiation = selectedProject?.project_type === 'radiation';

  // Marcadores de espectros: se cargan al activar el switch (todos los del proyecto)
  const { spectra } = useSpectraMarkers({
    enabled: showSpectra && isRadiation,
    projectId: selectedProject?.id,
  });

  // Estaciones estáticas: se cargan al activar el switch (todas las del proyecto)
  const { stations } = useStationMarkers({
    enabled: showStations && isRadiation,
    projectId: selectedProject?.id,
  });

  // Ref para guardar el último nivel de zoom notificado al padre
  const lastNotifiedZoomLevel = React.useRef<number>(Math.round(INITIAL_VIEW_STATE.zoom));

  // Ya no necesitamos filtrar mediciones, usamos solo H3
  const filteredMeasurements = measurements;



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
          // En 2D, hexágonos planos: solo cuenta el color
          extruded: is3D,
          elevationScale: elevationScale,
          getHexagon: (d: any) => d.h3_index,
          getFillColor: (d: any) => {
            // Usar la función de color apropiada según el tipo de proyecto
            if (selectedProject?.project_type === 'light_pollution') {
              if (lightPollutionColorMode === 'cct') {
                const cct = d.avg_cct;
                if (cct == null) return [120, 120, 120]; // gris si no hay CCT
                return getCCTColor(cct);
              }
              return getLightPollutionColor(d.avg_value || 0);
            } else {
              return getRadiationColor(d.avg_value || 0);
            }
          },
          updateTriggers: {
            getFillColor: [selectedProject?.project_type, lightPollutionColorMode],
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
          getPosition: (d: MapPoint) => [d.longitude, d.latitude],
          getRadius: 6,
          getFillColor: (d: MapPoint) => {
            // Usar color según el tipo de proyecto
            if (selectedProject?.project_type === 'light_pollution') {
              if (lightPollutionColorMode === 'cct') {
                if (d.cct != null) {
                  const color = getCCTColor(d.cct);
                  return [color[0], color[1], color[2], 200];
                }
                return [120, 120, 120, 200]; // gris si no hay CCT
              }
              if (d.lux != null) {
                const color = getLightPollutionColor(d.lux);
                return [color[0], color[1], color[2], 200];
              }
            } else if (d.dose_rate != null) {
              // Para radiación, usar dose_rate
              const color = getRadiationColor(d.dose_rate);
              return [color[0], color[1], color[2], 200];
            }
            // Color por defecto (naranja)
            return [255, 140, 0, 200];
          },
          updateTriggers: {
            getFillColor: [selectedProject?.project_type, lightPollutionColorMode],
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
  }, [isUsingH3, h3Data, measurements, zoomLevel, selectedProject, showSpectra, spectra, lightPollutionColorMode, is3D]);

  // Posición en pantalla (px) de cada estación, recalculada con cada cambio de cámara.
  // Los marcadores de estación se pintan como overlay DOM propio (no <Marker> de
  // react-map-gl dentro de <Map>) porque el canvas de deck.gl se compone POR ENCIMA del
  // mapa base y se queda con todos los clics/hover, aunque el marcador se vea debajo.
  const projectedStations = useMemo(() => {
    if (!showStations || !isRadiation || stations.length === 0) return [];
    try {
      const viewport = new WebMercatorViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        ...viewState,
      });
      return stations.map((station) => {
        const [x, y] = viewport.project([station.longitude, station.latitude]);
        return { station, x, y };
      });
    } catch (error) {
      return [];
    }
  }, [showStations, isRadiation, stations, viewState]);

  // Refresca overlays, zoom y bounds a partir de la cámara de deck.gl
  const applyViewState = (newViewState: any) => {
    // Solo refrescar overlays (no se realimenta a deck: cámara no controlada)
    setViewState(newViewState);

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
  };

  // Detalle de la medida bajo el cursor: los puntos solo traen coordenadas y valor
  const { detail: hoverDetail, loading: hoverDetailLoading } = useMeasurementDetail(
    hoveredObject?.measurement?.id,
    selectedProject?.project_type === 'light_pollution' ? 'light_pollution' : 'radiation'
  );

  // Renderizar tooltip memoizado
  const renderTooltip = useCallback(() => {
    if (!hoveredObject || !hoverInfo) return null;

    const { x, y } = hoverInfo;
    const m = hoveredObject.measurement;
    // Detalle solo si es el del punto actual (evita mostrar el del anterior un instante)
    const d = hoverDetail && m && hoverDetail.id === m.id ? hoverDetail : null;
    const hex = hoveredObject.hexagon;
    const sg = hoveredObject.screenGrid;
    const sp = hoveredObject.spectrum;
    const st = hoveredObject.station;
    const isLP = selectedProject?.project_type === 'light_pollution';

    return (
      <Paper elevation={0} sx={{ ...tipCardSx, left: x, top: y }}>
        {m && (
          <>
            <Box sx={tipHeaderSx}>{t('tooltip.measurement')}</Box>
            <Box sx={tipBodySx}>
              {isLP ? (
                m.lux != null ? <TipHeadline value={m.lux.toFixed(4)} unit="lux" /> : null
              ) : m.dose_rate != null ? (
                <TipHeadline value={m.dose_rate.toFixed(2)} unit="µSv/h" />
              ) : null}

              {isLP && m.cct != null && (
                <TipRow label={t('tooltip.cct')} value={`${Math.round(m.cct)} K`} />
              )}
              {d && 'brightness' in d && d.brightness != null && (
                <TipRow label={t('tooltip.brightness')} value={d.brightness.toFixed(2)} />
              )}
              {d && (('cpm' in d && d.cpm != null) || ('count_rate' in d && d.count_rate != null)) && (
                <TipRow
                  label={t('tooltip.countRate')}
                  value={`${(('cpm' in d && d.cpm != null ? d.cpm : (d as { count_rate?: number }).count_rate)!).toFixed(2)} CPM`}
                />
              )}
              {d?.speed != null && (
                <TipRow label={t('tooltip.speed')} value={`${(d.speed * 3.6).toFixed(1)} km/h`} />
              )}
              <TipRow label={t('tooltip.latitude')} value={m.latitude.toFixed(6)} />
              <TipRow label={t('tooltip.longitude')} value={m.longitude.toFixed(6)} />
              {d?.altitude ? <TipRow label={t('tooltip.altitude')} value={`${Math.round(d.altitude)} m`} /> : null}
              {d && (
                <TipRow
                  label={t('tooltip.date')}
                  value={formatDateTime(new Date(d.dateTime), {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                />
              )}

              {!d && hoverDetailLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <CircularProgress size={10} sx={{ color: TIP_LABEL }} />
                  <Typography sx={{ fontSize: '11px', color: TIP_LABEL }}>{t('tooltip.loadingDetail')}</Typography>
                </Box>
              )}

              {d?.weather_cache && (
                <Box sx={tipSectionSx}>
                  <Typography sx={tipSectionTitleSx}>{t('tooltip.weather')}</Typography>
                  {d.weather_cache.temperature != null && (
                    <TipRow label={t('tooltip.temperature')} value={`${d.weather_cache.temperature.toFixed(1)} °C`} />
                  )}
                  {d.weather_cache.humidity != null && (
                    <TipRow label={t('tooltip.humidity')} value={`${d.weather_cache.humidity.toFixed(0)} %`} />
                  )}
                  {d.weather_cache.pressure != null && (
                    <TipRow label={t('tooltip.pressure')} value={`${d.weather_cache.pressure.toFixed(0)} hPa`} />
                  )}
                  {d.weather_cache.wind_speed != null && d.weather_cache.wind_direction != null && (
                    <TipRow label={t('tooltip.wind')} value={`${d.weather_cache.wind_speed.toFixed(1)} m/s (${d.weather_cache.wind_direction.toFixed(0)}°)`} />
                  )}
                  {d.weather_cache.cloud_cover != null && (
                    <TipRow label={t('tooltip.cloudCover')} value={`${d.weather_cache.cloud_cover.toFixed(0)} %`} />
                  )}
                </Box>
              )}

              {d?.notes && (
                <Typography sx={{ mt: 1, fontSize: '11px', fontStyle: 'italic', color: TIP_LABEL }}>
                  {d.notes}
                </Typography>
              )}
            </Box>
          </>
        )}

        {hex && (
          <>
            <Box sx={tipHeaderSx}>{t('tooltip.cluster')}</Box>
            <Box sx={tipBodySx}>
              {isLP ? (
                <TipHeadline value={(hoveredObject.avgRadiation || 0).toFixed(4)} unit={t('tooltip.luxMean')} />
              ) : (
                <TipHeadline value={(hoveredObject.avgRadiation || 0).toFixed(3)} unit={t('tooltip.doseMean')} />
              )}
              <TipRow label={t('tooltip.measurements')} value={formatNumber(hoveredObject.count || 0)} />
              {isLP ? (
                <>
                  {hex.min_value !== undefined && <TipRow label={t('tooltip.min')} value={`${hex.min_value.toFixed(4)} lux`} />}
                  {hex.max_value !== undefined && <TipRow label={t('tooltip.max')} value={`${hex.max_value.toFixed(4)} lux`} />}
                  {hex.avg_cct != null && <TipRow label={t('tooltip.cctMean')} value={`${Math.round(hex.avg_cct)} K`} />}
                  {hex.min_cct != null && <TipRow label={t('tooltip.cctMin')} value={`${Math.round(hex.min_cct)} K`} />}
                  {hex.max_cct != null && <TipRow label={t('tooltip.cctMax')} value={`${Math.round(hex.max_cct)} K`} />}
                </>
              ) : (
                <>
                  {hex.min_value !== undefined && <TipRow label={t('tooltip.min')} value={`${hex.min_value.toFixed(3)} µSv/h`} />}
                  {hex.max_value !== undefined && <TipRow label={t('tooltip.max')} value={`${hex.max_value.toFixed(3)} µSv/h`} />}
                  {hex.std_value !== undefined && <TipRow label={t('tooltip.stdDev')} value={`${hex.std_value.toFixed(3)} µSv/h`} />}
                </>
              )}
              <Typography sx={{ mt: 0.75, fontSize: '10.5px', color: TIP_LABEL, fontStyle: 'italic' }}>
                {t('tooltip.zoomHint')}
              </Typography>
            </Box>
          </>
        )}

        {sg && (
          <>
            <Box sx={tipHeaderSx}>{t('tooltip.dataGrid')}</Box>
            <Box sx={tipBodySx}>
              <TipRow label={t('tooltip.measurements')} value={hoveredObject.count || 0} />
              <TipRow label={t('tooltip.totalValue')} value={(hoveredObject.totalWeight || 0).toFixed(2)} />
              <TipRow label={t('tooltip.avgValue')} value={((hoveredObject.totalWeight || 0) / (hoveredObject.count || 1)).toFixed(2)} />
            </Box>
          </>
        )}

        {sp && (
          <>
            <Box sx={tipHeaderSx}>{t('tooltip.spectrum', { id: sp.id })}</Box>
            <Box sx={tipBodySx}>
              <TipRow label={t('tooltip.latitude')} value={Number(sp.latitude).toFixed(6)} />
              <TipRow label={t('tooltip.longitude')} value={Number(sp.longitude).toFixed(6)} />
              <Typography sx={{ mt: 0.75, fontSize: '10.5px', color: T.accent, fontWeight: 600 }}>
                {t('tooltip.spectrumClickHint')}
              </Typography>
            </Box>
          </>
        )}

        {st && (
          <>
            <Box sx={tipHeaderSx}>{st.name}</Box>
            <Box sx={tipBodySx}>
              <TipRow label={t('tooltip.status')} value={t(`stationStatus.${st.status ?? 'unknown'}`)} />
              {st.last_dose_rate != null && (
                <TipHeadline value={st.last_dose_rate.toFixed(3)} unit="µSv/h" />
              )}
              <TipRow
                label={t('tooltip.lastMeasurement')}
                value={
                  st.last_measurement_at
                    ? formatDateTime(new Date(st.last_measurement_at), {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                      })
                    : t('tooltip.neverMeasured')
                }
              />
              {st.measurements_24h != null && (
                <TipRow label={t('tooltip.measurements24h')} value={formatNumber(st.measurements_24h)} />
              )}
              <TipRow label={t('tooltip.altitude')} value={st.altitude != null ? `${Math.round(st.altitude)} m` : '—'} />
              <Typography sx={{ mt: 0.75, fontSize: '10.5px', color: T.accent, fontWeight: 600 }}>
                {t('tooltip.stationClickHint')}
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    );
  }, [hoveredObject, hoverInfo, hoverDetail, hoverDetailLoading, selectedProject?.project_type, t, formatNumber, formatDateTime]);

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100%',
        position: 'relative'
      }}
    >
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
            width: { xs: '85vw', md: 360 },
            boxSizing: 'border-box',
            border: 'none',
            borderRight: `1px solid ${T.border}`,
            backgroundColor: T.surface,
            backgroundImage: 'none',
            top: 48,
            height: 'calc(100vh - 48px)',
            borderRadius: 0,
          },
        }}
      >
        {/* Contenido del panel con botón de colapsar integrado */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 3, pt: 2, pb: 3, position: 'relative' }}>
          {/* Botón para colapsar dentro del drawer */}
          <IconButton 
            onClick={() => setFiltersCollapsed(true)}
            size="small"
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              color: T.textMid,
              zIndex: 1,
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
          
          <Box sx={{ mt: 0 }}>
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
              backgroundColor: 'rgba(18,22,27,0.92)',
              border: `1px solid ${T.border}`,
              color: T.text,
              backdropFilter: 'blur(8px)',
              '&:hover': {
                backgroundColor: T.surface3,
              },
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
              backgroundColor: 'rgba(18,22,27,0.92)',
              border: `1px solid ${T.border}`,
              borderRadius: '8px',
              px: 2,
              py: 1.25,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              boxShadow: '0 8px 24px rgba(0,0,0,0.32)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <CircularProgress size={16} sx={{ color: T.accent }} />
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: T.textMid }}>{t('loadingMeasurements')}</Typography>
          </Box>
        )}

        {!loading && !isUsingH3 && pointsTruncated && (
          <Box
            sx={{
              position: 'absolute',
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              maxWidth: 'calc(100% - 32px)',
              backgroundColor: 'rgba(18,22,27,0.92)',
              border: `1px solid ${T.border}`,
              borderRadius: '8px',
              px: 2,
              py: 1.25,
              boxShadow: '0 8px 24px rgba(0,0,0,0.32)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: T.textMid }}>
              {t('pointsTruncated', { shown: formatNumber(measurements.length) })}
            </Typography>
          </Box>
        )}
        
        <Paper ref={mapPaperRef} elevation={0} sx={{ height: '100%', borderRadius: 0, overflow: 'hidden' }}>
          <DeckGL
            initialViewState={cameraTarget}
            controller={deckController}
            layers={layers}
            onViewStateChange={({viewState: newViewState}: any) => {
              // Al alternar 2D/3D, deck.gl notifica el reseteo de cámara durante su propio
              // render: esa llamada se aplaza para no actualizar MapComponent en mitad de él
              if (cameraResetPendingRef.current) {
                cameraResetPendingRef.current = false;
                queueMicrotask(() => applyViewState(newViewState));
                return;
              }
              applyViewState(newViewState);
            }}
            onLoad={() => console.log('DeckGL loaded successfully')}
            onError={(error) => console.error('DeckGL error:', error)}
          >
            <Map
              mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
              mapStyle={isSatellite ? 'mapbox://styles/mapbox/satellite-streets-v12' : 'mapbox://styles/mapbox/dark-v11'}
              projection={{ name: 'mercator' }}
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
              {showSdgsatLayer && selectedProject?.project_type === 'light_pollution' && (
                <>
                  <Source
                    id="sdgsat-tiles"
                    type="raster"
                    tiles={[SDGSAT_TILES_URL]}
                    tileSize={256}
                    scheme="tms"
                    minzoom={5}
                    maxzoom={13}
                    bounds={SDGSAT_BOUNDS}
                    attribution={SDGSAT_ATTRIBUTION}
                  />
                  <Layer
                    id="sdgsat-layer"
                    type="raster"
                    source="sdgsat-tiles"
                    paint={{
                      'raster-opacity': 0.8
                    }}
                  />
                </>
              )}

            </Map>
          </DeckGL>

          {/* Estaciones estáticas: overlay DOM propio (por ENCIMA del canvas de deck.gl,
              que si no se queda con todos los clics aunque el marcador se vea "debajo") */}
          {projectedStations.length > 0 && (
            <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
              {projectedStations.map(({ station, x, y }) => (
                <Box
                  key={station.id}
                  sx={{ ...stationBadgeSx, position: 'absolute', left: x, top: y, transform: 'translate(-50%, -100%)', pointerEvents: 'auto' }}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setSelectedStationId(station.id);
                  }}
                  onWheel={forwardWheelToMap}
                  onMouseEnter={() => {
                    setHoveredObject({ station });
                    setHoverInfo({ x, y });
                  }}
                  onMouseLeave={() => {
                    setHoveredObject(null);
                    setHoverInfo(null);
                  }}
                >
                  <Box sx={stationBadgeHeaderSx}>
                    <StatusDot kind={stationStatusKind(station.status)} size={6} />
                    <Typography
                      noWrap
                      sx={{ fontFamily: MONO, fontSize: '9px', fontWeight: 600, letterSpacing: '0.3px', color: T.text, maxWidth: 90 }}
                    >
                      {station.name}
                    </Typography>
                  </Box>
                  <Box sx={stationBadgeBodySx}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
                      <Typography sx={{ fontFamily: MONO, fontSize: '13px', fontWeight: 600, lineHeight: 1, color: T.accent, fontVariantNumeric: 'tabular-nums' }}>
                        {station.last_dose_rate != null ? station.last_dose_rate.toFixed(2) : '-'}
                      </Typography>
                      <Typography sx={{ fontFamily: MONO, fontSize: '9px', color: TIP_LABEL }}>µSv/h</Typography>
                    </Box>
                    <Typography sx={{ fontFamily: MONO, fontSize: '9px', color: TIP_LABEL, fontVariantNumeric: 'tabular-nums' }}>
                      24h: {station.avg_dose_rate_24h != null ? station.avg_dose_rate_24h.toFixed(2) : '-'}
                    </Typography>
                  </Box>
                  <Box sx={stationBadgeTailSx} />
                </Box>
              ))}
            </Box>
          )}

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
          
          {/* Coordinate readout (arriba-izquierda) */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: 10, md: 16 },
              left: filtersCollapsed ? { xs: 10, md: 16 } : { xs: 10, md: 376 },
              zIndex: 1000,
              display: 'flex',
              gap: 1.5,
              alignItems: 'center',
              px: 1.25,
              py: 0.6,
              backgroundColor: 'rgba(18,22,27,0.92)',
              border: `1px solid ${T.border}`,
              borderRadius: '8px',
              backdropFilter: 'blur(8px)',
              transition: 'left 0.2s ease-in-out',
            }}
          >
            <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textMid }}>
              {t('chrome.view')} {fmtLat(viewState.latitude)} · {fmtLon(viewState.longitude)}
            </Typography>
            <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textDim }}>
              {t('chrome.zoom')} {Number(viewState.zoom).toFixed(2)} · {t('chrome.pitch')} {Math.round(viewState.pitch || 0)}°
            </Typography>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={viewMode}
              onChange={(_, v) => { if (v) handleViewModeChange(v); }}
              aria-label={t('chrome.viewMode')}
              sx={segmentedToggleSx}
            >
              <ToggleButton value="2d">2D</ToggleButton>
              <ToggleButton value="3d">3D</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Columna derecha de paneles flotantes */}
          <Box
            sx={{
              position: 'absolute',
              top: { xs: 10, md: 16 },
              right: { xs: 10, md: 16 },
              zIndex: 1000,
              width: { xs: 200, md: 240 },
              display: 'flex',
              flexDirection: 'column',
              gap: 1.25,
              pointerEvents: 'none',
              maxHeight: 'calc(100% - 32px)',
              overflowY: 'auto',
            }}
          >
            {/* LAYERS */}
            <FloatPanel title={t('layers.title')}>
              {isRadiation && (
                <ToggleRow
                  label={t('layers.spectraMarkers')}
                  sub={t('layers.spectraVisible', { count: spectra.length })}
                  checked={showSpectra}
                  onChange={setShowSpectra}
                  right={showSpectra ? spectra.length : undefined}
                />
              )}
              {isRadiation && (
                <ToggleRow
                  label={t('layers.stationsMarkers')}
                  sub={t('layers.stationsVisible', { count: stations.length })}
                  checked={showStations}
                  onChange={setShowStations}
                  right={showStations ? stations.length : undefined}
                />
              )}
              {isRadiation && (
                <ToggleRow
                  label={t('layers.marnaLayer')}
                  sub={t('layers.marnaSub')}
                  checked={showMarnaLayer}
                  onChange={setShowMarnaLayer}
                />
              )}
              {selectedProject?.project_type === 'light_pollution' && (
                <ToggleRow
                  label={t('layers.sdgsatLayer')}
                  sub={t('layers.sdgsatSub')}
                  checked={showSdgsatLayer}
                  onChange={setShowSdgsatLayer}
                />
              )}
              <ToggleRow label={t('layers.satellite')} sub={t('layers.satelliteSub')} checked={isSatellite} onChange={setIsSatellite} />
            </FloatPanel>

            {/* DOSE RATE / Illumination (leyenda) */}
            {(() => {
              const isLP = selectedProject?.project_type === 'light_pollution';
              const isCCT = isLP && lightPollutionColorMode === 'cct';
              const legendItems = isLP
                ? (isCCT ? LIGHT_POLLUTION_CCT_LEGEND : LIGHT_POLLUTION_LEGEND)
                : RADIATION_LEGEND;
              const title = isLP
                ? (isCCT ? t('legend.cct') : t('legend.illumination'))
                : t('legend.doseRate');
              const right = isLP ? (isCCT ? 'K' : 'lux') : 'µSv/h';
              return (
                <FloatPanel title={title} right={right}>
                  {isLP && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.75 }}>
                      <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={lightPollutionColorMode}
                        onChange={(_, v) => { if (v) setLightPollutionColorMode(v); }}
                        sx={segmentedToggleSx}
                      >
                        <ToggleButton value="illumination">{t('legend.colorMode.illumination')}</ToggleButton>
                        <ToggleButton value="cct">{t('legend.colorMode.cct')}</ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                    {legendItems.map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 20, height: 10, background: item.gradient, borderRadius: '2px', flexShrink: 0 }} />
                        <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textMid }}>
                          {item.qualifierKey ? `${item.label} (${t(item.qualifierKey)})` : item.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </FloatPanel>
              );
            })()}

            {/* DOSE STATISTICS (radiación + H3) */}
            {isUsingH3 && statistics && isRadiation && (
              <FloatPanel title={t('stats.title')} right="µSv/h">
                <StatRow label={t('stats.mean')} value={statistics.global_avg.toFixed(3)} />
                <StatRow label={t('stats.max')} value={statistics.global_max.toFixed(3)} valueColor="#e0457b" />
                <StatRow label={t('stats.min')} value={statistics.global_min.toFixed(3)} />
                {statistics.global_std !== undefined && (
                  <StatRow label={t('stats.stdDev')} value={statistics.global_std.toFixed(3)} />
                )}
                {totalMeasurements !== undefined && (
                  <StatRow label={t('stats.samples')} value={formatNumber(totalMeasurements)} unit={t('stats.samplesUnit')} />
                )}
              </FloatPanel>
            )}
          </Box>

          {/* Scale bar (abajo-centro) */}
          {(() => {
            const { px, label } = computeScale(viewState.latitude, viewState.zoom, formatNumber);
            return (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.25,
                  pointerEvents: 'none',
                }}
              >
                <Typography sx={{ fontFamily: MONO, fontSize: 9, color: T.textMid }}>{label}</Typography>
                <Box
                  sx={{
                    width: px,
                    height: 6,
                    borderLeft: `1px solid ${T.textMid}`,
                    borderRight: `1px solid ${T.textMid}`,
                    borderBottom: `1px solid ${T.textMid}`,
                  }}
                />
              </Box>
            );
          })()}

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
            <strong>{t('mapbox.notConfiguredTitle')}</strong>
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {t('mapbox.notConfiguredBody')}
          </Typography>
        </Alert>
      )}

      {/* Diálogo con el espectro seleccionado */}
      <SpectrumDialog
        spectrumId={selectedSpectrumId}
        open={selectedSpectrumId !== null}
        onClose={() => setSelectedSpectrumId(null)}
      />

      {/* Diálogo con el histórico de la estación seleccionada */}
      <StationDialog
        stationId={selectedStationId}
        open={selectedStationId !== null}
        onClose={() => setSelectedStationId(null)}
      />
    </Box>
  );
};

// Memoizar el componente para evitar re-renders innecesarios
export default React.memo(MapComponent);
