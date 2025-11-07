import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import apiService from '../services/api';

interface ConfirmResetPasswordFormData {
  password1: string;
  password2: string;
}

const schema = yup.object({
  password1: yup
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .required('La contraseña es requerida'),
  password2: yup
    .string()
    .oneOf([yup.ref('password1')], 'Las contraseñas deben coincidir')
    .required('Confirma tu contraseña'),
});

const ConfirmResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConfirmResetPasswordFormData>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    // Verificar que tenemos los parámetros necesarios
    if (!uid || !token) {
      setError('Enlace de recuperación inválido o expirado.');
      return;
    }
    setValidToken(true);
  }, [uid, token]);

  const onSubmit = async (data: ConfirmResetPasswordFormData) => {
    if (!uid || !token) {
      setError('Enlace de recuperación inválido.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await apiService.confirmPasswordReset(uid, token, data.password1);
      setSuccess(true);
      
      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Password reset confirmation error:', error.response?.data);
      
      let errorMessage = 'Error al restablecer la contraseña';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.token) {
          errorMessage = 'El enlace de recuperación ha expirado o es inválido. Solicita uno nuevo.';
        } else if (errorData.new_password1) {
          errorMessage = `Contraseña: ${errorData.new_password1[0]}`;
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0];
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
            <Typography component="h1" variant="h4" align="center" gutterBottom>
              Enlace Inválido
            </Typography>
            
            <Alert severity="error" sx={{ mb: 3 }}>
              El enlace de recuperación es inválido o ha expirado.
            </Alert>

            <Box textAlign="center">
              <MuiLink component={Link} to="/reset-password" underline="hover">
                Solicitar nuevo enlace de recuperación
              </MuiLink>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  if (success) {
    return (
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
            <Typography component="h1" variant="h4" align="center" gutterBottom>
              Contraseña Restablecida
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3 }}>
              Tu contraseña ha sido restablecida exitosamente. 
              Serás redirigido al inicio de sesión automáticamente.
            </Alert>

            <Box textAlign="center">
              <MuiLink component={Link} to="/login" underline="hover">
                Ir al inicio de sesión
              </MuiLink>
            </Box>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            Nueva Contraseña
          </Typography>
          
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Ingresa tu nueva contraseña
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
              {error.includes('expirado') && (
                <Box sx={{ mt: 1 }}>
                  <MuiLink component={Link} to="/reset-password" underline="hover" color="error">
                    Solicitar nuevo enlace
                  </MuiLink>
                </Box>
              )}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
            <TextField
              {...register('password1')}
              margin="normal"
              required
              fullWidth
              name="password1"
              label="Nueva Contraseña"
              type="password"
              id="password1"
              autoComplete="new-password"
              error={!!errors.password1}
              helperText={errors.password1?.message}
            />

            <TextField
              {...register('password2')}
              margin="normal"
              required
              fullWidth
              name="password2"
              label="Confirmar Nueva Contraseña"
              type="password"
              id="password2"
              autoComplete="new-password"
              error={!!errors.password2}
              helperText={errors.password2?.message}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ 
                mt: 3, 
                mb: 2,
                py: 1.5,
                textTransform: 'none',
                fontSize: '1rem'
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Restablecer Contraseña'
              )}
            </Button>

            <Box textAlign="center">
              <Typography variant="body2">
                ¿Recordaste tu contraseña?{' '}
                <MuiLink component={Link} to="/login" underline="hover">
                  Volver al inicio de sesión
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ConfirmResetPasswordPage;
