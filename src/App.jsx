import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import AnimatedBackground from './components/AnimatedBackground';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Home from './pages/Home';
import Events from './pages/Events';
import About from './pages/About';
import Login from './pages/Login';
import VolunteerRegister from './pages/VolunteerRegister';
import AdminDashboard from './pages/AdminDashboard';
import VolunteerDashboard from './pages/VolunteerDashboard';
import EventSupport from './pages/EventSupport';

function App() {
  return (
    <AuthProvider>
      <Router>
        <AnimatedBackground />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/about" element={<About />} />
          
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/volunteer-register" 
            element={
              <PublicRoute>
                <VolunteerRegister />
              </PublicRoute>
            } 
          />
          
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Volunteer Routes */}
          <Route 
            path="/volunteer/dashboard" 
            element={
              <ProtectedRoute requireVolunteer={true}>
                <VolunteerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/volunteer/event-support/:taskId" 
            element={
              <ProtectedRoute requireVolunteer={true}>
                <EventSupport />
              </ProtectedRoute>
            } 
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
