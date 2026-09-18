import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiService from '../services/api';
import { AuthShell } from '../components/ui/AuthShell';
import { Banner } from '../components/ui/Banner';
import { StatusDot } from '../components/ui/StatusDot';
import { darkTokens as T } from '../theme/tokens';

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const key = searchParams.get('key');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!key) {
        setError(t('verify.invalidLink'));
        setLoading(false);
        return;
      }
      try {
        await apiService.verifyEmail(key);
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error: any) {
        console.error('Email verification error:', error.response?.data);
        let errorMessage = t('verify.verifyError');
        if (error.response?.data) {
          const errorData = error.response.data;
          if (errorData.detail) {
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
    verifyEmail();
  }, [key, navigate, t]);

  if (loading) {
    return (
      <AuthShell kicker={t('verify.kicker')} title={t('verify.verifyingTitle')}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
          <CircularProgress size={18} sx={{ color: T.accent }} />
          <Typography sx={{ fontSize: 13, color: T.textMid }}>{t('verify.verifyingBody')}</Typography>
        </Box>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell kicker={t('verify.kicker')} title={t('verify.successTitle')} footer={<><Link to="/login">{t('common.goToLogin')}</Link></>}>
        <Box sx={{ mb: 2 }}>
          <StatusDot kind="ok" />
        </Box>
        <Banner variant="info" title={t('verify.successBannerTitle')}>
          {t('verify.successBannerBody')}
        </Banner>
      </AuthShell>
    );
  }

  return (
    <AuthShell kicker={t('verify.kicker')} title={t('verify.invalidTitle')} footer={<><Link to="/login">{t('common.goToLogin')}</Link></>}>
      <Box sx={{ mb: 2 }}>
        <StatusDot kind="danger" />
      </Box>
      <Banner variant="danger" title={t('verify.errorBannerTitle')}>{error}</Banner>
      <Typography sx={{ fontSize: 12, color: T.textDim, mt: 2, lineHeight: 1.6 }}>
        {t('verify.expiredHint')}
      </Typography>
    </AuthShell>
  );
};

export default VerifyEmailPage;
