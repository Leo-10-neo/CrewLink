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

export const PUBLIC_INTERNET_URL = 'https://shapes-phil-text-proposed.trycloudflare.com';
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

export const getApiUrl = () => `${getApiBase()}/api`;

export const setApiBase = (url) => {
  if (!url) return getApiBase();
  const formatted = formatUrl(url);
  inMemoryApiBase = formatted;

  if (typeof window !== 'undefined') {
    localStorage.setItem('crewlink_api_base', formatted);
    
    // Dispatch event so active components can immediately refresh if they showed an error
    try {
      window.dispatchEvent(new CustomEvent('crewlink:api_reconnected', { detail: { url: formatted } }));
    } catch (_) {}

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

export const testServerConnection = async (testUrl, timeoutMs = 3500) => {
  const target = formatUrl(testUrl || getApiBase());
  try {
    const res = await axios.get(`${target}/api/test`, { timeout: timeoutMs, _skipIntercept: true });
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

    // Local Wi-Fi candidate (instant if phone is on home Wi-Fi)
    candidates.push(LAN_WIFI_URL);

    // Current stored base if exists
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('crewlink_api_base');
      if (stored) candidates.push(formatUrl(stored));
    }

    // Built-in public URL
    if (PUBLIC_INTERNET_URL) {
      candidates.push(PUBLIC_INTERNET_URL);
    }

    // Query GitHub Raw Registry with cache-busting
    try {
      const rawRes = await axios.get(`${RAW_REGISTRY_URL}?_cb=${Date.now()}`, { 
        timeout: 4000, 
        _skipIntercept: true 
      });
      if (rawRes.data && typeof rawRes.data === 'string' && rawRes.data.includes('trycloudflare.com')) {
        const candidateUrl = formatUrl(rawRes.data.trim());
        if (!candidateUrl.includes('api.trycloudflare.com')) {
          candidates.unshift(candidateUrl);
        }
      }
    } catch (_) {}

    // Fallback: GitHub REST API (without setting forbidden User-Agent header)
    try {
      const apiRes = await axios.get(CLOUD_REGISTRY_URL, {
        headers: { Accept: 'application/vnd.github.v3+json' },
        timeout: 4000,
        _skipIntercept: true
      });
      
      let decodedUrl = '';
      if (typeof apiRes.data === 'string' && apiRes.data.includes('trycloudflare.com')) {
        decodedUrl = apiRes.data.trim();
      } else if (apiRes.data && apiRes.data.content && apiRes.data.encoding === 'base64') {
        // Decode base64 content
        try {
          decodedUrl = atob(apiRes.data.content.replace(/\s/g, '')).trim();
        } catch (_) {}
      }

      if (decodedUrl && decodedUrl.includes('trycloudflare.com') && !decodedUrl.includes('api.trycloudflare.com')) {
        const ghUrl = formatUrl(decodedUrl);
        if (!candidates.includes(ghUrl)) {
          candidates.unshift(ghUrl);
        }
      }
    } catch (_) {}

    // Deduplicate candidates
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

// Dedicated configured axios instance
const api = axios.create({
  baseURL: `${getApiBase()}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL AXIOS REQUEST INTERCEPTOR:
// Transparently redirects any request with /api/ to the currently active live base!
// This fixes all stale API_URL references even if imported as constants!
// ─────────────────────────────────────────────────────────────────────────────
axios.interceptors.request.use(
  (config) => {
    if (config._skipIntercept) return config;

    const currentBase = getApiBase();
    if (config.url) {
      if (config.url.includes('/api/')) {
        const pathAfterApi = config.url.substring(config.url.indexOf('/api/'));
        config.url = `${currentBase}${pathAfterApi}`;
      } else if (config.url.startsWith('/api')) {
        config.url = `${currentBase}${config.url}`;
      }
    }

    // Automatically inject JWT authorization token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Configure local api instance request interceptor as well
api.interceptors.request.use(
  (config) => {
    config.baseURL = `${getApiBase()}/api`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL AXIOS RESPONSE INTERCEPTOR:
// Auto-detects dead tunnels / sleep resumes / network disconnects,
// triggers silent auto-discovery, and seamlessly retries the request!
// ─────────────────────────────────────────────────────────────────────────────
let recoveryPromise = null;

const createResponseErrorInterceptor = (clientInstance) => async (error) => {
  const originalRequest = error.config;
  if (!originalRequest || originalRequest._skipIntercept) {
    return Promise.reject(error);
  }

  const isNetworkOrTunnelError = 
    !error.response || 
    error.code === 'ERR_NETWORK' || 
    error.code === 'ECONNABORTED' ||
    [502, 503, 504, 521, 522, 523, 524, 404].includes(error.response?.status);

  const isCrewLinkEndpoint = 
    originalRequest.url?.includes('/api/') || 
    originalRequest.baseURL?.includes('/api');

  if (isNetworkOrTunnelError && isCrewLinkEndpoint && !originalRequest._retriedTunnelRecovery) {
    originalRequest._retriedTunnelRecovery = true;
    console.warn(`⚠️ Network/Tunnel disconnect on ${originalRequest.url}. Starting silent auto-recovery...`);

    if (!recoveryPromise) {
      recoveryPromise = autoDiscoverTunnelUrl(true);
    }

    try {
      const result = await recoveryPromise;
      if (result && result.success) {
        const freshBase = getApiBase();
        if (originalRequest.url?.includes('/api/')) {
          const pathAfterApi = originalRequest.url.substring(originalRequest.url.indexOf('/api/'));
          originalRequest.url = `${freshBase}${pathAfterApi}`;
        }
        if (originalRequest.baseURL) {
          originalRequest.baseURL = `${freshBase}/api`;
        }
        console.log(`✅ Auto-recovery successful! Retrying request to: ${originalRequest.url}`);
        return clientInstance(originalRequest);
      }
    } catch (recovErr) {
      console.warn('Auto-recovery retry failed:', recovErr);
    } finally {
      recoveryPromise = null;
    }
  }

  return Promise.reject(error);
};

axios.interceptors.response.use((res) => res, createResponseErrorInterceptor(axios));
api.interceptors.response.use((res) => res, createResponseErrorInterceptor(api));

// ─────────────────────────────────────────────────────────────────────────────
// APP LIFECYCLE & RESUME LISTENERS:
// Ensures that when the user wakes the app after 2 hours, connection is refreshed!
// ─────────────────────────────────────────────────────────────────────────────
if (typeof window !== 'undefined') {
  // 1. Initial proactive discovery
  setTimeout(() => {
    autoDiscoverTunnelUrl(false).catch(() => {});
  }, 300);

  // 2. On app resume / phone unlock / tab focus
  const handleResume = () => {
    if (!document.hidden) {
      testServerConnection(getApiBase(), 2500).then((res) => {
        if (!res.success) {
          autoDiscoverTunnelUrl(true).catch(() => {});
        }
      }).catch(() => {});
    }
  };

  document.addEventListener('visibilitychange', handleResume);
  window.addEventListener('focus', handleResume);

  // 3. Periodic background check every 30 seconds
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
