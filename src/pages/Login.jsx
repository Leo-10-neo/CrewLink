import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, ShieldAlert } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setApiError('');

    try {
      const result = await login(formData.email.trim(), formData.password);
      
      if (result.success) {
        if (result.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (result.user.role === 'volunteer') {
          navigate('/volunteer/dashboard');
        } else {
          // If they are not an admin or volunteer, we shouldn't let them in here.
          setApiError('Access denied. Unrecognized user role.');
        }
      } else {
        setApiError(result.message);
      }
    } catch (error) {
      setApiError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
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
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500/50 rounded-lg animate-fade-in flex items-start space-x-3">
              <ShieldAlert className="text-red-400 mt-0.5 flex-shrink-0" size={18} />
              <p className="text-red-200 text-sm">{apiError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email Address or Username
              </label>
              <input
                type="text"
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
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-900/50 border ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition-colors pr-10`}
                />
                <button
                  type="button"
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
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? 'Authenticating...' : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;


