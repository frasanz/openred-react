import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoginCredentials } from '../types';
import { MdFilledTextField, MdFilledButton, MdCircularProgress } from '../components/MaterialComponents';
import '../styles/auth.css';

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
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="card-content">
            <h1 className="login-title">Iniciar Sesión</h1>
            
            <p className="login-subtitle">
              Accede a tu cuenta de OpenRed
            </p>

            {(error || submitError) && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                <div className="error-content">
                  <span>{error || submitError}</span>
                  <Link to="/reset-password" className="error-link">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="login-form">
              <MdFilledTextField
                {...register('email')}
                label="Correo Electrónico"
                type="email"
                required
                error={!!errors.email}
                error-text={errors.email?.message}
                className="form-field"
              />
              
              <MdFilledTextField
                {...register('password')}
                label="Contraseña"
                type="password"
                required
                error={!!errors.password}
                error-text={errors.password?.message}
                className="form-field"
              />

              <MdFilledButton
                type="submit"
                disabled={loading}
                className="submit-button"
              >
                {loading ? (
                  <MdCircularProgress indeterminate />
                ) : (
                  'Iniciar Sesión'
                )}
              </MdFilledButton>

              <div className="register-link">
                <p>
                  ¿No tienes cuenta?{' '}
                  <Link to="/register" className="link">
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
