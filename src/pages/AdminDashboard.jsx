import { useEffect, useMemo, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Award, Bell, CalendarDays, Camera, Check, ClipboardCheck, Grid2X2, LogOut, Menu, Plus, Search, Sparkles, Trash2, UsersRound, X, Edit, MessageSquare, Image as ImageIcon, Download, Printer, Mic, Square, Send, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import VoiceNotePlayer from '../components/VoiceNotePlayer';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { API_BASE, API_URL } from '../services/api';

const emptyEvent = { title: '', description: '', rules: '', date: '', location: '', capacity: '', price: '', imageUrl: '' };
const navItems = [
  ['overview', 'Overview', Grid2X2], ['events', 'Events & approvals', CalendarDays], ['volunteers', 'Volunteers', UsersRound],
  ['tasks', 'Tasks & attendance', ClipboardCheck], ['certificates', 'Certificates', Award],
];

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('overview');
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [pendingVolunteers, setPendingVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const fetchData = async () => {
    try {
      const [eventResponse, userResponse, certResponse, notifResponse] = await Promise.all([
        axios.get(`${API_URL}/events/all`, config).catch(err => { console.error('Events error:', err.message); throw err; }), 
        axios.get(`${API_URL}/users`, config).catch(err => { console.error('Users error:', err.message); throw err; }),
        axios.get(`${API_URL}/admin/certificates`, config).catch(() => ({ data: { certificates: [], pendingVolunteers: [] } })),
        axios.get(`${API_URL}/notifications/admin`, config).catch(() => ({ data: [] }))
      ]);
      setEvents(eventResponse.data); 
      setUsers(userResponse.data);
      setCertificates(certResponse.data.certificates || []);
      setPendingVolunteers(certResponse.data.pendingVolunteers || []);
      setNotifications(notifResponse.data || []);
    } catch (error) { 
      console.error('Error fetching data:', error.message);
      setError('Some workspace data could not be loaded. Check the API connection.'); 
    }
    finally { setLoading(false); }
  };
  
  useEffect(() => { 
    fetchData(); 
    
    let interval;
    if (token) {
      interval = setInterval(async () => {
        try {
          const res = await axios.get(`${API_URL}/notifications/admin`, { headers: { Authorization: `Bearer ${token}` } });
          setNotifications(prev => {
            const latestNew = (res.data || [])[0];
            const latestOld = prev[0];
            
            if (latestNew && (!latestOld || latestNew._id !== latestNew._id)) {
              // Also only show toast if it's unread
              if (!latestNew.read) {
                setToast(latestNew.message);
                setTimeout(() => setToast(''), 6000);
              }
            }
            return res.data || [];
          });
        } catch (e) {}
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [token]);

  const pending = events.filter((event) => event.status === 'pending');
  const volunteers = users.filter((item) => item.role === 'volunteer');
  const visibleEvents = useMemo(() => events.filter((event) => `${event.title} ${event.location}`.toLowerCase().includes(search.toLowerCase())), [events, search]);
  const formatDate = (value) => new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const closeModal = () => { setShowEventModal(false); setEditingEvent(null); setEventForm(emptyEvent); };
  const editEvent = (event) => { setEditingEvent(event); setEventForm({ title: event.title, description: event.description, date: new Date(event.date).toISOString().slice(0, 16), location: event.location, capacity: event.capacity, price: event.price || '', imageUrl: event.imageUrl || '' }); setShowEventModal(true); };
  const saveEvent = async (event) => {
    event.preventDefault();
    try {
      if (editingEvent) await axios.put(`${API_URL}/events/${editingEvent._id}`, eventForm, config);
      else await axios.post(`${API_URL}/events`, eventForm, config);
      await fetchData(); closeModal();
    } catch (requestError) { setError(requestError.response?.data?.message || 'Unable to save this event.'); }
  };
  const updateStatus = async (id, status) => { try { await axios.patch(`${API_URL}/events/${id}/status`, { status }, config); await fetchData(); } catch { setError(`Unable to mark this event ${status}.`); } };
  const deleteEvent = async (id) => { if (!window.confirm('Delete this event?')) return; try { await axios.delete(`${API_URL}/events/${id}`, config); await fetchData(); } catch { setError('Unable to delete this event.'); } };
  const assignVolunteer = async (eventId, volunteerId) => { try { await axios.post(`${API_URL}/events/${eventId}/assign-volunteer`, { volunteerId }, config); await fetchData(); alert('Volunteer assigned successfully!'); } catch (err) { setError('Unable to assign volunteer to this event.'); } };
  
  const updateVolunteerStatus = async (volunteerId, status) => {
    try {
      await axios.put(`${API_URL}/users/${volunteerId}/status`, { status }, config);
    } catch (err) { setError('Unable to update volunteer status.'); }
  };

  const deleteVolunteer = async (volunteerId) => {
    try {
      await axios.delete(`${API_URL}/users/${volunteerId}`, config);
    } catch (err) { setError('Unable to remove volunteer.'); }
  };

  const signOut = () => { logout(); navigate('/'); };
  const markNotificationAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}/read`, {}, config);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  const markAllNotificationsAsRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`, {}, config);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      console.log('Clearing all notifications...');
      const response = await axios.delete(`${API_URL}/notifications/clear-all`, config);
      console.log('Clear response:', response.data);
      setNotifications([]);
      console.log('Notifications cleared successfully');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      console.error('Error response:', error.response);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const copy = { overview: ['Operations, at a glance.', 'A compact command centre for the CrewLink network.'], events: ['Events & approvals', 'Approve the calendar, then keep it moving.'], volunteers: ['Volunteer desk', 'Review readiness, assignments and contribution.'], tasks: ['Tasks & attendance', 'Make responsibilities visible before doors open.'], certificates: ['Certificates', 'Generate a formal record of volunteer contribution.'] }[activeView];

  if (loading) return <div className="admin-loading"><Sparkles size={22} /> Loading your command centre...</div>;
  return <div className="admin-shell">
    {toast && (
      <div style={{ position: 'fixed', top: '24px', right: '24px', zIndex: 9999, background: '#1e293b', color: 'white', padding: '14px 20px', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #334155' }}>
        <Bell size={18} style={{ color: '#60a5fa' }} />
        <span style={{ fontSize: '14px', fontWeight: '500' }}>{toast}</span>
        <button onClick={() => setToast('')} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0', display: 'flex', marginLeft: '8px' }}><X size={16} /></button>
      </div>
    )}
    {mobileMenuOpen && (
      <div className="admin-drawer-backdrop" onClick={() => setMobileMenuOpen(false)} />
    )}
    <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
      <div className="brand-lockup" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="brand-mark"><img src="/crewlink_logo_transparent.png" alt="CrewLink" style={{ height: '32px', width: 'auto' }} /></span>
          <strong>CrewLink</strong>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(false)} 
          className="md:hidden"
          style={{ background: 'none', border: 'none', color: '#b9d0f4', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          aria-label="Close menu"
        >
          <X size={22} />
        </button>
      </div>
      <p className="sidebar-label">ADMIN SPACE</p>
      <nav className="admin-nav">{navItems.map(([id, label, Icon]) => <button key={id} className={`admin-nav-item ${activeView === id ? 'active' : ''}`} onClick={() => { setActiveView(id); setMobileMenuOpen(false); }}><Icon size={19} /><span>{label}</span></button>)}</nav>
      <div className="sidebar-account"><p className="sidebar-label">ACCOUNT</p><button className="admin-nav-item" onClick={signOut}><LogOut size={19} /><span>Logout</span></button></div>
    </aside>
    <main className="admin-main">
      <header className="admin-topbar"><button className="mobile-menu" aria-label="Open menu" onClick={() => setMobileMenuOpen(true)}><Menu size={21} /></button><label className="search-box"><Search size={21} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search CrewLink" /></label><div className="topbar-profile" style={{position: 'relative'}}>
        <button onClick={() => setShowNotifications(!showNotifications)} style={{position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '4px'}}>
          <Bell size={23} />
          {unreadCount > 0 && (
            <span style={{ position: 'absolute', top: 0, right: 0, background: '#ef4444', color: 'white', fontSize: '10px', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {unreadCount}
            </span>
          )}
        </button>
        {showNotifications && (
          <div style={{ position: 'absolute', top: '100%', right: '0', marginTop: '12px', width: '320px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', zIndex: 50, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Notifications</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {unreadCount > 0 && <button onClick={markAllNotificationsAsRead} style={{ fontSize: '12px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all as read</button>}
                {notifications.length > 0 && <button onClick={clearAllNotifications} style={{ fontSize: '12px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Clear all</button>}
              </div>
            </div>
            <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '24px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>No notifications yet.</div>
              ) : (
                notifications.map(n => (
                  <div key={n._id} onClick={() => { 
                    if (!n.read) markNotificationAsRead(n._id); 
                    if (n.link) { 
                      if (n.type === 'chat_message' && n.taskId) {
                        // Switch to tasks view and let TasksView handle opening the chat
                        setActiveView('tasks');
                        // Store the taskId to open chat when TasksView loads
                        sessionStorage.setItem('openChatForTask', n.taskId);
                      } else {
                        setActiveView('tasks');
                      }
                      setShowNotifications(false); 
                    } 
                  }} style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: n.read ? 'white' : '#f8fafc', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ marginTop: '2px', color: n.read ? '#94a3b8' : '#3b82f6' }}>
                      {n.type === 'task_completed' ? <Check size={16} /> : n.type === 'chat_message' ? <MessageSquare size={16} /> : <Bell size={16} />}
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.4' }}>{n.message}</p>
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>{new Date(n.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        <span className="avatar">{user?.username?.[0]?.toUpperCase() || 'D'}</span><span>{user?.username || 'Devika Rao'}</span><button className="logout-icon" onClick={signOut} aria-label="Logout"><LogOut size={21} /></button></div></header>
      <section className="admin-content"><div className="page-heading"><div><h1>{copy[0]}</h1><p>{copy[1]}</p></div>{activeView === 'events' && <button className="primary-action" onClick={() => setShowEventModal(true)}><Plus size={18} /> Create event</button>}</div>{error && <div className="admin-alert">{error}<button onClick={() => setError('')} aria-label="Dismiss"><X size={17} /></button></div>}
        {activeView === 'overview' && <Overview events={events} users={users} pending={pending.length} onVolunteersClick={() => setActiveView('volunteers')} />}
        {activeView === 'events' && <EventsView events={visibleEvents} formatDate={formatDate} onEdit={editEvent} onDelete={deleteEvent} onStatus={updateStatus} />}
        {activeView === 'volunteers' && <VolunteersView volunteers={volunteers} events={events} onAssign={assignVolunteer} onUpdateStatus={updateVolunteerStatus} onViewProfile={setViewingProfile} onDelete={deleteVolunteer} />}
        {activeView === 'tasks' && <TasksView token={token} volunteers={volunteers} events={events} refreshTrigger={notifications[0]?._id} user={user} />}
        {activeView === 'certificates' && <CertificatesView certificates={certificates} pendingVolunteers={pendingVolunteers} onGenerate={fetchData} token={token} />}
      </section>
    </main>
    {/* Admin Mobile Bottom Navigation */}
    <nav className="admin-bottom-nav">
      {navItems.map(([id, label, Icon]) => (
        <button 
          key={id} 
          className={`admin-bottom-item ${activeView === id ? 'active' : ''}`} 
          onClick={() => setActiveView(id)}
        >
          <Icon size={18} />
          <span>{label.split(' ')[0]}</span>
        </button>
      ))}
    </nav>
    {showEventModal && <EventModal form={eventForm} setForm={setEventForm} editing={editingEvent} onClose={closeModal} onSubmit={saveEvent} />}
    {viewingProfile && (
        <div className="modal-backdrop">
          <div className="event-modal" style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>Volunteer Profile: {viewingProfile.fullName || viewingProfile.username}</h2>
              <button onClick={() => setViewingProfile(null)}><X size={20} /></button>
            </div>
            <div className="mt-4 space-y-4 text-sm text-gray-800">
              <div className="flex gap-4 items-center">
                {viewingProfile.photo ? (
                  <img src={viewingProfile.photo} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xl font-bold">
                    {viewingProfile.username?.[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold">{viewingProfile.fullName || viewingProfile.username}</h3>
                  <p className="text-gray-500">{viewingProfile.email} | {viewingProfile.phone || 'No phone'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div><strong>Age:</strong> {viewingProfile.age || 'N/A'}</div>
                <div><strong>Gender:</strong> {viewingProfile.gender || 'N/A'}</div>
                <div><strong>City:</strong> {viewingProfile.city || 'N/A'}</div>
                <div><strong>Address:</strong> {viewingProfile.address || 'N/A'}</div>
                <div><strong>Aadhar No:</strong> {viewingProfile.aadharNo || 'N/A'}</div>
                <div><strong>PAN Card No:</strong> {viewingProfile.panCardNo || 'N/A'}</div>
                <div className="col-span-2"><strong>Blood Group:</strong> {viewingProfile.bloodGroup || 'N/A'}</div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="font-semibold mb-2">Skills & Experience</h4>
                <p><strong>Skills:</strong> {viewingProfile.skills?.length > 0 ? viewingProfile.skills.join(', ') : 'None listed'}</p>
                <p><strong>Languages:</strong> {viewingProfile.languages?.length > 0 ? viewingProfile.languages.join(', ') : 'None listed'}</p>
                <p><strong>Availability:</strong> {viewingProfile.availability?.length > 0 ? viewingProfile.availability.join(', ') : 'None listed'}</p>
                <p><strong>Preferred Events:</strong> {viewingProfile.preferredEventTypes?.length > 0 ? viewingProfile.preferredEventTypes.join(', ') : 'None listed'}</p>
                <p className="mt-2"><strong>Experience Summary:</strong> {viewingProfile.experience || 'No experience summary provided.'}</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h4 className="font-semibold mb-2 text-red-600">Emergency Contact</h4>
                {viewingProfile.emergencyContact && viewingProfile.emergencyContact.name ? (
                  <>
                    <p><strong>Name:</strong> {viewingProfile.emergencyContact.name}</p>
                    <p><strong>Phone:</strong> {viewingProfile.emergencyContact.phone}</p>
                    <p><strong>Relation:</strong> {viewingProfile.emergencyContact.relation}</p>
                  </>
                ) : (
                  <p>No emergency contact provided.</p>
                )}
              </div>
            </div>
            <div className="modal-actions mt-6">
              <button onClick={() => setViewingProfile(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
  </div>;
}

const Overview = ({ events, users, pending, onVolunteersClick }) => <div className="overview-grid"><div className="stats-row"><Stat label="VOLUNTEERS" value={users.filter((item) => item.role === 'volunteer').length || 3} onClick={onVolunteersClick} actionLabel="View volunteers only" /><Stat label="UPCOMING EVENTS" value={events.length} /><Stat label="PENDING APPROVALS" value={pending} /></div><div className="overview-panels"><div className="data-panel"><h2>Event formats</h2>{['Conference', 'Concert', 'Festival', 'Charity'].map((format) => <div className="format-row" key={format}><span>{format}</span><i><b style={{ width: '28%' }} /></i><em>1</em></div>)}</div><div className="data-panel pulse-panel"><div className="donut"><strong>1/3</strong></div><div><h2>Attendance pulse</h2><p>Present, pending and absent records across active events.</p></div></div></div></div>;
const Stat = ({ label, value, onClick, actionLabel }) => <button className={`stat-card ${onClick ? 'stat-card-clickable' : ''}`} onClick={onClick} type="button"><span>{label}</span><strong>{value}</strong>{onClick && <small>{actionLabel}</small>}</button>;

const Status = ({ value }) => <span className={`status status-${value.toLowerCase().replace(' ', '-')}`}>{value}</span>;
const EventsView = ({ events, formatDate, onEdit, onDelete, onStatus }) => (
  <div className="table-panel">
    <div className="table-head">
      <span>EVENT</span>
      <span>DATE</span>
      <span>BUDGET / PRICE</span>
      <span>STATUS</span>
      <span>ACTIONS</span>
    </div>
    {events.length === 0 ? (
      <div className="empty-table-state">No events found.</div>
    ) : (
      events.map((event) => (
        <div className="table-row event-row" key={event._id}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexDirection: 'row' }}>
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.title} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0, border: '1px solid #e2e8f0' }} />
            ) : (
              <div className="avatar" style={{ borderRadius: '8px', flexShrink: 0, width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#64748b', fontWeight: 'bold' }}>{event.title?.[0]?.toUpperCase() || 'E'}</div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <strong>{event.title}</strong>
              <small>{event.subCategory || event.category || 'Cultural'} · {event.location}</small>
            </div>
          </div>
          <span>{formatDate(event.date)}</span>
          <span>₹{event.price || 0} · {event.capacity} cap.</span>
          <Status value={event.status || 'Approved'} />
          <div className="row-actions">
            {event.status === 'pending' && (
              <>
                <button onClick={() => onStatus(event._id, 'approved')}><Check size={15} /> Approve</button>
                <button className="danger" onClick={() => onStatus(event._id, 'rejected')}>Reject</button>
              </>
            )}
            <button onClick={() => onEdit(event)}>Edit</button>
            <button className="danger" onClick={() => onDelete(event._id)}><Trash2 size={15} /></button>
          </div>
        </div>
      ))
    )}
  </div>
);
const VolunteersView = ({ volunteers, events, onAssign, onUpdateStatus, onViewProfile, onDelete }) => {
  return (
    <div className="table-panel">
      <div className="table-head volunteer-table-head" style={{ gridTemplateColumns: '1.5fr 1fr 1.5fr .8fr 1.5fr' }}>
        <span>VOLUNTEER</span>
        <span>EMAIL</span>
        <span>IDENTITY & DETAILS</span>
        <span>STATUS</span>
        <span>ACTIONS</span>
      </div>
      {volunteers.length === 0 ? (
        <div className="empty-table-state">No volunteer accounts found yet.</div>
      ) : (
        volunteers.map((volunteer) => (
          <div className="table-row volunteer-row" key={volunteer._id} style={{ gridTemplateColumns: '1.5fr 1fr 1.5fr .8fr 1.5fr' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexDirection: 'row' }}>
              {volunteer.photo ? (
                 <img src={volunteer.photo} alt={volunteer.username} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                 <div className="avatar" style={{ flexShrink: 0 }}>{volunteer.username?.[0]?.toUpperCase()}</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <strong>{volunteer.fullName || volunteer.username}</strong>
                <small>{volunteer.expertRole || 'Volunteer'}</small>
              </div>
            </div>
            <span>{volunteer.email}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '13px', lineHeight: '1.4' }}>
              {volunteer.city ? (
                <>
                  <span><strong style={{fontSize:'12px',color:'#7690b1'}}>CITY:</strong> {volunteer.city}</span>
                  <span><strong style={{fontSize:'12px',color:'#7690b1'}}>PHONE:</strong> {volunteer.phone}</span>
                  <span><strong style={{fontSize:'12px',color:'#7690b1'}}>SKILLS:</strong> {volunteer.skills?.length || 0}</span>
                </>
              ) : (
                <span style={{color: '#95a5bd'}}>No detailed profile</span>
              )}
            </div>
            
            <select 
              value={volunteer.profileStatus || 'Verified'} 
              onChange={(e) => onUpdateStatus && onUpdateStatus(volunteer._id, e.target.value)}
              className="px-2 py-1 border border-gray-200 rounded text-sm bg-white"
            >
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Rejected">Rejected</option>
            </select>
            
            <div className="row-actions">
              <button onClick={() => onViewProfile && onViewProfile(volunteer)}>Profile</button>
              <button className="danger" onClick={() => { if (window.confirm(`Remove volunteer "${volunteer.fullName || volunteer.username}"? This cannot be undone.`)) onDelete && onDelete(volunteer._id); }}>Remove</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
const TasksView = ({ token, volunteers, events, refreshTrigger, user }) => {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState({ volunteerId: '', eventId: '', taskName: '', rules: '', salary: '' });
  const [attendanceMap, setAttendanceMap] = useState({});
  const [viewPhoto, setViewPhoto] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedTaskForChat, setSelectedTaskForChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const chatMessagesEndRef = useRef(null);
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const getTaskTime = (t) => {
    const d = t?.startTime || t?.dueDate || t?.event?.date;
    return d ? new Date(d).getTime() : 0;
  };

  const {
    isRecording,
    recordingTime,
    audioBase64,
    recorderError,
    startRecording,
    stopRecording,
    cancelRecording,
    clearRecording
  } = useAudioRecorder();

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/volunteer/admin/tasks`, config);
      setTasks(res.data);
    } catch {}
  };

  useEffect(() => { fetchTasks(); }, [refreshTrigger]);

  // Check if we need to open chat for a specific task (from notification click)
  useEffect(() => {
    const taskIdToOpen = sessionStorage.getItem('openChatForTask');
    if (taskIdToOpen && tasks.length > 0) {
      const task = tasks.find(t => t._id === taskIdToOpen);
      if (task) {
        openChatModal(task);
        sessionStorage.removeItem('openChatForTask');
      }
    }
  }, [tasks]);

  // Live polling for chat messages when chat modal is open (every 2 seconds)
  useEffect(() => {
    if (!showChatModal || !selectedTaskForChat?._id) return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_URL}/volunteer/admin/tasks/${selectedTaskForChat._id}`, config);
        const newMsgs = res.data?.chatMessages || [];
        setChatMessages(prevMsgs => {
          if (
            newMsgs.length !== prevMsgs.length ||
            (newMsgs.length > 0 &&
              prevMsgs.length > 0 &&
              newMsgs[newMsgs.length - 1]?.timestamp !== prevMsgs[prevMsgs.length - 1]?.timestamp)
          ) {
            setTimeout(() => {
              if (chatMessagesEndRef.current) {
                chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }, 100);
            return newMsgs;
          }
          return prevMsgs;
        });
      } catch (err) {
        // Silent catch for background polling
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [showChatModal, selectedTaskForChat?._id]);

  const markAttendance = async (task, status) => {
    try {
      const res = await axios.patch(
        `${API_URL}/volunteer/admin/attendance/${task.volunteer._id}/${task.event._id}`,
        { status, taskId: task._id }, config
      );
      setAttendanceMap(prev => ({ 
        ...prev, 
        [task._id]: res.data.status,
        [`${task.volunteer._id}_${task.event._id}`]: res.data.status 
      }));
    } catch {}
  };

  const assignTask = async (e) => {
    e.preventDefault();
    if (Number(form.salary) < 200) {
      alert('Salary must be at least ₹200.');
      return;
    }
    try {
      if (editingTask) {
        await axios.put(`${API_URL}/volunteer/admin/tasks/${editingTask._id}`, form, config);
      } else {
        await axios.post(`${API_URL}/volunteer/admin/tasks`, form, config);
      }
      closeModal();
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Unable to save task.');
    }
  };

  const openEditModal = (task) => {
    setForm({
      volunteerId: task.volunteer?._id || '',
      eventId: task.event?._id || '',
      taskName: task.taskName || '',
      rules: task.rules || '',
      salary: task.salary || ''
    });
    setEditingTask(task);
    setShowModal(true);
  };

  const removeTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await axios.delete(`${API_URL}/volunteer/admin/tasks/${taskId}`, config);
      fetchTasks();
    } catch {}
  };

  const approvePayment = async (taskId) => {
    try {
      await axios.patch(`${API_URL}/volunteer/admin/tasks/${taskId}/payment`, { status: 'approved' }, config);
      fetchTasks();
    } catch (err) {
      console.error('Error approving payment:', err);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTask(null);
    setForm({ volunteerId: '', eventId: '', taskName: '', rules: '', salary: '' });
  };

  const openChatModal = async (task) => {
    try {
      setSelectedTaskForChat(task);
      const res = await axios.get(`${API_URL}/volunteer/admin/tasks/${task._id}`, config);
      setChatMessages(res.data.chatMessages || []);
      setShowChatModal(true);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
    }
  };

  const closeChatModal = () => {
    setShowChatModal(false);
    setSelectedTaskForChat(null);
    setChatMessages([]);
    setMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    cancelRecording();
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedImage && !audioBase64) return;

    setSendingMessage(true);
    try {
      const newMessage = {
        sender: user?._id || 'admin',
        senderName: user?.fullName || user?.username || 'Admin',
        senderRole: 'admin',
        text: message || '',
        image: selectedImage || '',
        audio: audioBase64 || '',
        timestamp: new Date().toISOString()
      };

      const res = await axios.post(
        `${API_URL}/volunteer/admin/tasks/${selectedTaskForChat._id}/chat`,
        { message: newMessage },
        config
      );

      setChatMessages(res.data.chatMessages || []);
      setMessage('');
      setSelectedImage(null);
      setImagePreview(null);
      clearRecording();
      
      // Auto-scroll to bottom after sending message
      setTimeout(() => {
        if (chatMessagesEndRef.current) {
          chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result);
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const statusLabel = (s) => s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="table-panel relative mt-6" style={{ padding: '24px 24px 8px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button 
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
          onClick={() => { setEditingTask(null); setShowModal(true); }}
        >
          <Plus size={16} /> Assign task
        </button>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse" style={{ minWidth: '950px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e6ebf2', color: '#5e789b', font: "500 13px 'Poppins', sans-serif", letterSpacing: '.6px' }}>
              <th 
                style={{ padding: '16px 14px', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                title={`Sorted by time (${sortOrder === 'asc' ? 'earliest first' : 'latest first'}). Click to toggle.`}
              >
                <div className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                  <span>TASK</span>
                  {sortOrder === 'asc' ? <ArrowUp size={14} className="text-indigo-600" /> : <ArrowDown size={14} className="text-indigo-600" />}
                </div>
              </th>
              <th style={{ padding: '16px 14px', fontWeight: 600 }}>VOLUNTEER</th>
              <th style={{ padding: '16px 14px', fontWeight: 600 }}>EVENT</th>
              <th style={{ padding: '16px 14px', fontWeight: 600 }}>SALARY</th>
              <th style={{ padding: '16px 14px', fontWeight: 600 }}>STATUS</th>
              <th style={{ padding: '16px 14px', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-table-state" style={{ textAlign: 'center', padding: '40px 20px', color: '#7187a6', fontSize: '15px' }}>
                  No tasks assigned yet.
                </td>
              </tr>
            ) : (
              [...tasks].sort((a, b) => {
                const isCompletedA = a.status === 'completed' ? 1 : 0;
                const isCompletedB = b.status === 'completed' ? 1 : 0;
                if (isCompletedA !== isCompletedB) {
                  return isCompletedA - isCompletedB;
                }
                const timeA = getTaskTime(a);
                const timeB = getTaskTime(b);
                if (timeA !== timeB) {
                  return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
                }
                return sortOrder === 'asc'
                  ? new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
                  : new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
              }).map((task) => {
                const attKey = task._id;
                const attStatus = attendanceMap[attKey] || task.attendanceStatus || attendanceMap[`${task.volunteer?._id}_${task.event?._id}`];
                return (
                  <tr 
                    key={task._id} 
                    style={{ borderBottom: '1px solid #edf1f5', color: '#092953' }}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td style={{ padding: '18px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <strong style={{ fontSize: '14px', color: '#1e293b' }}>{task.taskName}</strong>
                        {(task.startTime || task.dueDate || task.event?.date) ? (
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {new Date(task.startTime || task.dueDate || task.event?.date).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td style={{ padding: '18px 14px' }}>
                      <span style={{ color: '#475569', fontSize: '14px' }}>{task.volunteer?.fullName || task.volunteer?.username || ''}</span>
                    </td>
                    <td style={{ padding: '18px 14px' }}>
                      <span style={{ color: '#5b52f6', fontSize: '14px', fontWeight: '600' }}>{task.event?.title || ''}</span>
                    </td>
                    <td style={{ padding: '18px 14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>₹{task.salary || 0}</span>
                        {task.status === 'completed' ? (
                          task.paymentStatus === 'approved' ? (
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[11px] font-semibold inline-block whitespace-nowrap border border-emerald-200/60 w-fit">
                              ✓ Approved
                            </span>
                          ) : (
                            <button
                              onClick={() => approvePayment(task._id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-semibold shadow-xs transition-colors whitespace-nowrap cursor-pointer w-fit"
                              title="Click to approve payment"
                            >
                              Approve Pay
                            </button>
                          )
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Pending work</span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '18px 14px' }}>
                      {task.status === 'completed' ? (
                        <span className="bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap">Completed</span>
                      ) : (
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold inline-block whitespace-nowrap">Pending</span>
                      )}
                    </td>
                    <td style={{ padding: '18px 14px', textAlign: 'right' }}>
                      <div className="flex gap-2 items-center justify-end">
                        <button onClick={() => openChatModal(task)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-gray-100 transition-colors" title="Chat">
                          <MessageSquare size={16} />
                        </button>
                        {task.completedPhoto && (
                          <button onClick={() => setViewPhoto(task.completedPhoto)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-gray-100 transition-colors" title="View Proof">
                            <Camera size={16} />
                          </button>
                        )}
                        {attStatus ? (
                          <span className="status" style={{ fontSize: '12px', marginRight: '4px' }}>{attStatus}</span>
                        ) : (
                          <>
                            <button 
                              onClick={() => markAttendance(task, 'present')}
                              className="bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors whitespace-nowrap"
                            >
                              Present
                            </button>
                            <button 
                              onClick={() => markAttendance(task, 'absent')}
                              className="bg-red-50 text-red-600 px-3.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors whitespace-nowrap"
                            >
                              Absent
                            </button>
                          </>
                        )}
                        <button onClick={() => openEditModal(task)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-gray-100 transition-colors" title="Edit">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => removeTask(task._id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-gray-100 transition-colors" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <form className="event-modal" onSubmit={assignTask}>
            <div className="modal-header"><h2>{editingTask ? 'Edit task' : 'Assign task'}</h2><button type="button" onClick={closeModal}><X size={20} /></button></div>
            <label>Task name / Role
              <select required value={form.taskName} onChange={e => setForm({ ...form, taskName: e.target.value })}>
                <option value="">Select a role / task</option>
                <option value="Event Coordinator team">Event Coordinator team</option>
                <option value="Event Coordinator Assistant">Event Coordinator Assistant</option>
                <option value="Registration Volunteer">Registration Volunteer</option>
                <option value="Guest Management">Guest Management</option>
                <option value="Crowd Management">Crowd Management</option>
                <option value="Decoration Team">Decoration Team</option>
                <option value="Stage Management">Stage Management</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Photography/Video Team">Photography/Video Team</option>
                <option value="Photography Volunteer">Photography Volunteer</option>
                <option value="Videography Volunteer">Videography Volunteer</option>
                <option value="Food & Catering Support">Food & Catering Support</option>
                <option value="Hospitality Volunteer">Hospitality Volunteer</option>
                <option value="Logistics Volunteer">Logistics Volunteer</option>
                <option value="Transportation Volunteer">Transportation Volunteer</option>
                <option value="Security/Safety Support">Security/Safety Support</option>
                <option value="Communication Volunteer">Communication Volunteer</option>
                <option value="Social Media Volunteer">Social Media Volunteer</option>
                <option value="First-Aid Support">First-Aid Support</option>
                <option value="Activity/Game Volunteer">Activity/Game Volunteer</option>
                <option value="Help Desk Volunteer">Help Desk Volunteer</option>
                <option value="Backstage Volunteer">Backstage Volunteer</option>
              </select>
            </label>
            <label>Volunteer
              <select required value={form.volunteerId} onChange={e => setForm({ ...form, volunteerId: e.target.value })}>
                <option value="">Select volunteer</option>
                {volunteers.map(v => <option key={v._id} value={v._id}>{v.fullName ? `${v.fullName} (@${v.username})` : v.username}</option>)}
              </select>
            </label>
            <label>Event
              <select required value={form.eventId} onChange={e => setForm({ ...form, eventId: e.target.value })}>
                <option value="">Select event</option>
                {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
              </select>
            </label>
            <label>Rules &amp; Regulations
              <textarea 
                value={form.rules} 
                onChange={e => setForm({ ...form, rules: e.target.value })} 
                placeholder="Specific instructions or rules for this task..."
                rows={3}
              />
            </label>
            <label>Salary (₹) <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal' }}>(Min. ₹200)</span>
              <input 
                type="number" 
                min="200" 
                required 
                value={form.salary} 
                onChange={e => setForm({ ...form, salary: e.target.value })} 
                placeholder="Minimum 200" 
              />
            </label>
            <div className="modal-actions"><button type="button" onClick={closeModal}>Cancel</button><button className="primary-action" type="submit">{editingTask ? 'Save changes' : 'Assign'}</button></div>
          </form>
        </div>
      )}
      {viewPhoto && (
        <div className="modal-backdrop">
          <div className="event-modal" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Task Proof</h2>
              <button type="button" onClick={() => setViewPhoto(null)}><X size={20} /></button>
            </div>
            <div className="mt-4">
              <img src={viewPhoto} alt="Completed Task Proof" style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
            </div>
            <div className="modal-actions mt-6">
              <button onClick={() => setViewPhoto(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
      {showChatModal && (
        <div className="modal-backdrop">
          <div className="event-modal" style={{ maxWidth: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2>Chat with {selectedTaskForChat?.volunteer?.fullName || selectedTaskForChat?.volunteer?.username || 'Volunteer'}</h2>
              <button type="button" onClick={closeChatModal}><X size={20} /></button>
            </div>
            <div className="mt-4 flex-1 overflow-y-auto" style={{ maxHeight: '400px', display: 'flex', flexDirection: 'column' }}>
              <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No messages yet</p>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => {
                    const isAdminMessage = msg.senderRole === 'admin';
                    return (
                      <div
                        key={index}
                        className={`flex ${isAdminMessage ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-xl px-4 py-2 ${
                            isAdminMessage
                              ? 'bg-teal-600 text-white'
                              : 'bg-white text-gray-900 border border-gray-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-xs font-semibold">
                              {msg.senderName}
                            </span>
                            <span className="text-xs opacity-70">
                              {msg.senderRole === 'admin' ? '(Admin)' : '(Volunteer)'}
                            </span>
                          </div>
                          {msg.image && (
                            <div className="mb-2">
                              <img 
                                src={msg.image} 
                                alt="Shared image" 
                                className="max-w-full h-auto rounded-lg cursor-pointer"
                                onClick={() => setShowImagePreview(msg.image)}
                                style={{ maxHeight: '200px' }}
                              />
                            </div>
                          )}
                          {msg.audio && (
                            <div className="mb-2">
                              <VoiceNotePlayer 
                                src={msg.audio} 
                                variant={isAdminMessage ? 'admin' : 'light'} 
                              />
                            </div>
                          )}
                          {msg.text && <p className="text-sm">{msg.text}</p>}
                          <p className="text-xs opacity-70 mt-1 text-right">
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatMessagesEndRef} />
              </div>
            </div>
            <div className="mt-4">
              {/* Voice Note Preview */}
              {audioBase64 && (
                <div className="mb-3 p-2 bg-indigo-50/90 border border-indigo-100 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="text-xs font-bold text-indigo-700 flex items-center gap-1 shrink-0">
                      <Mic size={14} /> Voice note:
                    </span>
                    <VoiceNotePlayer src={audioBase64} variant="light" />
                  </div>
                  <button
                    type="button"
                    onClick={clearRecording}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Discard voice note"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}

              {/* Recorder Error message */}
              {recorderError && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center justify-between">
                  <span>{recorderError}</span>
                </div>
              )}

              {/* Image Preview */}
              {imagePreview && (
                <div className="mb-3 relative inline-block">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              
              {isRecording ? (
                <div className="flex items-center space-x-3 w-full bg-red-50/90 border border-red-200 rounded-xl px-3.5 py-2 animate-fade-in">
                  <div className="flex items-center space-x-2.5 flex-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                    </span>
                    <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                      Recording
                    </span>
                    <span className="text-xs font-mono font-semibold text-gray-700 bg-white/90 px-2 py-0.5 rounded border border-red-100">
                      {Math.floor(recordingTime / 60)}:{recordingTime % 60 < 10 ? '0' : ''}{recordingTime % 60}
                    </span>
                    <div className="flex items-center space-x-0.5 ml-1">
                      <span className="w-1 h-3 bg-red-400 rounded-full animate-pulse"></span>
                      <span className="w-1 h-5 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1 h-2 bg-red-400 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                      <span className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{ animationDelay: '75ms' }}></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={cancelRecording}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                    title="Discard recording"
                  >
                    <Trash2 size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={stopRecording}
                    className="px-3 py-1.5 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Stop recording"
                  >
                    <Square size={14} className="fill-current" /> Done
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="admin-image-upload"
                  />
                  <label
                    htmlFor="admin-image-upload"
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    title="Attach image"
                  >
                    <ImageIcon size={18} />
                  </label>
                  <button
                    type="button"
                    onClick={startRecording}
                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    title="Record voice note"
                  >
                    <Mic size={18} />
                  </button>
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 min-w-0 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={(!message.trim() && !selectedImage && !audioBase64) || sendingMessage}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center gap-1.5 text-sm font-medium"
                    title="Send message"
                  >
                    <Send size={16} /> {sendingMessage ? 'Sending...' : 'Send'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showImagePreview && (
        <div className="modal-backdrop">
          <div className="event-modal" style={{ maxWidth: '800px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h2>Image Preview</h2>
              <button type="button" onClick={() => setShowImagePreview(null)}><X size={20} /></button>
            </div>
            <div className="mt-4">
              <img 
                src={showImagePreview} 
                alt="Full size preview" 
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0', maxHeight: '70vh', objectFit: 'contain' }}
              />
            </div>
            <div className="modal-actions mt-6">
              <button onClick={() => setShowImagePreview(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
const CertificatesView = ({ certificates, pendingVolunteers, onGenerate, token }) => {
  const [generating, setGenerating] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState({});
  const [selectedCert, setSelectedCert] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const handleGenerate = async (volunteerId) => {
    const eventId = selectedEvents[volunteerId];
    if (!eventId) {
      alert('Please select an event first.');
      return;
    }
    setGenerating(true);
    try {
      await axios.post(`${API_URL}/admin/certificates/generate`, 
        { volunteerId, eventId }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await onGenerate();
      setSelectedEvents(prev => ({ ...prev, [volunteerId]: '' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (certId) => {
    setUpdatingId(certId);
    try {
      await axios.patch(`${API_URL}/admin/certificates/${certId}/status`, 
        { status: 'approved' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await onGenerate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve certificate');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReject = async (certId) => {
    if (!window.confirm('Are you sure you want to reject this certificate?')) return;
    setUpdatingId(certId);
    try {
      await axios.patch(`${API_URL}/admin/certificates/${certId}/status`, 
        { status: 'rejected' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await onGenerate();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject certificate');
    } finally {
      setUpdatingId(null);
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

  return (
    <div className="table-panel">
      <div className="table-head cert-table-head">
        <span>VOLUNTEER</span>
        <span>EVENT</span>
        <span>CREW POINTS</span>
        <span>CERTIFICATE ID</span>
        <span>STATUS</span>
        <span>ACTIONS</span>
      </div>
      
      {/* Show already generated certificates */}
      {certificates.map(cert => (
        <div className="table-row cert-row" key={cert._id}>
          <div><strong>{cert.volunteer?.fullName || cert.volunteer?.username || 'Unknown'}</strong></div>
          <span>{cert.event?.title || 'Unknown Event'}</span>
          <span><span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200">500+ pts ✓</span></span>
          <span><span className="px-2 py-1 bg-gray-100 rounded text-sm font-mono text-gray-700">{cert.certificateId}</span></span>
          <span>
            {cert.status === 'approved' ? (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200 inline-flex items-center gap-1">
                <Check size={12} /> Approved
              </span>
            ) : cert.status === 'rejected' ? (
              <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold text-xs rounded-full border border-rose-200 inline-flex items-center gap-1">
                <X size={12} /> Rejected
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-xs rounded-full border border-amber-200 inline-flex items-center gap-1">
                ⏳ Pending Approval
              </span>
            )}
          </span>
          <div className="row-actions flex items-center gap-1.5">
            {cert.status !== 'approved' && (
              <button 
                onClick={() => handleApprove(cert._id)}
                disabled={updatingId === cert._id}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Click to approve certificate for volunteer"
              >
                <Check size={13} />
                <span>{updatingId === cert._id ? 'Approving...' : 'Approve'}</span>
              </button>
            )}
            {cert.status === 'pending' && (
              <button 
                onClick={() => handleReject(cert._id)}
                disabled={updatingId === cert._id}
                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-medium text-xs rounded-lg transition-colors cursor-pointer"
                title="Reject certificate"
              >
                Reject
              </button>
            )}
            <button 
              onClick={() => openCertificate(cert, false)} 
              className="px-3 py-1.5 bg-gray-100 text-gray-700 font-medium text-xs rounded-lg hover:bg-gray-200 transition-colors cursor-pointer"
            >
              View
            </button>
            {cert.status === 'approved' && (
              <button 
                onClick={() => openCertificate(cert, true)} 
                className="px-3.5 py-1.5 bg-indigo-600 text-white font-medium text-xs rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <Download size={13} />
                <span>Download</span>
              </button>
            )}
          </div>
        </div>
      ))}
      
      {/* Show pending volunteers who can have certificates generated */}
      {pendingVolunteers.map(pending => (
        <div className="table-row cert-row" key={pending.volunteer._id}>
          <div><strong>{pending.volunteer.fullName || pending.volunteer.username}</strong></div>
          <span>
            <select 
              className="px-2 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 w-full max-w-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={selectedEvents[pending.volunteer._id] || ''}
              onChange={(e) => setSelectedEvents(prev => ({ ...prev, [pending.volunteer._id]: e.target.value }))}
            >
              <option value="">Select after event completion</option>
              {pending.events.map(ev => (
                <option key={ev._id} value={ev._id}>{ev.title}</option>
              ))}
            </select>
          </span>
          <span>
            {pending.points >= 500 ? (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200 whitespace-nowrap">
                ✓ {pending.points} pts (Eligible)
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-semibold text-xs rounded-full border border-amber-200 whitespace-nowrap" title="Need 500 points for certificate">
                ⚠️ {pending.points || 0} / 500 pts
              </span>
            )}
          </span>
          <span className="text-gray-400">—</span>
          <span>
            <span className="text-gray-400 text-xs">Awaiting Generation</span>
          </span>
          <div className="row-actions">
            {pending.points >= 500 ? (
              <button 
                onClick={() => handleGenerate(pending.volunteer._id)}
                disabled={generating || !selectedEvents[pending.volunteer._id]}
                className="px-4 py-1.5 bg-indigo-600 text-white font-medium text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {generating ? 'Generating...' : 'Generate & Approve'}
              </button>
            ) : (
              <button 
                disabled
                className="px-3.5 py-1.5 bg-gray-100 text-gray-400 font-medium text-xs rounded-lg cursor-not-allowed"
                title="Volunteer must obtain 500 points before certificate can be generated"
              >
                Needs 500 pts
              </button>
            )}
          </div>
        </div>
      ))}

      {certificates.length === 0 && pendingVolunteers.length === 0 && (
        <div className="empty-table-state">No certificates available or pending. Approve volunteers for events first.</div>
      )}

      {/* Certificate Modal for Preview and Download/Print */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs overflow-y-auto certificate-modal-backdrop">
          <div className="relative w-full max-w-4xl my-8">
            {/* Modal Controls Bar */}
            <div className="flex items-center justify-between mb-3 px-2 certificate-no-print">
              <span className="text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Award size={16} className="text-amber-400" />
                Certificate Preview & Download
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={15} />
                  <span>Download / Print PDF</span>
                </button>
                <button
                  onClick={() => setSelectedCert(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Certificate Paper */}
            <div className="certificate-print-area bg-white p-3 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl flex items-center justify-center">
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
                  {selectedCert.volunteer?.fullName || selectedCert.volunteer?.username || 'Honored Volunteer'}
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
                    <p className="font-bold text-gray-800">
                      {selectedCert.issuedDate ? new Date(selectedCert.issuedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
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
                    <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Authorized Official</p>
                    <p className="font-bold text-gray-800 font-serif italic text-sm">CrewLink Operations</p>
                    <div className="w-28 h-0.5 bg-gray-300 mt-3 mb-1 ml-auto"></div>
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
const EventModal = ({ form, setForm, editing, onClose, onSubmit }) => {
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, imageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="modal-backdrop">
      <form className="event-modal" onSubmit={onSubmit}>
        <div className="modal-header">
          <h2>{editing ? 'Edit event' : 'Create event'}</h2>
          <button type="button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>
        {[['Event title', 'title'], ['Location', 'location']].map(([label, key]) => (
          <label key={key}>{label}<input required value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} /></label>
        ))}
        <label>Description<textarea required rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <label>Rules &amp; Regulations<textarea rows="3" placeholder="Rules specific to this event..." value={form.rules || ''} onChange={(event) => setForm({ ...form, rules: event.target.value })} /></label>
        <div className="form-grid">
          <label>Date and time<input required type="datetime-local" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
          <label>Capacity<input required min="1" type="number" value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} /></label>
        </div>
        <label>Price (₹)<input required min="0" type="number" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="e.g. 1000 or 0 for free" /></label>
        <label>
          Event Image
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
            <input type="file" accept="image/*" onChange={handleImageUpload} style={{ padding: '8px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '13px' }} />
            <div style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', fontWeight: '500' }}>OR</div>
            <input type="url" placeholder="Paste image URL here" value={form.imageUrl} onChange={(event) => setForm({ ...form, imageUrl: event.target.value })} />
          </div>
          {form.imageUrl && (
            <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', height: '120px', border: '1px solid #e2e8f0' }}>
              <img src={form.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </label>
        <div className="modal-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button className="primary-action" type="submit">{editing ? 'Save changes' : 'Create event'}</button>
        </div>
      </form>
    </div>
  );
};
