import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, GlobalStyles } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import EmailVerificationPage from './pages/EmailVerificationPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ConfirmResetPasswordPage from './pages/ConfirmResetPasswordPage';
import DevicesPage from './pages/DevicesPage';
import ProfilePage from './pages/ProfilePage';
import TracksPage from './pages/TracksPage';
import StatisticsPage from './pages/StatisticsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import MobileAppPage from './pages/MobileAppPage';
import theme from './theme/theme';

// Estilos globales
const globalStyles = {
  '*': {
    boxSizing: 'border-box',
  },
  html: {
    height: '100%',
  },
  body: {
    height: '100%',
    margin: 0,
    fontFamily: theme.typography.fontFamily,
  },
  '#root': {
    height: '100%',
  },
};

// Componente para rutas protegidas
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>; // Aquí podrías poner un spinner
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Componente para rutas de invitados (solo no autenticados)
const GuestRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={globalStyles} />
      
      <AuthProvider>
        <ProjectProvider>
          <Router>
          <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar />
            
            <div style={{ flexGrow: 1, overflow: 'auto' }}>
              <Routes>
                {/* Ruta principal - Siempre muestra el mapa */}
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<LandingPage />} />
                <Route 
                  path="/login" 
                  element={
                    <GuestRoute>
                      <LoginPage />
                    </GuestRoute>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <GuestRoute>
                      <RegisterPage />
                    </GuestRoute>
                  } 
                />
                <Route 
                  path="/email-verification" 
                  element={<EmailVerificationPage />} 
                />
                <Route 
                  path="/verify-email" 
                  element={<VerifyEmailPage />} 
                />
                <Route 
                  path="/reset-password" 
                  element={
                    <GuestRoute>
                      <ResetPasswordPage />
                    </GuestRoute>
                  } 
                />
                <Route 
                  path="/reset-password/confirm" 
                  element={<ConfirmResetPasswordPage />} 
                />
                <Route 
                  path="/privacy-policy" 
                  element={<PrivacyPolicyPage />} 
                />
                <Route 
                  path="/terms-of-service" 
                  element={<TermsOfServicePage />} 
                />
                <Route 
                  path="/mobile-app" 
                  element={<MobileAppPage />} 
                />

                {/* Rutas protegidas */}
                <Route 
                  path="/tracks" 
                  element={
                    <ProtectedRoute>
                      <TracksPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/statistics" 
                  element={
                    <ProtectedRoute>
                      <StatisticsPage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />

                {/* Ruta catch-all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </Router>
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
