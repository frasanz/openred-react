import React, { useState, useEffect, useCallback, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer, PathLayer, LineLayer } from '@deck.gl/layers';
import { Map } from 'react-map-gl';
import { getRadiationColorWithAlpha, RADIATION_LEGEND } from '../utils/radiationColors';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useMediaQuery,
  useTheme,
  Drawer,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Route as RouteIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Public as PublicIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  CalendarToday as CalendarIcon,
  AccessTime as ClockIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { Track, Measurement, Mission, Campaign } from '../types';
import { useAuth } from '../context/AuthContext';
import { useProjectContext } from '../context/ProjectContext';
import apiService from '../services/api';
import { useNavigate } from 'react-router-dom';

const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || '';

const TracksPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { selectedProject } = useProjectContext();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tracks, setTracks] = useState<Track[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  
  // Estado para diálogo de confirmación de eliminación
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);
  
  // Estado para controlar si el panel lateral está colapsado
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(isMobile);
  
  // Estado para controlar qué tarjetas están expandidas
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  
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
    mission: undefined as number | undefined,
    campaign: undefined as number | undefined,
  });
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const abortController = new AbortController();

    const loadTracks = async () => {
      console.log('🔄 Loading tracks...');
      setLoading(true);
      setError(null);
      try {
        const data = await apiService.getTracks();
        if (!abortController.signal.aborted) {
          setTracks(data);
          console.log('📍 Tracks loaded:', data.length, data);
        }
      } catch (err: any) {
        if (!abortController.signal.aborted) {
          console.error('❌ Error loading tracks:', err);
          setError(err.message || 'Error al cargar los tracks');
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    const loadMissionsAndCampaigns = async () => {
      try {
        console.log('📞 Calling getMissions API...');
        const missionsData = await apiService.getMissions();
        console.log('📦 getMissions response:', missionsData);
        
        if (!abortController.signal.aborted) {
          setMissions(missionsData);
          console.log('✅ Missions set in state:', missionsData.length, missionsData);
        } else {
          console.log('⚠️ Request aborted, skipping setMissions');
        }
      } catch (err: any) {
        console.error('❌ Error loading missions:', err);
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
  }, [isAuthenticated, navigate, selectedProject]);

  // Load track measurements when a track is selected
  const handleTrackClick = async (track: Track) => {
    setSelectedTrack(track);
    setLoadingMap(true);
    
    try {
      console.log('🗺️ Loading measurements for track:', track.id);
      
      // Llamar al endpoint de measurements con filtro por track
      const measurements = await apiService.getMeasurements({ track: track.id });
      
      console.log(`✅ Loaded ${measurements.length} measurements for track ${track.id}`);
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
      console.error('❌ Error loading track measurements:', err);
      setError('Error al cargar las mediciones del track');
      setTrackMeasurements([]);
    } finally {
      setLoadingMap(false);
    }
  };

  const reloadTracks = async () => {
    console.log('🔄 Reloading tracks...');
    setError(null);
    try {
      const data = await apiService.getTracks();
      setTracks(data);
      console.log('📍 Tracks reloaded:', data.length, data);
    } catch (err: any) {
      console.error('❌ Error reloading tracks:', err);
      setError(err.message || 'Error al cargar los tracks');
    }
  };

  // Cargar campañas cuando se selecciona una misión
  const loadCampaignsForMission = async (missionId: number) => {
    setLoadingCampaigns(true);
    setCampaigns([]);
    
    try {
      // Obtener el projectId del contexto
      const projectId = selectedProject?.id;
      
      if (!projectId) {
        console.warn('⚠️ No project selected, cannot load campaigns');
        return;
      }
      
      console.log('🔄 Loading campaigns for mission:', missionId, 'and project:', projectId);
      // Pedir solo las campañas de esta misión y proyecto al backend
      const campaignsData = await apiService.getCampaigns(missionId, projectId);
      
      setCampaigns(campaignsData);
      console.log('🎪 Campaigns loaded for mission:', campaignsData.length, campaignsData);
    } catch (err: any) {
      console.error('❌ Error loading campaigns:', err);
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleOpenDialog = async (track?: Track) => {
    console.log('🚪 Opening dialog for track:', track);
    
    if (track) {
      try {
        // Obtener el track completo del API con todos sus datos actualizados
        console.log('📞 Fetching complete track data from API...');
        const completeTrack = await apiService.getTrack(track.id);
        console.log('📦 Complete track data:', completeTrack);
        
        setEditingTrack(completeTrack);
        
        // Si el track tiene misión, cargar sus campañas para el dropdown
        if (completeTrack.mission) {
          try {
            console.log('🎯 Loading campaigns for mission:', completeTrack.mission);
            await loadCampaignsForMission(completeTrack.mission);
          } catch (err) {
            console.error('❌ Error loading campaigns:', err);
          }
        }
        
        // Establecer formData con los valores del track completo
        setFormData({
          name: completeTrack.name,
          description: completeTrack.description || '',
          is_public: completeTrack.is_public || false,
          mission: completeTrack.mission,
          campaign: completeTrack.campaign,
        });
        
        console.log('✅ FormData set:', {
          name: completeTrack.name,
          description: completeTrack.description,
          mission: completeTrack.mission,
          campaign: completeTrack.campaign
        });
        
      } catch (err) {
        console.error('❌ Error loading track:', err);
        // Si falla, usar los datos que tenemos
        setEditingTrack(track);
        setFormData({
          name: track.name,
          description: track.description || '',
          is_public: track.is_public || false,
          mission: undefined,
          campaign: track.campaign,
        });
      }
    } else {
      // Nuevo track
      console.log('➕ Creating new track');
      setEditingTrack(null);
      setFormData({
        name: '',
        description: '',
        is_public: false,
        mission: undefined,
        campaign: undefined,
      });
      setCampaigns([]);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTrack(null);
    setSelectedFile(null);
    setFileError(null);
    setCampaigns([]); // Limpiar campañas al cerrar
    setFormData({
      name: '',
      description: '',
      is_public: false,
      mission: undefined,
      campaign: undefined,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    // Validar que sea un archivo .rctrk
    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'rctrk') {
        setFileError('Solo se permiten archivos con extensión .rctrk');
        console.log('⚠️ Invalid file extension:', fileExtension);
        setSelectedFile(null);
        e.target.value = ''; // Limpiar el input
        return;
      }
      console.log('📁 File selected:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
      setSelectedFile(file);
      setFileError(null);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSaveTrack = async () => {
    try {
      if (editingTrack) {
        await apiService.updateTrack(editingTrack.id, formData);
        console.log('✏️ Track updated:', formData);
      } else {
        // Para crear un track necesitamos un archivo
        if (!selectedFile) {
          setError('Por favor selecciona un archivo RCTRK');
          return;
        }

        // Construir FormData para el upload
        const uploadData = new FormData();
        uploadData.append('file', selectedFile);
        
        // Obtener projectId del contexto
        const projectId = selectedProject?.id;
        if (!projectId) {
          setError('Por favor selecciona un proyecto primero');
          return;
        }
        uploadData.append('project', projectId.toString());
        uploadData.append('device', '1'); // TODO: obtener del selector de dispositivo
        
        // Detectar el tipo de archivo (siempre rctrk)
        const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
        if (fileExtension === 'rctrk') {
          uploadData.append('file_type', 'rctrk');
        }
        
        if (formData.description) {
          uploadData.append('description', formData.description);
        }
        
        // Añadir misión y campaña si están seleccionadas
        if (formData.mission) {
          uploadData.append('mission', formData.mission.toString());
        }
        
        if (formData.campaign) {
          uploadData.append('campaign', formData.campaign.toString());
        }

        await apiService.createTrack(uploadData);
        console.log('➕ Track created with file:', selectedFile.name);
      }
      handleCloseDialog();
      reloadTracks();
    } catch (err: any) {
      console.error('Error saving track:', err);
      setError(err.message || 'Error al guardar el track');
    }
  };

  const handleDeleteTrack = async (trackId: number) => {
    try {
      await apiService.deleteTrack(trackId);
      console.log('🗑️ Track deleted:', trackId);
      setDeleteDialogOpen(false);
      setTrackToDelete(null);
      reloadTracks();
    } catch (err: any) {
      console.error('Error deleting track:', err);
      setError(err.message || 'Error al eliminar el track');
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

  const toggleCardExpansion = (trackId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Evitar que se active handleTrackClick
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) {
        newSet.delete(trackId);
      } else {
        newSet.add(trackId);
      }
      return newSet;
    });
  };

  const formatDistance = (meters?: number) => {
    if (!meters) return '-';
    if (meters < 1000) return `${meters.toFixed(0)} m`;
    return `${(meters / 1000).toFixed(2)} km`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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
    <Box sx={{ position: 'relative', height: 'calc(100vh - 64px)', width: '100%' }}>
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
            borderRight: '1px solid',
            borderColor: 'divider',
            p: 3,
            top: 64, // Empieza debajo del navbar
            height: 'calc(100vh - 64px)', // Altura sin contar el navbar
          },
        }}
      >
        {/* Header con botón de colapsar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" gutterBottom>
              Mis Tracks
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Gestiona tus trayectorias
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
              sx={{ mb: 3 }}
            >
              Nuevo Track
            </Button>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tracks List */}
        {tracks.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 4 }}>
            <CardContent>
              <RouteIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No hay tracks
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Crea tu primer track subiendo un archivo RCTRK
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tracks.map((track) => {
              const isExpanded = expandedCards.has(track.id);
              
              return (
                <Card 
                  key={track.id} 
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedTrack?.id === track.id ? 2 : 0,
                    borderColor: 'primary.main',
                    '&:hover': { boxShadow: 3 }
                  }}
                  onClick={() => handleTrackClick(track)}
                >
                  <CardContent sx={{ pb: 1 }}>
                    {/* Header con título, icono público y botón expandir */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600, mb: 0.5 }}>
                          {track.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {track.is_public && <PublicIcon fontSize="small" color="action" />}
                        <IconButton 
                          size="small" 
                          onClick={(e) => toggleCardExpansion(track.id, e)}
                          sx={{ 
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.3s'
                          }}
                        >
                          <ExpandMoreIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Chips de estado, misión y campaña - SIEMPRE VISIBLES */}
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
                      {track.status && (
                        <Chip 
                          label={track.status} 
                          size="small" 
                          color={track.status === 'completed' ? 'success' : track.status === 'error' ? 'error' : 'default'}
                        />
                      )}
                      {track.mission_name && (
                        <Chip 
                          label={track.mission_name} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                        />
                      )}
                      {track.campaign_name && (
                        <Chip 
                          label={track.campaign_name} 
                          size="small" 
                          color="secondary"
                          variant="outlined"
                        />
                      )}
                    </Box>

                    {/* Fechas inicio y fin - SIEMPRE VISIBLES */}
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: 1,
                      fontSize: '0.875rem'
                    }}>
                      {track.start_time && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <ClockIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2, fontSize: '0.7rem' }}>
                              Inicio
                            </Typography>
                            <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.813rem' }}>
                              {formatDateTime(track.start_time)}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                      {track.end_time && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <ClockIcon fontSize="small" color="action" />
                          <Box>
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2, fontSize: '0.7rem' }}>
                              Fin
                            </Typography>
                            <Typography variant="body2" fontWeight={500} sx={{ fontSize: '0.813rem' }}>
                              {formatDateTime(track.end_time)}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    </Box>

                    {/* Contenido expandible con Collapse de MUI */}
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box>
                        {/* Descripción */}
                        {track.description && (
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem', mt: 2, mb: 1.5 }}>
                            {track.description}
                          </Typography>
                        )}

                        {/* Información detallada en grid */}
                        <Box sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(2, 1fr)', 
                          gap: 1.5, 
                          mt: 2,
                          fontSize: '0.875rem'
                        }}>
                          {/* Mediciones */}
                          {track.measurements_count !== undefined && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <TimelineIcon fontSize="small" color="action" />
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
                                  Mediciones
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {track.measurements_count}
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {/* Distancia - usar total_distance si existe, sino distance */}
                          {(track.total_distance !== undefined || track.distance !== undefined) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <RouteIcon fontSize="small" color="action" />
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
                                  Distancia
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {formatDistance(track.total_distance || track.distance)}
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {/* Velocidad promedio */}
                          {track.average_speed !== undefined && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <SpeedIcon fontSize="small" color="action" />
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
                                  Velocidad media
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {(track.average_speed * 3.6).toFixed(2)} km/h
                                </Typography>
                              </Box>
                            </Box>
                          )}

                          {/* Duración */}
                          {track.duration && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <TimerIcon fontSize="small" color="action" />
                              <Box>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
                                  Duración
                                </Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {formatDuration(track.duration)}
                                </Typography>
                              </Box>
                            </Box>
                          )}
                        </Box>

                        {/* Sección de Estadísticas de Radiación */}
                        {(track.avg_dose_rate !== undefined && track.avg_dose_rate !== null || 
                          track.max_dose_rate !== undefined && track.max_dose_rate !== null || 
                          track.min_dose_rate !== undefined && track.min_dose_rate !== null) && (
                          <Box sx={{ 
                            mt: 2,
                            pt: 2, 
                            borderTop: '1px solid',
                            borderColor: 'divider'
                          }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.primary' }}>
                              Tasa de dosis
                            </Typography>
                            <Box sx={{ 
                              display: 'grid', 
                              gridTemplateColumns: 'repeat(2, 1fr)', 
                              gap: 1,
                              fontSize: '0.813rem'
                            }}>
                              {track.avg_dose_rate !== undefined && track.avg_dose_rate !== null && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem' }}>
                                    Media
                                  </Typography>
                                  <Typography variant="body2" fontWeight={500} sx={{ color: 'warning.main' }}>
                                    {track.avg_dose_rate.toFixed(3)} µSv/h
                                  </Typography>
                                </Box>
                              )}
                              {track.max_dose_rate !== undefined && track.max_dose_rate !== null && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem' }}>
                                    Máxima
                                  </Typography>
                                  <Typography variant="body2" fontWeight={500} sx={{ color: 'error.main' }}>
                                    {track.max_dose_rate.toFixed(3)} µSv/h
                                  </Typography>
                                </Box>
                              )}
                              {track.min_dose_rate !== undefined && track.min_dose_rate !== null && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem' }}>
                                    Mínima
                                  </Typography>
                                  <Typography variant="body2" fontWeight={500} sx={{ color: 'success.main' }}>
                                    {track.min_dose_rate.toFixed(3)} µSv/h
                                  </Typography>
                                </Box>
                              )}
                              {track.std_dose_rate !== undefined && track.std_dose_rate !== null && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem' }}>
                                    Desv. std
                                  </Typography>
                                  <Typography variant="body2" fontWeight={500} sx={{ color: 'info.main' }}>
                                    {track.std_dose_rate.toFixed(3)} µSv/h
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        )}

                        {/* Fecha de creación al final */}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 0.5, 
                          pt: 1.5, 
                          mt: 1.5,
                          borderTop: '1px solid',
                          borderColor: 'divider'
                        }}>
                          <CalendarIcon fontSize="small" sx={{ fontSize: '0.875rem', color: 'text.secondary' }} />
                          <Typography variant="caption" color="text.secondary">
                            Creado: {formatDate(track.created_at)}
                          </Typography>
                        </Box>
                      </Box>
                    </Collapse>
                  </CardContent>
                  
                  <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                    <IconButton 
                      size="small" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleOpenDialog(track); 
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        handleOpenDeleteDialog(track); 
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
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
              backgroundColor: 'background.paper',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                backgroundColor: 'action.hover',
                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
              }
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
        {/* Mensaje cuando no hay track seleccionado */}
        {!selectedTrack && (
          <Box sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            bgcolor: 'background.default',
            zIndex: 2
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <RouteIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Selecciona un track para ver su recorrido
              </Typography>
            </Box>
          </Box>
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
                {trackMeasurements.length} puntos cargados
              </Typography>
            </Paper>

            {/* Leyenda de colores */}
            <Paper sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              p: 2,
              minWidth: '180px',
              zIndex: 3
            }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
                Tasa de dosis (µSv/h)
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {RADIATION_LEGEND.map((item, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                      width: 24, 
                      height: 16, 
                      background: item.gradient,
                      borderRadius: '2px',
                      border: '1px solid rgba(0,0,0,0.1)'
                    }} />
                    <Typography variant="caption" sx={{ fontSize: '11px' }}>{item.label}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

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
                  Medición Individual
                </Typography>
                {'dose_rate' in hoveredPoint.object && hoveredPoint.object.dose_rate !== undefined && (
                  <Typography variant="caption" component="div" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                    ☢️ {hoveredPoint.object.dose_rate.toFixed(2)} {hoveredPoint.object.radiation_unit || 'µSv/h'}
                  </Typography>
                )}
                {'speed' in hoveredPoint.object && hoveredPoint.object.speed !== undefined && hoveredPoint.object.speed !== null && (
                  <Typography variant="caption" component="div" sx={{ color: 'primary.main' }}>
                    🚀 {(hoveredPoint.object.speed * 3.6).toFixed(2)} km/h
                  </Typography>
                )}
                {'count_rate' in hoveredPoint.object && hoveredPoint.object.count_rate && (
                  <Typography variant="caption" component="div" sx={{ color: 'info.main' }}>
                    📊 {hoveredPoint.object.count_rate.toFixed(2)} CPM
                  </Typography>
                )}
                <Typography variant="caption" component="div">
                  📍 Lat: {typeof hoveredPoint.object.latitude === 'number' 
                    ? hoveredPoint.object.latitude.toFixed(6) 
                    : parseFloat(hoveredPoint.object.latitude).toFixed(6)}
                </Typography>
                <Typography variant="caption" component="div">
                  📍 Lng: {typeof hoveredPoint.object.longitude === 'number' 
                    ? hoveredPoint.object.longitude.toFixed(6) 
                    : parseFloat(hoveredPoint.object.longitude).toFixed(6)}
                </Typography>
                {hoveredPoint.object.altitude && (
                  <Typography variant="caption" component="div">
                    ⛰️ {hoveredPoint.object.altitude}m
                  </Typography>
                )}
                {hoveredPoint.object.dateTime && (
                  <Typography variant="caption" component="div" color="text.secondary">
                    🕐 {new Date(hoveredPoint.object.dateTime).toLocaleString('es-ES')}
                  </Typography>
                )}
                
                {/* Datos del tiempo */}
                {hoveredPoint.object.weather_cache && (
                  <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                      ☁️ Condiciones Meteorológicas
                    </Typography>
                    {hoveredPoint.object.weather_cache.temperature != null && (
                      <Typography variant="caption" component="div">
                        🌡️ {hoveredPoint.object.weather_cache.temperature.toFixed(1)}°C
                      </Typography>
                    )}
                    {hoveredPoint.object.weather_cache.humidity != null && (
                      <Typography variant="caption" component="div">
                        💧 Humedad: {hoveredPoint.object.weather_cache.humidity.toFixed(0)}%
                      </Typography>
                    )}
                    {hoveredPoint.object.weather_cache.pressure != null && (
                      <Typography variant="caption" component="div">
                        🔽 Presión: {hoveredPoint.object.weather_cache.pressure.toFixed(1)} hPa
                      </Typography>
                    )}
                    {hoveredPoint.object.weather_cache.wind_speed != null && hoveredPoint.object.weather_cache.wind_direction != null && (
                      <Typography variant="caption" component="div">
                        💨 Viento: {hoveredPoint.object.weather_cache.wind_speed.toFixed(1)} m/s ({hoveredPoint.object.weather_cache.wind_direction.toFixed(0)}°)
                      </Typography>
                    )}
                    {hoveredPoint.object.weather_cache.cloud_cover != null && (
                      <Typography variant="caption" component="div">
                        ☁️ Nubosidad: {hoveredPoint.object.weather_cache.cloud_cover.toFixed(0)}%
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTrack ? 'Editar Track' : 'Nuevo Track'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {!editingTrack && (
              <>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  sx={{ 
                    height: 56, 
                    textTransform: 'none',
                    justifyContent: 'flex-start',
                    color: selectedFile ? 'primary.main' : 'text.secondary',
                    borderColor: selectedFile ? 'primary.main' : 'rgba(0, 0, 0, 0.23)',
                  }}
                >
                  {selectedFile ? selectedFile.name : 'Seleccionar archivo RCTRK'}
                  <input
                    type="file"
                    accept="*"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
                
                {fileError && (
                  <Alert severity="error" sx={{ mt: 0 }} onClose={() => setFileError(null)}>
                    {fileError}
                  </Alert>
                )}
                
                {selectedFile && (
                  <Alert severity="info" sx={{ mt: 0 }}>
                    Tamaño: {(selectedFile.size / 1024).toFixed(2)} KB
                  </Alert>
                )}
              </>
            )}
            
            {editingTrack && (
              <TextField
                label="Nombre del track"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
            )}
            
            <TextField
              label="Descripción"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            
            <FormControl fullWidth>
              <InputLabel id="mission-select-label">Misión (opcional)</InputLabel>
              <Select
                labelId="mission-select-label"
                value={formData.mission || ''}
                onChange={(e) => {
                  const missionId = e.target.value ? Number(e.target.value) : undefined;
                  console.log('📝 Mission selected:', missionId);
                  console.log('🔍 Available missions:', missions);
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
                label="Misión (opcional)"
              >
                <MenuItem value="">
                  <em>Ninguna</em>
                </MenuItem>
                {missions.map((mission) => (
                  <MenuItem key={mission.id} value={mission.id}>
                    {mission.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl fullWidth disabled={!formData.mission || loadingCampaigns}>
              <InputLabel id="campaign-select-label">
                {loadingCampaigns ? 'Cargando campañas...' : 'Campaña (opcional)'}
              </InputLabel>
              <Select
                labelId="campaign-select-label"
                value={formData.campaign || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  campaign: e.target.value ? Number(e.target.value) : undefined 
                })}
                label={loadingCampaigns ? 'Cargando campañas...' : 'Campaña (opcional)'}
              >
                <MenuItem value="">
                  <em>Ninguna</em>
                </MenuItem>
                {campaigns.map((campaign) => (
                  <MenuItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            Cancelar
          </Button>
          <Button
            onClick={handleSaveTrack}
            variant="contained"
            disabled={editingTrack ? !formData.name.trim() : !selectedFile}
          >
            {editingTrack ? 'Guardar' : 'Crear'}
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
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            ¡Atención! Borrarás el track y todos los datos asociados.
          </Alert>
          {trackToDelete && (
            <Typography>
              ¿Estás seguro de que quieres eliminar "<strong>{trackToDelete.name}</strong>"?
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>
            Cancelar
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TracksPage;
