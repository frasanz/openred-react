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
  Divider,
} from '@mui/material';
import { Logout, Person, Route as RouteIcon, MoreVert, DeviceHub, Telegram } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';
import { darkTokens as T } from '../theme/tokens';
import { MONO } from '../theme/theme';

// Nav principal -> solo rutas reales existentes
const NAV_ITEMS = [
  { key: 'nav.map', path: '/' },
  { key: 'nav.mobileApp', path: '/mobile-app' },
  { key: 'nav.esp32', path: '/esp32' },
  { key: 'nav.statistics', path: '/statistics' },
];

// Enlaces secundarios (antes en el dropdown "Información")
const MORE_LINKS = [
  { key: 'nav.about', path: '/about' },
  { key: 'nav.privacyPolicy', path: '/privacy-policy' },
  { key: 'nav.termsOfService', path: '/terms-of-service' },
];

const TELEGRAM_URL = 'https://web.telegram.org/k/#@OpenRedProject';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { isAuthenticated, user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [infoAnchorEl, setInfoAnchorEl] = React.useState<null | HTMLElement>(null);

  // Reloj UTC presentacional (chrome "LIVE ... UTC" del mockup)
  const [now, setNow] = React.useState<Date>(new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const utc = now.toISOString().slice(11, 19);

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

  const handleDevices = () => {
    navigate('/devices');
    handleClose();
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  // En pantallas de auth, dejar solo brand + LIVE/reloj
  const AUTH_ROUTES = ['/login', '/register', '/reset-password', '/email-verification', '/verify-email'];
  const isAuthRoute = AUTH_ROUTES.some((p) => location.pathname.startsWith(p));

  const navHandler = (path: string) => {
    if (path === '/statistics') return handleStatistics;
    if (path === '/tracks') return handleTracks;
    return () => navigate(path);
  };

  return (
    <AppBar position="static">
      <Toolbar sx={{ gap: 2, justifyContent: 'space-between' }}>
        {/* Col 1: brand + status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box
            onClick={() => navigate('/')}
            sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, cursor: 'pointer' }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: 14, letterSpacing: '0.6px', color: T.text }}>
              OPENRED
            </Typography>
            <Typography
              sx={{ fontFamily: MONO, fontSize: 10, color: T.textDim, letterSpacing: '0.6px', textTransform: 'uppercase' }}
            >
              / Network
            </Typography>
          </Box>
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 1.5,
              pl: 1.5,
              borderLeft: `1px solid ${T.border}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: T.ok, boxShadow: `0 0 6px ${T.ok}` }} />
              <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textMid, letterSpacing: '0.6px' }}>
                {t('status.live')}
              </Typography>
            </Box>
            <Typography sx={{ fontFamily: MONO, fontSize: 10, color: T.textDim }}>{utc} UTC</Typography>
          </Box>
        </Box>

        {/* Col 2: nav principal (oculta en auth) */}
        {!isAuthRoute && (
        <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 0.5 }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <Button
                key={item.path}
                onClick={navHandler(item.path)}
                disableRipple
                sx={{
                  minWidth: 'auto',
                  px: 1.25,
                  py: 0.5,
                  fontSize: 13,
                  fontWeight: 500,
                  borderRadius: 0,
                  color: active ? T.text : T.textMid,
                  borderBottom: active ? `2px solid ${T.accent}` : '2px solid transparent',
                  '&:hover': { color: T.text, backgroundColor: 'transparent' },
                }}
              >
                {t(item.key)}
              </Button>
            );
          })}
        </Box>
        )}

        {/* Col 3: idioma (siempre) + acciones (oculta en auth) */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LanguageSwitcher />

          {!isAuthRoute && (
          <>
          <IconButton size="small" onClick={handleInfoMenu} sx={{ color: T.textMid }}>
            <MoreVert fontSize="small" />
          </IconButton>
          <Menu anchorEl={infoAnchorEl} open={Boolean(infoAnchorEl)} onClose={handleInfoClose}>
            {MORE_LINKS.map((l) => (
              <MenuItem
                key={l.path}
                onClick={() => {
                  navigate(l.path);
                  handleInfoClose();
                }}
                sx={{ fontSize: 13 }}
              >
                {t(l.key)}
              </MenuItem>
            ))}
          </Menu>

          <IconButton
            size="small"
            component="a"
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            title={t('nav.telegram') as string}
            sx={{ color: T.textMid }}
          >
            <Telegram fontSize="small" />
          </IconButton>

          {isAuthenticated ? (
            <>
              <IconButton onClick={handleMenu} size="small" sx={{ p: 0.5 }}>
                <Avatar
                  sx={{ width: 26, height: 26, fontSize: 12, fontFamily: MONO, bgcolor: T.accent, color: '#06262a' }}
                >
                  {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
                </Avatar>
              </IconButton>
              <Box sx={{ display: { xs: 'none', md: 'block' }, lineHeight: 1.1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: T.text }}>
                  {user?.username || user?.email?.split('@')[0]}
                </Typography>
                <Typography sx={{ fontFamily: MONO, fontSize: 9, color: T.textDim }}>
                  {user?.is_staff ? t('role.staff') : t('role.contributor')}
                </Typography>
              </Box>

              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                keepMounted
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleTracks} sx={{ fontSize: 13, gap: 1.5 }}>
                  <RouteIcon fontSize="small" sx={{ color: T.textMid }} />
                  {t('nav.myTracks')}
                </MenuItem>
                <MenuItem onClick={handleDevices} sx={{ fontSize: 13, gap: 1.5 }}>
                  <DeviceHub fontSize="small" sx={{ color: T.textMid }} />
                  {t('nav.myDevices')}
                </MenuItem>
                <MenuItem onClick={handleProfile} sx={{ fontSize: 13, gap: 1.5 }}>
                  <Person fontSize="small" sx={{ color: T.textMid }} />
                  {t('nav.myProfile')}
                </MenuItem>
                <Divider sx={{ borderColor: T.border }} />
                <MenuItem onClick={handleLogout} sx={{ fontSize: 13, gap: 1.5, color: 'error.main' }}>
                  <Logout fontSize="small" sx={{ color: 'error.main' }} />
                  {t('nav.logout')}
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button onClick={() => navigate('/login')} sx={{ fontSize: 13, color: T.textMid }}>
                {t('nav.login')}
              </Button>
              <Button variant="outlined" onClick={() => navigate('/register')} sx={{ fontSize: 13 }}>
                {t('nav.register')}
              </Button>
            </Box>
          )}
          </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
