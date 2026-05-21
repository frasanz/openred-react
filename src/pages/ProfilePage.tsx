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
  InputAdornment,
  Divider,
  Chip
} from '@mui/material';
import {
  Email as EmailIcon,
  BadgeOutlined as BadgeIcon,
  QueryStatsOutlined as MeasurementsIcon,
  CloudOutlined as TracksIcon,
  TrackChangesOutlined as MissionsIcon,
  CampaignOutlined as CampaignsIcon,
  ScienceOutlined as DoseIcon,
  CalendarMonthOutlined as CalendarIcon
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { User } from '../types';
import {
  OPENRED_ACCENT_RED,
  OPENRED_NAVY,
  OPENRED_PAGE_BG,
  openredBoxSx,
  openredBoxStaticSx,
} from '../styles/boxes';

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

  const pageBg = OPENRED_PAGE_BG;
  const navy = OPENRED_NAVY;
  const red = OPENRED_ACCENT_RED;

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
    <Box sx={{ minHeight: '100vh', background: pageBg, py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
            gap: 4,
            alignItems: 'start',
          }}
        >
          {/* Tarjeta principal: perfil + edición */}
          <Paper
            sx={{
              ...openredBoxStaticSx,
              p: { xs: 3, md: 4 },
              borderRadius: 3,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: navy,
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}
              >
                {getInitials(user)}
              </Avatar>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 500, lineHeight: 1.1, textTransform: 'none' }}
                >
                  {getDisplayName(user)}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(0,0,0,0.65)', mt: 0.5, wordBreak: 'break-word' }}
                >
                  {user.email}
                </Typography>

                <Chip
                  icon={<BadgeIcon sx={{ color: 'rgba(0,0,0,0.75)' }} />}
                  label={`Miembro desde ${formatDate(user.date_joined)}`}
                  size="small"
                  sx={{
                    mt: 1,
                    bgcolor: 'rgba(255,255,255,0.55)',
                    border: '1px solid rgba(0,0,0,0.10)',
                    '& .MuiChip-label': { fontSize: 12 },
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ mb: 3, borderColor: 'rgba(0,0,0,0.12)' }} />

            <Typography variant="h6" sx={{ fontWeight: 500, mb: 1.5 }}>
              Editar Perfil
            </Typography>

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <TextField
                {...register('email')}
                label="Email"
                type="email"
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255,255,255,0.60)',
                    borderRadius: 3,
                    '& fieldset': { borderColor: 'rgba(0,0,0,0.20)' },
                    '&:hover fieldset': { borderColor: 'rgba(0,0,0,0.35)' },
                    '&.Mui-focused fieldset': { borderColor: navy },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: 'rgba(0,0,0,0.60)' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  size="small"
                  sx={{
                    bgcolor: navy,
                    '&:hover': { bgcolor: navy },
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 999,
                    px: 2,
                  }}
                >
                  {loading ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => reset()}
                  disabled={loading}
                  size="small"
                  sx={{
                    borderColor: navy,
                    color: navy,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 999,
                    px: 2,
                    '&:hover': { borderColor: navy, bgcolor: 'rgba(7,81,164,0.06)' },
                  }}
                >
                  Cancelar
                </Button>
              </Box>
            </Box>
          </Paper>

          {/* Columna derecha: estadísticas + periodo */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Paper
              sx={{
                ...openredBoxSx,
                p: { xs: 3, md: 3.5 },
                borderRadius: 3,
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 500, mb: 2 }}>
                Tus estadísticas
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '32px 1fr auto', alignItems: 'center', columnGap: 1.5 }}>
                  <MeasurementsIcon sx={{ color: 'rgba(0,0,0,0.70)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.70)' }}>
                    Mediciones totales
                  </Typography>
                  <Typography className="statNumber" variant="h4" sx={{ fontWeight: 700, lineHeight: 1 }}>
                    {userStats?.total_measurements ?? 0}
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '32px 1fr auto', alignItems: 'center', columnGap: 1.5 }}>
                  <TracksIcon sx={{ color: 'rgba(0,0,0,0.70)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.70)' }}>
                    Tracks
                  </Typography>
                  <Typography className="statNumber" variant="h4" sx={{ fontWeight: 700, lineHeight: 1 }}>
                    {userStats?.total_tracks ?? 0}
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '32px 1fr auto', alignItems: 'center', columnGap: 1.5 }}>
                  <MissionsIcon sx={{ color: 'rgba(0,0,0,0.70)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.70)' }}>
                    Misiones
                  </Typography>
                  <Typography className="statNumber" variant="h4" sx={{ fontWeight: 700, lineHeight: 1 }}>
                    {userStats?.total_missions ?? 0}
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '32px 1fr auto', alignItems: 'center', columnGap: 1.5 }}>
                  <CampaignsIcon sx={{ color: 'rgba(0,0,0,0.70)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.70)' }}>
                    Campañas
                  </Typography>
                  <Typography className="statNumber" variant="h4" sx={{ fontWeight: 700, lineHeight: 1 }}>
                    {userStats?.total_campaigns ?? 0}
                  </Typography>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: '32px 1fr auto', alignItems: 'center', columnGap: 1.5 }}>
                  <DoseIcon sx={{ color: 'rgba(0,0,0,0.70)' }} />
                  <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.70)' }}>
                    Dosis máxima
                  </Typography>
                  <Typography className="statNumber" variant="h4" sx={{ fontWeight: 700, lineHeight: 1 }}>
                    {userStats?.highest_dose_rate != null
                      ? `${userStats.highest_dose_rate.toFixed(3)} μSv/h`
                      : 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {userStats?.first_measurement_date && (
              <Paper
                sx={{
                  ...openredBoxSx,
                  p: { xs: 3, md: 3.5 },
                  borderRadius: 3,
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 500, mb: 2 }}>
                  Periodo de Actividad
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '32px 1fr', alignItems: 'start', columnGap: 1.5 }}>
                    <CalendarIcon sx={{ color: 'rgba(0,0,0,0.70)' }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.70)' }}>
                        Primera medición
                      </Typography>
                      <Typography variant="body2" className="statUnit" sx={{ fontWeight: 500 }}>
                        {formatDate(userStats.first_measurement_date)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '32px 1fr', alignItems: 'start', columnGap: 1.5 }}>
                    <CalendarIcon sx={{ color: 'rgba(0,0,0,0.70)' }} />
                    <Box>
                      <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.70)' }}>
                        Última medición
                      </Typography>
                      <Typography variant="body2" className="statUnit" sx={{ fontWeight: 500 }}>
                        {userStats.last_measurement_date ? formatDate(userStats.last_measurement_date) : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
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
    </Box>
  );
};

export default ProfilePage;
