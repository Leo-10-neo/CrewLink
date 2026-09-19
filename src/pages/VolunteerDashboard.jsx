import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  LayoutDashboard, User, ClipboardList, Clock, Award,
  LogOut, Search, Bell, CalendarDays, CheckCircle2, X, MessageSquare, Download, FileText, Lock, Menu,
  ShieldAlert, ScrollText
} from 'lucide-react';

import { API_BASE, API_URL } from '../services/api';

const API = `${API_URL}/volunteer`;

const VolunteerDashboard = () => {
  const { user, token, logout } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('events');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [overview, setOverview] = useState(null);
  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [certMeta, setCertMeta] = useState({ points: 0, requiredPoints: 500, isEligible: false });
  const [selectedCert, setSelectedCert] = useState(null);
  const [claimingCert, setClaimingCert] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [selectedRulesTask, setSelectedRulesTask] = useState(null);
  const [completingTask, setCompletingTask] = useState(null);
  const [taskPhoto, setTaskPhoto] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Events tab states
  const [eventsList, setEventsList] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedEventForApply, setSelectedEventForApply] = useState(null);
  const [applyForm, setApplyForm] = useState({
    taskName: 'Stage Management',
    customTask: '',
    salary: 400,
    note: ''
  });
  const [submittingApply, setSubmittingApply] = useState(false);
  const [eventSearch, setEventSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedRulesEvent, setSelectedRulesEvent] = useState(null);

  const headers = { Authorization: `Bearer ${token}` };

  // ── Fetchers ──────────────────────────────
  const fetchEventsWithStatus = async (showLoader = false) => {
    try {
      if (showLoader && eventsList.length === 0) {
        setLoadingEvents(true);
      }
      const { data } = await axios.get(`${API}/events-with-status`, { headers });
      setEventsList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Error fetching events with status:', e);
    } finally {
      setLoadingEvents(false);
    }
  };
  const fetchOverview = async () => {
    try {
      const { data } = await axios.get(`${API}/overview`, { headers });
      setOverview(data);
    } catch (e) { console.error(e); }
  };

  const fetchProfile = async () => {
    try {
      const { data } = await axios.get(`${API}/profile`, { headers });
      const source = data.user || user || {};
      const asList = (value) => Array.isArray(value) ? value : (value || '');
      const savedEmergencyContact = data.emergencyContact && Object.values(data.emergencyContact).some(Boolean)
        ? data.emergencyContact
        : (source.emergencyContact || { name: '', phone: '', relation: '' });

      setProfile({
        ...data,
        fullName: data.fullName || source.fullName || source.username || '',
        city: data.city || source.city || '',
        phone: data.phone || source.phone || '',
        photo: data.photo || source.photo || '',
        aadharNo: data.aadharNo || source.aadharNo || '',
        panCardNo: data.panCardNo || source.panCardNo || '',
        address: data.address || source.address || '',
        age: data.age ?? source.age ?? null,
        gender: data.gender || source.gender || '',
        skills: data.skills || asList(source.skills),
        availability: data.availability || asList(source.availability),
        experience: data.experience || source.experience || '',
        preferredEventTypes: data.preferredEventTypes || asList(source.preferredEventTypes),
        languages: data.languages?.length ? data.languages : asList(source.languages),
        emergencyContact: savedEmergencyContact,
        bloodGroup: data.bloodGroup || source.bloodGroup || ''
      });
    } catch (e) { console.error(e); }
  };

  const fetchTasks = async () => {
    try {
      const { data } = await axios.get(`${API}/tasks`, { headers });
      setTasks(data);
    } catch (e) { console.error(e); }
  };

  const fetchAttendance = async () => {
    try {
      const { data } = await axios.get(`${API}/attendance`, { headers });
      setAttendance(data);
    } catch (e) { console.error(e); }
  };

  const fetchCertificates = async () => {
    try {
      const { data } = await axios.get(`${API}/certificates`, { headers });
      setCertificates(Array.isArray(data) ? data : (data.certificates || []));
      if (data && typeof data.points === 'number') {
        setCertMeta({ points: data.points, requiredPoints: data.requiredPoints || 500, isEligible: data.isEligible });
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchOverview(), fetchProfile(), fetchEventsWithStatus(true)]);
      setLoading(false);
    };
    load();
  }, []);

  // Live Notifications & Real-Time Sync (every 2.5 seconds)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/notifications`, { headers });
        setNotifications(prev => {
          const latestNew = (data || [])[0];
          const latestOld = prev[0];
          if (latestNew && (!latestOld || latestNew._id !== latestOld._id)) {
            if (!latestNew.read) {
              const isFromAdmin = latestNew.type === 'chat_message' || 
                (latestNew.message && latestNew.message.toLowerCase().includes('admin'));
              showNotification({
                title: isFromAdmin ? 'CrewLink • Admin' : 'CrewLink',
                message: latestNew.message,
                time: 'now',
                onClick: () => {
                  handleNotificationClick(latestNew);
                }
              });
              // Instantly refresh all tabs so volunteer sees approved/rejected status, new tasks, attendance without refreshing
              fetchEventsWithStatus(false);
              fetchTasks();
              fetchOverview();
              fetchAttendance();
            }
          }
          return data || [];
        });
      } catch (e) { console.error(e); }
    };

    fetchNotifications();
    
    // Fast polling every 2.5 seconds for instant real-time response
    const interval = setInterval(fetchNotifications, 2500);
    return () => clearInterval(interval);
  }, [token]);

  // Real-time active tab live sync (every 5 seconds)
  useEffect(() => {
    const refreshActiveTab = () => {
      if (activeTab === 'events') fetchEventsWithStatus(false);
      else if (activeTab === 'tasks') fetchTasks();
      else if (activeTab === 'attendance') fetchAttendance();
      else if (activeTab === 'certificates') fetchCertificates();
      else if (activeTab === 'overview') fetchOverview();
      else if (activeTab === 'profile') fetchProfile();
    };

    refreshActiveTab();
    const interval = setInterval(refreshActiveTab, 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const showToast = (msg, title = 'CrewLink') => {
    showNotification({
      title,
      message: msg,
      time: 'now'
    });
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const markNotificationAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}/read`, {}, { headers });
      setNotifications(notifications.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (e) { 
      console.error('Error marking notification as read:', e);
      console.error('Error response:', e.response);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`, {}, { headers });
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (e) { 
      console.error('Error marking all notifications as read:', e);
    }
  };

  const clearAllNotifications = async () => {
    try {
      console.log('Clearing all notifications...');
      const response = await axios.delete(`${API_URL}/notifications/clear-all`, { headers });
      console.log('Clear response:', response.data);
      setNotifications([]);
      console.log('Notifications cleared successfully');
    } catch (e) { 
      console.error('Error clearing notifications:', e);
      console.error('Error response:', e.response);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification) return;
    if (!notification.read && notification._id) {
      markNotificationAsRead(notification._id);
    }
    setShowNotifications(false);

    // 1. If it has a taskId, chat link, or mentions a task, open event support chat directly!
    let targetTaskId = notification.taskId;
    if (!targetTaskId && notification.link) {
      const match = notification.link.match(/event-support\/([a-zA-Z0-9]+)/);
      if (match) targetTaskId = match[1];
    }
    if (!targetTaskId && notification.message) {
      const taskMatch = notification.message.match(/regarding task ["']([^"']+)["']/i);
      if (taskMatch && tasks && tasks.length > 0) {
        const found = tasks.find(t => t.taskName?.toLowerCase() === taskMatch[1].toLowerCase());
        if (found) targetTaskId = found._id;
      }
    }

    if (targetTaskId) {
      navigate(`/volunteer/event-support/${targetTaskId}`, { state: { fromNotification: true } });
      return;
    }
    if (notification.link && notification.link.includes('/volunteer/event-support/')) {
      navigate(notification.link, { state: { fromNotification: true } });
      return;
    }

    // 2. Task applications / approvals
    if (notification.type === 'task_applied' || notification.type === 'task_approved' || 
        (notification.message && notification.message.toLowerCase().includes('application'))) {
      setActiveTab('events');
      return;
    }

    // 3. Completed tasks / reviews
    if (notification.type === 'task_completed' || 
        (notification.message && notification.message.toLowerCase().includes('task'))) {
      setActiveTab('tasks');
      return;
    }

    // 4. Certificates
    if (notification.type === 'certificate_pending' || 
        (notification.message && notification.message.toLowerCase().includes('certificate'))) {
      setActiveTab('certificates');
      return;
    }

    // Fallback
    if (notification.link) {
      navigate(notification.link, { state: { fromNotification: true } });
    } else {
      setActiveTab('events');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Handlers ──────────────────────────────
  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const normalizeList = (value) => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') return value.split(',').map(v => v.trim()).filter(Boolean);
        return [];
      };

      const { data } = await axios.put(`${API}/profile`, {
        fullName: profile?.fullName || profile?.user?.fullName || '',
        city: profile?.city || profile?.user?.city || '',
        phone: profile?.phone || profile?.user?.phone || '',
        photo: profile?.photo || profile?.user?.photo || '',
        aadharNo: profile?.aadharNo || profile?.user?.aadharNo || '',
        panCardNo: profile?.panCardNo || profile?.user?.panCardNo || '',
        address: profile?.address || profile?.user?.address || '',
        age: profile?.age ?? profile?.user?.age ?? null,
        gender: profile?.gender || profile?.user?.gender || '',
        skills: normalizeList(profile?.skills ?? profile?.user?.skills ?? []),
        availability: normalizeList(profile?.availability ?? profile?.user?.availability ?? []),
        experience: profile?.experience || profile?.user?.experience || '',
        preferredEventTypes: normalizeList(profile?.preferredEventTypes ?? profile?.user?.preferredEventTypes ?? []),
        languages: normalizeList(profile?.languages ?? profile?.user?.languages ?? []),
        emergencyContact: profile?.emergencyContact || profile?.user?.emergencyContact || { name: '', phone: '', relation: '' },
        bloodGroup: profile?.bloodGroup || profile?.user?.bloodGroup || '',
      }, { headers });
      setProfile(data);
      showToast('Profile saved');
    } catch (e) { showToast('Failed to save'); }
    setSaving(false);
  };

  const handleUpdateTaskStatus = async (taskId, status, photo = '') => {
    try {
      await axios.put(`${API}/tasks/${taskId}/status`, { status, photo }, { headers });
      fetchTasks();
      if (status === 'completed') {
        showToast('Work submitted to the admin for review!');
      } else {
        showToast('Task updated');
      }
    } catch (e) { showToast(e.response?.data?.message || 'Failed to update'); }
  };

  const handleToggleAttendance = async (recordId) => {
    try {
      const res = await axios.put(`${API}/attendance/${recordId}/toggle`, {}, { headers });
      fetchAttendance();
      const msg = res.data?.checkOut ? 'Checked out successfully!' : 'Checked in successfully!';
      showToast(msg);
    } catch (e) { showToast(e.response?.data?.message || 'Failed to update attendance'); }
  };

  const handleApply = async (eventId) => {
    try {
      await axios.post(`${API}/apply/${eventId}`, {}, { headers });
      fetchOverview();
      showToast('Applied!');
    } catch (e) { showToast(e.response?.data?.message || 'Failed'); }
  };

  const handleClaimCertificate = async () => {
    setClaimingCert(true);
    try {
      const { data } = await axios.post(`${API}/certificates/claim`, {}, { headers });
      await fetchCertificates();
      showToast(data.message || 'Certificate generated successfully!');
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setClaimingCert(false);
    }
  };

  const openCertificate = (cert, autoPrint = false) => {
    setSelectedCert(cert);
    if (autoPrint) {
      setTimeout(() => {
        window.print();
      }, 350);
    }
  };

  // ── Helpers ───────────────────────────────
  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const fmtDateTime = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });
  };

  // ── Sidebar nav items ─────────────────────
  const navItems = [
    { id: 'events', label: 'Events', icon: CalendarDays },
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'profile', label: 'My profile', icon: User },
    { id: 'tasks', label: 'My tasks', icon: ClipboardList },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'certificates', label: 'Certificates', icon: Award },
  ];

  // ══════════════════════════════════════════
  // RENDER TABS
  // ══════════════════════════════════════════

  const renderOverview = () => {
    if (!overview) return <div className="text-gray-400 py-12 text-center">Loading…</div>;
    return (
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">Ready to make it happen?</h1>
          <p className="text-gray-500 text-sm sm:text-base">Your volunteer hub for every contribution.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="glass-panel rounded-2xl p-4 sm:p-6 shadow-premium border border-white/60 flex flex-col justify-between min-h-[96px] sm:h-32 hover:shadow-glow transition-all">
            <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Application</span>
            <span className="text-2xl font-bold text-gray-900 capitalize">{overview.applicationStatus}</span>
          </div>
          <div className="glass-panel rounded-2xl p-4 sm:p-6 shadow-premium border border-white/60 flex flex-col justify-between min-h-[96px] sm:h-32 hover:shadow-glow transition-all">
            <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Assigned Events</span>
            <span className="text-3xl font-bold text-gray-900">{overview.assignedEvents}</span>
          </div>
          <div className="glass-panel rounded-2xl p-4 sm:p-6 shadow-premium border border-white/60 flex flex-col justify-between min-h-[96px] sm:h-32 hover:shadow-glow transition-all">
            <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Open Tasks</span>
            <span className="text-3xl font-bold text-gray-900">{overview.openTasks}</span>
          </div>
          <div className="glass-panel rounded-2xl p-4 sm:p-6 shadow-premium border border-white/60 flex flex-col justify-between min-h-[96px] sm:h-32 hover:shadow-glow transition-all">
            <span className="text-xs font-semibold text-gray-500 tracking-wider uppercase">Crew Points</span>
            <span className="text-3xl font-bold text-gray-900">{overview.crewPoints}</span>
          </div>
        </div>

        {/* Two-column content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available events */}
          <div className="glass-panel rounded-2xl border border-white/60 shadow-premium p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Available events</h2>
              <button 
                onClick={() => setActiveTab('events')} 
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold px-3 py-1.5 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Explore & Apply</span>
                <span>→</span>
              </button>
            </div>
            {overview.availableEvents.length === 0 ? (
              <p className="text-gray-400 text-sm py-4">No available events right now.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {overview.availableEvents.map(ev => (
                  <div 
                    key={ev._id} 
                    onClick={() => setActiveTab('events')}
                    className="py-3 cursor-pointer hover:bg-purple-50/50 rounded-xl px-2 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">{ev.title}</p>
                      <span className="text-xs text-purple-600 font-medium">Apply →</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {fmtDate(ev.date)} · {ev.category || 'General'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Next tasks */}
          <div className="glass-panel rounded-2xl border border-white/60 shadow-premium p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Next tasks</h2>
            {overview.nextTasks.length === 0 ? (
              <p className="text-gray-400 text-sm py-4">No tasks assigned yet.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {overview.nextTasks.map(t => (
                  <div key={t._id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{t.taskName}</p>
                      <p className="text-sm text-gray-500">
                        {t.event?.title || '—'} ·{' '}
                        {(t.startTime || t.dueDate || t.event?.date) ? (
                          <span className="text-indigo-600 font-mono text-xs mr-1">
                            {fmtDateTime(t.startTime || t.dueDate || t.event?.date)} ·
                          </span>
                        ) : null}
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          t.status === 'completed' ? 'bg-teal-50 text-teal-700' :
                          t.status === 'in-progress' ? 'bg-yellow-50 text-yellow-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>{t.status === 'completed' ? 'Completed' : t.status === 'in-progress' ? 'In progress' : 'Pending'}</span>
                      </p>
                    </div>
                    <span className="font-semibold text-emerald-600 text-sm">₹{t.salary || 0}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderProfile = () => {
    if (!profile) return <div className="text-gray-400 py-12 text-center">Loading…</div>;
    const userProfile = profile.user || user || {};
    const profileValue = (key) => {
      const val = profile[key] || userProfile[key] || '';
      return Array.isArray(val) ? val.join(', ') : val;
    };
    const field = (label, key, placeholder) => (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
        <input
          type="text"
          value={profileValue(key)}
          onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
          placeholder={placeholder}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-shadow"
        />
      </div>
    );
    const listValue = (value) => Array.isArray(value) ? value.join(', ') : (value || '');
    const emergencyContact = profile.emergencyContact && Object.values(profile.emergencyContact).some(Boolean)
      ? profile.emergencyContact
      : (userProfile.emergencyContact || {});
    const updateEmergencyContact = (key, value) => setProfile({
      ...profile,
      emergencyContact: { ...emergencyContact, [key]: value }
    });

    return (
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">Volunteer profile</h1>
          <p className="text-gray-500 text-sm sm:text-base">Your profile helps organisers match your strengths to the work.</p>
        </div>

        {/* Privacy note */}
        <div className="mb-6 p-4 bg-[#f0fdf4] border-l-4 border-teal-400 rounded-r-lg text-sm text-teal-800">
          For privacy, CrewLink does not collect government identity numbers in this prototype. Verification is represented with secure document placeholders and masked references only.
        </div>

        <div className="glass-panel rounded-2xl shadow-premium p-4 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {field('Full name', 'fullName', 'Your full name')}
            {field('City', 'city', 'e.g. Bengaluru')}
            {field('Phone', 'phone', '9876503333')}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="text"
                value={userProfile.email || ''}
                disabled
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>
            {field('Skills', 'skills', 'Guest coordination, first aid')}
            {field('Availability', 'availability', 'Weekends')}
            {field('Experience', 'experience', '2 years of campus events')}
            {field('Preferred event types', 'preferredEventTypes', 'Cultural, Charity')}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Languages</label>
              <input
                type="text"
                value={listValue(profile.languages?.length ? profile.languages : userProfile.languages)}
                onChange={(e) => setProfile({ ...profile, languages: e.target.value })}
                placeholder="Kannada, Hindi"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-shadow"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-100 pb-2">Emergency contact</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact name</label>
              <input
                type="text"
                value={emergencyContact.name || ''}
                onChange={(e) => updateEmergencyContact('name', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input
                type="text"
                value={emergencyContact.phone || ''}
                onChange={(e) => updateEmergencyContact('phone', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-shadow"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Relation</label>
              <input
                type="text"
                value={emergencyContact.relation || ''}
                onChange={(e) => updateEmergencyContact('relation', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-shadow"
              />
            </div>
            {field('Blood group', 'bloodGroup', 'O+')}
          </div>

          {/* Volunteer Registration Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Volunteer Photo</label>
              <div className="px-4 py-3 border-l-4 border-blue-400 bg-blue-50/50 rounded-r-lg">
                {profileValue('photo') ? (
                  <img src={profileValue('photo')} alt="Volunteer" className="w-24 h-24 object-cover rounded-md border border-gray-200" />
                ) : (
                  <span className="text-sm text-gray-500 italic">No photo provided</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Identity & Details</label>
              <div className="space-y-3">
                {field('Aadhaar number', 'aadharNo', 'Aadhaar number')}
                {field('PAN card number', 'panCardNo', 'PAN card number')}
                <div className="grid grid-cols-2 gap-3">
                  {field('Age', 'age', 'Age')}
                  {field('Gender', 'gender', 'Gender')}
                </div>
                {field('Address', 'address', 'Address')}
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-8 py-2.5 bg-[#5b52f6] hover:bg-[#4a42d4] text-white font-medium rounded-lg transition-colors shadow-md disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </div>
    );
  };

  const renderTasks = () => {
    if (tasks.length === 0) {
      return (
        <div className="max-w-5xl mx-auto animate-fade-in">
          <div className="mb-8">
            <h1 className="text-3xl font-medium text-gray-900 mb-1">My tasks</h1>
            <p className="text-gray-500 text-lg">Update your progress as you move through the day.</p>
          </div>
          <div className="glass-panel rounded-2xl shadow-premium p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks assigned yet</h3>
              <p className="text-gray-500">When admin assigns you tasks, they will appear here.</p>
            </div>
          </div>
        </div>
      );
    }

    const sortedTasks = [...tasks].sort((a, b) => {
      const isCompletedA = a.status === 'completed' ? 1 : 0;
      const isCompletedB = b.status === 'completed' ? 1 : 0;
      if (isCompletedA !== isCompletedB) {
        return isCompletedA - isCompletedB;
      }
      const timeA = new Date(a.startTime || a.dueDate || a.event?.date || 0).getTime();
      const timeB = new Date(b.startTime || b.dueDate || b.event?.date || 0).getTime();
      return timeA - timeB;
    });

    const approvedSalary = tasks.filter(t => t.paymentStatus === 'approved').reduce((sum, t) => sum + (Number(t.salary) || 0), 0);
    const pendingApprovalSalary = tasks.filter(t => t.status === 'completed' && t.paymentStatus !== 'approved').reduce((sum, t) => sum + (Number(t.salary) || 0), 0);
    const totalSalary = tasks.reduce((sum, t) => sum + (Number(t.salary) || 0), 0);

    return (
      <>
        <div className="max-w-5xl mx-auto animate-fade-in">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">My tasks</h1>
              <p className="text-gray-500 text-sm sm:text-base">Update your progress as you move through the day.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              <div className="bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-xl">
                <span className="text-[10px] font-semibold uppercase text-emerald-800 tracking-wider block">Approved Earnings:</span>
                <span className="text-base font-bold text-emerald-600">₹{approvedSalary}</span>
              </div>
              {pendingApprovalSalary > 0 && (
                <div className="bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">
                  <span className="text-[10px] font-semibold uppercase text-amber-800 tracking-wider block">Awaiting:</span>
                  <span className="text-base font-bold text-amber-600">₹{pendingApprovalSalary}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mobile card list */}
          <div className="md:hidden space-y-3">
            {sortedTasks.map(t => (
              <div key={t._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{t.taskName}</p>
                    {t.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{t.description}</p>}
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${
                    t.status === 'completed' ? 'bg-teal-50 text-teal-700' :
                    t.status === 'in-progress' ? 'bg-yellow-50 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {t.status === 'completed' ? 'Done' : t.status === 'in-progress' ? 'In progress' : 'Pending'}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/volunteer/event-support/${t._id}`)}
                  className="text-[#5b52f6] text-xs font-semibold hover:underline"
                >
                  📅 {t.event?.title || '—'}
                </button>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                  <div>
                    <span className="text-xs text-indigo-600 font-mono block">{fmtDateTime(t.startTime || t.dueDate || t.event?.date)}</span>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="font-semibold text-emerald-600 text-sm">₹{t.salary || 0}</span>
                      {t.status === 'completed' ? (
                        t.paymentStatus === 'approved' ? (
                          <span className="text-[10px] font-semibold text-emerald-600">✓ Paid</span>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-600">⏳ Pending</span>
                        )
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/volunteer/event-support/${t._id}`)}
                      className="px-2.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 border border-purple-200/60 shadow-2xs cursor-pointer"
                      title="Chat with Admin"
                    >
                      <MessageSquare size={13} />
                      <span>Chat</span>
                    </button>
                    {t.status !== 'completed' && (
                      <button
                        onClick={() => {
                          if (t.status === 'pending') {
                            handleUpdateTaskStatus(t._id, 'in-progress');
                          } else {
                            setCompletingTask(t);
                          }
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 font-medium text-xs rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {t.status === 'pending' ? 'Start' : 'Complete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block glass-panel rounded-2xl shadow-premium overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-4 px-6 font-semibold text-xs text-gray-400 uppercase tracking-wider">Task</th>
                    <th className="py-4 px-6 font-semibold text-xs text-gray-400 uppercase tracking-wider">Event</th>
                    <th className="py-4 px-6 font-semibold text-xs text-gray-400 uppercase tracking-wider">Date &amp; Time</th>
                    <th className="py-4 px-6 font-semibold text-xs text-gray-400 uppercase tracking-wider">Salary &amp; Payment</th>
                    <th className="py-4 px-6 font-semibold text-xs text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedTasks.map(t => (
                  <tr key={t._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-5 px-6">
                      <p className="font-semibold text-gray-900">{t.taskName}</p>
                      <p className="text-sm text-gray-500">{t.description}</p>
                    </td>
                    <td className="py-5 px-6">
                      <button 
                        onClick={() => navigate(`/volunteer/event-support/${t._id}`)}
                        className="text-[#5b52f6] hover:text-[#4a42d4] hover:underline transition-colors text-left font-semibold"
                      >
                        {t.event?.title || '—'}
                      </button>
                    </td>
                    <td className="py-5 px-6 text-gray-600 font-mono text-sm">
                      <span className="text-xs font-semibold text-indigo-600">
                        {fmtDateTime(t.startTime || t.dueDate || t.event?.date)}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-emerald-600">₹{t.salary || 0}</span>
                        {t.status === 'completed' ? (
                          t.paymentStatus === 'approved' ? (
                            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">✓ Payment Approved</span>
                          ) : (
                            <span className="text-xs font-medium text-amber-600 flex items-center gap-1 mt-0.5">⏳ Awaiting Approval</span>
                          )
                        ) : (
                          <span className="text-xs text-gray-400 mt-0.5">Upon completion</span>
                        )}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        t.status === 'completed' ? 'bg-teal-50 text-teal-700' :
                        t.status === 'in-progress' ? 'bg-yellow-50 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {t.status === 'completed' ? 'Completed' : t.status === 'in-progress' ? 'In progress' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/volunteer/event-support/${t._id}`)}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium text-xs rounded-lg border border-purple-200/60 shadow-2xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                          title="Chat with Admin"
                        >
                          <MessageSquare size={14} />
                          <span>Chat</span>
                        </button>
                        {t.status !== 'completed' && (
                          <button
                            onClick={() => {
                              if (t.status === 'pending') {
                                handleUpdateTaskStatus(t._id, 'in-progress');
                              } else {
                                setCompletingTask(t);
                              }
                            }}
                            className="px-4 py-1.5 bg-blue-50 text-blue-700 font-medium text-sm rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            {t.status === 'pending' ? 'Start task' : 'Complete task'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedRulesTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                Rules &amp; Regulations
              </h3>
              <button
                onClick={() => setSelectedRulesTask(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {selectedRulesTask.event?.rules && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wider">
                    Event Rules ({selectedRulesTask.event.title})
                  </h4>
                  <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700 whitespace-pre-line">
                    {selectedRulesTask.event.rules}
                  </div>
                </div>
              )}
              {selectedRulesTask.rules ? (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wider">
                    Task Instructions ({selectedRulesTask.taskName})
                  </h4>
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 whitespace-pre-line">
                    {selectedRulesTask.rules}
                  </div>
                </div>
              ) : (
                !selectedRulesTask.event?.rules && (
                  <p className="text-gray-500 italic text-center py-4">No specific rules or instructions provided for this task.</p>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {completingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Complete Task</h3>
              <button
                onClick={() => { setCompletingTask(null); setTaskPhoto(''); }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Please upload a photo of your completed work (Required).</p>
              <div className="mb-6">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setTaskPhoto(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }} 
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {taskPhoto && (
                  <div className="mt-4 rounded-xl overflow-hidden border border-gray-200">
                    <img src={taskPhoto} alt="Task proof" className="w-full h-48 object-cover" />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3">
                <button 
                  onClick={() => { setCompletingTask(null); setTaskPhoto(''); }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    handleUpdateTaskStatus(completingTask._id, 'completed', taskPhoto);
                    setCompletingTask(null);
                    setTaskPhoto('');
                  }}
                  disabled={!taskPhoto}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#5b52f6] hover:bg-[#4a42d4] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
    );
  };

  const renderAttendance = () => (
    <div className="max-w-5xl mx-auto animate-fade-in pb-12">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-3 tracking-tight">Attendance & points</h1>
        <p className="text-gray-500 text-lg max-w-2xl">Your contribution record, checked in and accounted for.</p>
      </div>

      {/* Points & Present Days */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 max-w-2xl">
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 rounded-3xl p-8 shadow-xl shadow-indigo-200 transform hover:-translate-y-1 transition-all duration-300">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-indigo-300 opacity-20 rounded-full blur-xl"></div>
          <div className="flex items-center justify-between relative z-10 mb-4">
            <span className="text-sm font-bold text-indigo-100 tracking-widest uppercase">Total Points</span>
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Award size={20} className="text-white" />
            </div>
          </div>
          <span className="text-5xl font-black text-white relative z-10">{attendance?.points || 0}</span>
          <div className="mt-3 relative z-10 flex items-center justify-between text-xs text-indigo-100/90 font-medium pt-2 border-t border-white/15">
            <span>Certificate Goal:</span>
            <span className="font-bold">{attendance?.points >= 500 ? '✓ 500 pts achieved!' : `${attendance?.points || 0} / 500 pts`}</span>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-8 shadow-premium flex flex-col justify-between transform hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-400 tracking-widest uppercase">Present Days</span>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <CalendarDays size={20} className="text-blue-600" />
            </div>
          </div>
          <span className="text-5xl font-black text-gray-900">{attendance?.records?.filter(r => r.status === 'present').length || 0}</span>
        </div>
      </div>

      <div className="glass-panel rounded-3xl shadow-premium overflow-hidden">
        <div className="bg-gray-50/50 px-6 py-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Attendance History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="py-4 px-6 font-bold text-xs text-gray-400 uppercase tracking-widest">Event / Task</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-400 uppercase tracking-widest">Status</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-400 uppercase tracking-widest">Check-in</th>
                <th className="py-4 px-6 font-bold text-xs text-gray-400 uppercase tracking-widest">Check-out</th>
                <th className="py-4 px-6 text-right font-bold text-xs text-gray-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(!attendance?.records || attendance.records.length === 0) ? (
                <tr>
                  <td colSpan="5" className="py-16">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-3xl">📅</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No attendance records yet</h3>
                      <p className="text-gray-500">Start attending events to build your record!</p>
                    </div>
                  </td>
                </tr>
              ) : [...attendance.records].sort((a, b) => {
                const isDoneA = (a.status === 'absent' || (a.status === 'present' && a.checkOut)) ? 1 : 0;
                const isDoneB = (b.status === 'absent' || (b.status === 'present' && b.checkOut)) ? 1 : 0;
                if (isDoneA !== isDoneB) return isDoneA - isDoneB;
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
              }).map(r => (
                <tr key={r._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="py-5 px-6">
                    <p className="font-bold text-gray-900">{r.task?.taskName || r.event?.title || '—'}</p>
                    {r.task?.taskName && r.event?.title && (
                      <p className="text-xs text-indigo-600 font-medium mt-0.5">{r.event.title}</p>
                    )}
                  </td>
                  <td className="py-5 px-6">
                    {r.status === 'present' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <CheckCircle2 size={14} className="text-emerald-500" /> Present
                      </span>
                    ) : r.status === 'absent' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                        <X size={14} className="text-rose-500" /> Absent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                        <Clock size={14} className="text-amber-500" /> Pending
                      </span>
                    )}
                  </td>
                  <td className="py-5 px-6 text-gray-600 font-mono text-sm font-medium">{fmtDateTime(r.checkIn)}</td>
                  <td className="py-5 px-6 text-gray-600 font-mono text-sm font-medium">{fmtDateTime(r.checkOut)}</td>
                  <td className="py-5 px-6 text-right">
                    {r.status === 'pending' ? (
                      <button
                        onClick={() => handleToggleAttendance(r._id)}
                        className="px-5 py-2 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-200 transition-all active:scale-95"
                      >
                        Check In
                      </button>
                    ) : r.status === 'present' && !r.checkOut ? (
                      <button
                        onClick={() => handleToggleAttendance(r._id)}
                        className="px-5 py-2 bg-white border-2 border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-95"
                      >
                        Check Out
                      </button>
                    ) : r.status === 'absent' ? (
                      <span className="text-rose-500 font-semibold text-sm px-4">Absent</span>
                    ) : (
                      <span className="text-emerald-600 font-semibold text-sm px-4">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCertificates = () => {
    const volunteerPoints = certMeta.points || overview?.crewPoints || attendance?.points || 0;
    const isEligible = volunteerPoints >= 500;
    const progressPct = Math.min(100, Math.round((volunteerPoints / 500) * 100));

    return (
      <div className="max-w-5xl mx-auto animate-fade-in pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-gray-900 mb-1">Certificates</h1>
          <p className="text-gray-500 text-lg">Formal recognition for moments you helped make possible.</p>
        </div>

        {/* 500 Points Qualification Progress Card */}
        <div className={`mb-8 p-6 rounded-3xl border transition-all duration-300 ${
          isEligible 
            ? 'glass-panel bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-indigo-500/10 border-emerald-300/60 shadow-premium' 
            : 'glass-panel border-white/60 shadow-premium'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-2xl">🏆</span>
                <h2 className="text-lg font-bold text-gray-900">Certificate Qualification Status</h2>
                {isEligible ? (
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    ✓ Eligible (500+ Pts)
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
                    Locked ({500 - volunteerPoints} pts needed)
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 max-w-2xl leading-relaxed">
                {isEligible 
                  ? "🎉 Outstanding job! You have obtained 500+ crew points. You are fully qualified to receive formal event completion certificates issued by the admin." 
                  : "Volunteers must obtain 500 points to unlock certificates. Earn +40 points per event check-in and +60 points per completed task."}
              </p>
            </div>
            <div className="text-left md:text-right bg-gray-50/80 md:bg-transparent p-3 md:p-0 rounded-2xl">
              <span className="text-3xl font-black text-gray-900">{volunteerPoints}</span>
              <span className="text-sm font-semibold text-gray-400"> / 500 pts</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden p-0.5">
            <div 
              className={`h-full transition-all duration-500 rounded-full ${
                isEligible 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 font-medium mt-2">
            <span>0 pts</span>
            <span>250 pts</span>
            <span className="font-bold text-gray-700">500 pts (Certificate Unlock)</span>
          </div>
        </div>

        {certificates.length === 0 ? (
          <div className="glass-panel rounded-3xl shadow-premium p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🎓</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {isEligible ? "Your Certificate is Ready!" : "Certificates Locked"}
              </h3>
              <p className="text-gray-500 max-w-md mb-6">
                {isEligible
                  ? "Outstanding achievement! You have reached 500+ points and qualified for your Certificate of Appreciation. Click below to generate your official credential."
                  : "You need 500 points before a certificate can be generated. Complete tasks and attend events to reach 500 points!"}
              </p>
              {isEligible && (
                <button
                  onClick={handleClaimCertificate}
                  disabled={claimingCert}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                >
                  <Award size={18} />
                  <span>{claimingCert ? 'Generating Certificate...' : 'Claim & Generate Certificate'}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-3xl shadow-premium overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">My Issued Certificates</h3>
                <p className="text-xs text-gray-500">Official recognized credentials awarded for volunteer service.</p>
              </div>
              {isEligible && (
                <button
                  onClick={handleClaimCertificate}
                  disabled={claimingCert}
                  className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
                >
                  <Award size={14} />
                  <span>{claimingCert ? 'Generating...' : 'Refresh / Check New Certs'}</span>
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-4 px-6 font-semibold text-xs text-gray-400 uppercase tracking-wider">Certificate ID</th>
                    <th className="py-4 px-6 font-semibold text-xs text-gray-400 uppercase tracking-wider">Event</th>
                    <th className="py-4 px-6 font-semibold text-xs text-gray-400 uppercase tracking-wider">Issued Date</th>
                    <th className="py-4 px-6 font-semibold text-xs text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {certificates.map(c => (
                    <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-5 px-6 font-mono text-[#5b52f6] font-bold">{c.certificateId}</td>
                      <td className="py-5 px-6 text-gray-700 font-medium">{c.event?.title || '—'}</td>
                      <td className="py-5 px-6 text-gray-500">{fmtDate(c.issuedDate)}</td>
                      <td className="py-5 px-6">
                        {c.status === 'approved' ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-full border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 size={12} /> Approved
                          </span>
                        ) : c.status === 'rejected' ? (
                          <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-semibold text-xs rounded-full border border-rose-200 inline-flex items-center gap-1">
                            <X size={12} /> Not Approved
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-semibold text-xs rounded-full border border-amber-200 inline-flex items-center gap-1" title="Awaiting Admin Approval">
                            <Clock size={12} /> Awaiting Approval
                          </span>
                        )}
                      </td>
                      <td className="py-5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => openCertificate(c, false)}
                            className="px-3.5 py-1.5 bg-gray-100 text-gray-700 font-semibold text-xs rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
                          >
                            View
                          </button>
                          {c.status === 'approved' ? (
                            <button 
                              onClick={() => openCertificate(c, true)}
                              className="px-4 py-1.5 bg-indigo-600 text-white font-semibold text-xs rounded-lg hover:bg-indigo-700 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Download size={14} />
                              <span>Download</span>
                            </button>
                          ) : (
                            <button 
                              disabled
                              className="px-3.5 py-1.5 bg-gray-100 text-gray-400 font-medium text-xs rounded-lg cursor-not-allowed flex items-center gap-1.5"
                              title="Certificate will be downloadable once approved by admin"
                            >
                              <Lock size={12} />
                              <span>Pending</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const openApplyModal = (event, prefillRole = 'Stage Management') => {
    setSelectedEventForApply(event);
    setApplyForm({
      taskName: prefillRole,
      customTask: '',
      salary: 400,
      note: ''
    });
    setShowApplyModal(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    const finalTaskName = applyForm.taskName === 'Custom' ? applyForm.customTask : applyForm.taskName;
    if (!finalTaskName || !finalTaskName.trim()) {
      showToast('Please specify a task name.');
      return;
    }
    if (Number(applyForm.salary) < 200) {
      showToast('Salary must be at least ₹200.');
      return;
    }

    try {
      setSubmittingApply(true);
      // Optimistic update so event card immediately shows Pending Approval
      setEventsList(prev => prev.map(ev => {
        if (ev._id === selectedEventForApply._id) {
          const newTask = {
            _id: 'temp_' + Date.now(),
            taskName: finalTaskName.trim(),
            salary: Number(applyForm.salary),
            applicationStatus: 'pending'
          };
          return { ...ev, myTasks: [...(ev.myTasks || []), newTask] };
        }
        return ev;
      }));

      await axios.post(`${API}/apply-task`, {
        eventId: selectedEventForApply._id,
        taskName: finalTaskName.trim(),
        salary: Number(applyForm.salary),
        note: applyForm.note
      }, { headers });

      showToast('Task application submitted! Admin notified for quick review.');
      setShowApplyModal(false);
      fetchEventsWithStatus();
      fetchOverview();
    } catch (err) {
      showToast(err.response?.data?.message || 'Error submitting application');
      fetchEventsWithStatus();
    } finally {
      setSubmittingApply(false);
    }
  };

  const renderEvents = () => {
    const filteredEvents = eventsList.filter(ev => {
      const matchSearch = !eventSearch || 
        ev.title?.toLowerCase().includes(eventSearch.toLowerCase()) ||
        ev.location?.toLowerCase().includes(eventSearch.toLowerCase()) ||
        ev.description?.toLowerCase().includes(eventSearch.toLowerCase());
      const matchCategory = categoryFilter === 'All' || ev.category?.toLowerCase() === categoryFilter.toLowerCase();
      return matchSearch && matchCategory;
    });

    const categories = ['All', 'General', 'Conference', 'Concert', 'Festival', 'Sports', 'Charity', 'Exhibition'];

    return (
      <div className="max-w-6xl mx-auto animate-fade-in pb-12">
        {/* Page Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-accent font-semibold text-xs tracking-wider uppercase mb-1">
              <CalendarDays size={16} /> Volunteer Opportunities
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Available Events & Tasks</h1>
            <p className="text-gray-600 text-sm sm:text-base mt-1">Explore upcoming events, apply for specific volunteer roles, and earn compensation and crew points.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-purple-100 text-purple-700 font-bold px-3 py-1.5 rounded-xl border border-purple-200">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'Event' : 'Events'} Available
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-panel p-4 rounded-2xl mb-8 border border-white/60 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by title, venue, or keyword..."
              value={eventSearch}
              onChange={(e) => setEventSearch(e.target.value)}
              className="w-full bg-white/80 border border-gray-200 text-sm text-gray-800 rounded-xl py-2 pl-10 pr-4 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
            />
          </div>
          <div 
            className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === cat 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'bg-white/60 hover:bg-white text-gray-600 border border-gray-200/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Events Grid */}
        {loadingEvents && eventsList.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-3"></div>
            <p className="text-gray-500 text-sm">Loading available events...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center border border-white/60 shadow-sm">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CalendarDays size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">No Events Found</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              {eventSearch || categoryFilter !== 'All' 
                ? 'No events matched your current search or category filter. Try clearing filters.' 
                : 'There are no active approved events at the moment. Please check back soon!'}
            </p>
            {(eventSearch || categoryFilter !== 'All') && (
              <button 
                onClick={() => { setEventSearch(''); setCategoryFilter('All'); }}
                className="mt-4 px-4 py-2 bg-purple-100 text-purple-700 font-semibold text-xs rounded-xl hover:bg-purple-200 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map(ev => {
              const myTasks = ev.myTasks || [];
              const pendingApp = myTasks.find(t => t.applicationStatus === 'pending');
              const approvedTasks = myTasks.filter(t => t.applicationStatus === 'approved');

              return (
                <div 
                  key={ev._id}
                  className="glass-panel rounded-3xl overflow-hidden border border-white/70 shadow-premium flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div>
                    {/* Event Banner / Image */}
                    <div className="h-44 w-full relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500">
                      {ev.imageUrl ? (
                        <img 
                          src={ev.imageUrl} 
                          alt={ev.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-white">
                          <CalendarDays size={40} className="mb-2 opacity-80" />
                          <span className="font-bold text-sm text-center px-4 line-clamp-2">{ev.title}</span>
                        </div>
                      )}
                      {/* Category Badge */}
                      <span className="absolute top-3.5 left-3.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {ev.category || 'General'}
                      </span>
                      {/* Price indicator */}
                      <span className="absolute bottom-3.5 right-3.5 bg-white/95 backdrop-blur-md text-purple-700 text-xs font-extrabold px-3 py-1 rounded-xl shadow-xs">
                        ₹{ev.price > 0 ? ev.price : 'Free Entry'}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="p-5">
                      <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2 line-clamp-1">
                        {ev.title}
                      </h3>

                      {/* Meta Details */}
                      <div className="space-y-1.5 text-xs text-gray-600 mb-4">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-purple-600 shrink-0" />
                          <span>{fmtDateTime(ev.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-purple-600 font-bold shrink-0">📍</span>
                          <span className="line-clamp-1">{ev.location}</span>
                        </div>
                        {ev.capacity && (
                          <div className="flex items-center gap-2">
                            <User size={14} className="text-purple-600 shrink-0" />
                            <span>{ev.capacity} Attendee Capacity</span>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-gray-500 text-xs line-clamp-2 mb-3 leading-relaxed">
                        {ev.description}
                      </p>

                      {/* Rules & Regulations of this Event */}
                      <div className="mb-4 p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl">
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[10.5px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                            <ShieldAlert size={13} className="text-amber-600 shrink-0" /> Rules &amp; Regulations
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedRulesEvent(ev)}
                            className="text-[10px] font-bold text-amber-700 hover:text-amber-900 underline cursor-pointer shrink-0"
                          >
                            Full View
                          </button>
                        </div>
                        <p className="text-xs text-amber-950/90 font-medium leading-relaxed line-clamp-2 whitespace-pre-line">
                          {ev.rules || 'Follow venue guidelines, wear volunteer badge, maintain punctuality, and coordinate directly with event supervisors.'}
                        </p>
                      </div>

                      {/* Available Roles to Apply */}
                      <div className="mb-4">
                        <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">Select Role to Apply:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            'Stage Management', 
                            'Registration & Check-in', 
                            'Guest Coordination', 
                            'Crowd Management', 
                            'Technical Support', 
                            'Food & Catering'
                          ].map((role) => {
                            const isAssigned = myTasks.some(t => t.taskName === role && t.applicationStatus === 'approved');
                            const isPending = myTasks.some(t => t.taskName === role && t.applicationStatus === 'pending');
                            return (
                              <button
                                key={role}
                                type="button"
                                onClick={() => openApplyModal(ev, role)}
                                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                                  isAssigned
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : isPending
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-indigo-50/90 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 hover:scale-102 shadow-2xs'
                                }`}
                                title={`Click to apply for ${role}`}
                              >
                                <span>{isAssigned ? '✓' : isPending ? '⏳' : '+'}</span>
                                <span>{role}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Applied / Assigned Tasks Status Badges */}
                      {myTasks.length > 0 && (
                        <div className="space-y-1.5 mb-4 p-3 bg-purple-50/70 border border-purple-100 rounded-2xl">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-purple-900">Your Status for this Event:</p>
                          {myTasks.map(t => (
                            <div key={t._id} className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-gray-800 line-clamp-1">
                                {t.taskName}
                              </span>
                              {t.applicationStatus === 'pending' ? (
                                <span className="bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5 rounded-md shrink-0">
                                  ⏳ Pending Approval
                                </span>
                              ) : t.applicationStatus === 'approved' ? (
                                <span className="bg-emerald-100 text-emerald-800 font-bold text-[10px] px-2 py-0.5 rounded-md shrink-0">
                                  ✅ Assigned (₹{t.salary})
                                </span>
                              ) : (
                                <span className="bg-red-100 text-red-800 font-bold text-[10px] px-2 py-0.5 rounded-md shrink-0">
                                  ✕ Not Selected
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer / Action */}
                  <div className="p-5 pt-0 border-t border-gray-100/60 mt-auto flex items-center gap-2">
                    {approvedTasks.length > 0 ? (
                      <button
                        onClick={() => setActiveTab('tasks')}
                        className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ClipboardList size={15} />
                        <span>View Assigned Task ({approvedTasks[0].taskName})</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => openApplyModal(ev)}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                      >
                        <span>{pendingApp ? 'Apply for Another Task' : 'Apply for Event Task'}</span>
                        <span>→</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* APPLY FOR TASK MODAL */}
        {showApplyModal && selectedEventForApply && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="glass-panel bg-white/95 max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/80 relative my-8 animate-scale-up">
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
                <div>
                  <span className="text-purple-600 text-xs font-bold uppercase tracking-wider">Volunteer Task Application</span>
                  <h2 className="text-xl font-bold text-gray-900 line-clamp-1">{selectedEventForApply.title}</h2>
                </div>
                <button 
                  onClick={() => setShowApplyModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleApplySubmit} className="space-y-4">
                {/* Event Rules & Regulations inside Apply Modal */}
                <div className="p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 uppercase tracking-wider mb-1">
                    <ShieldAlert size={14} className="text-amber-600 shrink-0" />
                    <span>Event Rules &amp; Regulations:</span>
                  </div>
                  <p className="text-xs text-amber-950 font-medium leading-relaxed whitespace-pre-line">
                    {selectedEventForApply.rules || 'Volunteers must check in punctually, wear volunteer ID badge, maintain decorum, and follow venue safety instructions.'}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Select Event Role / Task *
                  </label>
                  <select
                    value={applyForm.taskName}
                    onChange={(e) => setApplyForm({ ...applyForm, taskName: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-purple-200 outline-none"
                    required
                  >
                    <option value="Stage Management">Stage Management & Coordination</option>
                    <option value="Registration & Check-in">Registration & Attendee Check-in</option>
                    <option value="Guest Coordination">Guest Coordination & Hospitality</option>
                    <option value="Crowd Management">Crowd Management & Ushering</option>
                    <option value="Technical / AV Support">Technical, Sound & Lighting Support</option>
                    <option value="Decoration & Venue Setup">Decoration & Venue Setup</option>
                    <option value="Refreshment Management">Food & Refreshment Distribution</option>
                    <option value="Videography Volunteer">Photography & Videography</option>
                    <option value="Custom">Other (Custom Task)</option>
                  </select>
                </div>

                {applyForm.taskName === 'Custom' && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                      Specify Custom Task Name *
                    </label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. Social Media Coverage or DJ Assistant"
                      value={applyForm.customTask}
                      onChange={(e) => setApplyForm({ ...applyForm, customTask: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-purple-200 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Requested Compensation / Salary (₹) *
                  </label>
                  <input 
                    type="number"
                    min="200"
                    step="50"
                    required
                    value={applyForm.salary}
                    onChange={(e) => setApplyForm({ ...applyForm, salary: e.target.value })}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-purple-200 outline-none"
                    placeholder="Minimum ₹200"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Minimum statutory rate is ₹200 per completed task.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Experience or Application Note (Optional)
                  </label>
                  <textarea 
                    rows="3"
                    value={applyForm.note}
                    onChange={(e) => setApplyForm({ ...applyForm, note: e.target.value })}
                    placeholder="Mention any relevant experience or availability for this event..."
                    className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 focus:ring-2 focus:ring-purple-200 outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingApply}
                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submittingApply ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EVENT RULES & REGULATIONS MODAL */}
        {selectedRulesEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="glass-panel bg-white/95 max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/80 relative my-8 animate-scale-up">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <span className="text-amber-700 text-[10px] font-bold uppercase tracking-wider">Guidelines &amp; Code of Conduct</span>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-1">{selectedRulesEvent.title}</h2>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRulesEvent(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ScrollText size={14} className="text-amber-700" />
                    <span>Official Event Rules</span>
                  </h4>
                  <div className="text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-line font-medium">
                    {selectedRulesEvent.rules ? selectedRulesEvent.rules : (
                      '1. Punctuality is strictly required. Check in with your lead 30 minutes prior to event opening.\n2. Carry your volunteer badge and wear clean professional attire.\n3. Maintain decorum and courteous communication with attendees and guests.\n4. Follow all safety protocols and report issues directly to the admin coordinator.'
                    )}
                  </div>
                </div>

                {/* Event Summary Details */}
                <div className="p-3.5 bg-gray-50/90 border border-gray-100 rounded-2xl text-xs space-y-1.5 text-gray-600">
                  <div><strong>Venue / Location:</strong> {selectedRulesEvent.location}</div>
                  <div><strong>Date &amp; Time:</strong> {fmtDateTime(selectedRulesEvent.date)}</div>
                  {selectedRulesEvent.capacity && <div><strong>Attendee Capacity:</strong> {selectedRulesEvent.capacity} Attendees</div>}
                  <div><strong>Category:</strong> {selectedRulesEvent.category || 'General'}</div>
                </div>

                <div className="pt-2 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedRulesEvent(null)}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ev = selectedRulesEvent;
                      setSelectedRulesEvent(null);
                      openApplyModal(ev);
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Apply for this Event →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'events': return renderEvents();
      case 'overview': return renderOverview();
      case 'profile': return renderProfile();
      case 'tasks': return renderTasks();
      case 'attendance': return renderAttendance();
      case 'certificates': return renderCertificates();
      default: return renderEvents();
    }
  };

  // ══════════════════════════════════════════
  // MAIN LAYOUT
  // ══════════════════════════════════════════

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5b52f6]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-transparent overflow-x-hidden">
      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/65 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar (drawer on mobile, fixed on desktop) */}
      <div className={`fixed inset-y-0 left-0 z-50 w-[270px] bg-[#0b132c] text-gray-300 flex flex-col transform transition-transform duration-300 ease-in-out md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Logo and close button */}
        <div className="px-6 py-6 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/')}>
            <img 
              src="/crewlink_logo_transparent.png" 
              alt="CrewLink Logo" 
              className="h-8 w-auto transform group-hover:scale-105 transition-all duration-300 drop-shadow-md" 
            />
            <span className="text-2xl font-bold text-white tracking-tight">CrewLink</span>
          </div>
          <button 
            onClick={() => setMobileMenuOpen(false)} 
            className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <div className="px-4 mt-2">
          <p className="px-4 text-[11px] font-bold tracking-widest text-gray-500 mb-3 uppercase">Volunteer Space</p>
          <nav className="space-y-1.5">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all ${
                  activeTab === id ? 'bg-[#1c2744] text-white font-semibold' : 'hover:bg-[#15203b] hover:text-white'
                }`}
              >
                <Icon size={20} className={activeTab === id ? 'text-purple-400' : 'text-gray-400'} />
                <span className="font-medium text-sm">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Account */}
        <div className="px-4 mt-auto mb-6">
          <p className="px-4 text-[11px] font-bold tracking-widest text-gray-500 mb-3 uppercase">Account</p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all hover:bg-[#15203b] hover:text-white text-gray-300"
          >
            <LogOut size={20} className="text-gray-400" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 md:ml-[260px] ml-0 flex flex-col min-h-screen w-full max-w-full bg-transparent overflow-x-hidden">
        {/* Mobile Header (visible only on < md) */}
        <header className="md:hidden sticky top-0 z-30 glass-panel border-b border-gray-200/50 backdrop-blur-md px-4 py-3 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-2.5">
            <button 
              onClick={() => setMobileMenuOpen(true)} 
              className="p-1.5 -ml-1 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-100/60 focus:outline-none"
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <img 
                src="/crewlink_logo_transparent.png" 
                alt="CrewLink Logo" 
                className="h-7 w-auto drop-shadow-xs" 
              />
              <span className="font-bold text-lg text-accent tracking-tight">CrewLink</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200">
              Volunteer
            </span>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="p-1.5 text-gray-700 hover:text-gray-900 relative rounded-lg hover:bg-gray-100/60"
                aria-label="Notifications"
              >
                <Bell size={19} />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 bg-white text-gray-900 rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                  <div className="p-3.5 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                    <div className="flex gap-2 items-center">
                      <button 
                        onClick={() => {
                          const sampleTask = tasks[0] || { _id: '6aaa7a22e97a11cdc7c335c7', taskName: 'Crowd Management' };
                          const testMsg = 'New message from Admin regarding task "' + (sampleTask.taskName || 'Crowd Management') + '": "Please report to the main gate for briefing"';
                          showNotification({
                            title: 'CrewLink • Admin',
                            message: testMsg,
                            time: 'now',
                            onClick: () => {
                              handleNotificationClick({
                                type: 'chat_message',
                                message: testMsg,
                                taskId: sampleTask._id,
                                link: `/volunteer/event-support/${sampleTask._id}`
                              });
                            }
                          });
                        }}
                        className="text-[11px] font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded transition-colors"
                      >
                        Test
                      </button>
                      {unreadCount > 0 && (
                        <button onClick={markAllNotificationsAsRead} className="text-xs text-blue-600 hover:text-blue-700">Mark read</button>
                      )}
                      {notifications.length > 0 && (
                        <button onClick={clearAllNotifications} className="text-xs text-red-600 hover:text-red-700">Clear</button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-xs">No notifications yet.</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50/70' : ''}`}
                        >
                          <p className="text-xs text-gray-900 font-medium">{n.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex h-20 glass-panel border-b border-gray-200/50 backdrop-blur-md items-center justify-between px-8 sticky top-0 z-10">
          <div className="relative w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search CrewLink"
              className="w-full bg-white/75 border border-gray-200/60 text-sm text-gray-800 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all"
            />
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-gray-500 hover:text-gray-700 transition-colors relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <div className="flex gap-2 items-center">
                      <button 
                        onClick={() => {
                          const sampleTask = tasks[0] || { _id: '6aaa7a22e97a11cdc7c335c7', taskName: 'Crowd Management' };
                          const testMsg = 'New message from Admin regarding task "' + (sampleTask.taskName || 'Crowd Management') + '": "Please report to the main gate for briefing"';
                          showNotification({
                            title: 'CrewLink • Admin',
                            message: testMsg,
                            time: 'now',
                            onClick: () => {
                              handleNotificationClick({
                                type: 'chat_message',
                                message: testMsg,
                                taskId: sampleTask._id,
                                link: `/volunteer/event-support/${sampleTask._id}`
                              });
                            }
                          });
                        }}
                        className="text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-md transition-colors"
                      >
                        Test Banner
                      </button>
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllNotificationsAsRead} 
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Mark all as read
                        </button>
                      )}
                      {notifications.length > 0 && (
                        <button 
                          onClick={clearAllNotifications} 
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">No notifications yet.</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="mt-0.5">
                              {n.type === 'chat_message' ? (
                                <MessageSquare size={16} className={n.read ? 'text-gray-400' : 'text-blue-600'} />
                              ) : (
                                <Bell size={16} className={n.read ? 'text-gray-400' : 'text-blue-600'} />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{n.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-3 sm:p-6 md:p-8 pb-28 md:pb-8 overflow-x-hidden w-full min-w-0">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar for Volunteers */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 glass-panel border-t border-gray-200/60 backdrop-blur-md flex items-center justify-around py-1.5 px-1 z-30 shadow-lg" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}>
        {navItems.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all flex-1 max-w-[72px] ${
                isActive ? 'text-accent font-bold scale-105' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-purple-100' : ''}`}>
                <Icon size={18} className={isActive ? 'text-accent' : 'text-gray-500'} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 truncate w-full text-center">
                {label.replace('My ', '')}
              </span>
            </button>
          );
        })}
      </nav>

      {/* CERTIFICATE PREVIEW & DOWNLOAD MODAL */}
      {selectedCert && (
        <div className="modal-backdrop certificate-no-print" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 md:p-8 max-h-[96vh] overflow-y-auto shadow-2xl relative">
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100 certificate-no-print">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Official Certificate of Appreciation</h3>
                  <p className="text-xs text-gray-400 font-mono">ID: {selectedCert.certificateId}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {selectedCert.status === 'approved' ? (
                  <button
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm rounded-xl hover:shadow-lg hover:shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
                  >
                    <Download size={16} />
                    <span>Download / Print PDF</span>
                  </button>
                ) : (
                  <span className="px-3.5 py-2 bg-amber-50 text-amber-700 font-semibold text-xs rounded-xl border border-amber-200 flex items-center gap-1.5">
                    <Clock size={14} />
                    <span>Awaiting Admin Approval</span>
                  </span>
                )}
                <button
                  onClick={() => setSelectedCert(null)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {selectedCert.status !== 'approved' && (
              <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2.5 certificate-no-print">
                <Clock size={16} className="text-amber-600 shrink-0" />
                <div>
                  <strong>Pending Admin Approval:</strong> This certificate is awaiting review and verification by the admin. Once approved, the official download will unlock.
                </div>
              </div>
            )}

            {/* Print Area & Certificate Card */}
            <div className="certificate-print-area flex items-center justify-center p-1 sm:p-4">
              <div 
                className="w-full max-w-[820px] bg-[#fffdfa] border-4 sm:border-8 border-double border-[#d4af37] rounded-xl sm:rounded-2xl p-4 sm:p-12 relative text-center shadow-lg overflow-hidden select-none"
                style={{ fontFamily: "'Georgia', serif" }}
              >
                {/* Corner Flourishes */}
                <div className="absolute top-3 left-3 text-[#d4af37] text-xl font-bold">✦</div>
                <div className="absolute top-3 right-3 text-[#d4af37] text-xl font-bold">✦</div>
                <div className="absolute bottom-3 left-3 text-[#d4af37] text-xl font-bold">✦</div>
                <div className="absolute bottom-3 right-3 text-[#d4af37] text-xl font-bold">✦</div>

                {/* Brand Header */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <img 
                    src="/crewlink_logo_transparent.png" 
                    alt="CrewLink Logo" 
                    className="h-6 w-auto" 
                  />
                  <span className="text-xs tracking-[0.3em] font-bold text-gray-600 uppercase font-sans">CREWLINK VOLUNTEER NETWORK</span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-wider text-[#0f172a] uppercase mb-1">
                  Certificate of Appreciation
                </h1>
                <p className="text-xs sm:text-sm font-semibold tracking-widest text-[#b38728] uppercase mb-6 font-sans">
                  ★ 500 CREW POINTS EXCELLENCE MILESTONE ★
                </p>

                <p className="text-xs sm:text-sm text-gray-500 italic mb-2">
                  This honor is proudly presented to
                </p>

                <h2 className="text-2xl sm:text-4xl font-bold text-[#1e293b] border-b-2 border-[#d4af37]/50 pb-2 mb-4 inline-block px-8 max-w-full truncate">
                  {selectedCert.volunteer?.fullName || selectedCert.volunteer?.username || profile?.fullName || user?.fullName || user?.username || 'Honored Volunteer'}
                </h2>

                <p className="text-xs sm:text-sm text-gray-600 max-w-xl mx-auto leading-relaxed mb-6 font-sans">
                  In recognition of extraordinary commitment, exemplary service, and successfully obtaining the prestigious milestone of <strong className="text-gray-900">500+ Crew Points</strong> as an accredited volunteer for:
                </p>

                <div className="inline-block bg-[#faf6ea] border border-[#d4af37]/40 px-6 py-2.5 rounded-xl mb-8 font-sans">
                  <span className="text-base sm:text-lg font-bold text-[#1e293b]">
                    {selectedCert.event?.title || 'CrewLink Community Operations'}
                  </span>
                </div>

                {/* Footer Signatures and Seals */}
                <div className="grid grid-cols-3 items-end pt-6 border-t border-gray-200 mt-4 text-xs font-sans">
                  <div className="text-left">
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Date Issued</p>
                    <p className="font-bold text-gray-800">{fmtDate(selectedCert.issuedDate)}</p>
                    <div className="w-28 h-0.5 bg-gray-300 mt-3 mb-1"></div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Date of Recognition</p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#d4af37] flex flex-col items-center justify-center p-1 bg-amber-50/60 shadow-inner">
                      <span className="text-lg">🏅</span>
                      <span className="text-[8px] font-bold text-[#b38728] tracking-tighter uppercase">500 PTS</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#5b52f6] font-bold mt-1">{selectedCert.certificateId}</span>
                  </div>

                  <div className="text-right">
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${selectedCert.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {selectedCert.status === 'approved' ? '✓ Admin Approved' : '⏳ Verification Pending'}
                    </p>
                    <p className="font-bold text-gray-800 font-serif italic text-sm">
                      {selectedCert.status === 'approved' ? 'CrewLink Operations' : 'Pending Approval'}
                    </p>
                    <div className={`w-28 h-0.5 mt-3 mb-1 ml-auto ${selectedCert.status === 'approved' ? 'bg-emerald-300' : 'bg-amber-300'}`}></div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Executive Director</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerDashboard;
