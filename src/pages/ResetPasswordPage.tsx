import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import apiService from '../services/api';
import { MdFilledTextField, MdFilledButton, MdCircularProgress } from '../components/MaterialComponents';
import '../styles/auth.css';

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
      <div className="success-page">
        <div className="success-container">
          <div className="success-card">
            <div className="card-content">
              <h1 className="success-title">Email Enviado</h1>
              
              <div className="success-alert">
                <span className="success-icon">✅</span>
                <div className="success-content">
                  <span>Te hemos enviado un email con instrucciones para restablecer tu contraseña. Revisa tu bandeja de entrada y sigue las instrucciones.</span>
                </div>
              </div>

              <p className="success-message">
                Si no recibes el email en unos minutos, revisa tu carpeta de spam.
              </p>

              <div className="back-link">
                <Link to="/login" className="link">
                  Volver al inicio de sesión
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <div className="reset-password-card">
          <div className="card-content">
            <h1 className="reset-password-title">Recuperar Contraseña</h1>
            
            <p className="reset-password-subtitle">
              Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña
            </p>

            {error && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                <div className="error-content">
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="reset-password-form">
              <MdFilledTextField
                {...register('email')}
                label="Correo Electrónico"
                type="email"
                required
                error={!!errors.email}
                error-text={errors.email?.message}
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
                  'Enviar Email de Recuperación'
                )}
              </MdFilledButton>

              <div className="login-link">
                <p>
                  ¿Recordaste tu contraseña?{' '}
                  <Link to="/login" className="link">
                    Volver al inicio de sesión
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

export default ResetPasswordPage;
