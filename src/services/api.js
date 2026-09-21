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

export const PUBLIC_INTERNET_URL = 'https://billing-catalogue-seriously-elementary.trycloudflare.com';
export const RAW_REGISTRY_URL = 'https://raw.githubusercontent.com/Leo-10-neo/CrewLink/main/current_tunnel_url.txt';
export const CLOUD_REGISTRY_URL = 'https://api.github.com/repos/Leo-10-neo/CrewLink/contents/current_tunnel_url.txt';
export const LAN_WIFI_URL = 'http://192.168.0.121:5000';

let inMemoryApiBase = '';

// Dynamic host detection with support for custom user-configured server URL
export const getApiBase = () => {
  if (inMemoryApiBase) {
    return inMemoryApiBase;
  }

  // 1. User-configured server URL (persisted on the device in localStorage)
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('crewlink_api_base');
    if (custom && custom.trim()) {
      return formatUrl(custom);
    }
  }

  // 2. Build-time environment variable
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
  if (!url) return getApiBase();
  const formatted = formatUrl(url);
  inMemoryApiBase = formatted;

  if (typeof window !== 'undefined') {
    localStorage.setItem('crewlink_api_base', formatted);
    // Also notify native Android background service if available
    try {
      if (Capacitor?.isNativePlatform?.()) {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (token && user) {
          Capacitor.Plugins?.CrewLinkSync?.syncUser({
            token,
            role: user.role || 'volunteer',
            serverUrl: formatted,
          }).catch(() => {});
        }
      }
    } catch (_) {}
  }
  return formatted;
};

export const resetApiBase = () => {
  inMemoryApiBase = '';
  if (typeof window !== 'undefined') {
    localStorage.removeItem('crewlink_api_base');
  }
  return getApiBase();
};

export const testServerConnection = async (testUrl, timeoutMs = 4000) => {
  const target = formatUrl(testUrl || getApiBase());
  try {
    const res = await axios.get(`${target}/api/test`, { timeout: timeoutMs });
    return { success: true, url: target, data: res.data };
  } catch (err) {
    const errMsg = err.code === 'ECONNABORTED' 
      ? 'Connection timed out' 
      : (err.response?.status ? `HTTP ${err.response.status}` : (err.message || 'Network unreachable'));
    return { success: false, url: target, error: errMsg };
  }
};

let discoveryPromise = null;

// Multi-tier fast auto-discovery that races available candidates
export const autoDiscoverTunnelUrl = async (force = false) => {
  if (discoveryPromise && !force) {
    return discoveryPromise;
  }

  discoveryPromise = (async () => {
    // 1. Gather all potential candidates
    const candidates = [];

    // Local Wi-Fi candidate (super fast on home network)
    candidates.push(LAN_WIFI_URL);

    // Built-in public URL
    if (PUBLIC_INTERNET_URL) {
      candidates.push(PUBLIC_INTERNET_URL);
    }

    // Query GitHub Raw Registry
    try {
      const rawRes = await axios.get(`${RAW_REGISTRY_URL}?_cb=${Date.now()}`, { timeout: 3500 });
      if (rawRes.data && typeof rawRes.data === 'string' && rawRes.data.includes('trycloudflare.com')) {
        candidates.unshift(formatUrl(rawRes.data.trim()));
      }
    } catch (_) {}

    // Fallback: GitHub REST API
    try {
      const apiRes = await axios.get(CLOUD_REGISTRY_URL, {
        headers: { 
          Accept: 'application/vnd.github.v3.raw',
          'User-Agent': 'CrewLink-Mobile'
        },
        timeout: 3500,
      });
      if (apiRes.data && typeof apiRes.data === 'string' && apiRes.data.includes('trycloudflare.com')) {
        const ghUrl = formatUrl(apiRes.data.trim());
        if (!candidates.includes(ghUrl)) {
          candidates.push(ghUrl);
        }
      }
    } catch (_) {}

    // Deduplicate
    const uniqueCandidates = [...new Set(candidates.filter(Boolean))];

    // Race candidates in parallel to find the fastest responsive server
    try {
      const winningUrl = await Promise.any(
        uniqueCandidates.map(async (candidate) => {
          const test = await testServerConnection(candidate, 3500);
          if (test.success) {
            return candidate;
          }
          throw new Error(`Failed to connect to ${candidate}`);
        })
      );

      if (winningUrl) {
        setApiBase(winningUrl);
        console.log('✅ CrewLink API Connected to:', winningUrl);
        return { success: true, url: winningUrl };
      }
    } catch (_) {}

    return { success: false };
  })();

  try {
    const result = await discoveryPromise;
    return result;
  } finally {
    discoveryPromise = null;
  }
};

export const API_BASE = getApiBase();
export const API_URL = import.meta.env.VITE_API_URL || `${API_BASE}/api`;

const api = axios.create({
  baseURL: `${getApiBase()}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Dynamically use the active base URL and add authorization token
api.interceptors.request.use(
  (config) => {
    config.baseURL = `${getApiBase()}/api`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Automatic silent recovery: on any network disconnect, auto-discover live server and retry
let isRetrying = false;
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isNetworkError = !error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';

    if (isNetworkError && originalRequest && !originalRequest._retryNetwork && !isRetrying) {
      originalRequest._retryNetwork = true;
      isRetrying = true;

      try {
        console.warn('Network issue detected. Auto-reconnecting to live CrewLink API...');
        const discovered = await autoDiscoverTunnelUrl(true);
        if (discovered.success) {
          originalRequest.baseURL = `${discovered.url}/api`;
          return api(originalRequest);
        }
      } catch (_) {
        // Fall through to reject
      } finally {
        isRetrying = false;
      }
    }
    return Promise.reject(error);
  }
);

// Proactive background keep-alive monitor (keeps connection live while app is open)
if (typeof window !== 'undefined') {
  // 1. Check on initial page/app mount
  setTimeout(() => {
    autoDiscoverTunnelUrl(false).catch(() => {});
  }, 500);

  // 2. Check whenever user returns to the app (phone unlock, app switcher)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      testServerConnection(getApiBase(), 2500).then((res) => {
        if (!res.success) {
          autoDiscoverTunnelUrl(true).catch(() => {});
        }
      }).catch(() => {});
    }
  });

  // 3. Periodic silent heartbeat every 30 seconds
  setInterval(() => {
    if (!document.hidden) {
      testServerConnection(getApiBase(), 3000).then((res) => {
        if (!res.success) {
          autoDiscoverTunnelUrl(true).catch(() => {});
        }
      }).catch(() => {});
    }
  }, 30000);
}

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  googleLogin: (token) => api.post('/auth/google', { token }),
  getCurrentUser: () => api.get('/auth/me'),
};

// Events API
export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (eventData) => api.post('/events', eventData),
  update: (id, eventData) => api.put(`/events/${id}`, eventData),
  delete: (id) => api.delete(`/events/${id}`),
};

export default api;
