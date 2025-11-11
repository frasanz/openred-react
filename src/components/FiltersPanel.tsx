import React, { useState } from 'react';
import { Select, MenuItem, FormControl, InputLabel, Box, CircularProgress, Typography } from '@mui/material';
import { MapFilters, Project, AdaptiveFilters, CommonFilters, RadiationFilters, LightPollutionFilters, Mission, Campaign } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DateRangeFilter from './filters/DateRangeFilter';
import { ProjectSelector } from './ProjectSelector';

interface FiltersPanelMD3Props {
  measurements?: any[];
  filteredMeasurements?: any[];
  selectedProject?: Project | null;
  onProjectChange?: (project: Project) => void;
  
  // Props para filtros adaptativos (solo rango temporal)
  adaptiveFilters?: AdaptiveFilters;
  onCommonFiltersChange?: (filters: Partial<CommonFilters>) => void;
  
  // Props para filtros de misión y campaña
  missions?: Mission[];
  campaigns?: Campaign[];
  selectedMission?: number;
  selectedCampaign?: number;
  loadingCampaigns?: boolean;
  onMissionChange?: (missionId: number | undefined) => void;
  onCampaignChange?: (campaignId: number | undefined) => void;
  
  // Nueva prop para total de mediciones del servidor
  totalMeasurements?: number;
}

const FiltersPanelMD3: React.FC<FiltersPanelMD3Props> = ({ 
  measurements = [],
  filteredMeasurements = [],
  selectedProject = null,
  onProjectChange,
  
  // Props para filtros adaptativos (solo rango temporal)
  adaptiveFilters,
  onCommonFiltersChange,
  
  // Props para filtros de misión y campaña
  missions = [],
  campaigns = [],
  selectedMission,
  selectedCampaign,
  loadingCampaigns = false,
  onMissionChange,
  onCampaignChange,
  
  // Nueva prop para total de mediciones
  totalMeasurements
}) => {
  // Determinar si usar filtros adaptativos
  const usingAdaptiveFilters = !!(adaptiveFilters && onCommonFiltersChange);

  // Obtener filtros efectivos (solo rango temporal)
  const effectiveFilters = usingAdaptiveFilters && adaptiveFilters ? {
    startDate: adaptiveFilters.common.startDate,
    endDate: adaptiveFilters.common.endDate,
  } : {
    startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    endDate: new Date()
  };

  // Helper function to handle date range changes
  const handleDateRangeFiltersChange = React.useCallback((startDate: Date, endDate: Date) => {
    if (onCommonFiltersChange) {
      onCommonFiltersChange({ startDate, endDate });
    }
  }, [onCommonFiltersChange]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      {/* Project Selector */}
      {onProjectChange && (
        <ProjectSelector
          selectedProject={selectedProject}
          onProjectChange={onProjectChange}
        />
      )}

      {/* Mission and Campaign Filters */}
      {onMissionChange && onCampaignChange && (
        <>
            {/* Mission Selector */}
            <FormControl fullWidth size="small">
                <InputLabel shrink={true}>Misión</InputLabel>
            <Select
              value={selectedMission || ''}
              label="Misión"
              onChange={(e) => {
                const value = e.target.value;
                onMissionChange(value ? Number(value) : undefined);
              }}
              displayEmpty
              notched
              renderValue={(value) => {
                if (!value) {
                  return <span style={{ color: '#64748b' }}>Todas las misiones</span>;
                }
                const mission = missions.find((m) => m.id === value);
                return mission ? mission.name : '';
              }}
            >
              <MenuItem value="">
                Todas las misiones
              </MenuItem>
              {missions.map((mission) => (
                <MenuItem key={mission.id} value={mission.id}>
                  {mission.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Campaign Selector */}
          <FormControl 
            fullWidth 
            size="small"
            disabled={!selectedMission || loadingCampaigns}
          >
            <InputLabel shrink={true}>Campaña</InputLabel>
            <Select
              value={selectedCampaign || ''}
              label="Campaña"
              onChange={(e) => {
                const value = e.target.value;
                onCampaignChange(value ? Number(value) : undefined);
              }}
              displayEmpty
              notched
              renderValue={(value) => {
                if (!value) {
                  if (!selectedMission) {
                    return <span style={{ color: '#94a3b8' }}>Selecciona una misión primero</span>;
                  }
                  return <span style={{ color: '#64748b' }}>Todas las campañas</span>;
                }
                const campaign = campaigns.find((c) => c.id === value);
                return campaign ? campaign.name : '';
              }}
              endAdornment={
                loadingCampaigns ? (
                  <CircularProgress size={20} sx={{ mr: 2 }} />
                ) : null
              }
            >
              <MenuItem value="">
                {!selectedMission ? 'Selecciona una misión primero' : 'Todas las campañas'}
              </MenuItem>
              {campaigns.map((campaign) => (
                <MenuItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          </>
        )}

      {/* Date Range Filter - Elegant Date Picker */}
      <Box sx={{ mt: 1 }}>
        <DateRangeFilter
          startDate={effectiveFilters.startDate}
          endDate={effectiveFilters.endDate}
          onChange={handleDateRangeFiltersChange}
        />
      </Box>

      {/* Simple stats display */}
      <Box 
        sx={{ 
          mt: 3,
          p: 2, 
          bgcolor: 'primary.main',
          borderRadius: 2,
          textAlign: 'center',
          color: 'primary.contrastText'
        }}
      >
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
          {(totalMeasurements !== undefined ? totalMeasurements : measurements.length).toLocaleString('es-ES')}
        </Typography>
        <Typography variant="body2" component="div">
          mediciones
        </Typography>
      </Box>
    </Box>
  );
};

export default FiltersPanelMD3;
