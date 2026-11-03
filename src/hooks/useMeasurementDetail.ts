import { useEffect, useRef, useState } from 'react';
import { Measurement } from '../types';
import apiService from '../services/api';

// Espera antes de pedir el detalle: al pasar el ratón por encima de muchos puntos
// solo se pide el del punto en el que se para.
const DETAIL_DEBOUNCE_MS = 150;

/**
 * Detalle completo (con weather_cache) de la medida bajo el cursor.
 * Los puntos del mapa solo traen coordenadas y valor; el resto se pide aquí,
 * una vez por medida (caché en memoria) y cancelando la petición del punto anterior.
 */
export const useMeasurementDetail = (
  id: number | null | undefined,
  measurementType: 'radiation' | 'light_pollution' = 'radiation'
): { detail: Measurement | null; loading: boolean } => {
  const cacheRef = useRef(new Map<string, Measurement>());
  const [detail, setDetail] = useState<Measurement | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id == null) {
      setDetail(null);
      setLoading(false);
      return;
    }

    const key = `${measurementType}:${id}`;
    const cached = cacheRef.current.get(key);
    if (cached) {
      setDetail(cached);
      setLoading(false);
      return;
    }

    setDetail(null);
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const data = await apiService.getMeasurementDetail(id, measurementType, controller.signal);
        cacheRef.current.set(key, data);
        if (!controller.signal.aborted) setDetail(data);
      } catch (err) {
        // Sin detalle el tooltip se queda con lo básico (valor y coordenadas)
        if (!controller.signal.aborted) console.warn(`Could not load measurement ${id}:`, err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DETAIL_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [id, measurementType]);

  return { detail, loading };
};
