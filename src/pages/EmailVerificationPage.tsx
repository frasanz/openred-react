import React from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Alert,
  Button,
} from '@mui/material';
import { Link } from 'react-router-dom';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const EmailVerificationPage: React.FC = () => {
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
        <Paper elevation={3} sx={{ padding: 4, width: '100%', textAlign: 'center' }}>
          <CheckCircleOutlineIcon 
            sx={{ 
              fontSize: 64, 
              color: 'success.main', 
              mb: 2 
            }} 
          />
          
          <Typography component="h1" variant="h4" gutterBottom>
            ¡Registro Exitoso!
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Tu cuenta ha sido creada correctamente.
          </Typography>

          <Alert 
            severity="info" 
            icon={<MailOutlineIcon />}
            sx={{ mb: 3, textAlign: 'left' }}
          >
            <Typography variant="h6" gutterBottom>
              Verifica tu correo electrónico
            </Typography>
            <Typography variant="body2">
              Hemos enviado un enlace de verificación a tu dirección de correo electrónico. 
              Por favor, revisa tu bandeja de entrada (y la carpeta de spam) y haz clic en el 
              enlace para activar tu cuenta.
            </Typography>
          </Alert>

          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>¿No has recibido el correo?</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Revisa tu carpeta de spam o correo no deseado
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Asegúrate de que la dirección de email sea correcta
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • El correo puede tardar unos minutos en llegar
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              component={Link}
              to="/login"
              variant="contained"
              sx={{ 
                textTransform: 'none',
                px: 3 
              }}
            >
              Ir al inicio de sesión
            </Button>
            
            <Button
              component={Link}
              to="/"
              variant="outlined"
              sx={{ 
                textTransform: 'none',
                px: 3 
              }}
            >
              Volver al inicio
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default EmailVerificationPage;
