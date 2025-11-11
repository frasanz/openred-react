import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Menu,
  MenuItem,
  IconButton,
  Avatar,
  useTheme,
} from '@mui/material';
import { AccountCircle, Logout, DeviceHub, Person, Route, BarChart } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const theme = useTheme();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
    handleClose();
  };

  const handleDevices = () => {
    navigate('/devices');
    handleClose();
  };

  const handleTracks = () => {
    navigate('/tracks');
    handleClose();
  };

  const handleStatistics = () => {
    navigate('/statistics');
    handleClose();
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{ 
        backgroundColor: theme.palette.surface.main,
        color: theme.palette.primary.main,
        minHeight: '64px',
      }}
    >
      <Toolbar sx={{ px: 3, minHeight: '64px !important' }}>
        <Typography 
          variant="titleLarge" 
          component="div" 
          sx={{ 
            cursor: 'pointer',
            fontWeight: 600,
            color: theme.palette.primary.main,
          }}
          onClick={() => navigate('/')}
        >
          OpenRed
        </Typography>

        {/* Botón de Estadísticas visible siempre */}
        <Button
          startIcon={<BarChart />}
          onClick={handleStatistics}
          sx={{
            ml: 3,
            textTransform: 'none',
            color: theme.palette.primary.main,
            fontWeight: location.pathname === '/statistics' ? 600 : 400,
            '&:hover': {
              backgroundColor: theme.palette.primary.light + '20',
            }
          }}
        >
          Estadísticas
        </Button>

        {/* Espaciador para empujar el contenido de usuario a la derecha */}
        <Box sx={{ flexGrow: 1 }} />

        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography 
              variant="bodyMedium" 
              sx={{ 
                color: theme.palette.primary.main,
              }}
            >
              Hola, {user?.username || user?.email.split('@')[0]}
            </Typography>
            
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              sx={{
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.primary.light + '20',
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  fontSize: '14px',
                  fontWeight: 500,
                }}
              >
                {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || <AccountCircle />}
              </Avatar>
            </IconButton>
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem 
                onClick={handleDevices}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.light + '20',
                  }
                }}
              >
                <DeviceHub sx={{ mr: 2, color: theme.palette.primary.main }} />
                <Typography variant="bodyMedium">Mis Dispositivos</Typography>
              </MenuItem>
              <MenuItem 
                onClick={handleTracks}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.light + '20',
                  }
                }}
              >
                <Route sx={{ mr: 2, color: theme.palette.primary.main }} />
                <Typography variant="bodyMedium">Mis Tracks</Typography>
              </MenuItem>
              <MenuItem 
                onClick={handleProfile}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.light + '20',
                  }
                }}
              >
                <Person sx={{ mr: 2, color: theme.palette.primary.main }} />
                <Typography variant="bodyMedium">Mi Perfil</Typography>
              </MenuItem>
              <MenuItem 
                onClick={handleLogout}
                sx={{
                  py: 1.5,
                  px: 2,
                  '&:hover': {
                    backgroundColor: theme.palette.error.light + '20',
                  }
                }}
              >
                <Logout sx={{ mr: 2, color: theme.palette.error.main }} />
                <Typography variant="bodyMedium" color="error">Cerrar Sesión</Typography>
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <>
            {/* Espaciador para empujar los botones a la derecha */}
            <Box sx={{ flexGrow: 1 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {location.pathname === '/' && (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mr: 2 }}>
                  Explora mediciones públicas de radiación gamma
                </Typography>
              )}
              <Button 
                color="inherit" 
                onClick={() => navigate('/login')}
                sx={{ 
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Iniciar Sesión
              </Button>
              <Button 
                color="inherit" 
                onClick={() => navigate('/register')}
                sx={{ 
                  textTransform: 'none',
                  border: '1px solid rgba(255,255,255,0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderColor: 'rgba(255,255,255,0.5)'
                  }
                }}
              >
                Registrarse
              </Button>
            </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
