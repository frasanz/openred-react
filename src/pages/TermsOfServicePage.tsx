import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { Link } from 'react-router-dom';

const TermsOfServicePage: React.FC = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Términos de Servicio
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Última actualización: 10 de febrero de 2026
        </Typography>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            1. Aceptación de los Términos
          </Typography>
          <Typography variant="body1" paragraph>
            Al acceder y utilizar OpenRed, usted acepta estar sujeto a estos Términos de Servicio y todas
            las leyes y regulaciones aplicables. Si no está de acuerdo con alguno de estos términos, no
            debe utilizar este servicio.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            2. Descripción del Servicio
          </Typography>
          <Typography variant="body1" paragraph>
            OpenRed es una plataforma de ciencia ciudadana para la medición y visualización de datos ambientales,
            incluyendo radiación gamma y contaminación lumínica. El servicio permite a los usuarios registrar,
            visualizar y compartir mediciones ambientales.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            3. Registro y Cuenta de Usuario
          </Typography>
          <Typography variant="body1" paragraph>
            Para utilizar ciertas funciones del servicio, debe crear una cuenta. Usted es responsable de:
          </Typography>
          <ul>
            <li><Typography variant="body1">Mantener la confidencialidad de su contraseña</Typography></li>
            <li><Typography variant="body1">Todas las actividades que ocurran bajo su cuenta</Typography></li>
            <li><Typography variant="body1">Proporcionar información precisa y actualizada</Typography></li>
            <li><Typography variant="body1">Notificarnos inmediatamente sobre cualquier uso no autorizado</Typography></li>
          </ul>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            4. Uso Aceptable
          </Typography>
          <Typography variant="body1" paragraph>
            Al utilizar OpenRed, usted se compromete a:
          </Typography>
          <ul>
            <li><Typography variant="body1">No subir datos falsos o engañosos</Typography></li>
            <li><Typography variant="body1">No intentar acceder a cuentas de otros usuarios</Typography></li>
            <li><Typography variant="body1">No utilizar el servicio para actividades ilegales</Typography></li>
            <li><Typography variant="body1">No interferir con el funcionamiento del servicio</Typography></li>
            <li><Typography variant="body1">Respetar los derechos de propiedad intelectual</Typography></li>
          </ul>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            5. Datos y Mediciones
          </Typography>
          <Typography variant="body1" paragraph>
            Los datos de mediciones que usted suba a OpenRed pueden ser utilizados de forma agregada y
            anónima para investigación científica y visualización pública. Usted conserva los derechos
            sobre sus datos individuales, pero otorga a OpenRed una licencia no exclusiva para utilizarlos
            según se describe en nuestra Política de Privacidad.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            6. Contenido Científico
          </Typography>
          <Typography variant="body1" paragraph>
            La información proporcionada en OpenRed tiene fines educativos e informativos. No constituye
            asesoramiento profesional. Las mediciones ambientales deben ser interpretadas por profesionales
            cualificados.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            7. Disponibilidad del Servicio
          </Typography>
          <Typography variant="body1" paragraph>
            Nos esforzamos por mantener OpenRed disponible 24/7, pero no garantizamos que el servicio esté
            libre de errores o interrupciones. Nos reservamos el derecho de modificar o discontinuar el
            servicio en cualquier momento.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            8. Limitación de Responsabilidad
          </Typography>
          <Typography variant="body1" paragraph>
            OpenRed se proporciona "tal cual" sin garantías de ningún tipo. No somos responsables de daños
            directos, indirectos, incidentales o consecuentes derivados del uso o la imposibilidad de usar
            el servicio.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            9. Propiedad Intelectual
          </Typography>
          <Typography variant="body1" paragraph>
            El contenido, características y funcionalidad de OpenRed son propiedad de Fundación Ibercivis
            y están protegidos por derechos de autor y otras leyes de propiedad intelectual.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            10. Modificaciones de los Términos
          </Typography>
          <Typography variant="body1" paragraph>
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Le notificaremos
            sobre cambios significativos. El uso continuado del servicio después de dichos cambios constituye
            su aceptación de los nuevos términos.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            11. Terminación
          </Typography>
          <Typography variant="body1" paragraph>
            Podemos terminar o suspender su cuenta inmediatamente si incumple estos Términos de Servicio.
            Usted puede terminar su cuenta en cualquier momento contactándonos.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            12. Ley Aplicable
          </Typography>
          <Typography variant="body1" paragraph>
            Estos términos se rigen por las leyes de España. Cualquier disputa se resolverá en los
            tribunales de Zaragoza, España.
          </Typography>

          <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
            13. Contacto
          </Typography>
          <Typography variant="body1" paragraph>
            Si tiene preguntas sobre estos Términos de Servicio, contáctenos en:
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

export default TermsOfServicePage;
