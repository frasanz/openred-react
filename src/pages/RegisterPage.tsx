import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdFilledTextField, MdFilledButton, MdCircularProgress } from '../components/MaterialComponents';
import '../styles/auth.css';

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
    <div className="register-page">
      <div className="register-container">
        <div className="register-card">
          <div className="card-content">
            <h1 className="register-title">Crear Cuenta</h1>
            
            <p className="register-subtitle">
              Únete a la comunidad OpenRed y contribuye a la ciencia ciudadana
            </p>

            {(error || submitError) && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                <div className="error-content">
                  <span>{error || submitError}</span>
                  {Object.keys(fieldErrors).length > 0 && (
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px' }}>
                      {Object.entries(fieldErrors).map(([field, fieldError]) => (
                        <li key={field}>
                          <strong>{field === 'email' ? 'Email' :
                                   field === 'password1' ? 'Contraseña' :
                                   field === 'password2' ? 'Confirmar contraseña' :
                                   field}:</strong> {fieldError}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="register-form">
              <MdFilledTextField
                {...register('email')}
                label="Correo Electrónico"
                type="email"
                required
                error={!!errors.email || !!fieldErrors.email}
                error-text={errors.email?.message || fieldErrors.email}
                className="form-field"
              />

              <MdFilledTextField
                {...register('password1')}
                label="Contraseña"
                type="password"
                required
                error={!!errors.password1 || !!fieldErrors.password1}
                error-text={errors.password1?.message || fieldErrors.password1}
                className="form-field"
              />

              <MdFilledTextField
                {...register('password2')}
                label="Confirmar Contraseña"
                type="password"
                required
                error={!!errors.password2 || !!fieldErrors.password2}
                error-text={errors.password2?.message || fieldErrors.password2}
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
                  'Crear Cuenta'
                )}
              </MdFilledButton>

              <div className="login-link">
                <p>
                  ¿Ya tienes cuenta?{' '}
                  <Link to="/login" className="link">
                    Inicia sesión aquí
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

export default RegisterPage;
