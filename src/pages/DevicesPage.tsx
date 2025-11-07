import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
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
  Chip,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DeviceHub as DeviceIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Device, DeviceModel, DeviceFormData } from '../types';
import apiService from '../services/api';

const deviceSchema: yup.ObjectSchema<DeviceFormData> = yup.object({
  device_model: yup.number().required('Selecciona un modelo de dispositivo'),
  serial_number: yup.string().required('El número de serie es requerido'),
  hash: yup.string().optional(),
});

const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [deviceModels, setDeviceModels] = useState<DeviceModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeviceFormData>({
    resolver: yupResolver(deviceSchema),
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [devicesData, modelsData] = await Promise.all([
        apiService.getDevices(),
        apiService.getDeviceModels(),
      ]);

      setDevices(devicesData);
      setDeviceModels(modelsData);
    } catch (err: any) {
      setError('Error al cargar los dispositivos');
      console.error('Error loading devices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (device?: Device) => {
    if (device) {
      setEditingDevice(device);
      reset({
        device_model: device.device_model.id,
        serial_number: device.serial_number,
        hash: device.hash,
      });
    } else {
      setEditingDevice(null);
      reset({
        device_model: undefined,
        serial_number: '',
        hash: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingDevice(null);
    reset();
  };

  const handleSubmitDevice = async (data: DeviceFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (editingDevice) {
        await apiService.updateDevice(editingDevice.id, data);
      } else {
        await apiService.createDevice(data);
      }

      await loadData();
      handleCloseDialog();
    } catch (err: any) {
      setError(
        editingDevice 
          ? 'Error al actualizar el dispositivo'
          : 'Error al crear el dispositivo'
      );
      console.error('Error saving device:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = async (deviceId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este dispositivo?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await apiService.deleteDevice(deviceId);
      await loadData();
    } catch (err: any) {
      setError('Error al eliminar el dispositivo');
      console.error('Error deleting device:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && devices.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Cargando dispositivos...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          Mis Dispositivos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Agregar Dispositivo
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {devices.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <DeviceIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No tienes dispositivos registrados
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Agregar Primer Dispositivo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 3 }}>
          {devices.map((device) => (
            <Card key={device.id} elevation={3}>
              <CardContent>
                <Typography variant="h6">{device.device_model.name}</Typography>
                <Typography variant="body2">Serie: {device.serial_number}</Typography>
                <Chip
                  label={device.is_active ? 'Activo' : 'Inactivo'}
                  color={device.is_active ? 'success' : 'error'}
                  size="small"
                />
              </CardContent>
              <CardActions>
                <IconButton onClick={() => handleOpenDialog(device)}>
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => handleDeleteDevice(device.id)}>
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDevice ? 'Editar Dispositivo' : 'Agregar Dispositivo'}
        </DialogTitle>
        <form onSubmit={handleSubmit(handleSubmitDevice)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
              <Controller
                name="device_model"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.device_model}>
                    <InputLabel>Modelo</InputLabel>
                    <Select {...field} label="Modelo">
                      {deviceModels.map((model) => (
                        <MenuItem key={model.id} value={model.id}>
                          {model.name} - {model.manufacturer}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
              <Controller
                name="serial_number"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Número de Serie"
                    fullWidth
                    error={!!errors.serial_number}
                    helperText={errors.serial_number?.message}
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {editingDevice ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default DevicesPage;
