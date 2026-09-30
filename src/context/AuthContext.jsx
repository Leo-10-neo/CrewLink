import { createContext, useContext, useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import CrewLinkSync from '../plugins/CrewLinkSync';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    checkAuth();
    
    const handleAuthFailed = () => logout();
    window.addEventListener('crewlink:auth_failed', handleAuthFailed);
    return () => window.removeEventListener('crewlink:auth_failed', handleAuthFailed);
  }, []);

  const syncToNative = async (token, userObj) => {
    try {
      // Use official capacitor/preferences for bulletproof JS persistence
      await Preferences.set({ key: 'token', value: token });
      await Preferences.set({ key: 'user', value: JSON.stringify(userObj) });

      // Sync to custom plugin strictly for the background polling service
      if (typeof Capacitor !== 'undefined' && Capacitor.getPlatform() !== 'web') {
        const serverUrl = localStorage.getItem('crewlink_api_base') || '';
        CrewLinkSync.syncUser({
          token,
          role: userObj.role || 'volunteer',
          serverUrl,
          userJson: JSON.stringify(userObj)
        }).catch(() => {});
      }
    } catch (_) {}
  };

  const checkAuth = async () => {
    let storedToken = localStorage.getItem('token');
    let storedUser = localStorage.getItem('user');
    
    // Recovery for Android when localStorage gets wiped on force-close
    try {
      const prefToken = await Preferences.get({ key: 'token' });
      const prefUser = await Preferences.get({ key: 'user' });
      
      if (prefToken.value && prefUser.value) {
        storedToken = prefToken.value;
        storedUser = prefUser.value;
        localStorage.setItem('token', storedToken);
        localStorage.setItem('user', storedUser);
      }
    } catch (err) {
      console.warn('Preferences fallback failed:', err);
    }
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
    
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      
      if (response.data.token) {
        const { token: newToken, user: userData } = response.data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
        syncToNative(newToken, userData);
        
        return { success: true, user: userData };
      }
      
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      const serverMessage = error.response?.data?.message;
      const isNetworkError = !error.response || error.code === 'ERR_NETWORK';
      return { 
        success: false, 
        isNetworkError,
        message: serverMessage || (isNetworkError ? 'Cannot connect to backend server. Using mobile data or changed Wi-Fi? Check Server Settings.' : 'Invalid email or password. Please try again.') 
      };
    }
  };

  const googleLogin = async (googleToken) => {
    try {
      const response = await authAPI.googleLogin(googleToken);
      
      if (response.data.token) {
        const { token: newToken, user: userData } = response.data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        setIsAuthenticated(true);
        syncToNative(newToken, userData);
        
        return { success: true, user: userData };
      }
      
      return { success: false, message: response.data.message || 'Google Login failed' };
    } catch (error) {
      console.error('Google Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Google authentication failed. Please try again.' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      
      if (response.data.token) {
        const { token: newToken, user: newUser } = response.data;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        setIsAuthenticated(true);
        syncToNative(newToken, newUser);
        
        return { success: true, user: newUser };
      }
      
      return { success: false, message: response.data.message || 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    }
  };

  const logout = async () => {
    setIsLoggingOut(true);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    try {
      await Preferences.remove({ key: 'token' });
      await Preferences.remove({ key: 'user' });
      
      if (typeof Capacitor !== 'undefined' && Capacitor.getPlatform() !== 'web') {
        CrewLinkSync.clearUser().catch(() => {});
      }
    } catch (_) {}
    
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    // Reset isLoggingOut after a tick so it doesn't linger forever
    setTimeout(() => setIsLoggingOut(false), 100);
  };

  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    isLoggingOut,
    login,
    googleLogin,
    register,
    logout,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
