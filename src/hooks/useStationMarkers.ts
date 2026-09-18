import { useState, useEffect, useRef } from 'react';
import apiService from '../services/api';
import { PublicStation } from '../types';

interface UseStationMarkersOptions {
  enabled: boolean;
  projectId?: number;
}

interface UseStationMarkersResult {
  stations: PublicStation[];
  loading: boolean;
  error: string | null;
}

/**
 * Carga las estaciones estáticas de un proyecto (GET /api/stations/by-project/).
 *
 * Público, sin autenticación. Array plano sin bbox: se piden todas las del proyecto
 * de una vez al activar el switch, igual que useSpectraMarkers.
 */
export const useStationMarkers = ({ enabled, projectId }: UseStationMarkersOptions): UseStationMarkersResult => {
  const [stations, setStations] = useState<PublicStation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Proyecto ya cargado, para no repetir la petición mientras el switch sigue activo
  const loadedProjectRef = useRef<number | null>(null);

  useEffect(() => {
    // Switch apagado o sin proyecto: limpiar y soltar la capa
    if (!enabled || !projectId) {
      setStations([]);
      setError(null);
      loadedProjectRef.current = null;
      return;
    }

    // Ya tenemos las estaciones de este proyecto
    if (loadedProjectRef.current === projectId) return;

    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getStationsByProject({ project: projectId });
        if (!cancelled) {
          setStations(data);
          loadedProjectRef.current = projectId;
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Error cargando estaciones:', err);
          setError(err.message || 'Error al cargar estaciones');
          setStations([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [enabled, projectId]);

  return { stations, loading, error };
};
