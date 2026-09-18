import React, { useState, useEffect, useMemo, useRef } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, PathLayer, LineLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl';
import { getRadiationColorWithAlpha, RADIATION_LEGEND } from '../utils/radiationColors';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  LinearProgress,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputBase,
  useMediaQuery,
  useTheme,
  Drawer,
} from '@mui/material';
import {
  Route as RouteIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { Track, Measurement, Mission, Campaign, Device } from '../types';
import { useAuth } from '../context/AuthContext';
import { useProjectContext } from '../context/ProjectContext';
import apiService, { TrackProcessingTimeoutError } from '../services/api';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { darkTokens as T } from '../theme/tokens';
import { MONO } from '../theme/theme';
import { FloatPanel } from '../components/ui/FloatPanel';
import { useLocale } from '../utils/i18nFormat';

// --- Helpers de presentación de tracks ---
const DANGER = '#e0524a';

const statusColor = (status?: string): string | null => {
  if (!status || status === 'completed') return null;
  if (status === 'error' || status === 'failed') return DANGER;
  return '#d9a23a';
};

const trackMetaLabel = (t: Track): string => {
  const parts = [t.mission_name, t.campaign_name].filter(Boolean) as string[];
  return Array.from(new Set(parts)).join(' · ').toUpperCase();
};

const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';

// Límite del backend para POST /api/tracks/upload/ (responde 413 por encima)
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

type UploadPhase = 'idle' | 'uploading' | 'processing';

const deviceLabel = (d: Device): string =>
  [d.device_model?.name, d.serial_number].filter(Boolean).join(' · ') || `#${d.id}`;

const TracksPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { selectedProject } = useProjectContext();
  const navigate = useNavigate();
  const { t } = useTranslation(['tracks', 'common']);
  const { formatNumber, formatDate, formatTime, formatDateTime } = useLocale();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Fechas colapsadas: mismo día -> "20 may 2026 · 22:34 → 22:39"; distinto -> "20 may → 21 may 2026 · 22:34 → 02:11"
  const formatTrackRange = (track: Track): string => {
    if (!track.start_time) return '';
    const s = new Date(track.start_time);
    const e = track.end_time ? new Date(track.end_time) : null;
    const dFull: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
    const dShort: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    const tt: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
    const sd = formatDate(s, dFull);
    const st = formatTime(s, tt);
    if (!e) return `${sd} · ${st}`;
    const ed = formatDate(e, dFull);
    const et = formatTime(e, tt);
    if (sd === ed) return `${sd} · ${st} → ${et}`;
    return `${formatDate(s, dShort)} → ${ed} · ${st} → ${et}`;
  };

  // Stats por track (omite las partes sin dato; no inventa)
  const trackStats = (track: Track): string => {
    const parts: string[] = [];
    const dist = track.total_distance ?? track.distance;
    if (dist != null) parts.push(t('stats.km', { value: (dist / 1000).toFixed(1) }));
    if (track.measurements_count != null) parts.push(t('stats.points', { value: formatNumber(track.measurements_count) }));
    if (track.max_dose_rate != null) parts.push(t('stats.max', { value: track.max_dose_rate.toFixed(2) }));
    if (track.avg_dose_rate != null) parts.push(t('stats.avg', { value: track.avg_dose_rate.toFixed(2) }));
    return parts.join(' · ');
  };
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  // Error mostrado dentro del diálogo (subida / edición)
  const [dialogError, setDialogError] = useState<string | null>(null);
  // Fase de la subida: el 202 del backend no significa procesado, hay que sondear el track
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle');
  const uploadAbortRef = useRef<AbortController | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Estado para diálogo de confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);
  
  // Estado para controlar si el panel lateral está colapsado
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(isMobile);
  
  // Controles de la lista (solo UI sobre los tracks ya cargados)
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'longest' | 'samples'>('recent');
  
  // Track selection and map state
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [trackMeasurements, setTrackMeasurements] = useState<Measurement[]>([]);
  const [loadingMap, setLoadingMap] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [initialViewState, setInitialViewState] = useState({
    longitude: -3.7038,
    latitude: 40.4168,
    zoom: 12,
    pitch: 45, // Inclinación para ver el efecto 3D
    bearing: 0,
  });
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_public: false,
    device: undefined as number | undefined,
    mission: undefined as number | undefined,
    campaign: undefined as number | undefined,
    password: '',
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const abortController = new AbortController();

    const loadTracks = async () => {
      console.log('Loading tracks...');
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getTracks();
        if (!abortController.signal.aborted) {
          setTracks(data);
          console.log('Tracks loaded:', data.length, data);
        }
      } catch (err: any) {
        if (!abortController.signal.aborted) {
          console.error('Error loading tracks:', err);
          setError(err.message || t('errors.loadTracks'));
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    const loadMissionsAndCampaigns = async () => {
      try {
        if (!selectedProject?.id) {
          console.log('No project selected, skipping missions load');
          return;
        }
        
        console.log('Calling getMissions API for project:', selectedProject.id);
        const missionsData = await apiService.getMissions(selectedProject.id);
        console.log('getMissions response:', missionsData);
        
        if (!abortController.signal.aborted) {
          setMissions(missionsData);
          console.log('Missions set in state:', missionsData.length, missionsData);
        } else {
          console.log('Request aborted, skipping setMissions');
        }
      } catch (err: any) {
        console.error('Error loading missions:', err);
        // No mostrar error crítico, los campos serán opcionales
      }
    };

    loadTracks();
    loadMissionsAndCampaigns();

    // Cleanup function
    return () => {
      abortController.abort();
      // Limpiar datos pesados al desmontar para liberar memoria
      setTrackMeasurements([]);
      setSelectedTrack(null);
    };
  }, [isAuthenticated, navigate, selectedProject, t]);

  // Load track measurements when a track is selected
  const handleTrackClick = async (track: Track) => {
    setSelectedTrack(track);
    setLoadingMap(true);
    
    try {
      console.log('Loading measurements for track:', track.id);
      
      // Llamar al endpoint de measurements con filtro por track
      const measurements = await apiService.getMeasurements({ track: track.id });
      
      console.log(`Loaded ${measurements.length} measurements for track ${track.id}`);
      setTrackMeasurements(measurements);
      
      // Calculate bounds to fit all points - OPTIMIZADO (single pass)
      if (measurements.length > 0) {
        let minLng = Infinity;
        let maxLng = -Infinity;
        let minLat = Infinity;
        let maxLat = -Infinity;
        
        // Single pass para calcular bounds
        for (const m of measurements) {
          const lng = typeof m.longitude === 'number' ? m.longitude : parseFloat(m.longitude as string);
          const lat = typeof m.latitude === 'number' ? m.latitude : parseFloat(m.latitude as string);
          
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }
        
        // Calculate center
        const centerLng = (minLng + maxLng) / 2;
        const centerLat = (minLat + maxLat) / 2;
        
        // Calculate appropriate zoom level based on bounds
        const lngDiff = maxLng - minLng;
        const latDiff = maxLat - minLat;
        const maxDiff = Math.max(lngDiff, latDiff);
        
        // Aproximate zoom level (adjust as needed)
        let zoom = 13;
        if (maxDiff > 0.1) zoom = 10;
        if (maxDiff > 0.5) zoom = 8;
        if (maxDiff > 1) zoom = 7;
        if (maxDiff > 2) zoom = 6;
        if (maxDiff < 0.01) zoom = 15;
        if (maxDiff < 0.001) zoom = 17;
        
        // Actualizar initialViewState solo cuando cambia de track
        setInitialViewState({
          longitude: centerLng,
          latitude: centerLat,
          zoom,
          pitch: 45, // Inclinación para ver el efecto 3D de la velocidad
          bearing: 0
        });
      }
      
    } catch (err: any) {
      console.error('Error loading track measurements:', err);
      setError(t('errors.loadMeasurements'));
      setTrackMeasurements([]);
    } finally {
      setLoadingMap(false);
    }
  };

  const reloadTracks = async () => {
    console.log('Reloading tracks...');
    setError(null);
    try {
      const data = await apiService.getTracks();
      setTracks(data);
      console.log('Tracks reloaded:', data.length, data);
    } catch (err: any) {
      console.error('Error reloading tracks:', err);
      setError(err.message || t('errors.loadTracks'));
    }
  };

  // Cargar campañas cuando se selecciona una misión
  const loadCampaignsForMission = async (missionId: number) => {
    setLoadingCampaigns(true);
    setCampaigns([]);
    
    try {
      console.log('Loading campaigns for mission:', missionId);
      // Pedir solo las campañas de esta misión al backend usando el endpoint anidado
      const campaignsData = await apiService.getCampaigns(missionId);
      
      setCampaigns(campaignsData);
      console.log('Campaigns loaded for mission:', campaignsData.length, campaignsData);
    } catch (err: any) {
      console.error('Error loading campaigns:', err);
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleOpenDialog = async (track?: Track) => {
    console.log('Opening dialog for track:', track);
    
    if (track) {
      try {
        // Obtener el track completo del API con todos sus datos actualizados
        console.log('Fetching complete track data from API...');
        const completeTrack = await apiService.getTrack(track.id);
        console.log('Complete track data:', completeTrack);
        
        setEditingTrack(completeTrack);
        
        // Si el track tiene misión, cargar sus campañas para el dropdown
        if (completeTrack.mission) {
          try {
            console.log('Loading campaigns for mission:', completeTrack.mission);
            await loadCampaignsForMission(completeTrack.mission);
          } catch (err) {
            console.error('Error loading campaigns:', err);
          }
        }
        
        // Establecer formData con los valores del track completo
        setFormData({
          name: completeTrack.name,
          description: completeTrack.description || '',
          is_public: completeTrack.is_public || false,
          device: completeTrack.device,
          mission: completeTrack.mission,
          campaign: completeTrack.campaign,
          password: '',
        });
        
        console.log('FormData set:', {
          name: completeTrack.name,
          description: completeTrack.description,
          mission: completeTrack.mission,
          campaign: completeTrack.campaign
        });
        
      } catch (err) {
        console.error('Error loading track:', err);
        // Si falla, usar los datos que tenemos
        setEditingTrack(track);
        setFormData({
          name: track.name,
          description: track.description || '',
          is_public: track.is_public || false,
          device: track.device,
          mission: undefined,
          campaign: track.campaign,
          password: '',
        });
      }
    } else {
      // Nuevo track
      console.log('Creating new track');
      setEditingTrack(null);
      setFormData({
        name: '',
        description: '',
        is_public: false,
        device: undefined,
        mission: undefined,
        campaign: undefined,
        password: '',
      });
      setCampaigns([]);
      loadDevices();
    }
    setDialogError(null);
    setUploadPhase('idle');
    setOpenDialog(true);
  };

  // Dispositivos del usuario para el selector de subida. Si solo hay uno, se preselecciona.
  const loadDevices = async () => {
    setLoadingDevices(true);
    try {
      const data = await apiService.getMyDevices();
      setDevices(data);
      if (data.length === 1) {
        setFormData((prev) => ({ ...prev, device: data[0].id }));
      }
    } catch (err) {
      console.error('Error loading devices:', err);
      setDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleCloseDialog = () => {
    // Si se cierra durante la subida o el sondeo, cancelamos y refrescamos la lista:
    // el track puede existir ya en el backend aunque no hayamos visto el resultado.
    if (uploadAbortRef.current) {
      uploadAbortRef.current.abort();
      uploadAbortRef.current = null;
      if (uploadPhase === 'processing') {
        reloadTracks();
      }
    }
    setUploadPhase('idle');
    setDialogError(null);
    setOpenDialog(false);
    setEditingTrack(null);
    setSelectedFile(null);
    setFileError(null);
    setCampaigns([]); // Limpiar campañas al cerrar
    setFormData({
      name: '',
      description: '',
      is_public: false,
      device: undefined,
      mission: undefined,
      campaign: undefined,
      password: '',
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    // Validar que sea un archivo .rctrk
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'rctrk') {
        setFileError(t('errors.invalidFile'));
        console.log('Invalid file extension:', fileExtension);
        setSelectedFile(null);
        e.target.value = ''; // Limpiar el input
        return;
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        setFileError(t('errors.fileTooLarge'));
        console.log('File too large:', file.size);
        setSelectedFile(null);
        e.target.value = '';
        return;
      }
      console.log('File selected:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
      setSelectedFile(file);
      setFileError(null);
    } else {
      setSelectedFile(null);
    }
  };

  // Traduce los errores de POST /api/tracks/upload/ ({"error": "..."}) a un mensaje para el usuario
  const uploadErrorMessage = (err: any): string => {
    const status: number | undefined = err?.response?.status;
    const serverMessage: string | undefined = err?.response?.data?.error || err?.response?.data?.detail;
    switch (status) {
      case 401:
        return t('errors.unauthorized');
      case 403:
        return t('errors.wrongPassword');
      case 413:
        return t('errors.fileTooLarge');
      case 429: {
        const retryAfter = Number(err?.response?.headers?.['retry-after']);
        if (Number.isFinite(retryAfter) && retryAfter > 0) {
          return t('errors.rateLimited', { minutes: Math.max(1, Math.ceil(retryAfter / 60)) });
        }
        return t('errors.rateLimitedNoRetry');
      }
      default:
        return serverMessage || err?.message || t('errors.saveTrack');
    }
  };

  const handleSaveTrack = async () => {
    setDialogError(null);
    if (editingTrack) {
      try {
        await apiService.updateTrack(editingTrack.id, formData);
        console.log('Track updated:', formData);
        handleCloseDialog();
        reloadTracks();
      } catch (err: any) {
        console.error('Error updating track:', err);
        setDialogError(err?.response?.data?.error || err.message || t('errors.saveTrack'));
      }
      return;
    }

    // Subida de un .rctrk: file, mission y campaign son obligatorios; device es opcional (null si no hay)
    if (!selectedFile) {
      setDialogError(t('errors.selectFile'));
      return;
    }
    if (!formData.mission) {
      setDialogError(t('errors.selectMission'));
      return;
    }
    if (!formData.campaign) {
      setDialogError(t('errors.selectCampaign'));
      return;
    }
    const selectedCampaign = campaigns.find((c) => c.id === formData.campaign);

    const controller = new AbortController();
    uploadAbortRef.current = controller;
    setUploadPhase('uploading');
    let accepted = false; // true cuando el backend ya respondió 202
    try {
      const uploadResponse = await apiService.uploadTrack(
        {
          file: selectedFile,
          device: formData.device,
          mission: formData.mission,
          campaign: formData.campaign,
          campaign_password: selectedCampaign?.has_password ? formData.password : undefined,
          project: selectedProject?.id,
        },
        controller.signal
      );
      console.log('Track upload accepted:', uploadResponse);
      accepted = true;

      // 202: el fichero está en el servidor, pero el procesado va en segundo plano
      setUploadPhase('processing');
      const processed = await apiService.waitForTrackProcessing(uploadResponse.track_id, {
        signal: controller.signal,
      });
      uploadAbortRef.current = null;

      if (processed.status !== 'completed') {
        console.error('Track processing failed:', processed);
        setUploadPhase('idle');
        setDialogError(
          processed.error_message
            ? t('errors.processingFailed', { message: processed.error_message })
            : t('errors.processingFailedNoMessage')
        );
        reloadTracks();
        return;
      }

      console.log('Track processed:', processed);
      setSuccessMessage(
        t('upload.success', {
          name: processed.name || selectedFile.name,
          points: formatNumber(processed.measurements_count ?? 0),
        })
      );
      handleCloseDialog();
      reloadTracks();
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.code === 'ERR_CANCELED') {
        console.log('Track upload cancelled by user');
        return;
      }
      uploadAbortRef.current = null;
      if (err instanceof TrackProcessingTimeoutError || accepted) {
        // Subido pero sin resultado (aún en cola, o falló el sondeo): cerramos y avisamos,
        // la lista mostrará el track con su estado
        console.warn('Track uploaded but processing result unknown:', err);
        handleCloseDialog();
        setError(t('errors.processingTimeout'));
        reloadTracks();
        return;
      }
      console.error('Error uploading track:', err);
      setUploadPhase('idle');
      setDialogError(uploadErrorMessage(err));
    }
  };

  const handleDeleteTrack = async (trackId: number) => {
    try {
      await apiService.deleteTrack(trackId);
      console.log('Track deleted:', trackId);
      setDeleteDialogOpen(false);
      setTrackToDelete(null);
      reloadTracks();
    } catch (err: any) {
      console.error('Error deleting track:', err);
      setError(err.message || t('errors.deleteTrack'));
    }
  };

  const handleOpenDeleteDialog = (track: Track) => {
    setTrackToDelete(track);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTrackToDelete(null);
  };

  const confirmDelete = () => {
    if (trackToDelete) {
      handleDeleteTrack(trackToDelete.id);
    }
  };

  // Validar si el formulario es válido para crear un track
  const isFormValid = () => {
    if (editingTrack) {
      return formData.name.trim() !== '';
    }
    
    // Para subir un track: fichero, misión y campaña son obligatorios; el dispositivo es opcional
    if (uploadPhase !== 'idle') return false;
    if (!selectedFile || !formData.mission || !formData.campaign) return false;
    
    // Si la campaña tiene has_password=true, la contraseña es obligatoria
    const selectedCampaign = campaigns.find(c => c.id === formData.campaign);
    if (selectedCampaign?.has_password && !formData.password.trim()) {
      return false;
    }
    
    return true;
  };


  // Lista mostrada: filtro por búsqueda + orden (solo presentación)
  const displayedTracks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = tracks.filter(
      (t) =>
        !q ||
        t.name?.toLowerCase().includes(q) ||
        t.mission_name?.toLowerCase().includes(q) ||
        t.campaign_name?.toLowerCase().includes(q)
    );
    const time = (t: Track) => new Date(t.start_time || t.created_at || 0).getTime();
    const dist = (t: Track) => t.total_distance ?? t.distance ?? 0;
    const samples = (t: Track) => t.measurements_count ?? 0;
    return [...list].sort((a, b) => {
      switch (sortBy) {
        case 'oldest': return time(a) - time(b);
        case 'longest': return dist(b) - dist(a);
        case 'samples': return samples(b) - samples(a);
        default: return time(b) - time(a);
      }
    });
  }, [tracks, search, sortBy]);

  const totalKm = useMemo(
    () => tracks.reduce((s, t) => s + (t.total_distance ?? t.distance ?? 0), 0) / 1000,
    [tracks]
  );

  // Create map layers for track visualization - MEMOIZADO
  const layers = useMemo(() => [
    new ScatterplotLayer({
      id: 'track-points',
      data: trackMeasurements,
      getPosition: (d: Measurement) => {
        const lng = typeof d.longitude === 'number' ? d.longitude : parseFloat(d.longitude as string);
        const lat = typeof d.latitude === 'number' ? d.latitude : parseFloat(d.latitude as string);
        // Puntos planos en el suelo (sin elevación)
        return [lng, lat];
      },
      getFillColor: (d: Measurement) => {
        // Usar color basado en dose_rate si es RadiationMeasurement
        if ('dose_rate' in d && d.dose_rate !== undefined) {
          return getRadiationColorWithAlpha(d.dose_rate);
        }
        // Color naranja por defecto
        return [255, 140, 0, 200];
      },
      getRadius: 8,
      pickable: true,
      radiusMinPixels: 3,
      radiusMaxPixels: 10,
      onHover: (info: any) => setHoveredPoint(info.object ? info : null),
    }),
    // Path layer to connect the points - 3D con elevación basada en velocidad
    trackMeasurements.length > 1 && new PathLayer({
      id: 'track-path',
      data: [{ 
        path: trackMeasurements.map((m, index) => {
          const lng = typeof m.longitude === 'number' ? m.longitude : parseFloat(m.longitude as string);
          const lat = typeof m.latitude === 'number' ? m.latitude : parseFloat(m.latitude as string);
          
          // Si no hay velocidad, usar la del punto anterior
          let speed = m.speed;
          if (!speed && index > 0) {
            // Buscar la velocidad más reciente
            for (let i = index - 1; i >= 0; i--) {
              if (trackMeasurements[i].speed) {
                speed = trackMeasurements[i].speed;
                break;
              }
            }
          }
          
          const elevation = speed ? speed * 100 : 0; // Altura basada en velocidad
          return [lng, lat, elevation];
        }) 
      }],
      getPath: (d: any) => d.path,
      getColor: [128, 128, 128, 150], // Gris
      getWidth: 3,
      widthMinPixels: 2,
    }),
    // Barras verticales desde el suelo hasta la línea de velocidad
    trackMeasurements.length > 0 && new LineLayer({
      id: 'velocity-bars',
      data: trackMeasurements.map((m, index) => {
        // Si no hay velocidad, usar la del punto anterior
        let speed = m.speed;
        if (!speed && index > 0) {
          for (let i = index - 1; i >= 0; i--) {
            if (trackMeasurements[i].speed) {
              speed = trackMeasurements[i].speed;
              break;
            }
          }
        }
        return { ...m, speed };
      }),
      getSourcePosition: (d: any) => {
        const lng = typeof d.longitude === 'number' ? d.longitude : parseFloat(d.longitude as string);
        const lat = typeof d.latitude === 'number' ? d.latitude : parseFloat(d.latitude as string);
        return [lng, lat, 0]; // Desde el suelo
      },
      getTargetPosition: (d: any) => {
        const lng = typeof d.longitude === 'number' ? d.longitude : parseFloat(d.longitude as string);
        const lat = typeof d.latitude === 'number' ? d.latitude : parseFloat(d.latitude as string);
        const elevation = d.speed ? d.speed * 100 : 0;
        return [lng, lat, elevation]; // Hasta la altura de velocidad
      },
      getColor: [128, 128, 128, 80], // Gris semi-transparente
      getWidth: 1,
      widthMinPixels: 0.5,
    }),
  ].filter(Boolean), [trackMeasurements]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', overflow: 'hidden', position: 'relative', width: '100%' }}>
      {/* Drawer - Panel lateral que aparece encima del mapa */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={!sidebarCollapsed}
        onClose={() => setSidebarCollapsed(true)}
        hideBackdrop
        ModalProps={{
          keepMounted: true,
          style: { pointerEvents: 'none' }, // El modal no captura eventos
        }}
        PaperProps={{
          style: { pointerEvents: 'auto' }, // Solo el panel captura eventos
        }}
        sx={{
          zIndex: 1100, // Por debajo del navbar (que suele tener 1200+)
          '& .MuiDrawer-paper': {
            width: { xs: '85vw', md: 450 },
            boxSizing: 'border-box',
            border: 'none',
            borderRight: `1px solid ${T.border}`,
            backgroundColor: T.surface,
            backgroundImage: 'none',
            p: 3,
            top: 48, // Debajo del navbar (48px)
            height: 'calc(100vh - 48px)',
            borderRadius: 0,
          },
        }}
      >
        {/* Header con botón de colapsar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" gutterBottom>
              {t('header.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('header.subtitle')}
            </Typography>
          </Box>
          <IconButton 
            onClick={() => setSidebarCollapsed(true)}
            size="small"
            sx={{ 
              ml: 1,
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' }
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          fullWidth
          sx={{ mb: 2, textTransform: 'none' }}
        >
          {t('dialog.newButton')}
        </Button>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
            {successMessage}
          </Alert>
        )}

        {/* Header de lista: búsqueda + orden + contador */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, height: 40 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flex: 1, minWidth: 0, borderBottom: `1px solid ${T.border}`, px: 0.5 }}>
            <SearchIcon sx={{ fontSize: 16, color: T.textDim }} />
            <InputBase
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search.placeholder')}
              sx={{ flex: 1, fontFamily: MONO, fontSize: 12, color: T.text, '& input::placeholder': { color: T.textDim, opacity: 1 } }}
            />
          </Box>
          <FormControl size="small" variant="standard">
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              disableUnderline
              sx={{ fontFamily: MONO, fontSize: 11, color: T.textMid, '& .MuiSelect-icon': { color: T.textDim } }}
            >
              <MenuItem value="recent" sx={{ fontSize: 12 }}>{t('sort.recent')}</MenuItem>
              <MenuItem value="oldest" sx={{ fontSize: 12 }}>{t('sort.oldest')}</MenuItem>
              <MenuItem value="longest" sx={{ fontSize: 12 }}>{t('sort.longest')}</MenuItem>
              <MenuItem value="samples" sx={{ fontSize: 12 }}>{t('sort.samples')}</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textDim, mb: 1, textAlign: 'right' }}>
          {t('summary', { count: tracks.length, km: totalKm.toFixed(1) })}
        </Typography>

        {/* Tracks List - filas densas */}
        {tracks.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, color: T.textMid }}>
            <RouteIcon sx={{ fontSize: 48, color: T.textDim, mb: 1.5 }} />
            <Typography sx={{ fontSize: 14, color: T.text, mb: 0.5 }}>{t('empty.title')}</Typography>
            <Typography sx={{ fontSize: 12, color: T.textMid }}>{t('empty.subtitle')}</Typography>
          </Box>
        ) : (
          <Box sx={{ borderTop: `1px dashed ${T.hairline}` }}>
            {displayedTracks.map((track) => {
              const selected = selectedTrack?.id === track.id;
              const dotColor = statusColor(track.status);
              const meta = trackMetaLabel(track);
              const range = formatTrackRange(track);
              const stats = trackStats(track);
              return (
                <Box
                  key={track.id}
                  onClick={() => handleTrackClick(track)}
                  sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    px: 1.5,
                    py: 1.25,
                    borderBottom: `1px dashed ${T.hairline}`,
                    borderLeft: selected ? `2px solid ${T.accent}` : '2px solid transparent',
                    backgroundColor: selected ? T.accentSoft : 'transparent',
                    '&:hover': { backgroundColor: selected ? T.accentSoft : T.surface2 },
                    '&:hover .row-actions': { opacity: 1 },
                  }}
                >
                  {/* Línea 1: nombre + acciones (hover) */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                      {dotColor && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: dotColor, flexShrink: 0 }} />}
                      <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 500, color: T.text }}>
                        {track.name}
                      </Typography>
                    </Box>
                    <Box className="row-actions" sx={{ display: 'flex', gap: 0.25, opacity: 0, transition: 'opacity 120ms ease', flexShrink: 0 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleOpenDialog(track); }}
                        sx={{ color: T.textDim, '&:hover': { color: T.text } }}
                      >
                        <EditIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => { e.stopPropagation(); handleOpenDeleteDialog(track); }}
                        sx={{ color: T.textDim, '&:hover': { color: DANGER } }}
                      >
                        <DeleteIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Línea 2: misión · campaña */}
                  {meta && (
                    <Typography noWrap sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.5px', color: T.textMid, mt: 0.25 }}>
                      {meta}
                    </Typography>
                  )}

                  {/* Línea 3: fechas colapsadas */}
                  {range && (
                    <Typography noWrap sx={{ fontFamily: MONO, fontSize: 11, color: T.textMid, mt: 0.25 }}>
                      {range}
                    </Typography>
                  )}

                  {/* Línea 4: stats */}
                  {stats && (
                    <Typography noWrap sx={{ fontFamily: MONO, fontSize: 10, color: T.textDim, mt: 0.25 }}>
                      {stats}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Drawer>

      {/* Botón para expandir el sidebar cuando está colapsado */}
      {sidebarCollapsed && (
        <Box
          sx={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1000
          }}
        >
          <IconButton
            onClick={() => setSidebarCollapsed(false)}
            sx={{
              backgroundColor: 'rgba(18,22,27,0.92)',
              border: `1px solid ${T.border}`,
              color: T.text,
              backdropFilter: 'blur(8px)',
              '&:hover': {
                backgroundColor: T.surface3,
              },
            }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}

      {/* Map - Siempre ocupa toda la pantalla de fondo */}
      <Box sx={{ 
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
      }}>
        {/* Mensaje cuando no hay track seleccionado (sin tapar el mapa, estilo Home) */}
        {!selectedTrack && (
          <Paper
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 3,
              p: 3,
              textAlign: 'center',
              maxWidth: 420,
              bgcolor: 'rgba(18,22,27,0.92)',
              border: `1px solid ${T.border}`,
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.32)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <RouteIcon sx={{ fontSize: 80, color: T.textDim, mb: 2 }} />
            <Typography variant="h6" sx={{ color: T.textMid }}>
              {t('map.selectPrompt')}
            </Typography>
          </Paper>
        )}
        
        {/* Loading indicator */}
        {loadingMap && selectedTrack && (
          <Box sx={{ 
            position: 'absolute', 
            top: 16, 
            right: 16, 
            zIndex: 3,
            bgcolor: 'background.paper',
            borderRadius: 1,
            p: 2,
            boxShadow: 2
          }}>
            <CircularProgress size={24} />
          </Box>
        )}
        
        {/* Mapa DeckGL - siempre montado */}
        <DeckGL
          initialViewState={initialViewState}
          controller={true}
          layers={layers}
          style={{ position: 'relative', width: '100%', height: '100%' }}
          getCursor={() => 'default'}
        >
          <Map
            mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            projection={{ name: 'mercator' }}
            style={{ width: '100%', height: '100%' }}
            reuseMaps
            interactive={false}
          />
        </DeckGL>

        {/* Track Info Overlay - solo visible cuando hay track seleccionado */}
        {selectedTrack && (
          <>
            <Paper sx={{ 
              position: 'absolute', 
              top: 16, 
              left: 16, 
              p: 2,
              maxWidth: 300,
              zIndex: 3
            }}>
              <Typography variant="h6" sx={{ mb: 1, fontSize: '1rem' }}>
                {selectedTrack.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('map.pointsLoaded', { count: trackMeasurements.length })}
              </Typography>
            </Paper>

            {/* Leyenda de colores */}
            <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 3, width: 180 }}>
              <FloatPanel title="Dose Rate" right="µSv/h">
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                  {RADIATION_LEGEND.map((item, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 20, height: 10, background: item.gradient, borderRadius: '2px', flexShrink: 0 }} />
                      <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textMid }}>{item.label}</Typography>
                    </Box>
                  ))}
                </Box>
              </FloatPanel>
            </Box>

            {/* Tooltip for hovered point */}
            {hoveredPoint && hoveredPoint.object && (
              <Paper sx={{ 
                position: 'absolute', 
                left: hoveredPoint.x + 10, 
                top: hoveredPoint.y + 10, 
                p: 1.5,
                zIndex: 4,
                maxWidth: 300,
                pointerEvents: 'none'
              }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {t('tooltip.title')}
                </Typography>
                {'dose_rate' in hoveredPoint.object && hoveredPoint.object.dose_rate !== undefined && (
                  <Typography variant="caption" component="div" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                    {hoveredPoint.object.dose_rate.toFixed(2)} {hoveredPoint.object.radiation_unit || 'µSv/h'}
                  </Typography>
                )}
                {'speed' in hoveredPoint.object && hoveredPoint.object.speed !== undefined && hoveredPoint.object.speed !== null && (
                  <Typography variant="caption" component="div" sx={{ color: 'primary.main' }}>
                    {(hoveredPoint.object.speed * 3.6).toFixed(2)} km/h
                  </Typography>
                )}
                {'count_rate' in hoveredPoint.object && hoveredPoint.object.count_rate && (
                  <Typography variant="caption" component="div" sx={{ color: 'info.main' }}>
                    {hoveredPoint.object.count_rate.toFixed(2)} CPM
                  </Typography>
                )}
                <Typography variant="caption" component="div">
                  {t('tooltip.lat', { value: typeof hoveredPoint.object.latitude === 'number'
                    ? hoveredPoint.object.latitude.toFixed(6)
                    : parseFloat(hoveredPoint.object.latitude).toFixed(6) })}
                </Typography>
                <Typography variant="caption" component="div">
                  {t('tooltip.lng', { value: typeof hoveredPoint.object.longitude === 'number'
                    ? hoveredPoint.object.longitude.toFixed(6)
                    : parseFloat(hoveredPoint.object.longitude).toFixed(6) })}
                </Typography>
                {hoveredPoint.object.altitude && (
                  <Typography variant="caption" component="div">
                    {t('tooltip.altitude', { value: hoveredPoint.object.altitude })}
                  </Typography>
                )}
                {hoveredPoint.object.dateTime && (
                  <Typography variant="caption" component="div" color="text.secondary">
                    {formatDateTime(hoveredPoint.object.dateTime)}
                  </Typography>
                )}
                
                {/* Datos del tiempo */}
                {hoveredPoint.object.weather_cache && (
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                      {t('tooltip.weatherTitle')}
                    </Typography>
                    {hoveredPoint.object.weather_cache.temperature != null && (
                      <Typography variant="caption" component="div">
                        {hoveredPoint.object.weather_cache.temperature.toFixed(1)}°C
                      </Typography>
                    )}
                    {hoveredPoint.object.weather_cache.humidity != null && (
                      <Typography variant="caption" component="div">
                        {t('tooltip.humidity', { value: hoveredPoint.object.weather_cache.humidity.toFixed(0) })}
                      </Typography>
                    )}
                    {hoveredPoint.object.weather_cache.pressure != null && (
                      <Typography variant="caption" component="div">
                        {t('tooltip.pressure', { value: hoveredPoint.object.weather_cache.pressure.toFixed(1) })}
                      </Typography>
                    )}
                    {hoveredPoint.object.weather_cache.wind_speed != null && hoveredPoint.object.weather_cache.wind_direction != null && (
                      <Typography variant="caption" component="div">
                        {t('tooltip.wind', { speed: hoveredPoint.object.weather_cache.wind_speed.toFixed(1), direction: hoveredPoint.object.weather_cache.wind_direction.toFixed(0) })}
                      </Typography>
                    )}
                    {hoveredPoint.object.weather_cache.cloud_cover != null && (
                      <Typography variant="caption" component="div">
                        {t('tooltip.cloudCover', { value: hoveredPoint.object.weather_cache.cloud_cover.toFixed(0) })}
                      </Typography>
                    )}
                  </Box>
                )}
                
                {hoveredPoint.object.notes && (
                  <Typography variant="caption" component="div" sx={{ mt: 1, fontStyle: 'italic', color: 'text.secondary' }}>
                    {hoveredPoint.object.notes}
                  </Typography>
                )}
              </Paper>
            )}
          </>
        )}
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={uploadPhase === 'idle' ? handleCloseDialog : undefined}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingTrack ? t('dialog.editTitle') : t('dialog.newTitle')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {!editingTrack && (
              <>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  disabled={uploadPhase !== 'idle'}
                  sx={{ 
                    height: 56, 
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                    color: selectedFile ? 'primary.main' : 'text.secondary',
                    borderColor: selectedFile ? 'primary.main' : 'rgba(255, 255, 255, 0.23)',
                  }}
                >
                  {selectedFile ? selectedFile.name : t('dialog.selectFile')}
                  <input
                    type="file"
                    accept=".rctrk"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
                <Typography sx={{ fontSize: 12, color: T.textMid, mt: -1 }}>
                  {t('dialog.fileHint')}
                </Typography>
                
                {fileError && (
                  <Alert severity="error" sx={{ mt: 0 }} onClose={() => setFileError(null)}>
                    {fileError}
                  </Alert>
                )}
                
                {selectedFile && (
                  <Alert severity="info" sx={{ mt: 0 }}>
                    {t('dialog.fileSize', { value: (selectedFile.size / 1024).toFixed(2) })}
                    {' '}
                    {t('dialog.duplicateWarning')}
                  </Alert>
                )}

                <FormControl fullWidth disabled={loadingDevices || uploadPhase !== 'idle'}>
                  <InputLabel id="device-select-label">
                    {loadingDevices ? t('fields.deviceLoading') : t('fields.device')}
                  </InputLabel>
                  <Select
                    labelId="device-select-label"
                    value={formData.device || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      device: e.target.value ? Number(e.target.value) : undefined,
                    })}
                    label={loadingDevices ? t('fields.deviceLoading') : t('fields.device')}
                  >
                    <MenuItem value="">
                      <em>{t('fields.none')}</em>
                    </MenuItem>
                    {devices.map((device) => (
                      <MenuItem key={device.id} value={device.id}>
                        {deviceLabel(device)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {!loadingDevices && devices.length === 0 && (
                  <Alert severity="info" sx={{ mt: -1 }}>
                    {t('fields.noDevices')}{' '}
                    <RouterLink to="/devices" style={{ color: 'inherit' }}>
                      {t('common:nav.myDevices')}
                    </RouterLink>
                  </Alert>
                )}
              </>
            )}
            
            {editingTrack && (
              <TextField
                label={t('fields.name')}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
            )}
            
            {/* La subida no acepta descripción; solo se edita después */}
            {editingTrack && (
              <TextField
                label={t('fields.description')}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                multiline
                rows={3}
                fullWidth
              />
            )}
            
            <FormControl fullWidth required={!editingTrack} disabled={uploadPhase !== 'idle'}>
              <InputLabel id="mission-select-label">
                {editingTrack ? t('fields.mission') : t('fields.missionRequired')}
              </InputLabel>
              <Select
                labelId="mission-select-label"
                value={formData.mission || ''}
                onChange={(e) => {
                  const missionId = e.target.value ? Number(e.target.value) : undefined;
                  console.log('Mission selected:', missionId);
                  console.log('Available missions:', missions);
                  setFormData({ 
                    ...formData, 
                    mission: missionId,
                    campaign: undefined // Reset campaign when mission changes
                  });
                  
                  // Cargar campañas para esta misión
                  if (missionId) {
                    loadCampaignsForMission(missionId);
                  } else {
                    setCampaigns([]);
                  }
                }}
                label={editingTrack ? t('fields.mission') : t('fields.missionRequired')}
              >
                {editingTrack && (
                  <MenuItem value="">
                    <em>{t('fields.none')}</em>
                  </MenuItem>
                )}
                {missions.map((mission) => (
                  <MenuItem key={mission.id} value={mission.id}>
                    {mission.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl
              fullWidth
              required={!editingTrack}
              disabled={!formData.mission || loadingCampaigns || uploadPhase !== 'idle'}
            >
              <InputLabel id="campaign-select-label">
                {loadingCampaigns
                  ? t('fields.campaignLoading')
                  : editingTrack ? t('fields.campaign') : t('fields.campaignRequired')}
              </InputLabel>
              <Select
                labelId="campaign-select-label"
                value={formData.campaign || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  campaign: e.target.value ? Number(e.target.value) : undefined,
                  password: '' // Limpiar contraseña al cambiar de campaña
                })}
                label={loadingCampaigns
                  ? t('fields.campaignLoading')
                  : editingTrack ? t('fields.campaign') : t('fields.campaignRequired')}
              >
                {editingTrack && (
                  <MenuItem value="">
                    <em>{t('fields.none')}</em>
                  </MenuItem>
                )}
                {campaigns.map((campaign) => (
                  <MenuItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Campo de contraseña - solo si la campaña seleccionada tiene has_password=true */}
            {formData.campaign && campaigns.find(c => c.id === formData.campaign)?.has_password && (
              <TextField
                label={t('fields.campaignPassword')}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                fullWidth
                required
                disabled={uploadPhase !== 'idle'}
                helperText={t('fields.campaignPasswordHelper')}
              />
            )}

            {/* Progreso: subida del fichero y luego sondeo del procesado en el backend */}
            {uploadPhase !== 'idle' && (
              <Box>
                <LinearProgress sx={{ mb: 1 }} />
                <Typography sx={{ fontSize: 12, color: T.textMid }}>
                  {uploadPhase === 'uploading' ? t('upload.uploading') : t('upload.processing')}
                </Typography>
              </Box>
            )}

            {dialogError && (
              <Alert severity="error" onClose={() => setDialogError(null)}>
                {dialogError}
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            onClick={handleSaveTrack}
            variant="contained"
            disabled={!isFormValid()}
            startIcon={uploadPhase !== 'idle' ? <CircularProgress size={14} color="inherit" /> : undefined}
          >
            {editingTrack ? t('common:actions.save') : t('dialog.upload')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de confirmación de borrado */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={handleCloseDeleteDialog}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('delete.title')}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('delete.warning')}
          </Alert>
          {trackToDelete && (
            <Typography>
              <Trans
                t={t}
                i18nKey="delete.confirmText"
                values={{ name: trackToDelete.name }}
                components={{ strong: <strong /> }}
              />
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>
            {t('common:actions.cancel')}
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
          >
            {t('common:actions.delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TracksPage;
