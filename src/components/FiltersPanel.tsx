import React, { useState } from 'react';
import { Select, MenuItem, FormControl, Box, CircularProgress, Typography, Slider, Button } from '@mui/material';
import { MapFilters, Project, AdaptiveFilters, CommonFilters, RadiationFilters, LightPollutionFilters, Mission, Campaign } from '../types';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../utils/i18nFormat';
import DateRangeFilter from './filters/DateRangeFilter';
import { ProjectSelector } from './ProjectSelector';
import apiService from '../services/api';
import RadiationHistogram from './RadiationHistogram';
import { HistogramFetchParams } from '../hooks/useMeasurementsByZoom';
import { Section } from './ui/Section';
import { darkTokens as T } from '../theme/tokens';
import { MONO } from '../theme/theme';

// Ticks (marks) para los sliders — solo posiciones, sin etiqueta
const makeTicks = (min: number, max: number, n = 4) =>
  Array.from({ length: n + 1 }, (_, i) => ({ value: min + ((max - min) * i) / n }));
const ALT_TICKS = makeTicks(-100, 10000, 4);
const SPEED_TICKS = makeTicks(0, 1000, 4);
const DOSE_TICKS = makeTicks(0, 10, 5);

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
  const { t } = useTranslation('filters');
  const { formatNumber } = useLocale();
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

  const days = Math.max(
    0,
    Math.round((effectiveFilters.endDate.getTime() - effectiveFilters.startDate.getTime()) / 86400000)
  );
  const totalCount = totalMeasurements !== undefined ? totalMeasurements : measurements.length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', color: T.text }}>
      <Typography
        sx={{ fontFamily: MONO, fontSize: 11, fontWeight: 600, letterSpacing: '1px', color: T.text, mb: 0.5 }}
      >
        {t('panel.title')}
      </Typography>

      {/* Project */}
      {onProjectChange && (
        <Section label={t('panel.project')} divider={false}>
          <ProjectSelector selectedProject={selectedProject} onProjectChange={onProjectChange} />
        </Section>
      )}

      {/* Mission + Campaign */}
      {onMissionChange && onCampaignChange && (
        <>
          <Section label={t('panel.mission')} right={t('panel.missionsActive', { count: missions.length })}>
            <FormControl fullWidth size="small">
              <Select
                value={selectedMission || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  onMissionChange(value ? Number(value) : undefined);
                }}
                displayEmpty
                renderValue={(value) => {
                  if (!value) {
                    return <span style={{ color: T.textDim }}>{t('panel.allMissions')}</span>;
                  }
                  const mission = missions.find((m) => m.id === value);
                  return mission ? mission.name : '';
                }}
              >
                <MenuItem value="">{t('panel.allMissions')}</MenuItem>
                {missions.map((mission) => (
                  <MenuItem key={mission.id} value={mission.id}>
                    {mission.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Section>

          <Section label={t('panel.campaign')}>
            <FormControl fullWidth size="small" disabled={!selectedMission || loadingCampaigns}>
              <Select
                value={selectedCampaign || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  onCampaignChange(value ? Number(value) : undefined);
                }}
                displayEmpty
                renderValue={(value) => {
                  if (!value) {
                    if (!selectedMission) {
                      return <span style={{ color: T.textDim }}>{t('panel.selectMissionFirst')}</span>;
                    }
                    return <span style={{ color: T.textDim }}>{t('panel.allCampaigns')}</span>;
                  }
                  const campaign = campaigns.find((c) => c.id === value);
                  return campaign ? campaign.name : '';
                }}
                endAdornment={loadingCampaigns ? <CircularProgress size={16} sx={{ mr: 2 }} /> : null}
              >
                <MenuItem value="">
                  {!selectedMission ? t('panel.selectMissionFirst') : t('panel.allCampaigns')}
                </MenuItem>
                {campaigns.map((campaign) => (
                  <MenuItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Section>
        </>
      )}

      {/* Date Range */}
      <Section label={t('panel.dateRange')} right={t('panel.days', { value: formatNumber(days) })}>
        <DateRangeFilter
          startDate={effectiveFilters.startDate}
          endDate={effectiveFilters.endDate}
          onChange={handleDateRangeFiltersChange}
        />
      </Section>

      {/* Altitude */}
      <Section label={t('panel.altitude')} right="m">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: T.text }}>{altitudeRange[0]}</Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: T.text }}>{altitudeRange[1]}</Typography>
        </Box>
        <Slider
          value={altitudeRange}
          min={ALTITUDE_MIN}
          max={ALTITUDE_MAX}
          step={10}
          marks={ALT_TICKS}
          onChange={(_, v) => setAltitudeRange(v as [number, number])}
          onChangeCommitted={handleAltitudeCommit}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 9, color: T.textDim }}>{ALTITUDE_MIN} m</Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 9, color: T.textDim }}>{ALTITUDE_MAX} m</Typography>
        </Box>
      </Section>

      {/* Speed */}
      <Section label={t('panel.speed')} right="km/h">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: T.text }}>{speedRange[0]}</Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: T.text }}>{speedRange[1]}</Typography>
        </Box>
        <Slider
          value={speedRange}
          min={SPEED_MIN}
          max={SPEED_MAX}
          step={1}
          marks={SPEED_TICKS}
          onChange={(_, v) => setSpeedRange(v as [number, number])}
          onChangeCommitted={handleSpeedCommit}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ fontFamily: MONO, fontSize: 9, color: T.textDim }}>{SPEED_MIN} km/h</Typography>
          <Typography sx={{ fontFamily: MONO, fontSize: 9, color: T.textDim }}>{SPEED_MAX} km/h</Typography>
        </Box>
      </Section>

      {/* Dose Rate (radiación) */}
      {isRadiation && (
        <Section label={t('panel.doseRate')} right="µSv/h">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: T.text }}>{doseRateRange[0].toFixed(2)}</Typography>
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: T.text }}>{doseRateRange[1].toFixed(2)}</Typography>
          </Box>
          <Slider
            value={doseRateRange}
            min={DOSE_RATE_MIN}
            max={DOSE_RATE_MAX}
            step={0.01}
            marks={DOSE_TICKS}
            onChange={(_, v) => setDoseRateRange(v as [number, number])}
            onChangeCommitted={handleDoseRateCommit}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontFamily: MONO, fontSize: 9, color: T.textDim }}>{DOSE_RATE_MIN.toFixed(2)} µSv/h</Typography>
            <Typography sx={{ fontFamily: MONO, fontSize: 9, color: T.textDim }}>{DOSE_RATE_MAX.toFixed(2)} µSv/h</Typography>
          </Box>
        </Section>
      )}

      {/* Distribution (radiación) */}
      {isRadiation && selectedProject && (
        <Section label={t('panel.distribution')} right={formatNumber(totalCount)}>
          <RadiationHistogram fetchParams={histogramFetchParams} />
        </Section>
      )}

      {/* Descarga report - light pollution */}
      {isLightPollution && (
        <Box sx={{ mt: 1.75 }}>
          <Button variant="outlined" fullWidth disabled={downloadingReport} onClick={handleDownloadReport} sx={{ fontSize: 12 }}>
            {downloadingReport ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
            {downloadingReport ? t('panel.downloading') : t('panel.downloadReport')}
          </Button>
        </Box>
      )}

      {/* Descarga report - radiación */}
      {isRadiation && (
        <Box sx={{ mt: 1.75 }}>
          <Button variant="outlined" fullWidth disabled={downloadingReport} onClick={handleDownloadRadiationReport} sx={{ fontSize: 12 }}>
            {downloadingReport ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
            {downloadingReport ? t('panel.downloading') : t('panel.downloadReport')}
          </Button>
        </Box>
      )}

      {/* Total measurements */}
      <Section label={t('panel.totalMeasurements')}>
        <Typography
          sx={{ fontFamily: MONO, fontSize: 30, fontWeight: 600, color: T.text, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}
        >
          {formatNumber(totalCount)}
        </Typography>
        <Box sx={{ mt: 1, height: 3, borderRadius: 2, bgcolor: T.surface3, overflow: 'hidden' }}>
          <Box sx={{ width: '100%', height: '100%', bgcolor: T.accent, opacity: 0.55 }} />
        </Box>
      </Section>
    </Box>
  );
};

export default FiltersPanelMD3;
