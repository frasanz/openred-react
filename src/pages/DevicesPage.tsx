import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DeviceHub as DeviceIcon,
  Autorenew as RegenerateIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Code as CodeIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useTranslation } from 'react-i18next';
import {
  Device,
  DeviceModel,
  DeviceFormData,
  Station,
  StationFormData,
} from '../types';
import apiService from '../services/api';
import { useProjects, type Project } from '../hooks/useProjects';
import { useLocale } from '../utils/i18nFormat';
import { Section } from '../components/ui/Section';
import { StatusDot } from '../components/ui/StatusDot';
import { StationMapPicker, hasMapboxToken } from '../components/StationMapPicker';
import { darkTokens as T } from '../theme/tokens';
import { MONO } from '../theme/theme';

// Ejemplo ilustrativo de ingesta de una medida (radiación). El dispositivo lo envía con su
// ingest token en la cabecera X-Device-Token; los campos siguen RadiationMeasurement.
const EXAMPLE_MEASUREMENT = `POST https://api.open-red.es/api/ingest/radiation/
X-Device-Token: <token_del_dispositivo>
Content-Type: application/json

{
  "capture_mode": "movement",
  "project": 3,
  "latitude": 41.65,
  "longitude": -0.88,
  "altitude": 250,
  "accuracy": 4.5,
  "speed": 1.2,
  "cpm": 18,
  "cpm_error": 1.3,
  "dose_rate": 0.12,
  "dose_rate_error": 0.02,
  "dateTime": "2026-05-30T17:05:00Z"
}`;

// Extrae un mensaje legible de un error de Axios (detail / non_field_errors / errores de campo).
const extractApiError = (err: any, fallback: string): string => {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.detail) return String(data.detail);
  if (Array.isArray(data.non_field_errors)) return data.non_field_errors.join(' ');
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const value = data[firstKey];
    return Array.isArray(value) ? value.join(' ') : String(value);
  }
  return fallback;
};

const DevicesPage: React.FC = () => {
  const { t } = useTranslation('devices');
  const { formatDate } = useLocale();
  const { projects } = useProjects();

  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Diálogos de dispositivo
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  // Token mostrado una sola vez (tras crear / regenerar)
  const [revealedToken, setRevealedToken] = useState<string | null>(null);
  const [tokenCopied, setTokenCopied] = useState(false);
  // Diálogo con el ejemplo JSON de ingesta
  const [exampleOpen, setExampleOpen] = useState(false);
  const [exampleCopied, setExampleCopied] = useState(false);

  // Diálogos de estación
  const [stationDialogOpen, setStationDialogOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);

  // De momento, solo se puede crear una estación en el proyecto de pruebas.
  const radiationProjects = useMemo(
    () => projects.filter((p) => p.project_type === 'radiation' && p.name === 'radiation-test'),
    [projects],
  );

  // Más recientes primero; los que nunca han medido van al final.
  const sortedDevices = useMemo(
    () =>
      [...devices].sort((a, b) => {
        const aTime = a.last_measurement_at ? new Date(a.last_measurement_at).getTime() : -Infinity;
        const bTime = b.last_measurement_at ? new Date(b.last_measurement_at).getTime() : -Infinity;
        return bTime - aTime;
      }),
    [devices],
  );

  // Dispositivos disponibles para asociar a una estación: los del usuario sin estación previa,
  // más el actualmente asociado cuando se edita.
  const availableStationDevices = useMemo(() => {
    const usedDeviceIds = new Set(stations.map((s) => s.device));
    return devices.filter(
      (d) => !usedDeviceIds.has(d.id) || (editingStation && d.id === editingStation.device),
    );
  }, [devices, stations, editingStation]);

  // ----- Formulario de dispositivo -----
  const deviceSchema = useMemo(
    () =>
      yup.object({
        device_model: yup.number().required(t('validation.modelRequired')),
        serial_number: yup.string().required(t('validation.serialRequired')),
        calibration_date: yup.string().optional(),
        is_active: yup.boolean().optional(),
      }),
    [t],
  );

  const {
    control: deviceControl,
    handleSubmit: handleDeviceSubmit,
    reset: resetDeviceForm,
    formState: { errors: deviceErrors },
  } = useForm<DeviceFormData>({
    resolver: yupResolver(deviceSchema) as any,
    defaultValues: { serial_number: '', calibration_date: '', is_active: true },
  });

  // ----- Formulario de estación -----
  const stationSchema = useMemo(
    () =>
      yup.object({
        name: yup.string().required(t('validation.nameRequired')),
        device: yup.number().typeError(t('validation.deviceRequired')).required(t('validation.deviceRequired')),
        project: yup.number().typeError(t('validation.projectRequired')).required(t('validation.projectRequired')),
        latitude: yup
          .number()
          .typeError(t('validation.latitudeRequired'))
          .min(-90, t('validation.latitudeRange'))
          .max(90, t('validation.latitudeRange'))
          .required(t('validation.latitudeRequired')),
        longitude: yup
          .number()
          .typeError(t('validation.longitudeRequired'))
          .min(-180, t('validation.longitudeRange'))
          .max(180, t('validation.longitudeRange'))
          .required(t('validation.longitudeRequired')),
        altitude: yup.number().optional(),
        expected_interval_seconds: yup.number().optional(),
      }),
    [t],
  );

  const {
    control: stationControl,
    handleSubmit: handleStationSubmit,
    reset: resetStationForm,
    setValue: setStationValue,
    watch: watchStation,
    formState: { errors: stationErrors },
  } = useForm<StationFormData>({
    resolver: yupResolver(stationSchema) as any,
    defaultValues: { name: '', expected_interval_seconds: 300 },
  });

  const stationLat = watchStation('latitude');
  const stationLng = watchStation('longitude');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [devicesData, modelsData, stationsData] = await Promise.all([
        apiService.getMyDevices(),
        apiService.getDeviceModels(),
        apiService.getMyStations(),
      ]);
      setDevices(devicesData);
      setDeviceModels(modelsData);
      setStations(stationsData);
    } catch (err) {
      setError(t('errors.load'));
      console.error('Error loading devices/stations:', err);
    } finally {
      setLoading(false);
    }
  };

  // ----- Acciones de dispositivo -----
  const openDeviceDialog = (device?: Device) => {
    setError(null);
    if (device) {
      setEditingDevice(device);
      resetDeviceForm({
        device_model: device.device_model?.id,
        serial_number: device.serial_number,
        calibration_date: device.calibration_date ?? '',
        is_active: device.is_active,
      });
    } else {
      setEditingDevice(null);
      resetDeviceForm({
        device_model: undefined,
        serial_number: '',
        calibration_date: '',
        is_active: true,
      });
    }
    setDeviceDialogOpen(true);
  };

  const closeDeviceDialog = () => {
    setDeviceDialogOpen(false);
    setEditingDevice(null);
    resetDeviceForm();
  };

  const submitDevice = async (data: DeviceFormData) => {
    try {
      setLoading(true);
      setError(null);
      // No enviar calibration_date vacío.
      const payload: DeviceFormData = {
        ...data,
        calibration_date: data.calibration_date || undefined,
      };
      if (editingDevice) {
        await apiService.updateDevice(editingDevice.id, payload);
      } else {
        const created = await apiService.createDevice(payload);
        if (created.ingest_token) {
          revealToken(created.ingest_token);
        }
      }
      await loadData();
      closeDeviceDialog();
    } catch (err) {
      setError(extractApiError(err, t(editingDevice ? 'errors.updateDevice' : 'errors.createDevice')));
      console.error('Error saving device:', err);
    } finally {
      setLoading(false);
    }
  };

  const regenerateToken = async (deviceId: number) => {
    if (!window.confirm(t('regenerateConfirm'))) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.regenerateDeviceToken(deviceId);
      revealToken(res.ingest_token);
      await loadData();
    } catch (err) {
      setError(extractApiError(err, t('errors.regenerate')));
      console.error('Error regenerating token:', err);
    } finally {
      setLoading(false);
    }
  };

  const revealToken = (token: string) => {
    setRevealedToken(token);
    setTokenCopied(false);
  };

  const copyToken = async () => {
    if (!revealedToken) return;
    try {
      await navigator.clipboard.writeText(revealedToken);
      setTokenCopied(true);
    } catch (err) {
      console.error('Clipboard write failed:', err);
    }
  };

  const copyExample = async () => {
    try {
      await navigator.clipboard.writeText(EXAMPLE_MEASUREMENT);
      setExampleCopied(true);
    } catch (err) {
      console.error('Clipboard write failed:', err);
    }
  };

  // ----- Acciones de estación -----
  const openStationDialog = (station?: Station) => {
    setError(null);
    if (station) {
      setEditingStation(station);
      resetStationForm({
        name: station.name,
        device: station.device,
        project: station.project,
        latitude: station.latitude,
        longitude: station.longitude,
        altitude: station.altitude,
        expected_interval_seconds: station.expected_interval_seconds ?? 300,
      });
    } else {
      setEditingStation(null);
      resetStationForm({
        name: '',
        device: undefined,
        project: undefined,
        latitude: undefined,
        longitude: undefined,
        altitude: undefined,
        expected_interval_seconds: 300,
      });
    }
    setStationDialogOpen(true);
  };

  const closeStationDialog = () => {
    setStationDialogOpen(false);
    setEditingStation(null);
    resetStationForm();
  };

  const submitStation = async (data: StationFormData) => {
    try {
      setLoading(true);
      setError(null);
      if (editingStation) {
        await apiService.updateStation(editingStation.id, data);
      } else {
        await apiService.createStation(data);
      }
      await loadData();
      closeStationDialog();
    } catch (err) {
      setError(extractApiError(err, t(editingStation ? 'errors.updateStation' : 'errors.createStation')));
      console.error('Error saving station:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteStation = async (stationId: number) => {
    if (!window.confirm(t('confirm.deleteStation'))) return;
    try {
      setLoading(true);
      setError(null);
      await apiService.deleteStation(stationId);
      await loadData();
    } catch (err) {
      setError(extractApiError(err, t('errors.deleteStation')));
      console.error('Error deleting station:', err);
    } finally {
      setLoading(false);
    }
  };

  // ----- Helpers de presentación -----
  const stationStatusKind = (status?: string): 'ok' | 'warn' | 'danger' | 'info' => {
    switch (status) {
      case 'online':
        return 'ok';
      case 'offline':
        return 'danger';
      default:
        return 'info';
    }
  };

  const projectName = (id: number) => projects.find((p) => p.id === id)?.name ?? `#${id}`;
  const deviceSerial = (id: number) => devices.find((d) => d.id === id)?.serial_number ?? `#${id}`;

  if (loading && devices.length === 0 && stations.length === 0) {
    return (
      <Box sx={{ bgcolor: T.bg, minHeight: '100%', display: 'flex', justifyContent: 'center', pt: 10 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={24} />
          <Typography sx={{ mt: 2, color: T.textMid, fontSize: 13 }}>{t('loading')}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: T.bg, color: T.text, minHeight: '100%' }}>
      <Box sx={{ maxWidth: 980, mx: 'auto', px: 3, pt: 6, pb: 12 }}>
        <Typography component="h1" sx={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.015em', mb: 4 }}>
          {t('header.title')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* ----- Sección Dispositivos ----- */}
        <Section
          divider={false}
          label={t('sections.devices')}
          right={
            <Tooltip title={t('exampleDialog.title')}>
              <IconButton size="small" onClick={() => { setExampleCopied(false); setExampleOpen(true); }}>
                <CodeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          }
        >
          <Typography sx={{ fontSize: 12, color: T.textMid, mb: 2 }}>{t('sections.devicesHint')}</Typography>

          {devices.length === 0 ? (
            <EmptyState icon={<DeviceIcon />} text={t('empty.devices')} />
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
              {sortedDevices.map((device) => (
                <CardShell key={device.id}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      {device.device_model ? (
                        <>
                          <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{device.device_model.name}</Typography>
                          <Typography sx={{ fontFamily: MONO, fontSize: 11, color: T.textMid, mt: 0.25 }}>
                            {t('card.serial', { serial: device.serial_number })}
                          </Typography>
                        </>
                      ) : (
                        <Typography sx={{ fontFamily: MONO, fontSize: 14, fontWeight: 600 }}>
                          {device.serial_number}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={device.is_active ? t('card.active') : t('card.inactive')}
                      size="small"
                      color={device.is_active ? 'success' : 'default'}
                      variant="outlined"
                      sx={{ fontSize: 11, height: 22 }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.5 }}>
                    <StatusDot kind={device.has_ingest_token ? 'ok' : 'warn'} />
                    <Typography sx={{ fontSize: 12, color: T.textMid }}>
                      {device.has_ingest_token ? t('card.tokenPresent') : t('card.tokenAbsent')}
                    </Typography>
                  </Box>
                  {device.has_ingest_token && device.ingest_token_created_at && (
                    <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textDim, mt: 0.5 }}>
                      {t('card.tokenCreatedAt', { date: formatDate(device.ingest_token_created_at) })}
                    </Typography>
                  )}
                  {device.calibration_date && (
                    <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textDim, mt: 0.25 }}>
                      {t('card.calibration', { date: formatDate(device.calibration_date) })}
                    </Typography>
                  )}
                  <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textDim, mt: 0.25 }}>
                    {device.last_measurement_at
                      ? t('card.lastMeasurement', { date: formatDate(device.last_measurement_at) })
                      : t('card.neverMeasured')}
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1.5 }}>
                    <Tooltip title={t('actions.regenerate')}>
                      <IconButton size="small" onClick={() => regenerateToken(device.id)}>
                        <RegenerateIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('actions.edit')}>
                      <IconButton size="small" onClick={() => openDeviceDialog(device)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardShell>
              ))}
            </Box>
          )}
        </Section>

        {/* ----- Sección Estaciones ----- */}
        <Box sx={{ mt: 5 }}>
          <Section
            label={t('sections.stations')}
            right={
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => openStationDialog()}
                disabled={devices.length === 0}
                sx={{ fontSize: 12 }}
              >
                {t('sections.addStation')}
              </Button>
            }
          >
            <Typography sx={{ fontSize: 12, color: T.textMid, mb: 2 }}>{t('sections.stationsHint')}</Typography>

            {devices.length === 0 ? (
              <Typography sx={{ fontSize: 12, color: T.textDim }}>{t('empty.noDevicesForStation')}</Typography>
            ) : stations.length === 0 ? (
              <Typography sx={{ fontSize: 12, color: T.textDim }}>{t('empty.stations')}</Typography>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
                {stations.map((station) => (
                  <CardShell key={station.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <StatusDot kind={stationStatusKind(station.status)} />
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{station.name}</Typography>
                    </Box>
                    <Typography sx={{ fontFamily: MONO, fontSize: 11, color: T.textMid, mt: 0.75 }}>
                      {t('stationCard.device', { serial: deviceSerial(station.device) })}
                    </Typography>
                    <Typography sx={{ fontFamily: MONO, fontSize: 11, color: T.textMid, mt: 0.25 }}>
                      {t('stationCard.project', { name: projectName(station.project) })}
                    </Typography>
                    <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textDim, mt: 0.25 }}>
                      {t('stationCard.location', { lat: station.latitude, lon: station.longitude })}
                    </Typography>
                    <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textDim, mt: 0.25 }}>
                      {station.last_measurement_at
                        ? t('stationCard.lastMeasurement', { date: formatDate(station.last_measurement_at) })
                        : t('stationCard.neverMeasured')}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1.5 }}>
                      <Tooltip title={t('actions.edit')}>
                        <IconButton size="small" onClick={() => openStationDialog(station)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t('actions.delete')}>
                        <IconButton size="small" onClick={() => deleteStation(station.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardShell>
                ))}
              </Box>
            )}
          </Section>
        </Box>
      </Box>

      {/* ----- Diálogo crear/editar dispositivo ----- */}
      <Dialog open={deviceDialogOpen} onClose={closeDeviceDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDevice ? t('deviceDialog.editTitle') : t('deviceDialog.addTitle')}</DialogTitle>
        <form onSubmit={handleDeviceSubmit(submitDevice)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <Controller
                name="device_model"
                control={deviceControl}
                render={({ field }) => (
                  <FormControl fullWidth error={!!deviceErrors.device_model}>
                    <InputLabel>{t('deviceDialog.modelLabel')}</InputLabel>
                    <Select {...field} value={field.value ?? ''} label={t('deviceDialog.modelLabel')}>
                      {deviceModels.map((model) => (
                        <MenuItem key={model.id} value={model.id}>
                          {t('deviceDialog.modelOption', { name: model.name, manufacturer: model.manufacturer })}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="serial_number"
                control={deviceControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('deviceDialog.serialLabel')}
                    fullWidth
                    disabled={!!editingDevice}
                    error={!!deviceErrors.serial_number}
                    helperText={deviceErrors.serial_number?.message}
                  />
                )}
              />
              {!editingDevice && (
                <Controller
                  name="calibration_date"
                  control={deviceControl}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      value={field.value ?? ''}
                      type="date"
                      label={t('deviceDialog.calibrationLabel')}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              )}
              <Controller
                name="is_active"
                control={deviceControl}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={!!field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label={t('deviceDialog.activeLabel')}
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDeviceDialog}>{t('deviceDialog.cancel')}</Button>
            <Button type="submit" variant="contained">
              {editingDevice ? t('deviceDialog.update') : t('deviceDialog.create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ----- Diálogo del ingest token (una sola vez) ----- */}
      <Dialog open={!!revealedToken} onClose={() => setRevealedToken(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('tokenDialog.title')}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            {t('tokenDialog.warning')}
          </Alert>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: T.surface2,
              border: `1px solid ${T.border}`,
              borderRadius: '6px',
              p: 1.5,
            }}
          >
            <Typography sx={{ fontFamily: MONO, fontSize: 12, wordBreak: 'break-all', flex: 1 }}>
              {revealedToken}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={tokenCopied ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
              onClick={copyToken}
            >
              {tokenCopied ? t('tokenDialog.copied') : t('tokenDialog.copy')}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setRevealedToken(null)}>
            {t('tokenDialog.done')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ----- Diálogo del ejemplo JSON de ingesta ----- */}
      <Dialog open={exampleOpen} onClose={() => setExampleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('exampleDialog.title')}</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            {t('exampleDialog.note')}
          </Alert>
          <Typography sx={{ fontSize: 12, color: T.textMid, mb: 2 }}>{t('exampleDialog.intro')}</Typography>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 1.5,
              bgcolor: T.surface2,
              border: `1px solid ${T.border}`,
              borderRadius: '6px',
              fontFamily: MONO,
              fontSize: 12,
              lineHeight: 1.5,
              color: T.text,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              overflowX: 'auto',
            }}
          >
            {EXAMPLE_MEASUREMENT}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={exampleCopied ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
            onClick={copyExample}
          >
            {exampleCopied ? t('exampleDialog.copied') : t('exampleDialog.copy')}
          </Button>
          <Button variant="contained" onClick={() => setExampleOpen(false)}>
            {t('exampleDialog.close')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ----- Diálogo crear/editar estación ----- */}
      <Dialog open={stationDialogOpen} onClose={closeStationDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingStation ? t('stationDialog.editTitle') : t('stationDialog.addTitle')}</DialogTitle>
        <form onSubmit={handleStationSubmit(submitStation)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <Controller
                name="name"
                control={stationControl}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label={t('stationDialog.nameLabel')}
                    fullWidth
                    error={!!stationErrors.name}
                    helperText={stationErrors.name?.message}
                  />
                )}
              />
              <Controller
                name="device"
                control={stationControl}
                render={({ field }) => (
                  <FormControl fullWidth error={!!stationErrors.device}>
                    <InputLabel>{t('stationDialog.deviceLabel')}</InputLabel>
                    <Select {...field} value={field.value ?? ''} label={t('stationDialog.deviceLabel')}>
                      {availableStationDevices.map((d) => (
                        <MenuItem key={d.id} value={d.id}>
                          {d.serial_number}{d.device_model ? ` — ${d.device_model.name}` : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="project"
                control={stationControl}
                render={({ field }) => (
                  <FormControl fullWidth error={!!stationErrors.project}>
                    <InputLabel>{t('stationDialog.projectLabel')}</InputLabel>
                    <Select {...field} value={field.value ?? ''} label={t('stationDialog.projectLabel')}>
                      {radiationProjects.map((p: Project) => (
                        <MenuItem key={p.id} value={p.id}>
                          {p.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              {hasMapboxToken ? (
                <Box>
                  <Typography sx={{ fontSize: 12, color: T.textMid, mb: 1 }}>
                    {t('stationDialog.mapHint')}
                  </Typography>
                  <StationMapPicker
                    latitude={typeof stationLat === 'number' ? stationLat : undefined}
                    longitude={typeof stationLng === 'number' ? stationLng : undefined}
                    onChange={(lat, lng) => {
                      setStationValue('latitude', lat, { shouldValidate: true });
                      setStationValue('longitude', lng, { shouldValidate: true });
                    }}
                  />
                  <Typography sx={{ fontFamily: MONO, fontSize: 11, color: T.textMid, mt: 1 }}>
                    {typeof stationLat === 'number' && typeof stationLng === 'number'
                      ? t('stationCard.location', { lat: stationLat, lon: stationLng })
                      : t('stationDialog.noLocation')}
                  </Typography>
                  {(stationErrors.latitude || stationErrors.longitude) && (
                    <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.5 }}>
                      {stationErrors.latitude?.message || stationErrors.longitude?.message}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Controller
                    name="latitude"
                    control={stationControl}
                    render={({ field }) => (
                      <TextField
                        type="number"
                        label={t('stationDialog.latitudeLabel')}
                        fullWidth
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        error={!!stationErrors.latitude}
                        helperText={stationErrors.latitude?.message}
                      />
                    )}
                  />
                  <Controller
                    name="longitude"
                    control={stationControl}
                    render={({ field }) => (
                      <TextField
                        type="number"
                        label={t('stationDialog.longitudeLabel')}
                        fullWidth
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                        error={!!stationErrors.longitude}
                        helperText={stationErrors.longitude?.message}
                      />
                    )}
                  />
                </Box>
              )}
              <Controller
                name="altitude"
                control={stationControl}
                render={({ field }) => (
                  <TextField
                    type="number"
                    label={t('stationDialog.altitudeLabel')}
                    fullWidth
                    value={field.value ?? ''}
                    onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeStationDialog}>{t('stationDialog.cancel')}</Button>
            <Button type="submit" variant="contained">
              {editingStation ? t('stationDialog.update') : t('stationDialog.create')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

// Tarjeta con el estilo del sistema de diseño oscuro.
const CardShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    sx={{
      bgcolor: T.surface,
      border: `1px solid ${T.border}`,
      borderRadius: '8px',
      p: 2,
    }}
  >
    {children}
  </Box>
);

const EmptyState: React.FC<{ icon: React.ReactNode; text: string; children?: React.ReactNode }> = ({
  icon,
  text,
  children,
}) => (
  <Box
    sx={{
      textAlign: 'center',
      py: 6,
      border: `1px dashed ${T.border}`,
      borderRadius: '8px',
    }}
  >
    <Box sx={{ color: T.textDim, '& svg': { fontSize: 56 }, mb: 1.5 }}>{icon}</Box>
    <Typography sx={{ fontSize: 14, color: T.textMid, mb: 2 }}>{text}</Typography>
    {children}
  </Box>
);

export default DevicesPage;
