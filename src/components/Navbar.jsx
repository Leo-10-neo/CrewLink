import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, LogOut, User, LayoutDashboard, Calendar, FileText, Home as HomeIcon } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const navRefs = useRef([]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const currentLinks = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/events' },
    { name: 'About', path: '/about' }
  ];

  useEffect(() => {
    navRefs.current = navRefs.current.slice(0, currentLinks.length);
    const activeIndex = currentLinks.findIndex(link => location.pathname === link.path);
    
    // We add a tiny delay to ensure fonts/layout are rendered before calculating widths
    const timeoutId = setTimeout(() => {
      if (activeIndex !== -1 && navRefs.current[activeIndex]) {
        const activeEl = navRefs.current[activeIndex];
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
          opacity: 1
        });
      } else {
        setIndicatorStyle({ opacity: 0 });
      }
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [location.pathname, isAuthenticated, currentLinks.length]);

  return (
    <nav className="glass-panel sticky top-0 z-50 border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
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
            <span className="text-2xl font-bold text-accent tracking-tight">
              CrewLink
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center">
            <div className="relative flex items-center space-x-2 mr-6">
              {/* Sliding Water Droplet Indicator */}
              <div 
                className="droplet-bg"
                style={{
                  left: `${indicatorStyle.left}px`,
                  width: `${indicatorStyle.width}px`,
                  opacity: indicatorStyle.opacity
                }}
              />
              
              {currentLinks.map((link, index) => {
                const Icon = link.icon;
                return (
                  <Link 
                    key={link.path}
                    to={link.path}
                    ref={el => navRefs.current[index] = el}
                    className={`nav-link ${isActive(link.path) ? 'nav-link-active' : ''}`}
                  >
                    {Icon ? (
                      <div className="flex items-center space-x-2">
                        <Icon size={18} />
                        <span>{link.name}</span>
                      </div>
                    ) : (
                      link.name
                    )}
                  </Link>
                );
              })}
            </div>
            
            {/* Auth Buttons */}
            {!isAuthenticated ? (
              <div className="flex items-center space-x-3 border-l border-gray-200/50 pl-6">
                <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
                  Login
                </Link>
                <Link to="/volunteer-register" className="btn-primary text-sm py-2 px-4">
                  Volunteer Sign Up
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-3 border-l border-gray-200/50 pl-6">
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-900 hover:text-blue-600 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden glass-panel border-t border-gray-200/50 animate-fade-in">
          <div className="px-6 py-4 space-y-4">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/"
                  className="block nav-link py-2"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <HomeIcon size={18} />
                    <span>Home</span>
                  </div>
                </Link>
                <Link
                  to="/events"
                  className="block nav-link py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Events
                </Link>
                <Link
                  to="/about"
                  className="block nav-link py-2"
                  onClick={() => setIsOpen(false)}
                >
                  About
                </Link>
                <div className="pt-4 space-y-3 border-t border-gray-100">
                  <Link
                    to="/login"
                    className="block text-center text-sm font-medium text-gray-700 hover:text-gray-900 py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/volunteer-register"
                    className="block btn-primary text-center text-sm"
                    onClick={() => setIsOpen(false)}
                  >
                    Volunteer Sign Up
                  </Link>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/admin/dashboard"
                  className="block nav-link py-2"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="flex items-center space-x-2">
                    <LayoutDashboard size={18} />
                    <span>Dashboard</span>
                  </div>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium py-2 w-full"
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;


