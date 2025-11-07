// Mock data for development when backend is not available
import { RadiationMeasurement } from '../types';

// Simplified measurement data for quick testing
export const mockMeasurements: RadiationMeasurement[] = [
  {
    id: 1,
    device: 1,
    user: 1,
    project: 1,
    measurement_id: 'MEAS_001',
    dateTime: new Date().toISOString(),
    timestamp: Math.floor(Date.now() / 1000),
    latitude: "41.6488",
    longitude: "-0.8891",
    altitude: 200,
    accuracy: 5,
    data_quality: 'good',
    notes: 'Medición de prueba en Zaragoza centro',
    created_at: new Date().toISOString(),
    weather_fetched: false,
    weather_fetch_attempts: 0,
    dose_rate: 75,
    radiation_unit: 'nSv/h',
    detector_type: 'gamma',
    calibration_factor: 1.0,
    background_subtracted: false
  },
  {
    id: 2,
    device: 2,
    user: 1,
    project: 1,
    measurement_id: 'MEAS_002',
    dateTime: new Date(Date.now() - 3600000).toISOString(),
    timestamp: Math.floor((Date.now() - 3600000) / 1000),
    latitude: "41.6520",
    longitude: "-0.8950",
    altitude: 210,
    accuracy: 3,
    data_quality: 'good',
    notes: 'Medición de prueba en parque',
    created_at: new Date().toISOString(),
    weather_fetched: false,
    weather_fetch_attempts: 0,
    dose_rate: 45,
    radiation_unit: 'nSv/h',
    detector_type: 'gamma',
    calibration_factor: 1.0,
    background_subtracted: false
  },
  {
    id: 3,
    device: 1,
    user: 1,
    project: 1,
    measurement_id: 'MEAS_003',
    dateTime: new Date(Date.now() - 7200000).toISOString(),
    timestamp: Math.floor((Date.now() - 7200000) / 1000),
    latitude: "41.6450",
    longitude: "-0.8800",
    altitude: 195,
    accuracy: 4,
    data_quality: 'good',
    notes: 'Medición elevada detectada',
    created_at: new Date().toISOString(),
    weather_fetched: false,
    weather_fetch_attempts: 0,
    dose_rate: 120,
    radiation_unit: 'nSv/h',
    detector_type: 'gamma',
    calibration_factor: 1.0,
    background_subtracted: false
  },
  {
    id: 4,
    device: 3,
    user: 1,
    project: 1,
    measurement_id: 'MEAS_004',
    dateTime: new Date(Date.now() - 10800000).toISOString(),
    timestamp: Math.floor((Date.now() - 10800000) / 1000),
    latitude: "41.6400",
    longitude: "-0.8750",
    altitude: 180,
    accuracy: 6,
    data_quality: 'good',
    notes: 'Medición normal en zona residencial',
    created_at: new Date().toISOString(),
    weather_fetched: false,
    weather_fetch_attempts: 0,
    dose_rate: 32,
    radiation_unit: 'nSv/h',
    detector_type: 'gamma',
    calibration_factor: 1.0,
    background_subtracted: false
  },
  {
    id: 5,
    device: 2,
    user: 1,
    project: 1,
    measurement_id: 'MEAS_005',
    dateTime: new Date(Date.now() - 14400000).toISOString(),
    timestamp: Math.floor((Date.now() - 14400000) / 1000),
    latitude: "41.6600",
    longitude: "-0.9000",
    altitude: 220,
    accuracy: 2,
    data_quality: 'good',
    notes: 'Medición en zona industrial',
    created_at: new Date().toISOString(),
    weather_fetched: false,
    weather_fetch_attempts: 0,
    dose_rate: 88,
    radiation_unit: 'nSv/h',
    detector_type: 'gamma',
    calibration_factor: 1.0,
    background_subtracted: false
  },
  {
    id: 6,
    device: 1,
    user: 1,
    project: 1,
    measurement_id: 'MEAS_006',
    dateTime: new Date(Date.now() - 18000000).toISOString(),
    timestamp: Math.floor((Date.now() - 18000000) / 1000),
    latitude: "41.6350",
    longitude: "-0.8650",
    altitude: 185,
    accuracy: 4,
    data_quality: 'good',
    notes: 'Medición en campus universitario',
    created_at: new Date().toISOString(),
    weather_fetched: false,
    weather_fetch_attempts: 0,
    dose_rate: 65,
    radiation_unit: 'nSv/h',
    detector_type: 'gamma',
    calibration_factor: 1.0,
    background_subtracted: false
  },
  {
    id: 7,
    device: 3,
    user: 1,
    project: 1,
    measurement_id: 'MEAS_007',
    dateTime: new Date(Date.now() - 21600000).toISOString(),
    timestamp: Math.floor((Date.now() - 21600000) / 1000),
    latitude: "41.6580",
    longitude: "-0.8720",
    altitude: 205,
    accuracy: 3,
    data_quality: 'good',
    notes: 'Medición en zona verde',
    created_at: new Date().toISOString(),
    weather_fetched: false,
    weather_fetch_attempts: 0,
    dose_rate: 28,
    radiation_unit: 'nSv/h',
    detector_type: 'gamma',
    calibration_factor: 1.0,
    background_subtracted: false
  }
];

// Simple mock arrays for other data types
export const mockCampaigns: any[] = [
  {
    id: 1,
    name: 'Campaña de Verano 2025',
    description: 'Mediciones durante los meses de verano en zonas urbanas'
  },
  {
    id: 2,
    name: 'Monitoreo Industrial',
    description: 'Seguimiento de radiación en zonas industriales'
  }
];

export const mockMissions: any[] = [
  {
    id: 1,
    name: 'Misión Centro Histórico',
    description: 'Mediciones en el centro histórico de Zaragoza'
  },
  {
    id: 2,
    name: 'Misión Parques Urbanos',
    description: 'Mediciones en espacios verdes urbanos'
  }
];
