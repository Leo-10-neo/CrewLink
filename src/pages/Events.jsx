import { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, MapPin, DollarSign, Sparkles, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';
import { EVENT_TYPES, getEventTypeColorClass, getEventTypeById } from '../constants/eventTypes';
import { API_URL } from '../services/api';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Registration / Booking states
  const [bookingEvent, setBookingEvent] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingStatus, setBookingStatus] = useState({ loading: false, error: null, success: false });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`${API_URL}/events`);
        setEvents(response.data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!bookingDate || !bookingTime || !bookingEvent) return;

    setBookingStatus({ loading: true, error: null, success: false });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setBookingStatus({ loading: false, error: 'Please log in to register.', success: false });
        return;
      }

      await axios.post(
        `${API_URL}/events/${bookingEvent._id || bookingEvent.id}/register`,
        { bookingDate, bookingTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBookingStatus({ loading: false, error: null, success: true });

      // Close modal after success
      setTimeout(() => {
        setBookingEvent(null);
        setBookingStatus({ loading: false, error: null, success: false });
        setBookingDate('');
        setBookingTime('');
      }, 2000);

    } catch (error) {
      setBookingStatus({
        loading: false,
        error: error.response?.data?.message || 'Failed to register',
        success: false
      });
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar />

      {/* Event Categories Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-transparent opacity-50 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          {!selectedCategory ? (
            <>
              <div className="max-w-2xl mb-16 animate-slide-up">
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="text-blue-600" size={24} />
                  <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900">
                    Event Categories
                  </h2>
                </div>
                <p className="text-lg text-gray-600">
                  Discover opportunities across 19+ event categories. From corporate meetings to music festivals, find the perfect crew or your next gig.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {EVENT_TYPES.map((type, index) => (
                  <div
                    key={type.id}
                    onClick={() => setSelectedCategory(type)}
                    className="glass-panel p-6 rounded-2xl cursor-pointer transition-all duration-300 hover:shadow-premium hover:-translate-y-2 animate-slide-up group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300 origin-left">{type.emoji}</div>
                    <h3 className="font-bold text-gray-900 mb-2 text-2xl group-hover:text-accent transition-colors">
                      {type.name}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-3">
                      {type.description}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="animate-fade-in">
              <button
                onClick={() => setSelectedCategory(null)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium mb-8 transition-colors"
              >
                <ArrowLeft size={20} />
                <span>Back to Categories</span>
              </button>

              <div className="flex items-center space-x-3 mb-10">
                <span className="text-4xl">{selectedCategory.emoji}</span>
                <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900">
                  {selectedCategory.name}
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedCategory.subCategories?.map((sub, index) => (
                  <div
                    key={index}
                    className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-premium transition-all duration-500 cursor-pointer h-64"
                  >
                    <img
                      src={sub.imageUrl}
                      alt={sub.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute bottom-0 left-0 p-6 w-full transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <h3 className="text-2xl font-bold text-white mb-1">
                        {sub.name}
                      </h3>
                      <div className="h-1 w-12 bg-accent rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Live Events Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-gray-900 mb-8">All Available Events</h2>

          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg shadow-sm">
              <Calendar className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-lg">No events found at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, index) => {
                const eventType = getEventTypeById(event.eventTypeId || 'conferences');
                return (
                  <div key={event._id || event.id} className="glass-panel p-5 rounded-2xl hover:shadow-premium transition-all duration-300 animate-slide-up group" style={{ animationDelay: `${(index % 6) * 100}ms` }}>
                    {event.imageUrl ? (
                      <div
                        className="h-48 rounded-lg mb-4 bg-cover bg-center"
                        style={{ backgroundImage: `url(${event.imageUrl})` }}
                      ></div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center">
                        <Calendar className="text-gray-500" size={32} />
                      </div>
                    )}
                    <div className="flex items-center space-x-2 mb-2">
                      {eventType && (
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${getEventTypeColorClass(eventType.color)}`}>
                          {eventType.emoji} {eventType.name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-[#5b52f6] mb-2 group-hover:text-[#4a42d4] transition-colors">
                      {event.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {event.description}
                    </p>
                    {event.rules && (
                      <p className="text-xs text-red-600 font-medium mb-4 line-clamp-1">
                        * Rules apply
                      </p>
                    )}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar size={16} className="mr-2 text-blue-600" />
                        {new Date(event.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin size={16} className="mr-2 text-blue-600" />
                        {event.location}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign size={16} className="mr-2 text-blue-600" />
                        {event.capacity} Capacity
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Booking Modal */}
      {bookingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">
                Book Event: {bookingEvent.title}
              </h3>
              <button
                onClick={() => setBookingEvent(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleRegister} className="p-6">
              {bookingStatus.error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {bookingStatus.error}
                </div>
              )}
              {bookingStatus.success && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center">
                  <Sparkles size={16} className="mr-2" />
                  Successfully booked! See you there!
                </div>
              )}
              
              {bookingEvent.rules && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl">
                  <h4 className="text-sm font-semibold text-orange-800 mb-1">Rules &amp; Regulations</h4>
                  <p className="text-xs text-orange-700 whitespace-pre-line">{bookingEvent.rules}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Time</label>
                  <input
                    type="time"
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setBookingEvent(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingStatus.loading || bookingStatus.success}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {bookingStatus.loading ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Event Gallery Section */}
      <section className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16 animate-slide-up">
            <h2 className="text-3xl lg:text-4xl font-semibold text-gray-900 mb-4">Event Highlights</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              A glimpse into the magic we create. From intimate gatherings to massive events, our crew ensures every moment is picture-perfect.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]">
            {/* Image 1 (Large) */}
            <div className="col-span-2 row-span-2 rounded-2xl overflow-hidden group relative shadow-sm hover:shadow-premium transition-all duration-300">
              <img src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Concert Event" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-6">
                <span className="text-white font-bold text-lg">Mainstage Events</span>
              </div>
            </div>

            {/* Image 2 */}
            <div className="rounded-2xl overflow-hidden group relative shadow-sm hover:shadow-premium transition-all duration-300">
              <img src="https://images.unsplash.com/photo-1515169067868-5387ec356754?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Corporate Event" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white font-bold">Conferences</span>
              </div>
            </div>

            {/* Image 3 */}
            <div className="rounded-2xl overflow-hidden group relative shadow-sm hover:shadow-premium transition-all duration-300">
              <img src="https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" alt="Exhibition" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white font-bold">Exhibitions</span>
              </div>
            </div>

            {/* Image 4 (Wide) */}
            <div className="col-span-2 rounded-2xl overflow-hidden group relative shadow-sm hover:shadow-premium transition-all duration-300">
              <img src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Networking Event" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white font-bold text-lg">Networking</span>
              </div>
            </div>

            {/* Image 5 (Wide) */}
            <div className="col-span-2 rounded-2xl overflow-hidden group relative shadow-sm hover:shadow-premium transition-all duration-300">
              <img src="https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" alt="Tech Setup" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white font-bold text-lg">Tech Production</span>
              </div>
            </div>

            {/* Image 6 */}
            <div className="rounded-2xl overflow-hidden group relative shadow-sm hover:shadow-premium transition-all duration-300">
              <img src="/stage-crew.png" alt="Stage Crew" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white font-bold">Stage Crew</span>
              </div>
            </div>

            {/* Image 7 */}
            <div className="rounded-2xl overflow-hidden group relative shadow-sm hover:shadow-premium transition-all duration-300">
              <img src="https://images.unsplash.com/photo-1540317580384-e5d43616b9aa?w=600&q=80" alt="Backstage" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white font-bold">Backstage</span>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Events;
