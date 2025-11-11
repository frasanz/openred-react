import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Box,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  AccountTree as DevicesIcon,
  Analytics as MeasuresIcon,
  Analytics,
  Campaign as CampaignIcon,
  CalendarToday as DateIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { User } from '../types';

interface ProfileFormData {
  email: string;
}

interface UserStats {
  total_measurements: number;
  total_tracks: number;
  total_missions: number;
  total_campaigns: number;
  first_measurement_date: string | null;
  last_measurement_date: string | null;
  highest_dose_rate: number | null;
}

const profileSchema = yup.object({
  email: yup.string().email('Email inválido').required('El email es requerido'),
});

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      email: user?.email || '',
    }
  });

  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
      });
      loadUserStats();
    }
  }, [user, reset]);

  const loadUserStats = async () => {
    try {
      const stats = await apiService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    try {
      const updatedUser = await apiService.updateProfile(data);
      updateUser(updatedUser);
      setAlert({ type: 'success', message: 'Perfil actualizado correctamente' });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setAlert({ 
        type: 'error', 
        message: error.response?.data?.message || 'Error al actualizar el perfil' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (user: User) => {
    // Usar las primeras dos letras del email
    return user.email.substring(0, 2).toUpperCase();
  };

  const getDisplayName = (user: User) => {
    // Usar el username o la parte del email antes del @
    return user.username || user.email.split('@')[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>Cargando...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', gap: 4, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Información del perfil */}
        <Box sx={{ flex: 2 }}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mr: 3,
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {getInitials(user)}
              </Avatar>
              <Box>
                <Typography variant="h4" gutterBottom>
                  {getDisplayName(user)}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {user.email}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <DateIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  Miembro desde {formatDate(user.date_joined)}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="h6" gutterBottom>
              Editar Perfil
            </Typography>

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  {...register('email')}
                  label="Email"
                  type="email"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  InputProps={{
                    startAdornment: <EmailIcon sx={{ mr: 1, color: 'action.active' }} />
                  }}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{ minWidth: 120 }}
                  >
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => reset()}
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Estadísticas y resumen */}
        <Box sx={{ flex: 1 }}>
          {/* Estadísticas */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estadísticas
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <MeasuresIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Mediciones totales"
                    secondary={
                      <Chip 
                        label={userStats?.total_measurements || 0} 
                        size="small" 
                        color="primary" 
                      />
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <DevicesIcon color="secondary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Tracks"
                    secondary={
                      <Chip 
                        label={userStats?.total_tracks || 0} 
                        size="small" 
                        color="secondary" 
                      />
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CampaignIcon color="info" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Misiones"
                    secondary={
                      <Chip 
                        label={userStats?.total_missions || 0} 
                        size="small" 
                        color="info" 
                      />
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CampaignIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Campañas"
                    secondary={
                      <Chip 
                        label={userStats?.total_campaigns || 0} 
                        size="small" 
                        color="success" 
                      />
                    }
                  />
                </ListItem>
                <Divider sx={{ my: 1 }} />
                <ListItem>
                  <ListItemIcon>
                    <Analytics color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Dosis máxima"
                    secondary={
                      <Chip 
                        label={userStats?.highest_dose_rate 
                          ? `${userStats.highest_dose_rate.toFixed(3)} μSv/h` 
                          : 'N/A'
                        } 
                        size="small" 
                        color="error" 
                      />
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Periodo de actividad */}
          {userStats?.first_measurement_date && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Periodo de Actividad
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <DateIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Primera medición"
                      secondary={formatDate(userStats.first_measurement_date)}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <DateIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Última medición"
                      secondary={userStats.last_measurement_date 
                        ? formatDate(userStats.last_measurement_date)
                        : 'N/A'
                      }
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>

      {/* Snackbar para mensajes */}
      <Snackbar
        open={!!alert}
        autoHideDuration={6000}
        onClose={() => setAlert(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setAlert(null)} 
          severity={alert?.type || 'info'}
          sx={{ width: '100%' }}
        >
          {alert?.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProfilePage;
