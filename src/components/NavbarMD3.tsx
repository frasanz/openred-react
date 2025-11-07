import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdTextButton, MdIconButton, MdMenu, MdMenuItem } from './MaterialComponents';
import './NavbarMD3.css';

const NavbarMD3: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };

  const handleProfile = () => {
    navigate('/profile');
    handleClose();
  };

  const handleDevices = () => {
    navigate('/devices');
    handleClose();
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="md3-navbar">
      <div className="md3-navbar-container">
        {/* Logo/Brand */}
        <div className="md3-navbar-brand">
          <MdTextButton 
            onClick={() => navigate('/')}
            className="md3-brand-button"
          >
            OpenRed
          </MdTextButton>
        </div>

        {/* Navigation Links - Desktop */}
        <div className="md3-navbar-nav">
          {isAuthenticated && (
            <>
              <MdTextButton 
                onClick={() => navigate('/')}
                className={isActive('/') ? 'md3-nav-button active' : 'md3-nav-button'}
              >
                Mapa
              </MdTextButton>
              <MdTextButton 
                onClick={() => navigate('/tracks')}
                className={isActive('/tracks') ? 'md3-nav-button active' : 'md3-nav-button'}
              >
                Mis Tracks
              </MdTextButton>
              <MdTextButton 
                onClick={() => navigate('/devices')}
                className={isActive('/devices') ? 'md3-nav-button active' : 'md3-nav-button'}
              >
                Dispositivos
              </MdTextButton>
            </>
          )}
        </div>

        {/* User Menu */}
        <div className="md3-navbar-user">
          {isAuthenticated ? (
            <>
              <MdIconButton 
                onClick={handleMenu}
                className="md3-user-button"
              >
                <span className="material-symbols-outlined">account_circle</span>
              </MdIconButton>
              
              {anchorEl && (
                <MdMenu
                  anchor={anchorEl.id}
                  open={Boolean(anchorEl)}
                  className="md3-user-menu"
                >
                  <MdMenuItem onClick={handleProfile}>
                    <span className="material-symbols-outlined" slot="start">person</span>
                    Perfil
                  </MdMenuItem>
                  <MdMenuItem onClick={handleDevices}>
                    <span className="material-symbols-outlined" slot="start">device_hub</span>
                    Dispositivos
                  </MdMenuItem>
                  <hr />
                  <MdMenuItem onClick={handleLogout}>
                    <span className="material-symbols-outlined" slot="start">logout</span>
                    Cerrar sesión
                  </MdMenuItem>
                </MdMenu>
              )}
            </>
          ) : (
            <div className="md3-auth-buttons">
              <MdTextButton 
                onClick={() => navigate('/login')}
                className="md3-login-button"
              >
                Iniciar sesión
              </MdTextButton>
              <MdTextButton 
                onClick={() => navigate('/register')}
                className="md3-register-button"
              >
                Registrarse
              </MdTextButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavbarMD3;
