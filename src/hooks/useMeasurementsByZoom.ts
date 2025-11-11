import { useState, useEffect, useRef } from 'react';
import { Measurement, Project, AdaptiveFilters } from '../types';
import apiService from '../services/api';

interface UseMeasurementsByZoomOptions {
  selectedProject?: Project | null;
  zoom: number;
  enabled?: boolean;
  onProgress?: (loaded: number, total: number) => void;
  filters?: AdaptiveFilters;
  missionId?: number;
  campaignId?: number;
}

interface UseMeasurementsByZoomResult {
  measurements: Measurement[];
  h3Data: any[];
  loading: boolean;
  error: string | null;
  isUsingH3: boolean;
  h3Resolution: number;
  totalMeasurements: number;
  statistics?: {
    global_avg: number;
    global_min: number;
    global_max: number;
    global_std?: number;
  };
}

// 🎯 CONFIGURACIÓN DE ZOOM Y RESOLUCIÓN H3
const H3_ZOOM_THRESHOLD = 15; // Usar H3 hasta zoom 15, puntos desde zoom 16+

/**
 * Mapea el nivel de zoom del mapa a una resolución H3.
 * Cambios menos frecuentes (cada 2-3 niveles de zoom) para transiciones más suaves
 * y reducir el efecto de "baile" de hexágonos entre resoluciones.
 * 
 * H3 tiene resoluciones 0-15, donde mayor resolución = hexágonos más pequeños.
 */
const getH3ResolutionForZoom = (zoom: number): number => {
  if (zoom <= 3) return 1;   // Zoom 0-3: H3 res 1 (hexágonos muy grandes)
  if (zoom <= 5) return 2;   // Zoom 4-5: H3 res 2 (regiones/provincias)
  if (zoom <= 6) return 3;   // Zoom 5-6: H3 res 3 (áreas metropolitanas)
  if (zoom <= 7) return 4;   // Zoom 6-7: H3 res 4 (ciudades grandes)
  if (zoom <= 8) return 5;   // Zoom 7-8: H3 res 5 (ciudades pequeñas)
  if (zoom <= 9) return 6;   // Zoom 8-9: H3 res 5 (ciudades pequeñas)
  if (zoom <= 10) return 7;  // Zoom 9-10: H3 res 5 (barrios)
  if (zoom <= 11) return 8;  // Zoom 10-11: H3 res 5 (barrios)
  if (zoom <= 12) return 9;  // Zoom 11-12: H3 res 5 (barrios)
  if (zoom <= 13) return 10;  // Zoom 12-13: H3 res 6 (calles grandes)
  if (zoom <= 14) return 11;  // Zoom 13-14: H3 res 6 (calles grandes)
  if (zoom <= 15) return 12;  // Zoom 14-15: H3 res 7 (calles pequeñas)
  return 8;                   // Zoom 16+: H3 res 8 (edificios)
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

export const useMeasurementsByZoom = ({
  selectedProject,
  zoom,
  enabled = true,
  onProgress,
  filters,
  missionId,
  campaignId
}: UseMeasurementsByZoomOptions): UseMeasurementsByZoomResult => {
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [h3Data, setH3Data] = useState<any[]>([]);
  const [h3Resolution, setH3Resolution] = useState<number>(1);
  const [totalMeasurements, setTotalMeasurements] = useState<number>(0);
  const [statistics, setStatistics] = useState<{ global_avg: number; global_min: number; global_max: number; global_std?: number } | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isUsingH3 = zoom <= H3_ZOOM_THRESHOLD;
  const lastLoadedRef = useRef({ 
    projectId: -1, 
    isH3: false, 
    zoom: -1,
    startDate: '',
    endDate: '',
    missionId: -1,
    campaignId: -1
  });

  useEffect(() => {
    if (!enabled || !selectedProject) {
      return;
    }

    const projectId = selectedProject.id;
    const roundedZoom = Math.round(zoom);
    
    // Convertir fechas a formato ISO usando zona horaria local (evita problemas de UTC)
    const startDate = formatDateToISO(filters?.common?.startDate);
    const endDate = formatDateToISO(filters?.common?.endDate);
    
    const needsReload = 
      lastLoadedRef.current.projectId !== projectId ||
      lastLoadedRef.current.isH3 !== isUsingH3 ||
      lastLoadedRef.current.startDate !== startDate ||
      lastLoadedRef.current.endDate !== endDate ||
      lastLoadedRef.current.missionId !== (missionId ?? -1) ||
      lastLoadedRef.current.campaignId !== (campaignId ?? -1) ||
      (isUsingH3 && lastLoadedRef.current.zoom !== roundedZoom);

    if (!needsReload) {
      return;
    }

    const loadData = async () => {
      const h3Resolution = getH3ResolutionForZoom(roundedZoom);
      console.log(`🔄 Loading ${isUsingH3 ? `H3 (res ${h3Resolution})` : 'points'} for zoom ${roundedZoom}`);
      if (startDate || endDate) {
        console.log(`📅 Date range: ${startDate || 'any'} to ${endDate || 'any'}`);
      }
      if (missionId) {
        console.log(`🎯 Mission filter: ${missionId}`);
      }
      if (campaignId) {
        console.log(`🎯 Campaign filter: ${campaignId}`);
      }
      
      setH3Data([]);
      setMeasurements([]);
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
          
          const data = await apiService.getH3Aggregation(params);
          
          const actualResolution = data.resolution ?? requestedResolution;
          const total = data.totalMeasurements ?? 0;
          
          console.log(`✅ ${data.hexagons.length} hexagons loaded for zoom ${roundedZoom} (H3 res ${actualResolution}, ${total} measurements)`);
          setH3Data(data.hexagons);
          setH3Resolution(actualResolution);
          setTotalMeasurements(total);
          setStatistics(data.statistics);
        } else {
          // Zoom >= 16: Cargar puntos individuales desde /api/radiation-measurements/
          const params: any = {
            project: projectId,
          };
          
          // Agregar fechas si están presentes
          if (startDate) params.start_date = startDate;
          if (endDate) params.end_date = endDate;
          
          // Agregar filtros de misión y campaña
          if (missionId) params.mission = missionId;
          if (campaignId) params.campaign = campaignId;
          
          const data = await apiService.getMeasurements(params);
          
          console.log(`✅ ${data.length} individual points loaded for zoom ${roundedZoom}`);
          setMeasurements(data);
          setTotalMeasurements(data.length);
          setStatistics(undefined); // Limpiar estadísticas cuando vemos puntos individuales
        }

        lastLoadedRef.current = { 
          projectId, 
          isH3: isUsingH3, 
          zoom: roundedZoom,
          startDate,
          endDate,
          missionId: missionId ?? -1,
          campaignId: campaignId ?? -1
        };
      } catch (err: any) {
        console.error('❌ Error loading data:', err);
        setError(err.message || 'Error al cargar los datos');
        setMeasurements([]);
        setH3Data([]);
        setTotalMeasurements(0);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedProject, zoom, enabled, isUsingH3, onProgress, filters, missionId, campaignId]);

  return { measurements, h3Data, loading, error, isUsingH3, h3Resolution, totalMeasurements, statistics };
};
