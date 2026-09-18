import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Box, Typography } from '@mui/material';
import { AuthShell } from '../components/ui/AuthShell';
import { Form, FieldRow, FieldLabel, FieldError, AuthInput, PrimaryButton, TermsNotice } from '../components/ui/Form';
import { Banner } from '../components/ui/Banner';
import { darkTokens as T } from '../theme/tokens';

interface RegisterFormData {
  email: string;
  password1: string;
  password2: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const { register: registerUser, loading, error, clearError } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const schema: yup.ObjectSchema<RegisterFormData> = React.useMemo(
    () =>
      yup.object({
        email: yup.string().email(t('validation:email')).required(t('validation:emailRequired')),
        password1: yup
          .string()
          .min(8, t('validation:passwordMin', { count: 8 }))
          .required(t('validation:passwordRequired')),
        password2: yup
          .string()
          .oneOf([yup.ref('password1')], t('validation:passwordsMatch'))
          .required(t('validation:passwordConfirm')),
      }),
    [t],
  );

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
          return t('validation:fixFields');
        }
      } else if (errorData.detail) {
        return errorData.detail;
      } else if (errorData.message) {
        return errorData.message;
      }
    }

    return t('auth:register.createError');
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
    <AuthShell
      kicker={t('auth:register.kicker')}
      title={t('auth:register.title')}
      subtitle={t('auth:register.subtitle')}
      footer={<>{t('auth:register.haveAccountFooter')} <Link to="/login">{t('auth:register.signInHere')}</Link></>}
    >
      {(error || submitError) && (
        <Box sx={{ mb: 2 }}>
          <Banner variant="danger" title={t('auth:register.errorTitle')}>
            {error || submitError}
          </Banner>
        </Box>
      )}

      <Form onSubmit={handleSubmit(onSubmit)}>
        <FieldRow>
          <FieldLabel required>{t('auth:register.emailLabel')}</FieldLabel>
          <AuthInput type="email" placeholder={t('common:emailPlaceholder')} error={!!errors.email || !!fieldErrors.email} {...register('email')} />
          {(errors.email || fieldErrors.email) && <FieldError>{errors.email?.message || fieldErrors.email}</FieldError>}
        </FieldRow>

        <FieldRow>
          <FieldLabel required>{t('auth:register.passwordLabel')}</FieldLabel>
          <AuthInput type="password" placeholder="••••••••" error={!!errors.password1 || !!fieldErrors.password1} {...register('password1')} />
          {errors.password1 || fieldErrors.password1 ? (
            <FieldError>{errors.password1?.message || fieldErrors.password1}</FieldError>
          ) : (
            <Typography sx={{ fontSize: 11, color: T.textDim }}>{t('auth:register.passwordHint')}</Typography>
          )}
        </FieldRow>

        <FieldRow>
          <FieldLabel required>{t('auth:register.confirmPasswordLabel')}</FieldLabel>
          <AuthInput type="password" placeholder="••••••••" error={!!errors.password2 || !!fieldErrors.password2} {...register('password2')} />
          {(errors.password2 || fieldErrors.password2) && <FieldError>{errors.password2?.message || fieldErrors.password2}</FieldError>}
        </FieldRow>

        <PrimaryButton loading={loading}>{t('auth:register.submit')}</PrimaryButton>

        <TermsNotice>
          {t('auth:register.termsPrefix')} <Link to="/terms-of-service">{t('auth:register.termsLink')}</Link> {t('auth:register.and')}{' '}
          <Link to="/privacy-policy">{t('auth:register.privacyLink')}</Link>.
        </TermsNotice>
      </Form>
    </AuthShell>
  );
};

export default RegisterPage;
