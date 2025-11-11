import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginCredentials } from '../types';
import { 
  TextField, 
  Button, 
  CircularProgress, 
  Box, 
  Container, 
  Paper, 
  Typography,
  Alert,
  Link as MuiLink 
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

const schema = yup.object({
  email: yup
    .string()
    .email('Ingresa un email válido')
    .required('El email es requerido'),
  password: yup
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .required('La contraseña es requerida'),
});

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setSubmitError(null);
      clearError();
      await login(data);
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error.response?.data);
      
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0];
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.email) {
          errorMessage = `Email: ${errorData.email[0]}`;
        } else if (errorData.password) {
          errorMessage = `Contraseña: ${errorData.password[0]}`;
        }
        
        // Mensajes más informativos para errores comunes
        if (errorMessage.includes('No puede iniciar sesión')) {
          errorMessage = 'Credenciales incorrectas o cuenta no verificada. Revisa tu email para verificar tu cuenta.';
        }
      }
      
      setSubmitError(errorMessage);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        py: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            bgcolor: 'white',
            borderRadius: 3,
          }}
        >
          <Typography 
            variant="h4" 
            component="h1"
            sx={{ 
              mb: 1,
              fontWeight: 400,
              fontSize: 32,
            }}
          >
            Iniciar Sesión
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Accede a tu cuenta de OpenRed
          </Typography>

          {(error || submitError) && (
            <Alert 
              severity="error" 
              icon={<WarningIcon />}
              sx={{ mb: 3 }}
            >
              <Box>
                {error || submitError}
                <Box sx={{ mt: 1 }}>
                  <MuiLink 
                    component={Link}
                    to="/reset-password"
                    sx={{ 
                      color: 'error.main',
                      fontWeight: 500,
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </MuiLink>
                </Box>
              </Box>
            </Alert>
          )}

          <Box 
            component="form" 
            onSubmit={handleSubmit(onSubmit)}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              {...register('email')}
              label="Correo Electrónico"
              type="email"
              required
              error={!!errors.email}
              helperText={errors.email?.message}
              variant="filled"
              fullWidth
            />
            
            <TextField
              {...register('password')}
              label="Contraseña"
              type="password"
              required
              error={!!errors.password}
              helperText={errors.password?.message}
              variant="filled"
              fullWidth
            />

            <Button
              type="submit"
              disabled={loading}
              variant="contained"
              fullWidth
              sx={{ mt: 1, py: 1.5 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Iniciar Sesión'
              )}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                ¿No tienes cuenta?{' '}
                <MuiLink
                  component={Link}
                  to="/register"
                  sx={{ 
                    color: 'primary.main',
                    fontWeight: 500,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Regístrate aquí
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
