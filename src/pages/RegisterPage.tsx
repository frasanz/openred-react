import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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

interface RegisterFormData {
  email: string;
  password1: string;
  password2: string;
}

const schema: yup.ObjectSchema<RegisterFormData> = yup.object({
  email: yup
    .string()
    .email('Ingresa un email válido')
    .required('El email es requerido'),
  password1: yup
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .required('La contraseña es requerida'),
  password2: yup
    .string()
    .oneOf([yup.ref('password1')], 'Las contraseñas deben coincidir')
    .required('Confirma tu contraseña'),
});

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser, loading, error, clearError } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
  });

  const parseErrorResponse = (error: any) => {
    if (error.response?.data) {
      const errorData = error.response.data;
      
      // Si hay errores específicos de campo, extraerlos
      if (typeof errorData === 'object' && !errorData.detail) {
        const fieldErrs: Record<string, string> = {};
        
        Object.keys(errorData).forEach(field => {
          const fieldError = errorData[field];
          if (Array.isArray(fieldError)) {
            fieldErrs[field] = fieldError.join(', ');
          } else if (typeof fieldError === 'string') {
            fieldErrs[field] = fieldError;
          }
        });
        
        setFieldErrors(fieldErrs);
        
        // Si hay errores de campo, mostrar un mensaje general
        if (Object.keys(fieldErrs).length > 0) {
          return 'Por favor, corrige los errores indicados en los campos';
        }
      } else if (errorData.detail) {
        return errorData.detail;
      } else if (errorData.message) {
        return errorData.message;
      }
    }
    
    return 'Error al crear la cuenta';
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setSubmitError(null);
      setFieldErrors({});
      clearError();
      await registerUser(data);
      // Redirigir a la página de verificación de email
      navigate('/email-verification');
    } catch (error: any) {
      const errorMessage = parseErrorResponse(error);
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
            Crear Cuenta
          </Typography>
          
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Únete a la comunidad OpenRed y contribuye a la ciencia ciudadana
          </Typography>

          {(error || submitError) && (
            <Alert 
              severity="error" 
              icon={<WarningIcon />}
              sx={{ mb: 3 }}
            >
              <Box>
                {error || submitError}
                {Object.keys(fieldErrors).length > 0 && (
                  <Box component="ul" sx={{ m: '8px 0 0 0', pl: 2 }}>
                    {Object.entries(fieldErrors).map(([field, fieldError]) => (
                      <li key={field}>
                        <strong>
                          {field === 'email' ? 'Email' :
                           field === 'password1' ? 'Contraseña' :
                           field === 'password2' ? 'Confirmar contraseña' :
                           field}:
                        </strong> {fieldError}
                      </li>
                    ))}
                  </Box>
                )}
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
              error={!!errors.email || !!fieldErrors.email}
              helperText={errors.email?.message || fieldErrors.email}
              variant="filled"
              fullWidth
            />

            <TextField
              {...register('password1')}
              label="Contraseña"
              type="password"
              required
              error={!!errors.password1 || !!fieldErrors.password1}
              helperText={errors.password1?.message || fieldErrors.password1}
              variant="filled"
              fullWidth
            />

            <TextField
              {...register('password2')}
              label="Confirmar Contraseña"
              type="password"
              required
              error={!!errors.password2 || !!fieldErrors.password2}
              helperText={errors.password2?.message || fieldErrors.password2}
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
                'Crear Cuenta'
              )}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                ¿Ya tienes cuenta?{' '}
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
                  Inicia sesión aquí
                </MuiLink>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;
