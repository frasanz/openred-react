import React, { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiService from '../services/api';
import { AuthShell } from '../components/ui/AuthShell';
import { Form, FieldRow, FieldLabel, FieldError, AuthInput, PrimaryButton } from '../components/ui/Form';
import { Banner } from '../components/ui/Banner';
import { StatusDot } from '../components/ui/StatusDot';
import { darkTokens as T } from '../theme/tokens';

interface ConfirmResetPasswordFormData {
  password1: string;
  password2: string;
}

const ConfirmResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const schema = React.useMemo(
    () =>
      yup.object({
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
  } = useForm<ConfirmResetPasswordFormData>({ resolver: yupResolver(schema) });

  useEffect(() => {
    if (!uid || !token) {
      setError(t('auth:resetConfirm.invalidOrExpired'));
      return;
    }
    setValidToken(true);
  }, [uid, token, t]);

  const onSubmit = async (data: ConfirmResetPasswordFormData) => {
    if (!uid || !token) {
      setError(t('auth:resetConfirm.invalidOrExpired'));
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setFieldErrors({});
      await apiService.confirmPasswordReset(uid, token, data.password1);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error: any) {
      console.error('Password reset confirmation error:', error.response?.data);
      let errorMessage = t('auth:resetConfirm.resetError');
      if (error.response?.data) {
        const errorData = error.response.data;
        const fieldErrs: Record<string, string> = {};
        if (errorData.new_password1) {
          fieldErrs.password1 = Array.isArray(errorData.new_password1) ? errorData.new_password1.join(' ') : errorData.new_password1;
        }
        if (errorData.new_password2) {
          fieldErrs.password2 = Array.isArray(errorData.new_password2) ? errorData.new_password2.join(' ') : errorData.new_password2;
        }
        if (Object.keys(fieldErrs).length > 0) {
          setFieldErrors(fieldErrs);
          errorMessage = t('validation:fixFields');
        } else if (errorData.token) {
          errorMessage = t('auth:resetConfirm.tokenExpired');
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors[0];
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!validToken) {
    return (
      <AuthShell
        kicker={t('auth:resetConfirm.kicker')}
        title={t('auth:resetConfirm.invalidTitle')}
        footer={<><Link to="/reset-password">{t('auth:resetConfirm.requestNewLink')}</Link></>}
      >
        <Box sx={{ mb: 2 }}>
          <StatusDot kind="danger" />
        </Box>
        <Banner variant="danger" title={t('auth:resetConfirm.invalidBannerTitle')}>
          {t('auth:resetConfirm.invalidBannerBody')}
        </Banner>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell
        kicker={t('auth:resetConfirm.kicker')}
        title={t('auth:resetConfirm.successTitle')}
        footer={<><Link to="/login">{t('auth:common.goToLogin')}</Link></>}
      >
        <Box sx={{ mb: 2 }}>
          <StatusDot kind="ok" />
        </Box>
        <Banner variant="info" title={t('auth:resetConfirm.successBannerTitle')}>
          {t('auth:resetConfirm.successBannerBody')}
        </Banner>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker={t('auth:resetConfirm.kicker')}
      title={t('auth:resetConfirm.title')}
      subtitle={t('auth:resetConfirm.subtitle')}
      footer={<>{t('auth:resetConfirm.rememberedFooter')} <Link to="/login">{t('auth:common.backToLogin')}</Link></>}
    >
      {error && (
        <Box sx={{ mb: 2 }}>
          <Banner variant="danger" title={t('common:error')}>{error}</Banner>
        </Box>
      )}

      <Form onSubmit={handleSubmit(onSubmit)}>
        <FieldRow>
          <FieldLabel required>{t('auth:resetConfirm.newPassword')}</FieldLabel>
          <AuthInput type="password" placeholder="••••••••" error={!!errors.password1 || !!fieldErrors.password1} {...register('password1')} />
          {errors.password1 || fieldErrors.password1 ? (
            <FieldError>{errors.password1?.message || fieldErrors.password1}</FieldError>
          ) : (
            <Typography sx={{ fontSize: 11, color: T.textDim }}>{t('auth:resetConfirm.passwordHint')}</Typography>
          )}
        </FieldRow>

        <FieldRow>
          <FieldLabel required>{t('auth:resetConfirm.confirmPassword')}</FieldLabel>
          <AuthInput type="password" placeholder="••••••••" error={!!errors.password2 || !!fieldErrors.password2} {...register('password2')} />
          {(errors.password2 || fieldErrors.password2) && <FieldError>{errors.password2?.message || fieldErrors.password2}</FieldError>}
        </FieldRow>

        <PrimaryButton loading={loading}>{t('auth:resetConfirm.submit')}</PrimaryButton>
      </Form>
    </AuthShell>
  );
};

export default ConfirmResetPasswordPage;
