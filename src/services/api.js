import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Helper to format URL
const formatUrl = (raw) => {
  if (!raw) return '';
  let url = raw.trim().replace(/\/+$/, '');
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
};

export const PUBLIC_INTERNET_URL = 'https://forward-festival-img-bureau.trycloudflare.com';

// Dynamic host detection with support for custom user-configured server URL
export const getApiBase = () => {
  // 1. User-configured server URL (persisted on the device in localStorage)
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('crewlink_api_base');
    if (custom && custom.trim()) {
      return formatUrl(custom);
    }
  }

  // 2. Build-time environment variable (e.g. Render or production URL)
  let base = import.meta.env.VITE_API_BASE;
  if (base) {
    return formatUrl(base);
  }
  
  // 3. Native mobile (Capacitor / Android WebView): Default directly to public internet URL!
  if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
    return PUBLIC_INTERNET_URL;
  }

  // 4. Protocol / WebView checks
  if (typeof window !== 'undefined') {
    if (
      window.location.protocol === 'capacitor:' || 
      window.location.protocol === 'ionic:' ||
      window.Capacitor?.isNativePlatform?.()
    ) {
      return PUBLIC_INTERNET_URL;
    }

    // 5. User-agent check for Android WebView
    const ua = navigator.userAgent || '';
    if ((ua.includes('wv') || ua.includes('Android')) && (window.location.hostname === 'localhost' || !window.location.port)) {
      return PUBLIC_INTERNET_URL;
    }

    // 6. Localhost PC web development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }

    // 7. LAN IP when browsing on phone browser (e.g. 192.168.x.x)
    if (window.location.hostname && /^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname) && window.location.hostname !== '127.0.0.1') {
      return `http://${window.location.hostname}:5000`;
    }
  }

  return PUBLIC_INTERNET_URL;
};

export const setApiBase = (url) => {
  if (typeof window !== 'undefined') {
    if (url && url.trim()) {
      const formatted = formatUrl(url);
      localStorage.setItem('crewlink_api_base', formatted);
      return formatted;
    } else {
      localStorage.removeItem('crewlink_api_base');
      return getApiBase();
    }
  }
  return url;
};

export const resetApiBase = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('crewlink_api_base');
  }
  return getApiBase();
};

export const testServerConnection = async (testUrl) => {
  const target = formatUrl(testUrl || getApiBase());
  try {
    const res = await axios.get(`${target}/api/test`, { timeout: 6000 });
    return { success: true, url: target, data: res.data };
  } catch (err) {
    const errMsg = err.code === 'ECONNABORTED' 
      ? 'Connection timed out' 
      : (err.response?.status ? `HTTP ${err.response.status}` : (err.message || 'Network unreachable'));
    return { success: false, url: target, error: errMsg };
  }
};

export const RAW_REGISTRY_URL = 'https://raw.githubusercontent.com/Leo-10-neo/CrewLink/main/current_tunnel_url.txt';
export const CLOUD_REGISTRY_URL = 'https://api.github.com/repos/Leo-10-neo/CrewLink/contents/current_tunnel_url.txt';
export const LAN_WIFI_URL = 'http://192.168.0.121:5000';

export const autoDiscoverTunnelUrl = async () => {
  // 1. Check if the built-in PUBLIC_INTERNET_URL is active and responsive
  if (PUBLIC_INTERNET_URL) {
    try {
      const test = await testServerConnection(PUBLIC_INTERNET_URL);
      if (test.success) {
        setApiBase(PUBLIC_INTERNET_URL);
        return { success: true, url: PUBLIC_INTERNET_URL };
      }
    } catch (_) {}
  }

  // 2. Query Raw GitHub Registry (fast, unthrottled, no headers required)
  try {
    const res = await axios.get(`${RAW_REGISTRY_URL}?_cb=${Date.now()}`, {
      timeout: 5000,
    });
    if (res.data && typeof res.data === 'string' && res.data.includes('trycloudflare.com')) {
      const liveUrl = formatUrl(res.data.trim());
      const test = await testServerConnection(liveUrl);
      if (test.success) {
        setApiBase(liveUrl);
        return { success: true, url: liveUrl };
      }
    }
  } catch (err) {
    console.warn('Auto-discovery from Raw Registry failed:', err.message);
  }

  // 3. Fallback to GitHub REST API Registry
  try {
    const res = await axios.get(CLOUD_REGISTRY_URL, {
      headers: { 
        Accept: 'application/vnd.github.v3.raw',
        'User-Agent': 'CrewLink-Mobile'
      },
      timeout: 5000,
    });
    if (res.data && typeof res.data === 'string' && res.data.includes('trycloudflare.com')) {
      const liveUrl = formatUrl(res.data.trim());
      const test = await testServerConnection(liveUrl);
      if (test.success) {
        setApiBase(liveUrl);
        return { success: true, url: liveUrl };
      }
    }
  } catch (err) {
    console.warn('Auto-discovery from Cloud Registry failed:', err.message);
  }

  // 4. Fallback to local Wi-Fi IP if phone is on the same local network
  try {
    const test = await testServerConnection(LAN_WIFI_URL);
    if (test.success) {
      setApiBase(LAN_WIFI_URL);
      return { success: true, url: LAN_WIFI_URL };
    }
  } catch (_) {}

  return { success: false };
};

export const API_BASE = getApiBase();
export const API_URL = import.meta.env.VITE_API_URL || `${API_BASE}/api`;

const api = axios.create({
  baseURL: `${getApiBase()}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dynamically use the active base URL and add authorization token
api.interceptors.request.use(
  (config) => {
    config.baseURL = `${getApiBase()}/api`;
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

let isAutoDiscovering = false;
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!error.response && originalRequest && !originalRequest._retryNetwork) {
      originalRequest._retryNetwork = true;
      if (!isAutoDiscovering) {
        isAutoDiscovering = true;
        try {
          const discovered = await autoDiscoverTunnelUrl();
          if (discovered.success) {
            originalRequest.baseURL = `${discovered.url}/api`;
            return api(originalRequest);
          }
        } catch (_) {
          // ignore
        } finally {
          isAutoDiscovering = false;
        }
      }
    }
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
