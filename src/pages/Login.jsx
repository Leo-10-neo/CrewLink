import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  ShieldAlert, 
  Globe, 
  Server, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Wifi, 
  RefreshCw, 
  X 
} from 'lucide-react';
import { 
  getApiBase, 
  setApiBase, 
  resetApiBase, 
  testServerConnection, 
  autoDiscoverTunnelUrl, 
  PUBLIC_INTERNET_URL 
} from '../services/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isNetworkErr, setIsNetworkErr] = useState(false);

  // Server settings modal state
  const [showServerModal, setShowServerModal] = useState(false);
  const [currentApiBase, setCurrentApiBase] = useState('');
  const [serverUrlInput, setServerUrlInput] = useState('');
  const [isTestingServer, setIsTestingServer] = useState(false);
  const [serverTestStatus, setServerTestStatus] = useState(null); // { success: boolean, message: string }
  const [isAutoReconnecting, setIsAutoReconnecting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // On mount: detect server connection and auto-resolve live tunnel on mobile data
  useEffect(() => {
    const initConnection = async () => {
      const active = getApiBase();
      setCurrentApiBase(active);
      setServerUrlInput(active);

      try {
        const test = await testServerConnection(active);
        if (test.success) {
          setIsNetworkErr(false);
          setApiError('');
        } else {
          const disc = await autoDiscoverTunnelUrl();
          if (disc.success) {
            setCurrentApiBase(disc.url);
            setServerUrlInput(disc.url);
            setIsNetworkErr(false);
            setApiError('');
          }
        }
      } catch (_) {}
    };

    initConnection();
  }, [showServerModal]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email or Username is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    setApiError('');
    setIsNetworkErr(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setApiError('');
    setIsNetworkErr(false);

    try {
      const result = await login(formData.email.trim(), formData.password);
      
      if (result.success) {
        if (result.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (result.user.role === 'volunteer') {
          navigate('/volunteer/dashboard');
        } else {
          setApiError('Access denied. Unrecognized user role.');
        }
      } else {
        if (result.isNetworkError || (result.message && result.message.toLowerCase().includes('connect'))) {
          // Attempt auto-recovery from cloud registry
          const disc = await autoDiscoverTunnelUrl();
          if (disc.success) {
            const retryRes = await login(formData.email.trim(), formData.password);
            if (retryRes.success) {
              if (retryRes.user.role === 'admin') {
                navigate('/admin/dashboard');
              } else if (retryRes.user.role === 'volunteer') {
                navigate('/volunteer/dashboard');
              } else {
                setApiError('Access denied. Unrecognized user role.');
              }
              return;
            }
          }
          setIsNetworkErr(true);
        }
        setApiError(result.message);
      }
    } catch (error) {
      // Auto-recovery attempt on unexpected network exception
      try {
        const disc = await autoDiscoverTunnelUrl();
        if (disc.success) {
          const retryRes = await login(formData.email.trim(), formData.password);
          if (retryRes.success) {
            if (retryRes.user.role === 'admin') {
              navigate('/admin/dashboard');
            } else if (retryRes.user.role === 'volunteer') {
              navigate('/volunteer/dashboard');
            }
            return;
          }
        }
      } catch (_) {}
      setApiError('Cannot connect to backend server. Re-check internet or tunnel status.');
      setIsNetworkErr(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTestingServer(true);
    setServerTestStatus(null);
    try {
      const res = await testServerConnection(serverUrlInput);
      if (res.success) {
        setServerTestStatus({
          success: true,
          message: 'Connected successfully! CrewLink API is live.',
        });
      } else {
        setServerTestStatus({
          success: false,
          message: `Connection failed: ${res.error}`,
        });
      }
    } catch (err) {
      setServerTestStatus({
        success: false,
        message: 'Could not connect to this server URL.',
      });
    } finally {
      setIsTestingServer(false);
    }
  };

  const handleSaveServerUrl = () => {
    const updated = setApiBase(serverUrlInput);
    setCurrentApiBase(updated);
    setShowServerModal(false);
    setApiError('');
    setIsNetworkErr(false);
  };

  const handleResetServerUrl = () => {
    const def = resetApiBase();
    setCurrentApiBase(def);
    setServerUrlInput(def);
    setServerTestStatus(null);
  };

  const handleAutoReconnect = async () => {
    setIsAutoReconnecting(true);
    setApiError('');
    try {
      const disc = await autoDiscoverTunnelUrl();
      if (disc.success) {
        setCurrentApiBase(disc.url);
        setServerUrlInput(disc.url);
        setIsNetworkErr(false);
        setApiError('');
        if (formData.email.trim() && formData.password) {
          const fakeEvent = { preventDefault: () => {} };
          handleSubmit(fakeEvent);
        }
      } else {
        setIsNetworkErr(true);
        setApiError('Auto-detect could not reach server. Tap "Configure Server URL" to check settings.');
      }
    } catch (_) {
      setIsNetworkErr(true);
      setApiError('Auto-reconnect failed. Tap "Configure Server URL" to inspect settings.');
    } finally {
      setIsAutoReconnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-3.5 sm:p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600 rounded-full blur-[120px] opacity-20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px] opacity-20"></div>

      <div className="w-full max-w-md animate-slide-up relative z-10">
        {/* Logo and Header */}
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="inline-flex items-center space-x-3 mb-4 sm:mb-6 group">
            <svg 
              viewBox="0 0 100 60" 
              className="w-16 h-10 transform group-hover:scale-105 transition-all duration-300 drop-shadow-xl"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="50%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
                <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d946ef" />
                  <stop offset="100%" stopColor="#4c1d95" />
                </linearGradient>
                <clipPath id="clipTopLeft">
                  <rect x="0" y="0" width="60" height="30" />
                </clipPath>
                <filter id="bevel3D" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.2" result="dropShadow" />
                  <feGaussianBlur in="SourceAlpha" stdDeviation="1" result="blur" />
                  <feOffset dx="-1.5" dy="-1.5" result="offsetBlur" />
                  <feComposite in="SourceGraphic" in2="offsetBlur" operator="arithmetic" k2="1" k3="-1" result="highlightMask" />
                  <feFlood floodColor="white" floodOpacity="0.9" />
                  <feComposite in2="highlightMask" operator="in" result="highlight" />
                  <feOffset in="SourceAlpha" dx="2" dy="2" result="offsetBlur2" />
                  <feComposite in="SourceGraphic" in2="offsetBlur2" operator="arithmetic" k2="1" k3="-1" result="shadowMask" />
                  <feFlood floodColor="#000000" floodOpacity="0.5" />
                  <feComposite in2="shadowMask" operator="in" result="shadow" />
                  <feMerge>
                    <feMergeNode in="dropShadow" />
                    <feMergeNode in="SourceGraphic" />
                    <feMergeNode in="shadow" />
                    <feMergeNode in="highlight" />
                  </feMerge>
                </filter>
              </defs>
              <rect x="12" y="10" width="46" height="40" rx="20" fill="none" stroke="url(#silverGrad)" strokeWidth="12" filter="url(#bevel3D)" />
              <rect x="42" y="10" width="46" height="40" rx="20" fill="none" stroke="url(#purpleGrad)" strokeWidth="12" filter="url(#bevel3D)" />
              <rect x="12" y="10" width="46" height="40" rx="20" fill="none" stroke="url(#silverGrad)" strokeWidth="12" clipPath="url(#clipTopLeft)" filter="url(#bevel3D)" />
            </svg>
            <span className="text-3xl font-black text-white tracking-tight">
              CrewLink
            </span>
          </Link>
          <div className="flex items-center justify-center space-x-2 mb-2">
            <ShieldAlert className="text-blue-400" size={24} />
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">
              CrewLink Portal
            </h1>
          </div>
          <p className="text-gray-400 text-sm sm:text-base">
            Secure login for Admins and Volunteers
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl p-5 sm:p-8">
          {apiError && (
            <div id="login-error" data-testid="login-error" className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg animate-fade-in">
              <div className="flex items-start space-x-3">
                <ShieldAlert className="text-red-400 mt-0.5 flex-shrink-0" size={18} />
                <div className="flex-1">
                  <p className="text-red-200 text-sm leading-relaxed">{apiError}</p>
                  {isNetworkErr && (
                    <div className="mt-3 pt-3 border-t border-red-500/30">
                      <p className="text-xs text-red-300 mb-2">
                        Using phone data or changed Wi-Fi? Reconnect to the active tunnel or configure address:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleAutoReconnect}
                          disabled={isAutoReconnecting}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow transition-colors"
                        >
                          {isAutoReconnecting ? (
                            <>
                              <Loader2 size={13} className="animate-spin" />
                              <span>Connecting...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw size={13} />
                              <span>Auto-Reconnect Now</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowServerModal(true)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-800/80 hover:bg-red-700 text-white text-xs font-semibold rounded-md shadow transition-colors"
                        >
                          <Settings size={13} />
                          <span>Configure Server URL</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} id="login-form">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="login-email">
                Email Address or Username
              </label>
              <input
                type="text"
                id="login-email"
                data-testid="login-email"
                name="email"
                placeholder="admin@crewlink.com or username"
                value={formData.email}
                onChange={handleChange}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                className={`w-full px-4 py-3 bg-gray-900/50 border ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors`}
              />
              {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  data-testid="login-password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-900/50 border ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors pr-10`}
                />
                <button
                  type="button"
                  id="btn-toggle-password"
                  data-testid="btn-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
            </div>

            <button
              type="submit"
              id="login-submit"
              data-testid="login-submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg hover:shadow-blue-600/30"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>
        </div>
      </div>

      {/* Server Settings Modal */}
      {showServerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-white animate-scale-up">
            <button
              onClick={() => setShowServerModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700/50"
            >
              <X size={20} />
            </button>

            <div className="flex items-center space-x-2.5 mb-3">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                <Server size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Server Connection</h3>
                <p className="text-xs text-gray-400">Configure connection for Wi-Fi or Mobile Data</p>
              </div>
            </div>

            <div className="mb-4 text-xs text-gray-300 bg-gray-900/60 p-3 rounded-lg border border-gray-700/60 space-y-1">
              <p>
                <strong className="text-blue-400">📱 Mobile Data (4G/5G):</strong> Enter your public Cloudflare Tunnel URL (e.g. <code className="text-gray-200">https://xxxx.trycloudflare.com</code>)
              </p>
              <p>
                <strong className="text-emerald-400">🏠 Home Wi-Fi:</strong> Use your PC's local IP (e.g. <code className="text-gray-200">http://192.168.0.121:5000</code>)
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Backend Server URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={serverUrlInput}
                  onChange={(e) => {
                    setServerUrlInput(e.target.value);
                    setServerTestStatus(null);
                  }}
                  placeholder="https://...trycloudflare.com or http://192.168.0.121:5000"
                  className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="mb-4">
              <span className="text-[11px] font-medium text-gray-400 block mb-1.5">Quick Presets:</span>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={async () => {
                    setIsTestingServer(true);
                    setServerTestStatus({ success: true, message: 'Detecting live cloud tunnel...' });
                    const res = await autoDiscoverTunnelUrl();
                    setIsTestingServer(false);
                    if (res.success) {
                      setServerUrlInput(res.url);
                      setCurrentApiBase(res.url);
                      setApiBase(res.url);
                      setServerTestStatus({ success: true, message: `Connected! Live server: ${res.url}` });
                      setApiError('');
                      setIsNetworkErr(false);
                    } else {
                      setServerTestStatus({ success: false, message: 'Could not auto-detect live tunnel.' });
                    }
                  }}
                  className="flex items-center justify-center space-x-1 px-1.5 py-1.5 bg-blue-700/60 hover:bg-blue-700 border border-blue-500/50 rounded text-xs text-white font-medium transition-colors"
                >
                  <RefreshCw size={12} className="text-blue-200" />
                  <span>Auto-Sync</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setServerUrlInput(PUBLIC_INTERNET_URL);
                    setServerTestStatus(null);
                  }}
                  className="flex items-center justify-center space-x-1 px-1.5 py-1.5 bg-gray-700/60 hover:bg-gray-700 border border-gray-600 rounded text-xs text-gray-200 transition-colors"
                >
                  <Globe size={12} className="text-purple-400" />
                  <span>Tunnel</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setServerUrlInput('http://192.168.0.121:5000');
                    setServerTestStatus(null);
                  }}
                  className="flex items-center justify-center space-x-1 px-1.5 py-1.5 bg-gray-700/60 hover:bg-gray-700 border border-gray-600 rounded text-xs text-gray-200 transition-colors"
                >
                  <Wifi size={12} className="text-emerald-400" />
                  <span>Wi-Fi</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setServerUrlInput('http://localhost:5000');
                    setServerTestStatus(null);
                  }}
                  className="flex items-center justify-center space-x-1 px-1.5 py-1.5 bg-gray-700/60 hover:bg-gray-700 border border-gray-600 rounded text-xs text-gray-200 transition-colors"
                >
                  <Server size={12} className="text-blue-400" />
                  <span>Local</span>
                </button>
              </div>
            </div>

            {/* Connection Test Result */}
            {serverTestStatus && (
              <div className={`mb-4 p-3 rounded-lg text-xs flex items-start space-x-2 border ${
                serverTestStatus.success 
                  ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200' 
                  : 'bg-red-950/50 border-red-500/50 text-red-200'
              }`}>
                {serverTestStatus.success ? (
                  <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <XCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                )}
                <span>{serverTestStatus.message}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTestingServer || !serverUrlInput.trim()}
                className="flex-1 px-3 py-2.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-gray-200 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
              >
                {isTestingServer ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} />
                    <span>Test Connection</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveServerUrl}
                className="flex-1 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors shadow-md"
              >
                <span>Save & Apply</span>
              </button>
            </div>

            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={handleResetServerUrl}
                className="text-[11px] text-gray-400 hover:text-gray-200 underline"
              >
                Reset to default server configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
