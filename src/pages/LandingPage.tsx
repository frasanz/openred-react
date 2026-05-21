import React from 'react';
import { Container, Typography, Box, Button, Paper, Grid, Link as MuiLink } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ScienceIcon from '@mui/icons-material/Science';
import MapIcon from '@mui/icons-material/Map';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import PeopleIcon from '@mui/icons-material/People';

const LandingPage: React.FC = () => {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      py: 8
    }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Paper elevation={3} sx={{ p: 6, mb: 4, textAlign: 'center' }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
            OpenRed
          </Typography>
          <Typography variant="h5" gutterBottom color="text.secondary" sx={{ mb: 4 }}>
            Plataforma de Ciencia Ciudadana para Mediciones Ambientales
          </Typography>
          <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', maxWidth: '800px', mx: 'auto', mb: 4 }}>
            OpenRed es una plataforma colaborativa que permite a ciudadanos y científicos registrar, 
            visualizar y analizar mediciones ambientales en tiempo real, incluyendo radiación gamma 
            y contaminación lumínica.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              component={RouterLink} 
              to="/register" 
              variant="contained" 
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              Crear Cuenta
            </Button>
            <Button 
              component={RouterLink} 
              to="/login" 
              variant="outlined" 
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              Iniciar Sesión
            </Button>
          </Box>
        </Paper>

        {/* Features Section */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 4, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MapIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" component="h2">
                  Visualización en Mapa
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary">
                Visualiza mediciones ambientales en un mapa interactivo. Explora datos de radiación 
                gamma y contaminación lumínica de diferentes campañas y misiones científicas.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 4, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <DataUsageIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" component="h2">
                  Análisis de Datos
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary">
                Accede a estadísticas detalladas, gráficos temporales y mapas de calor. 
                Analiza tendencias y patrones en las mediciones ambientales.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 4, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ScienceIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" component="h2">
                  Ciencia Ciudadana
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary">
                Contribuye a la investigación científica registrando tus propias mediciones. 
                Forma parte de una comunidad global de científicos ciudadanos.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 4, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
                <Typography variant="h5" component="h2">
                  Colaboración Abierta
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary">
                Trabaja junto a investigadores y entusiastas de todo el mundo. 
                Comparte datos y conocimientos en una plataforma abierta y transparente.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Data Privacy Section */}
        <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Uso de Datos y Privacidad
          </Typography>
          <Typography variant="body1" paragraph>
            En OpenRed, tu privacidad es nuestra prioridad. Utilizamos los datos que nos proporcionas exclusivamente para:
          </Typography>
          <ul>
            <Typography component="li" variant="body1" paragraph>
              <strong>Crear y gestionar tu cuenta de usuario</strong> - Tu nombre y correo electrónico 
              nos permiten identificarte y mantener tu sesión segura.
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              <strong>Almacenar tus mediciones ambientales</strong> - Guardamos los datos que registres 
              con tus dispositivos para que puedas visualizarlos y analizarlos.
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              <strong>Compartir datos científicos de forma anónima</strong> - Las mediciones ambientales 
              se comparten públicamente sin información personal para fines de investigación.
            </Typography>
            <Typography component="li" variant="body1" paragraph>
              <strong>Mejorar la plataforma</strong> - Analizamos el uso de la aplicación para ofrecer 
              una mejor experiencia.
            </Typography>
          </ul>
          <Typography variant="body1" paragraph>
            <strong>Autenticación con Google:</strong> Si eliges iniciar sesión con Google, únicamente 
            recibimos tu nombre y dirección de correo electrónico. No tenemos acceso a tu contraseña 
            de Google ni a otros datos de tu cuenta.
          </Typography>
          <Typography variant="body1">
            Para más información, consulta nuestra{' '}
            <MuiLink component={RouterLink} to="/privacy-policy" sx={{ fontWeight: 'bold' }}>
              Política de Privacidad
            </MuiLink>
            {' '}y nuestros{' '}
            <MuiLink component={RouterLink} to="/terms-of-service" sx={{ fontWeight: 'bold' }}>
              Términos de Servicio
            </MuiLink>.
          </Typography>
        </Paper>

        {/* About Section */}
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Sobre OpenRed
          </Typography>
          <Typography variant="body1" paragraph>
            OpenRed es un proyecto desarrollado por la Fundación Ibercivis, dedicada a promover 
            la ciencia ciudadana y la participación pública en la investigación científica.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Contacto: frasanz@ibercivis.es
          </Typography>
          
          <Box sx={{ mt: 4, display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
            <MuiLink component={RouterLink} to="/privacy-policy" sx={{ fontSize: '0.9rem' }}>
              Política de Privacidad
            </MuiLink>
            <MuiLink component={RouterLink} to="/terms-of-service" sx={{ fontSize: '0.9rem' }}>
              Términos de Servicio
            </MuiLink>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LandingPage;
