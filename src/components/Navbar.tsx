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
import { AccountCircle, Logout, DeviceHub, Person, Route, BarChart, ArrowDropDown, Android } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [infoAnchorEl, setInfoAnchorEl] = React.useState<null | HTMLElement>(null);
  const theme = useTheme();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleInfoMenu = (event: React.MouseEvent<HTMLElement>) => {
    setInfoAnchorEl(event.currentTarget);
  };

  const handleInfoClose = () => {
    setInfoAnchorEl(null);
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
        backgroundColor: '#000000',
        color: '#ffffff',
        minHeight: '64px',
        borderRadius: 0,
        border: 'none',
      }}
    >
      <Toolbar sx={{ px: 3, minHeight: '64px !important' }}>
        <Typography 
          variant="titleLarge" 
          component="div" 
          sx={{ 
            cursor: 'pointer',
            fontWeight: 600,
            color: '#ffffff',
          }}
          onClick={() => navigate('/')}
        >
          Open-red
        </Typography>

        {/* Espaciador para empujar el contenido a la derecha */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Dropdown de Información - visible siempre */}
        <Button
          endIcon={<ArrowDropDown />}
          onClick={handleInfoMenu}
          sx={{
            textTransform: 'none',
            color: '#ffffff',
            mr: 2,
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)',
            }
          }}
        >
          Información
        </Button>
        <Menu
          anchorEl={infoAnchorEl}
          open={Boolean(infoAnchorEl)}
          onClose={handleInfoClose}
          PaperProps={{
            sx: {
              backgroundColor: '#CDDCED',
            }
          }}
        >
          <MenuItem 
            onClick={() => { 
              navigate('/statistics'); 
              handleInfoClose(); 
            }}
          >
            <BarChart sx={{ mr: 1 }} />
            Estadísticas
          </MenuItem>
          <MenuItem 
            onClick={() => { 
              navigate('/mobile-app'); 
              handleInfoClose(); 
            }}
          >
            <Android sx={{ mr: 1 }} />
            App Móvil
          </MenuItem>
          <MenuItem 
            onClick={() => { 
              navigate('/about'); 
              handleInfoClose(); 
            }}
          >
            Acerca de
          </MenuItem>
          <MenuItem 
            onClick={() => { 
              navigate('/privacy-policy'); 
              handleInfoClose(); 
            }}
          >
            Política de Privacidad
          </MenuItem>
          <MenuItem 
            onClick={() => { 
              navigate('/terms-of-service'); 
              handleInfoClose(); 
            }}
          >
            Términos de Servicio
          </MenuItem>
        </Menu>

        {isAuthenticated ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography 
              variant="bodyMedium" 
              sx={{ 
                color: '#ffffff',
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
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: '#ffffff',
                  color: '#000000',
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
              PaperProps={{
                sx: {
                  backgroundColor: '#CDDCED',
                }
              }}
            >
              <MenuItem 
                onClick={handleTracks}
                sx={{
                  py: 1.5,
                  px: 2,
                  color: '#000000',
                  '&:hover': {
                    backgroundColor: '#E4EEFA',
                  }
                }}
              >
                <Route sx={{ mr: 2, color: '#000000' }} />
                <Typography variant="bodyMedium" sx={{ color: '#000000' }}>Mis Tracks</Typography>
              </MenuItem>
              <MenuItem 
                onClick={handleProfile}
                sx={{
                  py: 1.5,
                  px: 2,
                  color: '#000000',
                  '&:hover': {
                    backgroundColor: '#E4EEFA',
                  }
                }}
              >
                <Person sx={{ mr: 2, color: '#000000' }} />
                <Typography variant="bodyMedium" sx={{ color: '#000000' }}>Mi Perfil</Typography>
              </MenuItem>
              <MenuItem 
                onClick={handleLogout}
                sx={{
                  py: 1.5,
                  px: 2,
                  color: '#000000',
                  '&:hover': {
                    backgroundColor: '#E4EEFA',
                  }
                }}
              >
                <Logout sx={{ mr: 2, color: '#F05255' }} />
                <Typography variant="bodyMedium" sx={{ color: '#F05255' }}>Cerrar Sesión</Typography>
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
