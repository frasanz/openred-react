import { useState, useEffect, useRef } from 'react';
import apiService from '../services/api';
import { RadiationSpectrumMarker } from '../types';

interface UseSpectraMarkersOptions {
  enabled: boolean;
  projectId?: number;
}

interface UseSpectraMarkersResult {
  spectra: RadiationSpectrumMarker[];
  loading: boolean;
  error: string | null;
}

/**
 * Carga los marcadores de espectros de radiación (GET /api/radiation-spectra/map/).
 *
 * Trae todos los espectros del proyecto de una vez (array plano, sin bbox): son pocos
 * por track, así no parpadean al hacer pan y es una sola petición. El endpoint soporta
 * bbox (ver apiService.getRadiationSpectraMap) por si en el futuro hace falta paginar
 * por viewport o agregar por H3.
 */
export const useSpectraMarkers = ({ enabled, projectId }: UseSpectraMarkersOptions): UseSpectraMarkersResult => {
  const [spectra, setSpectra] = useState<RadiationSpectrumMarker[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Proyecto ya cargado, para no repetir la petición mientras el switch sigue activo
  const loadedProjectRef = useRef<number | null>(null);

  useEffect(() => {
    // Switch apagado o sin proyecto: limpiar y soltar la capa
    if (!enabled || !projectId) {
      setSpectra([]);
      setError(null);
      loadedProjectRef.current = null;
      return;
    }

    // Ya tenemos los espectros de este proyecto
    if (loadedProjectRef.current === projectId) return;

    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getRadiationSpectraMap({ project: projectId });
        if (!cancelled) {
          setSpectra(data);
          loadedProjectRef.current = projectId;
          console.log(`${data.length} espectros cargados para el proyecto ${projectId}`);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error('Error cargando espectros:', err);
          setError(err.message || 'Error al cargar espectros');
          setSpectra([]);
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

  return { spectra, loading, error };
};
