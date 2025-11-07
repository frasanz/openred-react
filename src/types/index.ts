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
  device_model: DeviceModel;
  serial_number: string;
  hash: string;
  owner?: User;
  purchase_date?: string;
  calibration_date?: string;
  is_active: boolean;
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
  distance?: number; // en metros
  duration?: number; // en segundos
  measurements_count?: number; // Note: backend uses measurements_count (plural)
  status?: string; // completed, processing, error, etc.
  error_message?: string;
  is_public?: boolean;
  gpx_file?: string;
  geojson_data?: any;
}

// Base interface for all measurements
export interface BaseMeasurement {
  id: number;
  device: number; // Device ID
  user?: number; // User ID
  project: number; // Project ID
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
  hash?: string;
}
