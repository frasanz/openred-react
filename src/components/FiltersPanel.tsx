import React, { useState } from 'react';
import { Select, MenuItem, FormControl, InputLabel, Box, CircularProgress, Typography, Slider, Button } from '@mui/material';
import { MapFilters, Project, AdaptiveFilters, CommonFilters, RadiationFilters, LightPollutionFilters, Mission, Campaign } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import DateRangeFilter from './filters/DateRangeFilter';
import { ProjectSelector } from './ProjectSelector';
import apiService from '../services/api';
import RadiationHistogram from './RadiationHistogram';
import { HistogramFetchParams } from '../hooks/useMeasurementsByZoom';

interface FiltersPanelMD3Props {
  measurements?: any[];
  filteredMeasurements?: any[];
  selectedProject?: Project | null;
  onProjectChange?: (project: Project) => void;

  // Props para filtros adaptativos
  adaptiveFilters?: AdaptiveFilters;
  onCommonFiltersChange?: (filters: Partial<CommonFilters>) => void;
  onRadiationFiltersChange?: (filters: Partial<RadiationFilters>) => void;

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
  viewBounds?: { north: number; south: number; east: number; west: number };
  histogramFetchParams?: HistogramFetchParams;
}

// Rangos por defecto para los sliders
const ALTITUDE_MIN = -100;
const ALTITUDE_MAX = 10000;
const SPEED_MIN = 0;
const SPEED_MAX = 1000;
const DOSE_RATE_MIN = 0;
const DOSE_RATE_MAX = 10;

const FiltersPanelMD3: React.FC<FiltersPanelMD3Props> = ({
  measurements = [],
  filteredMeasurements = [],
  selectedProject = null,
  onProjectChange,

  // Props para filtros adaptativos
  adaptiveFilters,
  onCommonFiltersChange,
  onRadiationFiltersChange,

  // Props para filtros de misión y campaña
  missions = [],
  campaigns = [],
  selectedMission,
  selectedCampaign,
  loadingCampaigns = false,
  onMissionChange,
  onCampaignChange,

  // Nueva prop para total de mediciones
  totalMeasurements,
  viewBounds,
  histogramFetchParams,
}) => {
  const isRadiation = selectedProject?.project_type === 'radiation';
  const isLightPollution = selectedProject?.project_type === 'light_pollution';
  const [downloadingReport, setDownloadingReport] = useState(false);

  // Estado local de los sliders — inicializado desde adaptiveFilters para reflejar valores persistidos
  const [altitudeRange, setAltitudeRange] = useState<[number, number]>([
    adaptiveFilters?.common?.minAltitude ?? ALTITUDE_MIN,
    adaptiveFilters?.common?.maxAltitude ?? ALTITUDE_MAX,
  ]);
  const [speedRange, setSpeedRange] = useState<[number, number]>([
    adaptiveFilters?.common?.minSpeed ?? SPEED_MIN,
    adaptiveFilters?.common?.maxSpeed ?? SPEED_MAX,
  ]);
  const [doseRateRange, setDoseRateRange] = useState<[number, number]>([
    adaptiveFilters?.radiation?.minDoseRate ?? DOSE_RATE_MIN,
    adaptiveFilters?.radiation?.maxDoseRate ?? DOSE_RATE_MAX,
  ]);

  // Sincronizar sliders cuando adaptiveFilters carga desde localStorage (solo una vez)
  const initializedRef = React.useRef(false);
  React.useEffect(() => {
    if (initializedRef.current || !adaptiveFilters) return;
    const { common, radiation } = adaptiveFilters;
    if (common.minAltitude !== undefined || common.maxAltitude !== undefined) {
      setAltitudeRange([common.minAltitude ?? ALTITUDE_MIN, common.maxAltitude ?? ALTITUDE_MAX]);
    }
    if (common.minSpeed !== undefined || common.maxSpeed !== undefined) {
      setSpeedRange([common.minSpeed ?? SPEED_MIN, common.maxSpeed ?? SPEED_MAX]);
    }
    if (radiation?.minDoseRate !== undefined || radiation?.maxDoseRate !== undefined) {
      setDoseRateRange([radiation.minDoseRate ?? DOSE_RATE_MIN, radiation.maxDoseRate ?? DOSE_RATE_MAX]);
    }
    initializedRef.current = true;
  }, [adaptiveFilters]);

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

  // Handlers de los sliders - solo aplican al soltar (onChangeCommitted)
  const handleAltitudeCommit = React.useCallback((_: any, value: number | number[]) => {
    const [min, max] = value as number[];
    if (onCommonFiltersChange) {
      onCommonFiltersChange({
        minAltitude: min === ALTITUDE_MIN ? undefined : min,
        maxAltitude: max === ALTITUDE_MAX ? undefined : max,
      });
    }
  }, [onCommonFiltersChange]);

  const handleSpeedCommit = React.useCallback((_: any, value: number | number[]) => {
    const [min, max] = value as number[];
    if (onCommonFiltersChange) {
      onCommonFiltersChange({
        minSpeed: min === SPEED_MIN ? undefined : min,
        maxSpeed: max === SPEED_MAX ? undefined : max,
      });
    }
  }, [onCommonFiltersChange]);

  const handleDoseRateCommit = React.useCallback((_: any, value: number | number[]) => {
    const [min, max] = value as number[];
    if (onRadiationFiltersChange) {
      onRadiationFiltersChange({
        minDoseRate: min === DOSE_RATE_MIN ? undefined : min,
        maxDoseRate: max === DOSE_RATE_MAX ? undefined : max,
      });
    }
  }, [onRadiationFiltersChange]);

  const handleDownloadReport = React.useCallback(async () => {
    if (!selectedProject) return;
    setDownloadingReport(true);
    try {
      const params: Record<string, any> = { project: selectedProject.id };
      const startDate = adaptiveFilters?.common?.startDate;
      const endDate = adaptiveFilters?.common?.endDate;
      if (startDate) params.start_date = startDate.toISOString().split('T')[0];
      if (endDate) params.end_date = endDate.toISOString().split('T')[0];
      if (selectedMission) params.mission = selectedMission;
      if (selectedCampaign) params.campaign = selectedCampaign;
      if (adaptiveFilters?.common?.minAltitude !== undefined) params.min_altitude = adaptiveFilters.common.minAltitude;
      if (adaptiveFilters?.common?.maxAltitude !== undefined) params.max_altitude = adaptiveFilters.common.maxAltitude;
      if (adaptiveFilters?.common?.minSpeed !== undefined) params.min_speed = adaptiveFilters.common.minSpeed / 3.6;
      if (adaptiveFilters?.common?.maxSpeed !== undefined) params.max_speed = adaptiveFilters.common.maxSpeed / 3.6;
      if (viewBounds) {
        params.north = viewBounds.north;
        params.south = viewBounds.south;
        params.east = viewBounds.east;
        params.west = viewBounds.west;
      }
      await apiService.downloadLightPollutionReport(params);
    } catch (err) {
      console.error('Error descargando report:', err);
    } finally {
      setDownloadingReport(false);
    }
  }, [selectedProject, adaptiveFilters, selectedMission, selectedCampaign, viewBounds]);

  const handleDownloadRadiationReport = React.useCallback(async () => {
    if (!selectedProject) return;
    setDownloadingReport(true);
    try {
      const params: Record<string, any> = { project: selectedProject.id };
      const startDate = adaptiveFilters?.common?.startDate;
      const endDate = adaptiveFilters?.common?.endDate;
      if (startDate) params.start_date = startDate.toISOString().split('T')[0];
      if (endDate) params.end_date = endDate.toISOString().split('T')[0];
      if (selectedMission) params.mission = selectedMission;
      if (selectedCampaign) params.campaign = selectedCampaign;
      if (adaptiveFilters?.common?.minAltitude !== undefined) params.min_altitude = adaptiveFilters.common.minAltitude;
      if (adaptiveFilters?.common?.maxAltitude !== undefined) params.max_altitude = adaptiveFilters.common.maxAltitude;
      if (adaptiveFilters?.common?.minSpeed !== undefined) params.min_speed = adaptiveFilters.common.minSpeed / 3.6;
      if (adaptiveFilters?.common?.maxSpeed !== undefined) params.max_speed = adaptiveFilters.common.maxSpeed / 3.6;
      if (adaptiveFilters?.radiation?.minDoseRate !== undefined) params.min_dose_rate = adaptiveFilters.radiation.minDoseRate;
      if (adaptiveFilters?.radiation?.maxDoseRate !== undefined) params.max_dose_rate = adaptiveFilters.radiation.maxDoseRate;
      if (viewBounds) {
        params.north = viewBounds.north;
        params.south = viewBounds.south;
        params.east = viewBounds.east;
        params.west = viewBounds.west;
      }
      await apiService.downloadRadiationReport(params);
    } catch (err) {
      console.error('Error descargando report de radiación:', err);
    } finally {
      setDownloadingReport(false);
    }
  }, [selectedProject, adaptiveFilters, selectedMission, selectedCampaign, viewBounds]);

  const sliderSx = {
    color: '#0751A4',
    '& .MuiSlider-thumb': { width: 14, height: 14 },
    '& .MuiSlider-rail': { opacity: 0.3 },
  };

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
            <FormControl fullWidth size="small" sx={{ 
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#0751A4',
                  borderWidth: '1px',
                },
                '&:hover fieldset': {
                  borderColor: '#0751A4',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0751A4',
                },
              }
            }}>
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
            sx={{ 
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: '#0751A4',
                  borderWidth: '1px',
                },
                '&:hover fieldset': {
                  borderColor: '#0751A4',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#0751A4',
                },
              }
            }}
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
      <Box>
        <DateRangeFilter
          startDate={effectiveFilters.startDate}
          endDate={effectiveFilters.endDate}
          onChange={handleDateRangeFiltersChange}
        />
      </Box>

      {/* Altitude Filter */}
      <Box sx={{ px: 1 }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Altitud (m)
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>{altitudeRange[0]} m</Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>{altitudeRange[1]} m</Typography>
        </Box>
        <Slider
          value={altitudeRange}
          min={ALTITUDE_MIN}
          max={ALTITUDE_MAX}
          step={10}
          onChange={(_, v) => setAltitudeRange(v as [number, number])}
          onChangeCommitted={handleAltitudeCommit}
          sx={sliderSx}
          size="small"
        />
      </Box>

      {/* Speed Filter */}
      <Box sx={{ px: 1 }}>
        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Velocidad (km/h)
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>{speedRange[0]} km/h</Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>{speedRange[1]} km/h</Typography>
        </Box>
        <Slider
          value={speedRange}
          min={SPEED_MIN}
          max={SPEED_MAX}
          step={1}
          onChange={(_, v) => setSpeedRange(v as [number, number])}
          onChangeCommitted={handleSpeedCommit}
          sx={sliderSx}
          size="small"
        />
      </Box>

      {/* Dose Rate Filter - solo para proyectos de radiación */}
      {isRadiation && (
        <Box sx={{ px: 1 }}>
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
            Radiación (µSv/h)
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>{doseRateRange[0].toFixed(2)} µSv/h</Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>{doseRateRange[1].toFixed(2)} µSv/h</Typography>
          </Box>
          <Slider
            value={doseRateRange}
            min={DOSE_RATE_MIN}
            max={DOSE_RATE_MAX}
            step={0.01}
            onChange={(_, v) => setDoseRateRange(v as [number, number])}
            onChangeCommitted={handleDoseRateCommit}
            sx={sliderSx}
            size="small"
          />
        </Box>
      )}

      {/* Botón de descarga de report - solo para light pollution */}
      {isLightPollution && (
        <Button
          variant="outlined"
          fullWidth
          disabled={downloadingReport}
          onClick={handleDownloadReport}
          sx={{ borderColor: '#0751A4', color: '#0751A4' }}
        >
          {downloadingReport ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
          {downloadingReport ? 'Descargando...' : 'Descargar report'}
        </Button>
      )}

      {/* Histograma de distribución de dosis - solo para radiación */}
      {isRadiation && selectedProject && (
        <RadiationHistogram fetchParams={histogramFetchParams} />
      )}

      {/* Botón de descarga de report - solo para radiación */}
      {isRadiation && (
        <Button
          variant="outlined"
          fullWidth
          disabled={downloadingReport}
          onClick={handleDownloadRadiationReport}
          sx={{ borderColor: '#0751A4', color: '#0751A4' }}
        >
          {downloadingReport ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
          {downloadingReport ? 'Descargando...' : 'Descargar report'}
        </Button>
      )}

      {/* Simple stats display */}
      <Box 
        sx={{ 
          p: 2, 
          bgcolor: '#000000',
          borderRadius: 2,
          textAlign: 'center',
          color: '#CDDCED'
        }}
      >
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: '#CDDCED' }}>
          {(totalMeasurements !== undefined ? totalMeasurements : measurements.length).toLocaleString('es-ES')}
        </Typography>
        <Typography variant="body2" component="div" sx={{ color: '#CDDCED' }}>
          mediciones
        </Typography>
      </Box>
    </Box>
  );
};

export default FiltersPanelMD3;
