import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Dynamic host detection: When running on native mobile via Capacitor,
// localhost refers to the device itself, so we target the server on the local network.
export const getApiBase = () => {
  let base = import.meta.env.VITE_API_BASE;
  if (base) {
    if (!base.startsWith('http://') && !base.startsWith('https://')) {
      base = `https://${base}`;
    }
    return base.replace(/\/+$/, '');
  }
  
  // 1. Official Capacitor check
  if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
    return 'http://192.168.0.121:5000';
  }

  // 2. Protocol / WebView checks
  if (typeof window !== 'undefined') {
    if (
      window.location.protocol === 'capacitor:' || 
      window.location.protocol === 'ionic:' ||
      window.Capacitor?.isNativePlatform?.()
    ) {
      return 'http://192.168.0.121:5000';
    }

    // 3. User-agent check for Android WebView
    const ua = navigator.userAgent || '';
    if ((ua.includes('wv') || ua.includes('Android')) && (window.location.hostname === 'localhost' || !window.location.port)) {
      return 'http://192.168.0.121:5000';
    }

    // 4. LAN IP when browsing on phone browser (e.g. 192.168.x.x)
    if (window.location.hostname && /^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname) && window.location.hostname !== '127.0.0.1') {
      return `http://${window.location.hostname}:5000`;
    }
  }

  return 'http://localhost:5000';
};

export const API_BASE = getApiBase();
export const API_URL = import.meta.env.VITE_API_URL || `${API_BASE}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  googleLogin: (token) => api.post('/auth/google', { token }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
};

// Events API
export const eventsAPI = {
  getAllEvents: () => api.get('/events'),
  getEventById: (id) => api.get(`/events/${id}`),
  createEvent: (eventData) => api.post('/events', eventData),
  updateEvent: (id, eventData) => api.put(`/events/${id}`, eventData),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  joinEvent: (id) => api.post(`/events/${id}/join`),
  leaveEvent: (id) => api.post(`/events/${id}/leave`),
};

// Applications API
export const applicationsAPI = {
  getMyApplications: () => api.get('/applications/my'),
  createApplication: (applicationData) => api.post('/applications', applicationData),
  updateApplication: (id, status) => api.put(`/applications/${id}`, { status }),
  deleteApplication: (id) => api.delete(`/applications/${id}`),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
