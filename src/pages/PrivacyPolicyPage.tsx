import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { Link } from 'react-router-dom';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Política de Privacidad
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Última actualización: 10 de febrero de 2026
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            1. Información que Recopilamos
          </Typography>
          <Typography variant="body1" paragraph>
            OpenRed recopila información que usted nos proporciona directamente cuando se registra en nuestra plataforma,
            incluyendo nombre, dirección de correo electrónico y datos de mediciones de radiación.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            2. Uso de la Información
          </Typography>
          <Typography variant="body1" paragraph>
            Utilizamos la información recopilada para:
          </Typography>
          <ul>
            <li><Typography variant="body1">Proporcionar, mantener y mejorar nuestros servicios</Typography></li>
            <li><Typography variant="body1">Procesar y completar transacciones</Typography></li>
            <li><Typography variant="body1">Enviar información técnica y actualizaciones</Typography></li>
            <li><Typography variant="body1">Responder a sus comentarios y preguntas</Typography></li>
            <li><Typography variant="body1">Visualizar datos de mediciones de forma agregada</Typography></li>
          </ul>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            3. Compartir Información
          </Typography>
          <Typography variant="body1" paragraph>
            Los datos de mediciones ambientales pueden ser compartidos de forma pública y anónima para fines
            de investigación científica y concienciación ciudadana. No compartimos información personal
            identificable con terceros sin su consentimiento explícito.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            4. Seguridad de Datos
          </Typography>
          <Typography variant="body1" paragraph>
            Implementamos medidas de seguridad técnicas y organizativas para proteger su información personal
            contra acceso no autorizado, alteración o destrucción.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            5. Sus Derechos
          </Typography>
          <Typography variant="body1" paragraph>
            Usted tiene derecho a acceder, corregir o eliminar su información personal en cualquier momento.
            Puede ejercer estos derechos contactándonos en frasanz@ibercivis.es
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            6. Cookies y Tecnologías Similares
          </Typography>
          <Typography variant="body1" paragraph>
            Utilizamos cookies y tecnologías similares para mejorar la experiencia del usuario, mantener
            sesiones activas y analizar el uso de nuestra plataforma.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            7. Autenticación con Google
          </Typography>
          <Typography variant="body1" paragraph>
            Cuando utiliza la autenticación de Google, recibimos información básica de perfil (nombre y correo electrónico)
            según los permisos que usted otorgue. No tenemos acceso a su contraseña de Google.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            8. Cambios a esta Política
          </Typography>
          <Typography variant="body1" paragraph>
            Podemos actualizar esta política de privacidad ocasionalmente. Le notificaremos sobre cambios
            significativos publicando la nueva política en esta página.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            9. Contacto
          </Typography>
          <Typography variant="body1" paragraph>
            Si tiene preguntas sobre esta Política de Privacidad, contáctenos en:
          </Typography>
          <Typography variant="body1" paragraph>
            Email: frasanz@ibercivis.es<br />
            OpenRed - Fundación Ibercivis
          </Typography>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Link to="/" style={{ textDecoration: 'none' }}>
              <Typography variant="body2" color="primary">
                Volver a la página principal
              </Typography>
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicyPage;
