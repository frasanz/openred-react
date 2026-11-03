// OpenRed API Types
export interface User {
  id: number;
  username: string;
  email: string;
  date_joined: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface DeviceModel {
  id: number;
  name: string;
  manufacturer: string;
  version?: string;
  technology?: string;
  validatedByOpenRed: boolean;
  description?: string;
  picture?: string;
  max_radiation_range: number;
}

export interface Device {
  id: number;
  device_model?: DeviceModel | null;
  serial_number: string;
  owner?: number;
  purchase_date?: string;
  calibration_date?: string;
  is_active: boolean;
  has_ingest_token: boolean;
  ingest_token_created_at?: string | null;
  last_measurement_at?: string | null;
  // Solo presente en la respuesta de creación / rotación (en claro, una única vez).
  ingest_token?: string;
}

// Respuesta de POST /api/devices/ y POST /api/devices/{id}/regenerate_token/.
// El ingest_token solo se devuelve en estas respuestas y no puede recuperarse después.
export interface IngestTokenResponse {
  ingest_token: string;
  ingest_token_created_at: string;
}

export interface Station {
  id: number;
  name: string;
  device: number; // Device ID (relación 1:1)
  project: number; // Project ID (debe ser de radiación)
  latitude: number;
  longitude: number;
  altitude?: number;
  expected_interval_seconds?: number;
  // Campos read-only que pone el servidor:
  user?: number;
  status?: string;
  last_measurement_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Estación devuelta por GET /api/stations/by-project/ (público, sin autenticación).
// Endpoint distinto de /api/stations/mine/: trae todas las estaciones de un proyecto
// (de cualquier usuario), con datos agregados de radiación en lugar de `device`/`user`.
export interface PublicStation {
  id: number;
  name: string;
  project: number;
  latitude: number;
  longitude: number;
  altitude?: number | null;
  status?: string;
  is_active: boolean;
  last_measurement_at?: string | null;
  expected_interval_seconds?: number;
  last_dose_rate?: number | null;
  last_dose_rate_at?: string | null;
  avg_dose_rate_24h?: number | null;
  measurements_24h?: number;
}

// GET /api/stations/{id}/readings/ (público, sin autenticación): serie temporal agregada
// en buckets, lista para pintar. Cada punto de `series` trae avg/min/max de dose_rate y cpm;
// `weather` es una serie aparte (resolución horaria o más gruesa) que no está alineada
// punto a punto con `series` a propósito.
export interface StationReadingsMetricPoint {
  avg: number;
  min: number;
  max: number;
}

export interface StationReadingsSeriesPoint {
  t: string;
  count: number;
  dose_rate?: StationReadingsMetricPoint;
  cpm?: StationReadingsMetricPoint;
}

export interface StationReadingsWeatherPoint {
  t: string;
  hours: number;
  temperature?: number | null;
  humidity?: number | null;
  pressure?: number | null;
  wind_speed?: number | null;
  wind_direction?: number | null;
  cloud_cover?: number | null;
  rain_sum?: number | null;
}

export interface StationReadingsResponse {
  station: {
    id: number;
    name: string;
    project: number;
    latitude: number;
    longitude: number;
    status?: string;
    expected_interval_seconds?: number;
  };
  window: {
    start: string;
    end: string;
    interval: string;
    points: number;
  };
  units: Record<string, string>;
  stats: {
    count: number;
    dose_rate_avg?: number | null;
    dose_rate_min?: number | null;
    dose_rate_max?: number | null;
    cpm_avg?: number | null;
    cpm_min?: number | null;
    cpm_max?: number | null;
  };
  series: StationReadingsSeriesPoint[];
  weather: StationReadingsWeatherPoint[];
}

export interface StationFormData {
  name: string;
  device: number;
  project: number;
  latitude: number;
  longitude: number;
  altitude?: number;
  expected_interval_seconds?: number;
}

export interface Mission {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  created_at: string;
  project: number; // Project ID
  created_by: number; // User ID who created the mission
}

export interface Campaign {
  id: number;
  name: string;
  description: string;
  mission: Mission;
  participants: User[];
  devices: Device[];
  start_date: string;
  end_date: string;
  created_at: string;
  max_participants?: number;
  is_public: boolean;
  has_password: boolean;
}

export interface Track {
  id: number;
  name: string;
  description?: string;
  created_by: number; // User ID who created the track
  project?: number; // Project ID
  device?: number; // Device ID
  mission?: number; // Mission ID
  campaign?: number; // Campaign ID
  campaign_name?: string; // Campaign name (from backend)
  mission_name?: string; // Mission name (from backend)
  file?: string; // URL to the track file
  file_type?: string; // csv, gpx, etc.
  created_at: string;
  updated_at: string;
  start_time?: string;
  end_time?: string;
  distance?: number; // en metros (legacy field)
  total_distance?: number; // en metros (nuevo campo del backend)
  duration?: number; // en segundos
  average_speed?: number; // velocidad promedio en m/s
  measurements_count?: number; // Note: backend uses measurements_count (plural)
  // Estadísticas de radiación
  min_dose_rate?: number; // Tasa de dosis mínima en µSv/h
  max_dose_rate?: number; // Tasa de dosis máxima en µSv/h
  avg_dose_rate?: number; // Tasa de dosis promedio en µSv/h
  std_dose_rate?: number; // Desviación estándar de tasa de dosis en µSv/h
  status?: string; // completed, processing, error, etc.
  error_message?: string;
  is_public?: boolean;
  gpx_file?: string;
  geojson_data?: any;
}

// Datos para POST /api/tracks/upload/ (multipart/form-data)
export interface TrackUploadData {
  file: File; // .rctrk, export de RadiaCode Android o iOS
  device?: number; // opcional; si no se envía el backend lo guarda como null
  mission: number;
  campaign: number; // debe pertenecer a la misión
  campaign_password?: string; // solo si la campaña tiene has_password
  project?: number; // opcional; si se envía debe coincidir con el de la misión
}

// Respuesta 202 de POST /api/tracks/upload/. El 202 no significa procesado:
// hay que sondear GET /api/tracks/{track_id}/ hasta status completed | failed.
export interface TrackUploadResponse {
  track_id: number;
  job_id: string;
  status: string; // pending | processing | completed | failed
  message: string;
}

// Weather cache data structure
export interface WeatherCache {
  id: number;
  h3_cell: string;
  timestamp_hour: string;
  temperature: number;
  humidity: number;
  pressure: number;
  wind_speed: number;
  wind_direction: number;
  cloud_cover: number;
  fetched: boolean;
  fetch_attempts: number;
}

// Base interface for all measurements
export interface BaseMeasurement {
  id: number;
  device: number; // Device ID
  user?: number; // User ID
  project: number; // Project ID
  weather_cache?: WeatherCache; // Weather data from cache
  measurement_id: string;
  dateTime: string;
  timestamp?: number;
  latitude: string | number;
  longitude: string | number;
  altitude?: number;
  accuracy?: number;
  speed?: number; // Velocity in km/h
  data_quality: string;
  notes?: string;
  created_at: string;
  weather_fetched: boolean;
  weather_fetch_attempts: number;
  weather_last_attempt?: string;
  weather_data?: any;
  temperature?: number;
  humidity?: number;
  pressure?: number;
  wind_speed?: number;
  wind_direction?: number;
  cloudiness?: number;
  weather_description?: string;
}

// Radiation measurements
export interface RadiationMeasurement extends BaseMeasurement {
  dose_rate: number;
  radiation_unit: string;
  cpm?: number;
  count_rate?: number;
  detector_type?: string;
  calibration_factor: number;
  background_subtracted: boolean;
  raw_data?: any;
}

// Light pollution measurements
export interface LightPollutionMeasurement extends BaseMeasurement {
  sky_brightness: number;
  brightness_unit: string;
  lux?: number; // Iluminación en lux
  cct?: number; // Temperatura de color (CCT) en Kelvin
  brightness?: number; // Brillo general
  sqm_reading?: number;
  nelm?: number;
  bortle_class?: number;
  moon_phase?: number;
  moon_illumination?: number;
  sun_elevation?: number;
  observation_conditions?: string;
  naked_eye_stars?: number;
  telescope_limiting_magnitude?: number;
  light_sources?: any;
}

// Union type for all measurement types
export type Measurement = RadiationMeasurement | LightPollutionMeasurement;

// Punto ligero para pintar (GET .../compact/): solo lo necesario para el mapa.
// El resto de la medida se pide al hacer hover (GET .../{id}/).
// Mismos nombres que en Measurement para que los accesores sirvan para ambos.
export interface MapPoint {
  id: number;
  latitude: number;
  longitude: number;
  dose_rate?: number | null; // radiación
  lux?: number | null;       // lumínica
  cct?: number | null;       // lumínica
  speed?: number | null;     // m/s (solo tracks)
}

// Espectros de radiación
// Marcador ligero para el mapa (GET /api/radiation-spectra/map/) — array plano, sin counts.
// latitude/longitude = coordenadas de inicio del espectro (solo los que tienen fix GPS).
export interface RadiationSpectrumMarker {
  id: number;
  latitude: number;
  longitude: number;
}

// Project interface
export interface Project {
  id: number;
  name: string;
  description?: string;
  project_type: 'radiation' | 'light_pollution';
  is_active: boolean;
  is_public: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
  project_settings?: any;
  measurements_count: number;
  last_measurement_date: string | null;
}

// Filtros comunes a todos los tipos de medición
export interface CommonFilters {
  startDate: Date;
  endDate: Date;
  dataQuality: string[];
  minAccuracy?: number;
  maxAccuracy?: number;
  minAltitude?: number;
  maxAltitude?: number;
  minSpeed?: number;
  maxSpeed?: number;
  location?: {
    center: [number, number];
    radius: number;
  };
}

// Filtros específicos para radiación
export interface RadiationFilters {
  minIntensity: number;
  maxIntensity: number;
  units: 'nSv/h' | 'μSv/h' | 'mSv/h';
  detectorType?: string[];
  backgroundSubtracted?: boolean;
  minCPM?: number;
  maxCPM?: number;
  minDoseRate?: number;
  maxDoseRate?: number;
}

// Filtros específicos para contaminación lumínica
export interface LightPollutionFilters {
  minBrightness: number;
  maxBrightness: number;
  units: 'mag/arcsec²';
  bortleClass?: number[];
  moonPhase?: {
    min: number;
    max: number;
  };
  observationDirection?: string[];
}

// Filtros adaptativos que cambian según el tipo de proyecto
export interface AdaptiveFilters {
  common: CommonFilters;
  radiation?: RadiationFilters;
  lightPollution?: LightPollutionFilters;
}

// Interfaz para el estado de filtros usado por componentes
export interface FilterState {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  valueRange: {
    min: number;
    max: number;
  };
  deviceTypes: string[];
  location?: {
    center: [number, number];
    radius: number;
  } | {
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    } | null;
    radius: number | null;
    center: { lat: number; lng: number } | null;
  };
}

// Legacy interface para compatibilidad (se eliminará gradualmente)
export interface MapFilters {
  startDate: Date;
  endDate: Date;
  minIntensity: number;
  maxIntensity: number;
  campaignId?: number;
}

export interface AuthTokens {
  access?: string;
  refresh?: string;
  key?: string; // Para tokens de Django tradicional
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password1: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

export interface ApiResponse<T> {
  count?: number;
  next?: string;
  previous?: string;
  results?: T[];
  data?: T;
}

export interface MapFilters {
  startDate: Date;
  endDate: Date;
  minIntensity: number;
  maxIntensity: number;
  campaignId?: number;
}

export interface MeasurementPoint {
  position: [number, number]; // [longitude, latitude]
  values: {
    radiation: number;
    [key: string]: any;
  };
  dateTime: number; // timestamp
  size: number;
  color: [number, number, number]; // RGB color
}

export interface DeviceFormData {
  device_model: number;
  serial_number: string;
  calibration_date?: string;
  is_active?: boolean;
}
