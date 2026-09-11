import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    const destination = user?.role === 'admin'
      ? '/admin/dashboard'
      : user?.role === 'volunteer'
        ? '/volunteer/dashboard'
        : '/dashboard';
    return <Navigate to={destination} replace />;
  }

  return children;
};

export default PublicRoute;
