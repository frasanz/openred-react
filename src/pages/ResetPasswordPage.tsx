import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Box } from '@mui/material';
import apiService from '../services/api';
import { AuthShell } from '../components/ui/AuthShell';
import { Form, FieldRow, FieldLabel, FieldError, AuthInput, PrimaryButton } from '../components/ui/Form';
import { Banner } from '../components/ui/Banner';
import { StatusDot } from '../components/ui/StatusDot';

interface ResetPasswordFormData {
  email: string;
}

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation(['auth', 'validation', 'common']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const schema = React.useMemo(
    () =>
      yup.object({
        email: yup.string().email(t('validation:email')).required(t('validation:emailRequired')),
      }),
    [t],
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({ resolver: yupResolver(schema) });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setLoading(true);
      setError(null);
      await apiService.requestPasswordReset(data.email);
      setSuccess(true);
    } catch (error: any) {
      console.error('Password reset error:', error.response?.data);
      let errorMessage = t('auth:resetRequest.sendError');
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
      <AuthShell
        kicker={t('auth:resetRequest.kicker')}
        title={t('auth:resetRequest.successTitle')}
        footer={<><Link to="/login">{t('auth:common.backToLogin')}</Link></>}
      >
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatusDot kind="ok" />
        </Box>
        <Banner variant="info" title={t('auth:resetRequest.successBannerTitle')}>
          {t('auth:resetRequest.successBannerBody')}
        </Banner>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      kicker={t('auth:resetRequest.kicker')}
      title={t('auth:resetRequest.title')}
      subtitle={t('auth:resetRequest.subtitle')}
      footer={<>{t('auth:resetRequest.rememberedFooter')} <Link to="/login">{t('auth:common.backToLogin')}</Link></>}
    >
      {error && (
        <Box sx={{ mb: 2 }}>
          <Banner variant="danger" title={t('common:error')}>{error}</Banner>
        </Box>
      )}

      <Form onSubmit={handleSubmit(onSubmit)}>
        <FieldRow>
          <FieldLabel required>{t('auth:resetRequest.emailLabel')}</FieldLabel>
          <AuthInput type="email" placeholder={t('common:emailPlaceholder')} error={!!errors.email} {...register('email')} />
          {errors.email && <FieldError>{errors.email.message}</FieldError>}
        </FieldRow>

        <PrimaryButton loading={loading}>{t('auth:resetRequest.submit')}</PrimaryButton>
      </Form>
    </AuthShell>
  );
};

export default ResetPasswordPage;
