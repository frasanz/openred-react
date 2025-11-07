import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LoginIcon from '@mui/icons-material/Login';
import InfoIcon from '@mui/icons-material/Info';

const EmailConfirmedPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-confirmed'>('loading');
  const [message, setMessage] = useState<string>('');
  
  useEffect(() => {
    // Analizar los parámetros de la URL para determinar el estado
    const statusParam = searchParams.get('status');
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    
    console.log('Email confirmation page params:', { statusParam, errorParam, messageParam, fullURL: location.search });
    
    // Simular un pequeño delay para mostrar loading
    const timer = setTimeout(() => {
      if (statusParam === 'success') {
        setStatus('success');
        setMessage(messageParam || 'Tu cuenta ha sido verificada exitosamente.');
      } else if (statusParam === 'error' || errorParam) {
        setStatus('error');
        setMessage(messageParam || errorParam || 'Hubo un problema al verificar tu dirección de email.');
      } else if (statusParam === 'already-confirmed') {
        setStatus('already-confirmed');
        setMessage(messageParam || 'Esta cuenta ya ha sido confirmada anteriormente.');
      } else {
        // Si llegamos aquí desde Django sin parámetros específicos, 
        // probablemente es una confirmación exitosa
        setStatus('success');
        setMessage('Tu cuenta ha sido verificada exitosamente.');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [searchParams, location]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={64} sx={{ mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Verificando tu cuenta...
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Por favor espera mientras confirmamos tu dirección de email.
            </Typography>
          </Box>
        );

      case 'success':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircleIcon 
              sx={{ 
                fontSize: 80, 
                color: 'success.main', 
                mb: 2 
              }} 
            />
            <Typography variant="h4" gutterBottom>
              ¡Email Confirmado!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {message}
            </Typography>
            
            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>¡Bienvenido a OpenRed!</strong> Tu cuenta está ahora activa y puedes:
              </Typography>
              <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 0 }}>
                <li>Iniciar sesión con tu email y contraseña</li>
                <li>Acceder a todas las funcionalidades de la plataforma</li>
                <li>Contribuir a la ciencia ciudadana</li>
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                size="large"
                startIcon={<LoginIcon />}
                sx={{ 
                  textTransform: 'none',
                  px: 3 
                }}
              >
                Iniciar Sesión
              </Button>
              
              <Button
                component={Link}
                to="/"
                variant="outlined"
                size="large"
                sx={{ 
                  textTransform: 'none',
                  px: 3 
                }}
              >
                Ir al Inicio
              </Button>
            </Box>
          </Box>
        );

      case 'already-confirmed':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <InfoIcon 
              sx={{ 
                fontSize: 80, 
                color: 'info.main', 
                mb: 2 
              }} 
            />
            <Typography variant="h4" gutterBottom>
              Cuenta Ya Confirmada
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {message}
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Tu cuenta ya está activa.</strong> Puedes proceder a:
              </Typography>
              <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 0 }}>
                <li>Iniciar sesión normalmente</li>
                <li>Usar todas las funcionalidades de la plataforma</li>
                <li>No necesitas confirmar el email nuevamente</li>
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                size="large"
                startIcon={<LoginIcon />}
                sx={{ 
                  textTransform: 'none',
                  px: 3 
                }}
              >
                Iniciar Sesión
              </Button>
              
              <Button
                component={Link}
                to="/"
                variant="outlined"
                size="large"
                sx={{ 
                  textTransform: 'none',
                  px: 3 
                }}
              >
                Ir al Inicio
              </Button>
            </Box>
          </Box>
        );

      case 'error':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <ErrorIcon 
              sx={{ 
                fontSize: 80, 
                color: 'error.main', 
                mb: 2 
              }} 
            />
            <Typography variant="h4" gutterBottom>
              Error de Verificación
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {message}
            </Typography>
            
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>Posibles causas:</strong>
              </Typography>
              <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 1 }}>
                <li>El enlace de verificación ha expirado</li>
                <li>El enlace ya ha sido utilizado anteriormente</li>
                <li>El enlace está dañado o incompleto</li>
                <li>Problema temporal del servidor</li>
              </Typography>
              <Typography variant="body2">
                <strong>Soluciones:</strong>
              </Typography>
              <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 0 }}>
                <li>Intenta registrarte nuevamente con el mismo email</li>
                <li>Revisa tu bandeja de spam</li>
                <li>Contacta al soporte si el problema persiste</li>
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                size="large"
                sx={{ 
                  textTransform: 'none',
                  px: 3 
                }}
              >
                Registrarse de Nuevo
              </Button>
              
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                size="large"
                sx={{ 
                  textTransform: 'none',
                  px: 3 
                }}
              >
                Intentar Iniciar Sesión
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

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
          {renderContent()}
        </Paper>
      </Box>
    </Container>
  );
};

export default EmailConfirmedPage;
