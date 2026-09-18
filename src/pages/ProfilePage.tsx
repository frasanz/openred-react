import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Alert, Snackbar } from '@mui/material';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { User } from '../types';
import { darkTokens as T } from '../theme/tokens';
import { MONO } from '../theme/theme';
import { useLocale } from '../utils/i18nFormat';

interface ProfileFormData {
  email: string;
}

interface UserStats {
  total_measurements: number;
  total_tracks: number;
  total_missions: number;
  total_campaigns: number;
  first_measurement_date: string | null;
  last_measurement_date: string | null;
  highest_dose_rate: number | null;
}

// Cabecera de sección: mono, dim, con hairline
const SectionHead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    sx={{
      fontFamily: MONO,
      fontSize: 9.5,
      letterSpacing: '0.22em',
      textTransform: 'uppercase',
      color: T.textDim,
      pb: 1,
      mb: 2,
      borderBottom: `1px solid ${T.border}`,
    }}
  >
    {children}
  </Typography>
);

// Fila stat: label sans izq, valor mono der (+ unidad dim)
const StatRow: React.FC<{ label: string; value: string; unit?: string }> = ({ label, value, unit }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', py: 1, borderBottom: `1px dashed ${T.hairline}` }}>
    <Typography sx={{ fontSize: 13, color: T.textMid }}>{label}</Typography>
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
      <Typography sx={{ fontFamily: MONO, fontSize: 15, color: T.text, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
      {unit && <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textDim }}>{unit}</Typography>}
    </Box>
  </Box>
);

// Fila meta (actividad): label mono upper izq, valor mono der
const MetaRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', py: 1, borderBottom: `1px dashed ${T.hairline}` }}>
    <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.textDim }}>{label}</Typography>
    <Typography sx={{ fontFamily: MONO, fontSize: 12, color: T.textMid, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
  </Box>
);

const ProfilePage: React.FC = () => {
  const { t } = useTranslation(['profile', 'validation']);
  const { formatNumber, formatDate } = useLocale();
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fmtShort = (d?: string | null): string =>
    d ? formatDate(d, { day: 'numeric', month: 'short', year: 'numeric' }) : t('profile:dateFallback');

  const profileSchema = React.useMemo(
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
    reset,
  } = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: { email: user?.email || '' },
  });

  useEffect(() => {
    if (user) {
      reset({ email: user.email });
      loadUserStats();
    }
  }, [user, reset]);

  const loadUserStats = async () => {
    try {
      const stats = await apiService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setLoading(true);
    try {
      const updatedUser = await apiService.updateProfile(data);
      updateUser(updatedUser);
      setAlert({ type: 'success', message: t('profile:form.updateSuccess') });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setAlert({ type: 'error', message: error.response?.data?.message || t('profile:form.updateError') });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getInitials = (u: User) => u.email.substring(0, 2).toUpperCase();
  const getDisplayName = (u: User) => u.username || u.email.split('@')[0];

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: T.bg, color: T.textMid, p: 5 }}>
        <Typography sx={{ fontFamily: MONO, fontSize: 13 }}>{t('profile:loading')}</Typography>
      </Box>
    );
  }

  const role = user.is_staff ? t('profile:role.staff') : t('profile:role.contributor');
  const daysActive =
    userStats?.first_measurement_date && userStats?.last_measurement_date
      ? Math.max(
          1,
          Math.round(
            (new Date(userStats.last_measurement_date).getTime() -
              new Date(userStats.first_measurement_date).getTime()) /
              86400000
          )
        )
      : null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: T.bg, color: T.text, px: { xs: 2, md: 5 }, pt: 4, pb: 6 }}>
      <Box sx={{ maxWidth: 1280, mx: 'auto' }}>
        {/* Identity */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              bgcolor: T.accent,
              color: T.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: MONO,
              fontWeight: 600,
              fontSize: 18,
              flexShrink: 0,
            }}
          >
            {getInitials(user)}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h1" sx={{ fontSize: 24, fontWeight: 600, color: T.text, letterSpacing: '-0.015em', lineHeight: 1.1 }}>
              {getDisplayName(user)}
            </Typography>
            <Typography sx={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textDim, mt: 0.5 }}>
              {t('profile:header.memberSince', { role, date: fmtShort(user.date_joined).toUpperCase() })}
            </Typography>
            <Typography sx={{ fontFamily: MONO, fontSize: 11, color: T.textMid, mt: 0.25, wordBreak: 'break-word' }}>
              {user.email}
            </Typography>
          </Box>
        </Box>

        {/* 2 columnas */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, alignItems: 'start' }}>
          {/* IZQUIERDA: edición + cuenta */}
          <Box>
            <SectionHead>{t('profile:form.sectionTitle')}</SectionHead>
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Typography sx={{ fontSize: 12, color: T.textMid, mb: 0.75 }}>{t('profile:form.emailLabel')}</Typography>
              <TextField
                {...register('email')}
                type="email"
                fullWidth
                size="small"
                error={!!errors.email}
                helperText={errors.email?.message}
              />
              <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                <Button type="submit" variant="contained" disabled={loading} sx={{ fontWeight: 600 }}>
                  {loading ? t('profile:saving') : t('profile:form.save')}
                </Button>
                <Button
                  variant="text"
                  onClick={() => reset()}
                  disabled={loading}
                  sx={{ fontFamily: MONO, fontSize: 12, color: T.textMid }}
                >
                  {t('profile:form.cancel')}
                </Button>
              </Box>
            </Box>

            {/* Cuenta / sesión */}
            <Box sx={{ mt: 5 }}>
              <SectionHead>{t('profile:account.sectionTitle')}</SectionHead>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                <Typography sx={{ fontSize: 13, color: T.textMid }}>{t('profile:account.logoutLabel')}</Typography>
                <Button variant="outlined" size="small" onClick={handleLogout} sx={{ fontFamily: MONO, fontSize: 12 }}>
                  {t('profile:account.logoutButton')}
                </Button>
              </Box>
            </Box>
          </Box>

          {/* DERECHA: stats + actividad */}
          <Box>
            <SectionHead>{t('profile:stats.sectionTitle')}</SectionHead>
            <Box sx={{ mb: 5 }}>
              <StatRow label={t('profile:stats.totalMeasurements')} value={formatNumber(userStats?.total_measurements ?? 0)} />
              <StatRow label={t('profile:stats.tracks')} value={formatNumber(userStats?.total_tracks ?? 0)} />
              <StatRow label={t('profile:stats.missions')} value={formatNumber(userStats?.total_missions ?? 0)} />
              <StatRow label={t('profile:stats.campaigns')} value={formatNumber(userStats?.total_campaigns ?? 0)} />
              <StatRow
                label={t('profile:stats.maxDose')}
                value={userStats?.highest_dose_rate != null ? userStats.highest_dose_rate.toFixed(3) : t('profile:dateFallback')}
                unit={userStats?.highest_dose_rate != null ? t('profile:stats.doseUnit') : undefined}
              />
            </Box>

            {userStats?.first_measurement_date && (
              <Box>
                <SectionHead>{t('profile:activity.sectionTitle')}</SectionHead>
                <MetaRow label={t('profile:activity.firstMeasurement')} value={fmtShort(userStats.first_measurement_date)} />
                <MetaRow label={t('profile:activity.lastMeasurement')} value={fmtShort(userStats.last_measurement_date)} />
                {daysActive != null && (
                  <MetaRow
                    label={t('profile:activity.daysActive')}
                    value={t('profile:activity.daysValue', { count: daysActive, days: formatNumber(daysActive) })}
                  />
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={!!alert}
        autoHideDuration={6000}
        onClose={() => setAlert(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setAlert(null)} severity={alert?.type || 'info'} sx={{ width: '100%' }}>
          {alert?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfilePage;
