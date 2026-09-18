import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import LoginIcon from '@mui/icons-material/Login';
import InfoIcon from '@mui/icons-material/Info';

const EmailConfirmedPage: React.FC = () => {
  const { t } = useTranslation('auth');
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-confirmed'>('loading');
  const [message, setMessage] = useState<string>('');
  
  useEffect(() => {
    // Analizar los parámetros de la URL para determinar el estado
    const statusParam = searchParams.get('status');
    const errorParam = searchParams.get('error');
    const messageParam = searchParams.get('message');
    
    console.log('Email confirmation page params:', { statusParam, errorParam, messageParam, fullURL: location.search });
    
    // Simular un pequeño delay para mostrar loading
    const timer = setTimeout(() => {
      if (statusParam === 'success') {
        setStatus('success');
        setMessage(messageParam || t('confirmed.successDefault'));
      } else if (statusParam === 'error' || errorParam) {
        setStatus('error');
        setMessage(messageParam || errorParam || t('confirmed.errorDefault'));
      } else if (statusParam === 'already-confirmed') {
        setStatus('already-confirmed');
        setMessage(messageParam || t('confirmed.alreadyDefault'));
      } else {
        // Si llegamos aquí desde Django sin parámetros específicos,
        // probablemente es una confirmación exitosa
        setStatus('success');
        setMessage(t('confirmed.successDefault'));
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [searchParams, location, t]);

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={64} sx={{ mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              {t('confirmed.verifyingTitle')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('confirmed.verifyingBody')}
            </Typography>
          </Box>
        );

      case 'success':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircleIcon 
              sx={{ 
                fontSize: 80, 
                color: 'success.main', 
                mb: 2 
              }} 
            />
            <Typography variant="h4" gutterBottom>
              {t('confirmed.successTitle')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {message}
            </Typography>

            <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>{t('confirmed.welcomeLead')}</strong> {t('confirmed.welcomeIntro')}
              </Typography>
              <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 0 }}>
                <li>{t('confirmed.welcome1')}</li>
                <li>{t('confirmed.welcome2')}</li>
                <li>{t('confirmed.welcome3')}</li>
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                size="large"
                startIcon={<LoginIcon />}
                sx={{ 
                  textTransform: 'none',
                  px: 3
                }}
              >
                {t('confirmed.goToLogin')}
              </Button>

              <Button
                component={Link}
                to="/"
                variant="outlined"
                size="large"
                sx={{
                  textTransform: 'none',
                  px: 3
                }}
              >
                {t('confirmed.goToHome')}
              </Button>
            </Box>
          </Box>
        );

      case 'already-confirmed':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <InfoIcon 
              sx={{ 
                fontSize: 80, 
                color: 'info.main', 
                mb: 2 
              }} 
            />
            <Typography variant="h4" gutterBottom>
              {t('confirmed.alreadyTitle')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {message}
            </Typography>

            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>{t('confirmed.alreadyLead')}</strong> {t('confirmed.alreadyIntro')}
              </Typography>
              <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 0 }}>
                <li>{t('confirmed.already1')}</li>
                <li>{t('confirmed.already2')}</li>
                <li>{t('confirmed.already3')}</li>
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component={Link}
                to="/login"
                variant="contained"
                size="large"
                startIcon={<LoginIcon />}
                sx={{ 
                  textTransform: 'none',
                  px: 3
                }}
              >
                {t('confirmed.goToLogin')}
              </Button>

              <Button
                component={Link}
                to="/"
                variant="outlined"
                size="large"
                sx={{
                  textTransform: 'none',
                  px: 3
                }}
              >
                {t('confirmed.goToHome')}
              </Button>
            </Box>
          </Box>
        );

      case 'error':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <ErrorIcon 
              sx={{ 
                fontSize: 80, 
                color: 'error.main', 
                mb: 2 
              }} 
            />
            <Typography variant="h4" gutterBottom>
              {t('confirmed.errorTitle')}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {message}
            </Typography>

            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>{t('confirmed.causesLead')}</strong>
              </Typography>
              <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 1 }}>
                <li>{t('confirmed.cause1')}</li>
                <li>{t('confirmed.cause2')}</li>
                <li>{t('confirmed.cause3')}</li>
                <li>{t('confirmed.cause4')}</li>
              </Typography>
              <Typography variant="body2">
                <strong>{t('confirmed.solutionsLead')}</strong>
              </Typography>
              <Typography variant="body2" component="ul" sx={{ mt: 1, mb: 0 }}>
                <li>{t('confirmed.solution1')}</li>
                <li>{t('confirmed.solution2')}</li>
                <li>{t('confirmed.solution3')}</li>
              </Typography>
            </Alert>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                size="large"
                sx={{ 
                  textTransform: 'none',
                  px: 3
                }}
              >
                {t('confirmed.registerAgain')}
              </Button>

              <Button
                component={Link}
                to="/login"
                variant="outlined"
                size="large"
                sx={{
                  textTransform: 'none',
                  px: 3
                }}
              >
                {t('confirmed.tryLogin')}
              </Button>
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          {renderContent()}
        </Paper>
      </Box>
    </Container>
  );
};

export default EmailConfirmedPage;
