import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { LoginCredentials } from '../types';
import { useGoogleLogin } from '@react-oauth/google';
import { Box, Link as MuiLink } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { AuthShell } from '../components/ui/AuthShell';
import { Form, FieldRow, FieldLabel, FieldError, AuthInput, PrimaryButton, GhostButton, AuthDivider } from '../components/ui/Form';
import { Banner } from '../components/ui/Banner';
import { darkTokens as T } from '../theme/tokens';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const { login, loginWithGoogle, loading, error, clearError } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const schema = React.useMemo(
    () =>
      yup.object({
        email: yup.string().email(t('validation:email')).required(t('validation:emailRequired')),
        password: yup
          .string()
          .min(6, t('validation:passwordMin', { count: 6 }))
          .required(t('validation:passwordRequired')),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>({
    resolver: yupResolver(schema),
  });

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    onSuccess: async (tokenResponse) => {
      try {
        setGoogleLoading(true);
        setSubmitError(null);
        clearError();

        // tokenResponse.access_token es el access token de Google
        await loginWithGoogle(tokenResponse.access_token);
        navigate('/');
      } catch (error: any) {
        console.error('Google login error:', error.response?.data);

        let errorMessage = t('auth:login.googleError');

        if (error.response?.data) {
          const errorData = error.response.data;

          if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
            errorMessage = errorData.non_field_errors[0];

            // Mejorar mensaje si el usuario ya está registrado
            if (errorMessage.includes('already registered')) {
              errorMessage = t('auth:login.alreadyRegistered');
            }
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.email) {
            errorMessage = `Email: ${errorData.email[0]}`;
          }
        }

        setSubmitError(errorMessage);
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setSubmitError(t('auth:login.googleConnectError'));
    },
  });

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setSubmitError(null);
      clearError();
      await login(data);
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error.response?.data);

      let errorMessage = t('auth:login.loginError');

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0];
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.email) {
          errorMessage = `Email: ${errorData.email[0]}`;
        } else if (errorData.password) {
          errorMessage = `${t('auth:login.passwordLabel')}: ${errorData.password[0]}`;
        }

        // Mensajes más informativos para errores comunes
        if (errorMessage.includes('No puede iniciar sesión')) {
          errorMessage = t('auth:login.invalidCredentials');
        }
      }

      setSubmitError(errorMessage);
    }
  };

  return (
    <AuthShell
      kicker={t('auth:login.kicker')}
      title={t('auth:login.title')}
      subtitle={t('auth:login.subtitle')}
      footer={<>{t('auth:login.noAccountFooter')} <Link to="/register">{t('auth:login.signUpHere')}</Link></>}
    >
      {(error || submitError) && (
        <Box sx={{ mb: 2 }}>
          <Banner variant="danger" title={t('auth:login.errorTitle')}>
            {error || submitError}
          </Banner>
        </Box>
      )}

      <Form onSubmit={handleSubmit(onSubmit)}>
        <FieldRow>
          <FieldLabel required>{t('auth:login.emailLabel')}</FieldLabel>
          <AuthInput type="email" placeholder={t('common:emailPlaceholder')} error={!!errors.email} {...register('email')} />
          {errors.email && <FieldError>{errors.email.message}</FieldError>}
        </FieldRow>

        <FieldRow>
          <FieldLabel required>{t('auth:login.passwordLabel')}</FieldLabel>
          <AuthInput type="password" placeholder="••••••••" error={!!errors.password} {...register('password')} />
          {errors.password && <FieldError>{errors.password.message}</FieldError>}
        </FieldRow>

        <MuiLink
          component={Link}
          to="/reset-password"
          sx={{ alignSelf: 'flex-start', fontSize: 12, color: T.textMid, textDecoration: 'none', '&:hover': { color: T.text } }}
        >
          {t('auth:login.forgotPassword')}
        </MuiLink>

        <PrimaryButton loading={loading}>{t('auth:login.submit')}</PrimaryButton>

        <AuthDivider>{t('auth:login.orContinueWith')}</AuthDivider>

        <GhostButton
          onClick={() => googleLogin()}
          disabled={loading}
          loading={googleLoading}
          startIcon={<GoogleIcon sx={{ fontSize: 18 }} />}
        >
          {googleLoading ? t('auth:login.connecting') : t('auth:login.continueWithGoogle')}
        </GhostButton>
      </Form>
    </AuthShell>
  );
};

export default LoginPage;
