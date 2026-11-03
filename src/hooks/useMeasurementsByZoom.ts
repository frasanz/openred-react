import { useState, useEffect, useRef } from 'react';
import { MapPoint, Project, AdaptiveFilters } from '../types';
import apiService from '../services/api';

interface UseMeasurementsByZoomOptions {
  selectedProject?: Project | null;
  zoom: number;
  enabled?: boolean;
  onProgress?: (loaded: number, total: number) => void;
  filters?: AdaptiveFilters;
  missionId?: number;
  campaignId?: number;
  bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

export interface HistogramFetchParams {
  project?: number;
  start_date?: string;
  end_date?: string;
  mission?: number;
  campaign?: number;
  min_altitude?: number;
  max_altitude?: number;
  min_speed?: number;
  max_speed?: number;
  min_dose_rate?: number;
  max_dose_rate?: number;
  north?: number;
  south?: number;
  east?: number;
  west?: number;
}

interface UseMeasurementsByZoomResult {
  measurements: MapPoint[];
  pointsTruncated: boolean; // el servidor cortó los puntos en su límite
  h3Data: any[];
  loading: boolean;
  error: string | null;
  isUsingH3: boolean;
  h3Resolution: number;
  totalMeasurements: number;
  histogramFetchParams?: HistogramFetchParams;
  statistics?: {
    global_avg: number;
    global_min: number;
    global_max: number;
    global_std?: number;
  };
}

// CONFIGURACIÓN DE ZOOM Y RESOLUCIÓN H3
const H3_ZOOM_THRESHOLD = 14; // Usar H3 hasta zoom 14, puntos desde zoom 15+

// Factor de expansión del bbox pedido (caché al mover el mapa).
// En puntos se expande menos: cada punto cuesta mucho más que un hexágono.
const H3_BOUNDS_FACTOR = 2;      // área x4
const POINTS_BOUNDS_FACTOR = 1.5; // área x2,25

/**
 * Mapea el nivel de zoom del mapa a una resolución H3.
 * H3 tiene resoluciones 0-15, donde mayor resolución = hexágonos más pequeños.
 */
const getH3ResolutionForZoom = (zoom: number): number => {
  if (zoom <= 3) return 2;   // Zoom 0-3:  H3 res 2
  if (zoom <= 5) return 3;   // Zoom 4-5:  H3 res 3
  if (zoom <= 7) return 4;   // Zoom 6-7:  H3 res 4
  if (zoom <= 8) return 5;   // Zoom 8:    H3 res 5
  if (zoom <= 9) return 6;   // Zoom 9:    H3 res 6
  if (zoom <= 10) return 7;  // Zoom 10:   H3 res 7
  if (zoom <= 11) return 8;  // Zoom 11:   H3 res 8
  if (zoom <= 12) return 9;  // Zoom 12:   H3 res 9
  if (zoom <= 13) return 10; // Zoom 13:   H3 res 10
  return 11;                 // Zoom 14:   H3 res 11
};

/**
 * Formatea una fecha a formato ISO (YYYY-MM-DD) usando la zona horaria LOCAL.
 * Evita problemas de conversión UTC que pueden cambiar el día.
 */
const formatDateToISO = (date: Date | undefined): string => {
  if (!date) return '';
  
  // Usar zona horaria local en lugar de UTC
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Expande un bounding box por un factor dado.
 * Factor 2 = expande 50% en cada dirección (área total x4)
 */
const expandBounds = (
  bounds: { north: number; south: number; east: number; west: number },
  factor: number = 2
): { north: number; south: number; east: number; west: number } => {
  const latDiff = bounds.north - bounds.south;
  const lonDiff = bounds.east - bounds.west;
  
  const latExpansion = (latDiff * (factor - 1)) / 2;
  const lonExpansion = (lonDiff * (factor - 1)) / 2;
  
  return {
    north: Math.min(90, bounds.north + latExpansion),
    south: Math.max(-90, bounds.south - latExpansion),
    east: bounds.east + lonExpansion,
    west: bounds.west - lonExpansion
  };
};

/**
 * Verifica si un viewport está completamente dentro de bounds cacheados.
 */
const isInsideBounds = (
  viewport: { north: number; south: number; east: number; west: number },
  cached: { north: number; south: number; east: number; west: number }
): boolean => {
  return (
    viewport.north <= cached.north &&
    viewport.south >= cached.south &&
    viewport.east <= cached.east &&
    viewport.west >= cached.west
  );
};

export const useMeasurementsByZoom = ({
  selectedProject,
  zoom,
  enabled = true,
  onProgress,
  filters,
  missionId,
  campaignId,
  bounds
}: UseMeasurementsByZoomOptions): UseMeasurementsByZoomResult => {
  const [measurements, setMeasurements] = useState<MapPoint[]>([]);
  const [pointsTruncated, setPointsTruncated] = useState(false);
  const [h3Data, setH3Data] = useState<any[]>([]);
  const [h3Resolution, setH3Resolution] = useState<number>(1);
  const [totalMeasurements, setTotalMeasurements] = useState<number>(0);
  const [statistics, setStatistics] = useState<{ global_avg: number; global_min: number; global_max: number; global_std?: number } | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [histogramFetchParams, setHistogramFetchParams] = useState<HistogramFetchParams | undefined>(undefined);
  
  const isUsingH3 = zoom <= H3_ZOOM_THRESHOLD;
  
  const lastLoadedRef = useRef({
    projectId: -1,
    isH3: false,
    zoom: -1,
    startDate: '',
    endDate: '',
    missionId: -1,
    campaignId: -1,
    minAltitude: undefined as number | undefined,
    maxAltitude: undefined as number | undefined,
    minSpeed: undefined as number | undefined,
    maxSpeed: undefined as number | undefined,
    minDoseRate: undefined as number | undefined,
    maxDoseRate: undefined as number | undefined,
  });
  
  // Caché para el bounding box expandido que ya fue cargado
  const cachedBoundsRef = useRef<{ north: number; south: number; east: number; west: number } | null>(null);

  // Petición en curso: se cancela cuando empieza otra o al desmontar
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  useEffect(() => {
    if (!enabled || !selectedProject) {
      return;
    }

    const projectId = selectedProject.id;
    const roundedZoom = Math.round(zoom);
    
    // Convertir fechas a formato ISO usando zona horaria local (evita problemas de UTC)
    const startDate = formatDateToISO(filters?.common?.startDate);
    const endDate = formatDateToISO(filters?.common?.endDate);
    
    // Invalidar caché en cambios importantes (edge cases).
    // El zoom solo importa en H3 (cambia la resolución); los puntos no dependen del zoom
    // y los ya cargados siguen valiendo mientras el viewport quede dentro del bbox cacheado.
    const shouldInvalidateCache =
      lastLoadedRef.current.projectId !== projectId ||
      lastLoadedRef.current.isH3 !== isUsingH3 ||
      (isUsingH3 && lastLoadedRef.current.zoom !== roundedZoom) ||
      lastLoadedRef.current.startDate !== startDate ||
      lastLoadedRef.current.endDate !== endDate ||
      lastLoadedRef.current.missionId !== (missionId ?? -1) ||
      lastLoadedRef.current.campaignId !== (campaignId ?? -1) ||
      lastLoadedRef.current.minAltitude !== filters?.common?.minAltitude ||
      lastLoadedRef.current.maxAltitude !== filters?.common?.maxAltitude ||
      lastLoadedRef.current.minSpeed !== filters?.common?.minSpeed ||
      lastLoadedRef.current.maxSpeed !== filters?.common?.maxSpeed ||
      lastLoadedRef.current.minDoseRate !== filters?.radiation?.minDoseRate ||
      lastLoadedRef.current.maxDoseRate !== filters?.radiation?.maxDoseRate;
    
    if (shouldInvalidateCache) {
      cachedBoundsRef.current = null; // Invalidar caché
    }
    
    // Verificar si necesitamos recargar por bounds
    const needsBoundsReload = bounds && (
      !cachedBoundsRef.current || // No hay caché
      !isInsideBounds(bounds, cachedBoundsRef.current) // Viewport se salió del área cacheada
    );
    
    // Logging para debug
    if (bounds && cachedBoundsRef.current && !needsBoundsReload) {
      console.log('Using cached data - viewport inside cached bounds');
    }
    if (needsBoundsReload && cachedBoundsRef.current) {
      console.log('Viewport moved outside cached area - reloading...');
    }
    if (!cachedBoundsRef.current && bounds) {
      console.log('No cache available - initial load');
    }
    
    const needsReload = shouldInvalidateCache || needsBoundsReload;

    if (!needsReload) {
      return;
    }

    const loadData = async () => {
      const h3Resolution = getH3ResolutionForZoom(roundedZoom);
      console.log(`Loading ${isUsingH3 ? `H3 (res ${h3Resolution})` : 'points'} for zoom ${roundedZoom}`);
      if (startDate || endDate) {
        console.log(`Date range: ${startDate || 'any'} to ${endDate || 'any'}`);
      }
      if (missionId) {
        console.log(`Mission filter: ${missionId}`);
      }
      if (campaignId) {
        console.log(`Campaign filter: ${campaignId}`);
      }
      
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // NO borrar datos existentes - mantenerlos mientras cargamos los nuevos
      setLoading(true);
      setError(null);

      try {
        const measurementType = selectedProject.project_type === 'light_pollution' 
          ? 'light_pollution' 
          : 'radiation';

        if (isUsingH3) {
          const requestedResolution = getH3ResolutionForZoom(roundedZoom);
          const params: any = {
            resolution: requestedResolution,
            project: projectId,
            measurementType
          };
          
          // Agregar fechas si están presentes
          if (startDate) params.start_date = startDate;
          if (endDate) params.end_date = endDate;
          
          // Agregar filtros de misión y campaña
          if (missionId) params.mission = missionId;
          if (campaignId) params.campaign = campaignId;

          // Filtros de altitud (m)
          if (filters?.common?.minAltitude !== undefined) params.min_altitude = filters.common.minAltitude;
          if (filters?.common?.maxAltitude !== undefined) params.max_altitude = filters.common.maxAltitude;

          // Filtros de velocidad: UI en km/h → API en m/s
          if (filters?.common?.minSpeed !== undefined) params.min_speed = filters.common.minSpeed / 3.6;
          if (filters?.common?.maxSpeed !== undefined) params.max_speed = filters.common.maxSpeed / 3.6;

          // Filtros específicos de radiación
          if (measurementType === 'radiation') {
            if (filters?.radiation?.minDoseRate !== undefined) params.min_dose_rate = filters.radiation.minDoseRate;
            if (filters?.radiation?.maxDoseRate !== undefined) params.max_dose_rate = filters.radiation.maxDoseRate;
          }

          // Expandir y usar bounding box si está presente (x2 para caché)
          let requestBounds = bounds;
          if (bounds) {
            requestBounds = expandBounds(bounds, H3_BOUNDS_FACTOR);
            params.north = requestBounds.north;
            params.south = requestBounds.south;
            params.east = requestBounds.east;
            params.west = requestBounds.west;

            console.log(`Requesting expanded bounds: N:${requestBounds.north.toFixed(2)} S:${requestBounds.south.toFixed(2)} E:${requestBounds.east.toFixed(2)} W:${requestBounds.west.toFixed(2)}`);
          }

          const data = await apiService.getH3Aggregation(params, controller.signal);
          if (controller.signal.aborted) return;
          
          // Cachear los bounds expandidos después de cargar exitosamente
          if (requestBounds) {
            cachedBoundsRef.current = requestBounds;
          }
          
          const actualResolution = data.resolution ?? requestedResolution;
          const total = data.totalMeasurements ?? 0;
          
          console.log(`${data.hexagons.length} hexagons loaded for zoom ${roundedZoom} (H3 res ${actualResolution}, ${total} measurements)`);
          setH3Data(data.hexagons);
          setH3Resolution(actualResolution);
          setTotalMeasurements(total);
          setStatistics(data.statistics);
        } else {
          // Zoom >= 15: puntos ligeros desde .../compact/ (el detalle se pide al hacer hover)
          const params: any = {
            project: projectId,
            measurementType // Pasar el tipo de medición
          };
          
          // Agregar fechas si están presentes
          if (startDate) params.start_date = startDate;
          if (endDate) params.end_date = endDate;
          
          // Agregar filtros de misión y campaña
          if (missionId) params.mission = missionId;
          if (campaignId) params.campaign = campaignId;

          // Filtros de altitud (m)
          if (filters?.common?.minAltitude !== undefined) params.min_altitude = filters.common.minAltitude;
          if (filters?.common?.maxAltitude !== undefined) params.max_altitude = filters.common.maxAltitude;

          // Filtros de velocidad: UI en km/h → API en m/s
          if (filters?.common?.minSpeed !== undefined) params.min_speed = filters.common.minSpeed / 3.6;
          if (filters?.common?.maxSpeed !== undefined) params.max_speed = filters.common.maxSpeed / 3.6;

          // Filtros específicos de radiación
          if (measurementType === 'radiation') {
            if (filters?.radiation?.minDoseRate !== undefined) params.min_dose_rate = filters.radiation.minDoseRate;
            if (filters?.radiation?.maxDoseRate !== undefined) params.max_dose_rate = filters.radiation.maxDoseRate;
          }

          // Expandir y usar bounding box si está presente (x1,5 para caché)
          let requestBounds = bounds;
          if (bounds) {
            requestBounds = expandBounds(bounds, POINTS_BOUNDS_FACTOR);
            params.north = requestBounds.north;
            params.south = requestBounds.south;
            params.east = requestBounds.east;
            params.west = requestBounds.west;

            console.log(`Requesting expanded bounds: N:${requestBounds.north.toFixed(2)} S:${requestBounds.south.toFixed(2)} E:${requestBounds.east.toFixed(2)} W:${requestBounds.west.toFixed(2)}`);
          }

          const { points: data, truncated } = await apiService.getMapPoints(params, controller.signal);
          if (controller.signal.aborted) return;
          
          // Cachear los bounds expandidos después de cargar exitosamente.
          // Si el servidor cortó, el área no está completa: sin caché, para que al acercar
          // (bbox más pequeño, dentro del anterior) se vuelva a pedir y salgan todos.
          cachedBoundsRef.current = requestBounds && !truncated ? requestBounds : null;

          console.log(`${data.length} individual points loaded for zoom ${roundedZoom}`);
          setMeasurements(data);
          setPointsTruncated(truncated);
          setTotalMeasurements(data.length);
          setStatistics(undefined); // Limpiar estadísticas cuando vemos puntos individuales
        }

        // Exponer los params exactos usados para que el histograma los reutilice (solo radiación)
        if (measurementType === 'radiation') {
          const cached = cachedBoundsRef.current;
          setHistogramFetchParams({
            project: projectId,
            ...(startDate && { start_date: startDate }),
            ...(endDate && { end_date: endDate }),
            ...(missionId && { mission: missionId }),
            ...(campaignId && { campaign: campaignId }),
            ...(filters?.common?.minAltitude !== undefined && { min_altitude: filters.common.minAltitude }),
            ...(filters?.common?.maxAltitude !== undefined && { max_altitude: filters.common.maxAltitude }),
            ...(filters?.common?.minSpeed !== undefined && { min_speed: filters.common.minSpeed / 3.6 }),
            ...(filters?.common?.maxSpeed !== undefined && { max_speed: filters.common.maxSpeed / 3.6 }),
            ...(filters?.radiation?.minDoseRate !== undefined && { min_dose_rate: filters.radiation.minDoseRate }),
            ...(filters?.radiation?.maxDoseRate !== undefined && { max_dose_rate: filters.radiation.maxDoseRate }),
            ...(cached && { north: cached.north, south: cached.south, east: cached.east, west: cached.west }),
          });
        }

        lastLoadedRef.current = {
          projectId,
          isH3: isUsingH3,
          zoom: roundedZoom,
          startDate,
          endDate,
          missionId: missionId ?? -1,
          campaignId: campaignId ?? -1,
          minAltitude: filters?.common?.minAltitude,
          maxAltitude: filters?.common?.maxAltitude,
          minSpeed: filters?.common?.minSpeed,
          maxSpeed: filters?.common?.maxSpeed,
          minDoseRate: filters?.radiation?.minDoseRate,
          maxDoseRate: filters?.radiation?.maxDoseRate,
        };
      } catch (err: any) {
        // Cancelada porque empezó otra carga (o se desmontó): no es un error
        if (controller.signal.aborted) return;
        console.error('Error loading data:', err);
        setError(err.message || 'Error al cargar los datos');
        setMeasurements([]);
        setPointsTruncated(false);
        setH3Data([]);
        setTotalMeasurements(0);
      } finally {
        // Si la sustituyó otra carga, esa es la que quita el indicador
        if (abortControllerRef.current === controller) {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [selectedProject, zoom, enabled, isUsingH3, onProgress, filters, missionId, campaignId, bounds]);

  return { measurements, pointsTruncated, h3Data, loading, error, isUsingH3, h3Resolution, totalMeasurements, statistics, histogramFetchParams };
};
