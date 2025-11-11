import React, { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { Box, Alert, Snackbar, Chip, Typography, Paper } from '@mui/material';
import MapComponent from '../components/MapComponent';
import LoadingProgress from '../components/LoadingProgress';
import { Measurement, Campaign, Mission, MapFilters, Project } from '../types';
import apiService from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useProjectContext } from '../context/ProjectContext';
import { useAdaptiveFilters } from '../hooks/useAdaptiveFilters';
import { useMeasurementsByZoom } from '../hooks/useMeasurementsByZoom';

const HomePage: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { selectedProject, setSelectedProject, isRadiationProject, isLightPollutionProject } = useProjectContext();
  
  // Hook para filtros adaptativos (solo rango temporal)
  const {
    filters: adaptiveFilters,
    updateCommonFilters,
    persistFilters,
  } = useAdaptiveFilters(selectedProject);
  
  const [missions, setMissions] = useState<Mission[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedMission, setSelectedMission] = useState<number | undefined>(undefined);
  const [selectedCampaign, setSelectedCampaign] = useState<number | undefined>(undefined);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(5.5); // Zoom inicial
  
  // Estado para la barra de progreso
  const [loadingProgress, setLoadingProgress] = useState({
    loaded: 0,
    total: 0,
    percentage: 0
  });

  // Ref para throttling de actualizaciones
  const lastUpdateTime = React.useRef(0);

  // Función para actualizar el progreso con logging para debug
  const updateProgress = React.useCallback((loaded: number, total: number) => {
    const percentage = total > 0 ? (loaded / total) * 100 : 0;
    const now = Date.now();
    
    // Throttling: actualizar máximo cada 100ms, excepto para la primera y última actualización
    const shouldUpdate = loaded === 0 || loaded === total || (now - lastUpdateTime.current) > 100;
    
    if (shouldUpdate) {
      console.log(`🔄 Progress update called: ${loaded}/${total} (${percentage.toFixed(1)}%)`);
      lastUpdateTime.current = now;
      
      // Usar flushSync para forzar una actualización inmediata del estado
      flushSync(() => {
        setLoadingProgress(prev => {
          console.log(`📊 Progress state changing from ${prev.loaded}/${prev.total} to ${loaded}/${total}`);
          return { loaded, total, percentage };
        });
      });
    }
  }, []);

  // Hook para cargar mediciones según el zoom
  const { 
    measurements, 
    h3Data,
    h3Resolution,
    totalMeasurements,
    loading: dataLoading, 
    error: measurementsError,
    isUsingH3,
    statistics
  } = useMeasurementsByZoom({
    selectedProject,
    zoom: currentZoom,
    enabled: !!selectedProject,
    onProgress: updateProgress,
    filters: adaptiveFilters,
    missionId: selectedMission,
    campaignId: selectedCampaign
  });
  
  // Persistir filtros cuando cambien
  useEffect(() => {
    persistFilters();
  }, [persistFilters]);

  // Manejar errores del hook de mediciones
  useEffect(() => {
    if (measurementsError) {
      setError(measurementsError);
    }
  }, [measurementsError]);

  // Función para cargar campañas de una misión específica
  const loadCampaignsForMission = async (missionId: number) => {
    const projectId = selectedProject?.id;
    if (!projectId) {
      console.warn('⚠️ No project selected, cannot load campaigns');
      return;
    }

    setLoadingCampaigns(true);
    try {
      console.log(`🔍 Loading campaigns for mission ${missionId} and project ${projectId}`);
      const campaignsData = await apiService.getCampaigns(missionId, projectId);
      console.log('✅ Campaigns loaded:', campaignsData);
      setCampaigns(campaignsData);
    } catch (err) {
      console.error('❌ Error loading campaigns:', err);
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  // Cargar misiones cuando haya un proyecto seleccionado
  useEffect(() => {
    if (!selectedProject) {
      return;
    }

    const controller = new AbortController();

    const loadMissions = async () => {
      try {
        console.log('🔍 Loading missions...');
        const missionsData = await apiService.getMissions();
        if (!controller.signal.aborted) {
          console.log('✅ Missions loaded:', missionsData.length);
          setMissions(missionsData);
        }
      } catch (missionError) {
        if (!controller.signal.aborted) {
          console.log('⚠️ Missions not loaded (may require authentication):', missionError);
        }
      }
    };

    loadMissions();

    // Cleanup function
    return () => {
      controller.abort();
    };
  }, [selectedProject?.id]);

  // Callback para manejar cambios de zoom desde el MapComponent
  const handleZoomChange = useCallback((newZoom: number) => {
    setCurrentZoom(newZoom);
  }, []);

  // Handlers para cambios de misión y campaña
  const handleMissionChange = (missionId: number | undefined) => {
    setSelectedMission(missionId);
    setSelectedCampaign(undefined); // Reset campaign when mission changes
    setCampaigns([]); // Clear campaigns
    if (missionId) {
      loadCampaignsForMission(missionId);
    }
  };

  const handleCampaignChange = (campaignId: number | undefined) => {
    setSelectedCampaign(campaignId);
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      
      {/* Contenedor del mapa que ocupa el espacio restante */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        {/* Mostrar barra de progreso si está cargando */}
        {dataLoading && (
          <Box sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <LoadingProgress 
              loaded={loadingProgress.loaded}
              total={loadingProgress.total} 
              percentage={loadingProgress.percentage}
              isLoading={dataLoading}
            />
          </Box>
        )}
        
        <MapComponent
          measurements={measurements}
          campaigns={campaigns}
          loading={dataLoading}
          selectedProject={selectedProject}
          onProjectChange={setSelectedProject}
          // Solo filtros de rango temporal
          adaptiveFilters={adaptiveFilters}
          onCommonFiltersChange={updateCommonFilters}
          // Filtros de misión y campaña
          missions={missions}
          selectedMission={selectedMission}
          selectedCampaign={selectedCampaign}
          loadingCampaigns={loadingCampaigns}
          onMissionChange={handleMissionChange}
          onCampaignChange={handleCampaignChange}
          // Pasar datos H3 y callback de zoom
          h3Data={h3Data}
          h3Resolution={h3Resolution}
          isUsingH3={isUsingH3}
          onZoomChange={handleZoomChange}
          totalMeasurements={totalMeasurements}
          statistics={statistics}
        />
      </Box>
      
      {/* Snackbar para errores */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseError} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default HomePage;
