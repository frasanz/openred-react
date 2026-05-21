import React from 'react';
import { Container, Typography, Box, Paper, Button, Alert } from '@mui/material';
import { Link } from 'react-router-dom';
import AndroidIcon from '@mui/icons-material/Android';
import WarningIcon from '@mui/icons-material/Warning';
import DownloadIcon from '@mui/icons-material/Download';

const MobileAppPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AndroidIcon sx={{ fontSize: 48, color: '#3DDC84', mr: 2 }} />
          <Typography variant="h3" component="h1">
            Aplicación Móvil OpenRed
          </Typography>
        </Box>

        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Aplicación en Desarrollo
          </Typography>
          <Typography variant="body2">
            Esta aplicación está actualmente en fase de desarrollo activo. Algunas funcionalidades 
            pueden no estar completamente operativas. En particular, el inicio de sesión con Google 
            aún no funciona correctamente.
          </Typography>
        </Alert>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Acerca de la App
        </Typography>
        <Typography variant="body1" paragraph>
          La aplicación móvil OpenRed te permite registrar mediciones ambientales directamente desde 
          tu dispositivo Android. Conecta tus sensores de radiación y contaminación lumínica para 
          contribuir a la ciencia ciudadana en tiempo real.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Características
        </Typography>
        <ul>
          <li>
            <Typography variant="body1" paragraph>
              <strong>Registro de mediciones:</strong> Captura datos de radiación gamma y contaminación 
              lumínica con tus dispositivos conectados
            </Typography>
          </li>
          <li>
            <Typography variant="body1" paragraph>
              <strong>Tracks en tiempo real:</strong> Crea y gestiona tracks de mediciones durante 
              tus campañas de monitoreo
            </Typography>
          </li>
          <li>
            <Typography variant="body1" paragraph>
              <strong>Sincronización automática:</strong> Tus datos se sincronizan automáticamente 
              con la plataforma OpenRed
            </Typography>
          </li>
          <li>
            <Typography variant="body1" paragraph>
              <strong>Visualización en mapa:</strong> Visualiza tus mediciones en tiempo real sobre 
              un mapa interactivo
            </Typography>
          </li>
        </ul>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Limitaciones Conocidas
        </Typography>
        <ul>
          <li>
            <Typography variant="body1" paragraph>
              <strong>Login con Google:</strong> El inicio de sesión mediante Google OAuth no 
              funciona correctamente en esta versión
            </Typography>
          </li>
          <li>
            <Typography variant="body1" paragraph>
              <strong>Versión Beta:</strong> Pueden existir errores y problemas de estabilidad
            </Typography>
          </li>
        </ul>

        <Box sx={{ mt: 4, p: 3, bgcolor: '#f5f5f5', borderRadius: 2 }}>
          <Typography variant="h5" gutterBottom>
            Descargar APK
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Descarga la última versión de la aplicación para Android
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<DownloadIcon />}
            href="/open-red.apk"
            download
            sx={{
              mt: 2,
              bgcolor: '#3DDC84',
              '&:hover': {
                bgcolor: '#2dcc74',
              }
            }}
          >
            Descargar OpenRed.apk
          </Button>
          <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
            Nota: Necesitarás habilitar la instalación de aplicaciones de fuentes desconocidas 
            en tu dispositivo Android para instalar esta APK.
          </Typography>
        </Box>

        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Instalación
        </Typography>
        <ol>
          <li>
            <Typography variant="body1" paragraph>
              Descarga el archivo APK usando el botón de arriba
            </Typography>
          </li>
          <li>
            <Typography variant="body1" paragraph>
              Ve a <strong>Ajustes → Seguridad</strong> en tu dispositivo Android
            </Typography>
          </li>
          <li>
            <Typography variant="body1" paragraph>
              Habilita <strong>"Orígenes desconocidos"</strong> o <strong>"Instalar aplicaciones 
              desconocidas"</strong>
            </Typography>
          </li>
          <li>
            <Typography variant="body1" paragraph>
              Abre el archivo APK descargado y sigue las instrucciones de instalación
            </Typography>
          </li>
          <li>
            <Typography variant="body1" paragraph>
              Inicia sesión con tu cuenta de OpenRed (usa email/contraseña, NO Google por ahora)
            </Typography>
          </li>
        </ol>

        <Alert severity="info" sx={{ mt: 4 }}>
          <Typography variant="body2">
            <strong>¿Problemas o sugerencias?</strong> Contáctanos en frasanz@ibercivis.es
          </Typography>
        </Alert>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" color="primary">
              Volver a la página principal
            </Typography>
          </Link>
        </Box>
      </Paper>
    </Container>
  );
};

export default MobileAppPage;
