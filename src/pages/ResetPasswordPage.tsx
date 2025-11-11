import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface ResetPasswordFormData {
  email: string;
}

const schema = yup.object({
  email: yup
    .string()
    .email('Ingresa un email válido')
    .required('El email es requerido'),
});

const ResetPasswordPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiService.requestPasswordReset(data.email);
      setSuccess(true);
    } catch (error: any) {
      console.error('Password reset error:', error.response?.data);
      
      let errorMessage = 'Error al enviar el email de recuperación';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (errorData.email) {
          errorMessage = `Email: ${errorData.email[0]}`;
        } else if (errorData.detail) {
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

  if (success) {
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
              textAlign: 'center',
            }}
          >
            <Typography 
              variant="h4" 
              component="h1"
              sx={{ 
                mb: 3,
                fontWeight: 400,
                fontSize: 32,
              }}
            >
              Email Enviado
            </Typography>
            
            <Alert 
              severity="success" 
              icon={<CheckCircleIcon />}
              sx={{ mb: 3, textAlign: 'left' }}
            >
              Te hemos enviado un email con instrucciones para restablecer tu contraseña. 
              Revisa tu bandeja de entrada y sigue las instrucciones.
            </Alert>

            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ mb: 3 }}
            >
              Si no recibes el email en unos minutos, revisa tu carpeta de spam.
            </Typography>

            <MuiLink
              component={Link}
              to="/login"
              sx={{ 
                color: 'primary.main',
                fontWeight: 500,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              Volver al inicio de sesión
            </MuiLink>
          </Paper>
        </Container>
      </Box>
    );
  }

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
            Recuperar Contraseña
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña
          </Typography>

          {error && (
            <Alert 
              severity="error" 
              icon={<WarningIcon />}
              sx={{ mb: 3 }}
            >
              {error}
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
                'Enviar Email de Recuperación'
              )}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                ¿Recordaste tu contraseña?{' '}
                <MuiLink
                  component={Link}
                  to="/login"
                  sx={{ 
                    color: 'primary.main',
                    fontWeight: 500,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Volver al inicio de sesión
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default ResetPasswordPage;
