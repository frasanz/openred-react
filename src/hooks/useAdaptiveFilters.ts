import { useState, useEffect, useCallback } from 'react';
import { AdaptiveFilters, CommonFilters, RadiationFilters, LightPollutionFilters, Project } from '../types';

// Valores por defecto para filtros comunes
const getDefaultCommonFilters = (): CommonFilters => ({
  startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 año atrás
  endDate: new Date(), // Hoy
  dataQuality: ['excellent', 'good', 'fair'], // Excluir solo 'poor' por defecto
  minAccuracy: 0,
  maxAccuracy: 50, // metros
});

// Valores por defecto para filtros de radiación
const getDefaultRadiationFilters = (): RadiationFilters => ({
  minIntensity: 0,
  maxIntensity: 500, // nSv/h
  units: 'nSv/h',
  detectorType: [], // Todos los tipos
  backgroundSubtracted: undefined, // Ambos
  minCPM: undefined,
  maxCPM: undefined,
});

// Valores por defecto para filtros de contaminación lumínica
const getDefaultLightPollutionFilters = (): LightPollutionFilters => ({
  minBrightness: 10,
  maxBrightness: 25, // mag/arcsec²
  units: 'mag/arcsec²',
  bortleClass: [], // Todas las clases
  moonPhase: undefined,
  observationDirection: [], // Todas las direcciones
});

// Hook principal para gestión de filtros adaptativos
export const useAdaptiveFilters = (selectedProject: Project | null) => {
  const [filters, setFilters] = useState<AdaptiveFilters>(() => ({
    common: getDefaultCommonFilters(),
    radiation: getDefaultRadiationFilters(),
    lightPollution: getDefaultLightPollutionFilters(),
  }));

  // Función para actualizar filtros comunes
  const updateCommonFilters = useCallback((newFilters: Partial<CommonFilters>) => {
    setFilters(prev => ({
      ...prev,
      common: { ...prev.common, ...newFilters }
    }));
  }, []);

  // Función para actualizar filtros de radiación
  const updateRadiationFilters = useCallback((newFilters: Partial<RadiationFilters>) => {
    setFilters(prev => ({
      ...prev,
      radiation: prev.radiation ? { ...prev.radiation, ...newFilters } : { ...getDefaultRadiationFilters(), ...newFilters }
    }));
  }, []);

  // Función para actualizar filtros de contaminación lumínica
  const updateLightPollutionFilters = useCallback((newFilters: Partial<LightPollutionFilters>) => {
    setFilters(prev => ({
      ...prev,
      lightPollution: prev.lightPollution ? { ...prev.lightPollution, ...newFilters } : { ...getDefaultLightPollutionFilters(), ...newFilters }
    }));
  }, []);

  // Resetear filtros específicos al cambiar tipo de proyecto
  useEffect(() => {
    if (!selectedProject) return;

    if (selectedProject.project_type === 'radiation') {
      setFilters(prev => ({
        ...prev,
        radiation: getDefaultRadiationFilters(),
        // Mantener common, limpiar lightPollution para optimizar memoria
        lightPollution: undefined,
      }));
    } else if (selectedProject.project_type === 'light_pollution') {
      setFilters(prev => ({
        ...prev,
        lightPollution: getDefaultLightPollutionFilters(),
        // Mantener common, limpiar radiation para optimizar memoria
        radiation: undefined,
      }));
    }
  }, [selectedProject?.project_type]);

  // Función para persistir filtros en localStorage
  const persistFilters = useCallback(() => {
    try {
      // Guardar filtros comunes
      localStorage.setItem('openred_common_filters', JSON.stringify(filters.common));
      
      // Guardar filtros específicos según el tipo de proyecto
      if (selectedProject?.project_type === 'radiation' && filters.radiation) {
        localStorage.setItem('openred_radiation_filters', JSON.stringify(filters.radiation));
      } else if (selectedProject?.project_type === 'light_pollution' && filters.lightPollution) {
        localStorage.setItem('openred_light_pollution_filters', JSON.stringify(filters.lightPollution));
      }
    } catch (error) {
      console.warn('Could not persist filters to localStorage:', error);
    }
  }, [filters, selectedProject?.project_type]);

  // Función para cargar filtros desde localStorage
  const loadPersistedFilters = useCallback(() => {
    try {
      // Cargar filtros comunes
      const savedCommonFilters = localStorage.getItem('openred_common_filters');
      if (savedCommonFilters) {
        const parsed = JSON.parse(savedCommonFilters);
        // Convertir fechas de string a Date
        if (parsed.startDate) parsed.startDate = new Date(parsed.startDate);
        if (parsed.endDate) parsed.endDate = new Date(parsed.endDate);
        updateCommonFilters(parsed);
      }

      // Cargar filtros específicos según el tipo de proyecto
      if (selectedProject?.project_type === 'radiation') {
        const savedRadiationFilters = localStorage.getItem('openred_radiation_filters');
        if (savedRadiationFilters) {
          updateRadiationFilters(JSON.parse(savedRadiationFilters));
        }
      } else if (selectedProject?.project_type === 'light_pollution') {
        const savedLightPollutionFilters = localStorage.getItem('openred_light_pollution_filters');
        if (savedLightPollutionFilters) {
          updateLightPollutionFilters(JSON.parse(savedLightPollutionFilters));
        }
      }
    } catch (error) {
      console.warn('Could not load persisted filters from localStorage:', error);
    }
  }, [selectedProject?.project_type, updateCommonFilters, updateRadiationFilters, updateLightPollutionFilters]);

  // Cargar filtros persistidos al montar o cambiar proyecto
  useEffect(() => {
    loadPersistedFilters();
  }, [loadPersistedFilters]);

  // Función para obtener los filtros activos según el tipo de proyecto
  const getActiveFilters = useCallback((): { common: CommonFilters; specific: RadiationFilters | LightPollutionFilters | null } => {
    if (selectedProject?.project_type === 'radiation') {
      return { common: filters.common, specific: filters.radiation || getDefaultRadiationFilters() };
    } else if (selectedProject?.project_type === 'light_pollution') {
      return { common: filters.common, specific: filters.lightPollution || getDefaultLightPollutionFilters() };
    }
    return { common: filters.common, specific: null };
  }, [filters, selectedProject?.project_type]);

  return {
    filters,
    updateCommonFilters,
    updateRadiationFilters,
    updateLightPollutionFilters,
    getActiveFilters,
    persistFilters,
    loadPersistedFilters,
    // Funciones de utilidad
    resetToDefaults: useCallback(() => {
      setFilters({
        common: getDefaultCommonFilters(),
        radiation: getDefaultRadiationFilters(),
        lightPollution: getDefaultLightPollutionFilters(),
      });
    }, []),
  };
};

export { getDefaultCommonFilters, getDefaultRadiationFilters, getDefaultLightPollutionFilters };
