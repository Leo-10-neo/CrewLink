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
    <nav className="glass-panel sticky top-0 z-50 border-b border-gray-200/50" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <img
              src="/crewlink_logo_transparent.png"
              alt="CrewLink Logo"
              className="h-10 w-auto transform group-hover:scale-105 transition-all duration-300 drop-shadow-md"
            />
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
                <Link to="/login" id="nav-login-link" data-testid="nav-login-link" className="text-gray-600 hover:text-gray-900 font-medium text-sm">
                  Login
                </Link>
                <Link to="/volunteer-register" id="nav-volunteer-link" data-testid="nav-volunteer-link" className="btn-primary text-sm py-2 px-4">
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


