import React, { useState } from 'react';
import { Select, MenuItem, FormControl, InputLabel, Box, CircularProgress } from '@mui/material';
import { MdSlider, MdTextButton, MdFilledButton } from './MaterialComponents';
import { MapFilters, Project, AdaptiveFilters, CommonFilters, RadiationFilters, LightPollutionFilters, Mission, Campaign } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DateRangeFilter from './filters/DateRangeFilter';
import { ProjectSelector } from './ProjectSelector';
import './FiltersPanelMD3.css';

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
    <div className="md3-filters-panel">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 4px' }}>
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

        {/* Simple stats display - MD3 Surface Container */}
        <div className="md3-stats-simple" style={{ marginTop: '24px' }}>
          <span className="md3-stats-count">
            {(totalMeasurements !== undefined ? totalMeasurements : measurements.length).toLocaleString('es-ES')}
          </span>
          <span className="md3-stats-text">mediciones</span>
        </div>
      </Box>
    </div>
  );
};

export default FiltersPanelMD3;
