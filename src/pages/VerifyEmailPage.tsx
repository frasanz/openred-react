import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import apiService from '../services/api';

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const key = searchParams.get('key');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!key) {
        setError('Enlace de verificación inválido.');
        setLoading(false);
        return;
      }

      try {
        await apiService.verifyEmail(key);
        setSuccess(true);
        
        // Redirigir al login después de 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error: any) {
        console.error('Email verification error:', error.response?.data);
        
        let errorMessage = 'Error al verificar el email';
        
        if (error.response?.data) {
          const errorData = error.response.data;
          
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.non_field_errors) {
            errorMessage = errorData.non_field_errors[0];
          }
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [key, navigate]);

  if (loading) {
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
          <Paper elevation={3} sx={{ padding: 4, width: '100%', textAlign: 'center' }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Verificando tu email...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Por favor espera mientras verificamos tu cuenta.
            </Typography>
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
              ¡Email Verificado!
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3 }}>
              Tu cuenta ha sido verificada exitosamente. 
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
            Error de Verificación
          </Typography>
          
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>

          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
            Si el enlace ha expirado, puedes solicitar un nuevo email de verificación 
            iniciando sesión en tu cuenta.
          </Typography>

          <Box textAlign="center">
            <MuiLink component={Link} to="/login" underline="hover">
              Ir al inicio de sesión
            </MuiLink>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default VerifyEmailPage;
