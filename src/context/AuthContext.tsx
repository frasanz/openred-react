import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User, LoginCredentials, RegisterData } from '../types';
import { apiService } from '../services/api';
import i18n from '../i18n';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: (accessToken: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  clearError: () => void;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: User }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is authenticated on app load
  useEffect(() => {
    const initializeAuth = async () => {
      if (apiService.isAuthenticated()) {
        try {
          dispatch({ type: 'AUTH_START' });
          
          // Validar que los tokens sean válidos
          const isValid = await apiService.validateTokens();
          if (isValid) {
            const user = await apiService.getCurrentUser();
            console.log('User data loaded:', user); // Debug log
            dispatch({ type: 'AUTH_SUCCESS', payload: user });
          } else {
            dispatch({ type: 'AUTH_LOGOUT' });
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      await apiService.login(credentials);
      const user = await apiService.getCurrentUser();
      console.log('User data after login:', user); // Debug log
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error: any) {
      let errorMessage = i18n.t('auth:login.loginError');

      if (error.response?.data) {
        const errorData = error.response.data;

        // Si hay errores específicos de campo, formatearlos
        if (typeof errorData === 'object' && !errorData.detail) {
          const fieldErrors: string[] = [];

          Object.keys(errorData).forEach(field => {
            const fieldError = errorData[field];
            if (Array.isArray(fieldError)) {
              fieldErrors.push(`${field}: ${fieldError.join(', ')}`);
            } else if (typeof fieldError === 'string') {
              fieldErrors.push(`${field}: ${fieldError}`);
            }
          });

          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('\n');
          }
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }

      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const loginWithGoogle = async (accessToken: string): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      await apiService.loginWithGoogle(accessToken);
      const user = await apiService.getCurrentUser();
      console.log('User data after Google login:', user);
      dispatch({ type: 'AUTH_SUCCESS', payload: user });
    } catch (error: any) {
      let errorMessage = i18n.t('auth:login.googleError');

      if (error.response?.data) {
        const errorData = error.response.data;

        if (errorData.non_field_errors && errorData.non_field_errors.length > 0) {
          errorMessage = errorData.non_field_errors[0];

          // Mejorar mensaje si el usuario ya está registrado
          if (errorMessage.includes('already registered')) {
            errorMessage = i18n.t('auth:login.alreadyRegistered');
          }
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }
      
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      dispatch({ type: 'AUTH_START' });
      
      // Registrar usuario
      await apiService.register(userData);
      
      // Con email verification = mandatory, el usuario NO estará autenticado inmediatamente
      // No intentar obtener datos del usuario, solo limpiar el estado de loading
      dispatch({ type: 'AUTH_LOGOUT' }); // Esto limpia loading y mantiene al usuario sin autenticar
      
    } catch (error: any) {
      let errorMessage = i18n.t('auth:register.createError');

      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Si hay errores específicos de campo, formatearlos
        if (typeof errorData === 'object' && !errorData.detail) {
          const fieldErrors: string[] = [];
          
          Object.keys(errorData).forEach(field => {
            const fieldError = errorData[field];
            if (Array.isArray(fieldError)) {
              fieldErrors.push(`${field}: ${fieldError.join(', ')}`);
            } else if (typeof fieldError === 'string') {
              fieldErrors.push(`${field}: ${fieldError}`);
            }
          });
          
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('\n');
          }
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }
      
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const updateUser = (user: User): void => {
    dispatch({ type: 'UPDATE_USER', payload: user });
  };

  const value: AuthContextType = {
    ...state,
    login,
    loginWithGoogle,
    register,
    logout,
    updateUser,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
