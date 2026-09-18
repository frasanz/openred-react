import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  User,
  DeviceModel,
  Device,
  IngestTokenResponse,
  Station,
  StationFormData,
  PublicStation,
  StationReadingsResponse,
  Mission,
  Campaign,
  Track,
  TrackUploadData,
  TrackUploadResponse,
  Measurement,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  ApiResponse,
  DeviceFormData,
  RadiationSpectrumMarker
} from '../types';
import {
  ActivityStatistics,
  GlobalStatistics,
  HeatmapStatistics,
  RecordsStatistics
} from '../types/statistics';
import { mockMeasurements, mockCampaigns, mockMissions } from './mockData';
import { MeasurementServiceFactory, MeasurementType } from './measurements';

// Estados finales del procesado de un track subido.
export const isTrackProcessingFinished = (status?: string): boolean =>
  status === 'completed' || status === 'failed' || status === 'error';

export class TrackProcessingTimeoutError extends Error {
  trackId: number;
  lastTrack: Track;
  constructor(trackId: number, lastTrack: Track) {
    super(`Track ${trackId} is still processing`);
    this.name = 'TrackProcessingTimeoutError';
    this.trackId = trackId;
    this.lastTrack = lastTrack;
  }
}

class ApiService {
  private api: AxiosInstance;
  private baseURL: string;
  private measurementFactory: MeasurementServiceFactory;
  private loadingPromise: Promise<Measurement[]> | null = null; // Para evitar peticiones duplicadas

  constructor() {
    // Configurar URLs específicas por entorno
    // En desarrollo: usar proxy de package.json (baseURL vacío)
    // En producción: URL completa del backend
    this.baseURL = process.env.NODE_ENV === 'development' 
      ? ''  // Usa el proxy configurado en package.json
      : 'https://api.open-red.es';  // URL completa para producción
    
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token (excepto para endpoints de auth)
    this.api.interceptors.request.use(
      (config) => {
        // No agregar token para endpoints de autenticación
        const authEndpoints = ['/dj-rest-auth/login/', '/dj-rest-auth/registration/', '/dj-rest-auth/token/refresh/'];
        const isAuthEndpoint = authEndpoints.some(endpoint => config.url?.includes(endpoint));
        
        if (!isAuthEndpoint) {
          const token = localStorage.getItem('access_token');
          if (token) {
            // Usar "Token" para tokens de Django tradicional, "Bearer" para JWT
            // Detectar el tipo de token: JWT tiene puntos, token tradicional no
            const isJWT = token.includes('.') && token.split('.').length === 3;
            const authHeader = isJWT ? `Bearer ${token}` : `Token ${token}`;
            config.headers.Authorization = authHeader;
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          // Solo intentar refresh si tenemos refresh token (JWT)
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              await this.refreshToken();
              // Actualizar el header de autorización para la request retry
              const newToken = localStorage.getItem('access_token');
              if (newToken) {
                const isJWT = newToken.includes('.') && newToken.split('.').length === 3;
                originalRequest.headers.Authorization = isJWT ? `Bearer ${newToken}` : `Token ${newToken}`;
              }
              return this.api.request(originalRequest);
            } catch (refreshError) {
              this.clearTokens();
              console.warn('Token refresh failed, user needs to login again');
              return Promise.reject(refreshError);
            }
          } else {
            // Token tradicional de Django - limpiar y requerir re-login
            this.clearTokens();
            console.warn('Traditional Django token expired, user needs to login again');
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );

    // Inicializar el factory de servicios de medidas
    this.measurementFactory = new MeasurementServiceFactory(this.api);
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    try {
      // Limpiar cualquier token previo que pueda ser inválido
      this.clearTokens();
      
      // Django dj-rest-auth está configurado para usar solo email como método de autenticación
      const loginData = {
        email: credentials.email,
        password: credentials.password
      };

      const response: AxiosResponse<AuthTokens> = await this.api.post('/dj-rest-auth/login/', loginData);
      this.setTokens(response.data);
      return response.data;
    } catch (error: any) {
      // Mejorar el manejo de errores
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error('No se puede conectar al servidor. Asegúrate de que el backend Django esté ejecutándose en https://dev.ibercivis.es:8000');
      }
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.non_field_errors && errorData.non_field_errors[0].includes('credenciales')) {
          throw new Error('Credenciales incorrectas o cuenta no verificada. Si es una cuenta nueva, verifica tu email primero.');
        }
      }

      if (error.response?.status === 401) {
        const errorData = error.response.data;
        if (errorData.code === 'token_not_valid') {
          throw new Error('Sesión expirada. Por favor, intenta iniciar sesión nuevamente.');
        }
      }
      
      throw error;
    }
  }

  async loginWithGoogle(accessToken: string): Promise<AuthTokens> {
    try {
      // Limpiar cualquier token previo
      this.clearTokens();
      
      const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
      
      const response: AxiosResponse<AuthTokens> = await this.api.post('/dj-rest-auth/google/', {
        access_token: accessToken,
        client_id: clientId  // Enviar client_id para que el backend sepa cuál app usar
      });
      
      this.setTokens(response.data);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        throw new Error('No se puede conectar al servidor. Asegúrate de que el backend Django esté ejecutándose en https://dev.ibercivis.es:8000');
      }
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<AuthTokens> {
    try {
      console.log('Datos enviados en registro:', userData); // Debug log
      const response: AxiosResponse<AuthTokens> = await this.api.post('/dj-rest-auth/registration/', userData);
      
      // Con email verification = mandatory, puede que no se devuelvan tokens inmediatamente
      // Solo guardar tokens si están presentes en la respuesta
      if (response.data && (response.data.key || response.data.access)) {
        this.setTokens(response.data);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error en registro:', error.response?.data); // Debug log
      // No limpiar tokens en caso de error de registro
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/dj-rest-auth/logout/');
    } finally {
      this.clearTokens();
    }
  }

  async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    // Si no hay refresh token, es probablemente un token tradicional de Django
    // que no se refresca, así que limpiar y forzar re-login
    if (!refreshToken) {
      this.clearTokens();
      throw new Error('No refresh token available - using traditional Django tokens');
    }

    try {
      // Intentar con el endpoint de dj-rest-auth primero
      let response: AxiosResponse<{access: string}>;
      
      try {
        response = await this.api.post('/dj-rest-auth/token/refresh/', {
          refresh: refreshToken
        });
      } catch (error: any) {
        // Si falla con 404, intentar con el endpoint de simplejwt
        if (error.response?.status === 404) {
          response = await this.api.post('/api/token/refresh/', {
            refresh: refreshToken
          });
        } else {
          throw error;
        }
      }
      
      localStorage.setItem('access_token', response.data.access);
    } catch (error) {
      this.clearTokens();
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    const response: AxiosResponse<User> = await this.api.get('/dj-rest-auth/user/');
    return response.data;
  }

  // Device methods
  async getDeviceModels(): Promise<DeviceModel[]> {
    const response: AxiosResponse<ApiResponse<DeviceModel> | DeviceModel[]> = await this.api.get('/api/device-models/');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
  }

  // Mis dispositivos. No trae el ingest_token, solo has_ingest_token e ingest_token_created_at.
  async getMyDevices(): Promise<Device[]> {
    const response: AxiosResponse<ApiResponse<Device> | Device[]> = await this.api.get('/api/devices/mine/');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
  }

  // La respuesta incluye el ingest_token en claro: SOLO se devuelve aquí, esta única vez.
  async createDevice(deviceData: DeviceFormData): Promise<Device & IngestTokenResponse> {
    const response: AxiosResponse<Device & IngestTokenResponse> = await this.api.post('/api/devices/', deviceData);
    return response.data;
  }

  async updateDevice(id: number, deviceData: Partial<DeviceFormData>): Promise<Device> {
    const response: AxiosResponse<Device> = await this.api.patch(`/api/devices/${id}/`, deviceData);
    return response.data;
  }

  async deleteDevice(id: number): Promise<void> {
    await this.api.delete(`/api/devices/${id}/`);
  }

  // Rota el ingest_token (perdido / reflasheo). De nuevo, el token se devuelve una sola vez.
  async regenerateDeviceToken(id: number): Promise<IngestTokenResponse> {
    const response: AxiosResponse<IngestTokenResponse> = await this.api.post(`/api/devices/${id}/regenerate_token/`);
    return response.data;
  }

  // Station methods
  async getMyStations(): Promise<Station[]> {
    const response: AxiosResponse<ApiResponse<Station> | Station[]> = await this.api.get('/api/stations/mine/');
    if (Array.isArray(response.data)) {
      return response.data;
    }
    return response.data.results || [];
  }

  async createStation(data: StationFormData): Promise<Station> {
    const response: AxiosResponse<Station> = await this.api.post('/api/stations/', data);
    return response.data;
  }

  async updateStation(id: number, data: Partial<StationFormData>): Promise<Station> {
    const response: AxiosResponse<Station> = await this.api.patch(`/api/stations/${id}/`, data);
    return response.data;
  }

  async deleteStation(id: number): Promise<void> {
    await this.api.delete(`/api/stations/${id}/`);
  }

  // Estaciones de un proyecto (público, sin autenticación). Array plano ordenado por
  // nombre, sin paginación. Por defecto solo las activas.
  async getStationsByProject(params: { project?: number; include_inactive?: boolean }): Promise<PublicStation[]> {
    const response = await this.api.get('/api/stations/by-project/', { params });
    return Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
  }

  // Detalle de una estación (público, sin autenticación): serie temporal agregada.
  // range: 1d/1w/1m/1y/4y (o cualquier N+unidad h/d/w/m/y). interval: auto por defecto.
  async getStationReadings(
    id: number,
    params?: { range?: string; interval?: string; start?: string; end?: string },
  ): Promise<StationReadingsResponse> {
    const response = await this.api.get(`/api/stations/${id}/readings/`, { params });
    return response.data;
  }

  // Mission methods
  async getMissions(projectId: number): Promise<Mission[]> {
    try {
      const response: AxiosResponse<ApiResponse<Mission>> = await this.api.get(`/api/projects/${projectId}/missions/`);
      console.log('getMissions raw response.data:', response.data);
      
      // Manejar diferentes formatos de respuesta
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      }
      
      return [];
    } catch (error) {
      console.warn('Failed to fetch missions from backend, using mock data:', error);
      return mockMissions as Mission[];
    }
  }

  async getCampaigns(missionId: number): Promise<Campaign[]> {
    try {
      // Usar endpoint anidado de missions
      const url = `/api/missions/${missionId}/campaigns/`;

      const response: AxiosResponse<ApiResponse<Campaign>> = await this.api.get(url);
      console.log('getCampaigns raw response.data:', response.data);

      // Manejar diferentes formatos de respuesta
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results;
      }

      return [];
    } catch (error) {
      console.warn('Failed to fetch campaigns from backend, using mock data:', error);
      return mockCampaigns as Campaign[];
    }
  }

  // Track management
  async getTracks(): Promise<Track[]> {
    const response: AxiosResponse<ApiResponse<Track>> = await this.api.get('/api/tracks/my_tracks/');
    console.log('getTracks response:', response.data);
    
    // Manejar diferentes formatos de respuesta
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data.results && Array.isArray(response.data.results)) {
      return response.data.results;
    }
    
    return [];
  }

  async getTrack(id: number): Promise<Track> {
    const response: AxiosResponse<Track> = await this.api.get(`/api/tracks/${id}/`);
    return response.data;
  }

  // Sube un .rctrk a POST /api/tracks/upload/. El backend responde 202 y procesa en segundo plano.
  // Errores del backend: {"error": "..."} con 400 (campo, campaña de otra misión, extensión, contenido,
  // contraseña requerida), 403 (contraseña incorrecta), 413 (> 10 MiB), 429 (Retry-After en segundos).
  async uploadTrack(data: TrackUploadData, signal?: AbortSignal): Promise<TrackUploadResponse> {
    const formData = new FormData();
    formData.append('file', data.file);
    if (data.device != null) {
      formData.append('device', String(data.device));
    }
    formData.append('mission', String(data.mission));
    formData.append('campaign', String(data.campaign));
    if (data.campaign_password) {
      formData.append('campaign_password', data.campaign_password);
    }
    if (data.project != null) {
      formData.append('project', String(data.project));
    }
    // La instancia lleva Content-Type application/json por defecto y con ese header axios 1.x
    // serializa el FormData a JSON (el fichero se pierde y el backend responde "No file provided").
    // Con multipart/form-data explícito axios deja que el navegador ponga el boundary.
    const response: AxiosResponse<TrackUploadResponse> = await this.api.post('/api/tracks/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal,
    });
    return response.data;
  }

  // Sondea GET /api/tracks/{id}/ hasta que el procesado termine (completed | failed | error).
  // Lanza TrackProcessingTimeoutError si se agota el tiempo; el track sigue procesándose en el backend.
  async waitForTrackProcessing(
    trackId: number,
    options: { intervalMs?: number; timeoutMs?: number; signal?: AbortSignal } = {}
  ): Promise<Track> {
    const { intervalMs = 2500, timeoutMs = 60000, signal } = options;
    const deadline = Date.now() + timeoutMs;
    const throwIfAborted = () => {
      if (signal?.aborted) {
        throw new DOMException('Track processing polling aborted', 'AbortError');
      }
    };
    while (true) {
      throwIfAborted();
      const track = await this.getTrack(trackId);
      if (isTrackProcessingFinished(track.status)) {
        return track;
      }
      if (Date.now() + intervalMs > deadline) {
        throw new TrackProcessingTimeoutError(trackId, track);
      }
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          signal?.removeEventListener('abort', onAbort);
          resolve();
        }, intervalMs);
        const onAbort = () => {
          clearTimeout(timer);
          reject(new DOMException('Track processing polling aborted', 'AbortError'));
        };
        signal?.addEventListener('abort', onAbort, { once: true });
      });
    }
  }

  async updateTrack(id: number, data: Partial<Track>): Promise<Track> {
    const response: AxiosResponse<Track> = await this.api.patch(`/api/tracks/${id}/`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }

  async deleteTrack(id: number): Promise<void> {
    await this.api.delete(`/api/tracks/${id}/`);
  }

  // Measurement methods
  
  // Getter para acceder a los servicios de medidas de forma específica
  get measurements() {
    return {
      radiation: this.measurementFactory.getService(MeasurementType.RADIATION),
      lightPollution: this.measurementFactory.getService(MeasurementType.LIGHT_POLLUTION)
    };
  }

  // Método legacy para retrocompatibilidad - usa radiación por defecto
  async getMeasurements(params?: {
    project?: number;
    start_date?: string;
    end_date?: string;
    min_radiation?: number;
    max_radiation?: number;
    campaign?: number;
    track?: number;
    mission?: number;
    measurementType?: 'radiation' | 'light_pollution';
    north?: number;
    south?: number;
    east?: number;
    west?: number;
  }): Promise<Measurement[]> {
    try {
      // Determinar qué servicio usar basado en measurementType
      const measurementType = params?.measurementType || 'radiation';
      const service = measurementType === 'light_pollution'
        ? this.measurements.lightPollution
        : this.measurements.radiation;
      
      return await service.getMeasurements(params as any);
    } catch (error) {
      console.warn('Failed to fetch measurements from backend, using mock data:', error);
      // Return mock data as fallback
      return mockMeasurements;
    }
  }

  async createMeasurement(measurementData: Omit<Measurement, 'id' | 'measurement_id'>): Promise<Measurement> {
    // Determinar el tipo de medida basado en los campos presentes
    const isRadiation = 'dose_rate' in measurementData;
    const service = isRadiation 
      ? this.measurements.radiation 
      : this.measurements.lightPollution;
    
    return service.createMeasurement(measurementData as any);
  }

  // Métodos de carga progresiva legacy - mantienen compatibilidad con código existente
  async getMeasurementsCount(projectId?: number): Promise<number> {
    // Por defecto usar radiación
    return this.measurements.radiation.getMeasurementsCount(projectId);
  }

  async getMeasurementsWithProgress(
    onProgress: (loaded: number, total: number) => void,
    options: {
      pageSize?: number;
      maxConcurrent?: number;
      useParallel?: boolean;
      autoOptimize?: boolean;
      projectId?: number;
      knownTotal?: number;
      measurementType?: 'radiation' | 'light_pollution'; // Nuevo parámetro opcional
    } = {}
  ): Promise<Measurement[]> {
    // Determinar qué servicio usar
    const measurementType = options.measurementType || 'radiation';
    const service = measurementType === 'radiation' 
      ? this.measurements.radiation 
      : this.measurements.lightPollution;

    return service.getMeasurementsWithProgress(onProgress, options);
  }

  // Métodos para agregaciones H3
  async getH3Aggregation(
    params?: {
      resolution?: number;
      project?: number;
      start_date?: string;
      end_date?: string;
      measurementType?: 'radiation' | 'light_pollution';
      mission?: number;
      campaign?: number;
    }
  ): Promise<{ 
    hexagons: any[], 
    resolution?: number, 
    totalMeasurements?: number,
    statistics?: {
      global_avg: number;
      global_min: number;
      global_max: number;
      global_std?: number;
    }
  }> {
    const measurementType = params?.measurementType || 'radiation';
    const service = measurementType === 'radiation' 
      ? this.measurements.radiation 
      : this.measurements.lightPollution;

    return service.getH3Aggregation(params);
  }

  // Histograma de radiación
  async getRadiationHistogram(params: {
    project?: number;
    mission?: number;
    campaign?: number;
    start_date?: string;
    end_date?: string;
    min_altitude?: number;
    max_altitude?: number;
    min_speed?: number;
    max_speed?: number;
    min_dose_rate?: number;
    max_dose_rate?: number;
    north?: number;
    south?: number;
    east?: number;
    west?: number;
  }): Promise<{
    total: number;
    min: number;
    max: number;
    bins: { label: string; min: number; max: number | null; count: number }[];
  }> {
    const response = await this.api.get('/api/radiation-measurements/histogram/', { params });
    return response.data;
  }

  // Descarga de report de radiación
  async downloadRadiationReport(params: Record<string, any>): Promise<void> {
    const response = await this.api.get('/api/radiation-measurements/report/', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const disposition = response.headers['content-disposition'];
    const filename = disposition
      ? disposition.split('filename=')[1]?.replace(/"/g, '') ?? 'report.csv'
      : 'report.pdf';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  // Descarga de report de contaminación lumínica
  async downloadLightPollutionReport(params: Record<string, any>): Promise<void> {
    const response = await this.api.get('/api/light-pollution-measurements/report/', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const disposition = response.headers['content-disposition'];
    const filename = disposition
      ? disposition.split('filename=')[1]?.replace(/"/g, '') ?? 'report.csv'
      : 'report.pdf';
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  // Espectros de radiación
  // Marcadores ligeros para el mapa: array plano (no paginado) con { id, latitude, longitude }.
  // Soporta filtros project/track y bbox (north/south/east/west); bbox inválido → 400.
  async getRadiationSpectraMap(params?: {
    project?: number;
    track?: number;
    north?: number;
    south?: number;
    east?: number;
    west?: number;
  }): Promise<RadiationSpectrumMarker[]> {
    const response = await this.api.get('/api/radiation-spectra/map/', { params });
    return Array.isArray(response.data) ? response.data : (response.data?.results ?? []);
  }

  // Detalle completo de un espectro (pesado): counts (1024), a0/a1/a2, durationSec, etc.
  // Se usará al pulsar un marcador para pintar el histograma.
  async getRadiationSpectrumDetail(id: number): Promise<any> {
    const response = await this.api.get(`/api/radiation-spectra/${id}/`);
    return response.data;
  }

  // Profile management
  async updateProfile(data: { email: string }): Promise<User> {
    const response: AxiosResponse<User> = await this.api.patch('/api/profile/', data);
    return response.data;
  }

  async getUserStats(): Promise<any> {
    const response: AxiosResponse<any> = await this.api.get('/api/users/me/stats/');
    return response.data;
  }

  // Campaign management
  async createCampaign(data: any): Promise<Campaign> {
    const response: AxiosResponse<Campaign> = await this.api.post('/api/campaigns/', data);
    return response.data;
  }

  async updateCampaign(id: number, data: any): Promise<Campaign> {
    const response: AxiosResponse<Campaign> = await this.api.patch(`/api/campaigns/${id}/`, data);
    return response.data;
  }

  async deleteCampaign(id: number): Promise<void> {
    await this.api.delete(`/api/campaigns/${id}/`);
  }

  // Mission management
  async createMission(data: any): Promise<Mission> {
    const response: AxiosResponse<Mission> = await this.api.post('/api/missions/', data);
    return response.data;
  }

  async updateMission(id: number, data: any): Promise<Mission> {
    const response: AxiosResponse<Mission> = await this.api.patch(`/api/missions/${id}/`, data);
    return response.data;
  }

  async deleteMission(id: number): Promise<void> {
    await this.api.delete(`/api/missions/${id}/`);
  }

  // Password reset methods
  async requestPasswordReset(email: string): Promise<void> {
    const response: AxiosResponse<void> = await this.api.post('/dj-rest-auth/password/reset/', {
      email: email
    });
    return response.data;
  }

  async confirmPasswordReset(uid: string, token: string, newPassword: string): Promise<void> {
    const response: AxiosResponse<void> = await this.api.post('/dj-rest-auth/password/reset/confirm/', {
      uid: uid,
      token: token,
      new_password1: newPassword,
      new_password2: newPassword
    });
    return response.data;
  }

  // Email verification
  async verifyEmail(key: string): Promise<void> {
    const response: AxiosResponse<void> = await this.api.post('/dj-rest-auth/registration/verify-email/', {
      key: key
    });
    return response.data;
  }

  // Statistics methods
  async getActivityStatistics(): Promise<ActivityStatistics> {
    const response: AxiosResponse<ActivityStatistics> = await this.api.get('/api/stats/activity/');
    return response.data;
  }

  async getGlobalStatistics(type: 'radiation' | 'light_pollution' = 'radiation'): Promise<GlobalStatistics> {
    const response: AxiosResponse<GlobalStatistics> = await this.api.get(`/api/stats/global/?type=${type}`);
    return response.data;
  }

  async getHeatmapStatistics(
    resolution: number = 8, 
    type: 'radiation' | 'light_pollution' = 'radiation'
  ): Promise<HeatmapStatistics> {
    const response: AxiosResponse<HeatmapStatistics> = await this.api.get(
      `/api/stats/heatmap/?resolution=${resolution}&type=${type}`
    );
    return response.data;
  }

  async getRecordsStatistics(): Promise<RecordsStatistics> {
    const response: AxiosResponse<RecordsStatistics> = await this.api.get('/api/stats/records/');
    return response.data;
  }

  // Utility methods
  private setTokens(tokens: AuthTokens): void {
    // Manejar tanto formato JWT como tokens tradicionales de Django
    if (tokens.key) {
      // Formato tradicional de Django dj-rest-auth
      localStorage.setItem('access_token', tokens.key);
    } else if (tokens.access) {
      // Formato JWT
      localStorage.setItem('access_token', tokens.access);
      if (tokens.refresh) {
        localStorage.setItem('refresh_token', tokens.refresh);
      }
    }
  }

  private clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  // Verificar si los tokens son válidos haciendo una request al endpoint de usuario
  async validateTokens(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      await this.getCurrentUser();
      return true;
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token inválido, limpiar
        this.clearTokens();
        return false;
      }
      // Otros errores no relacionados con autenticación
      return true;
    }
  }
}

export const apiService = new ApiService();
export default apiService;