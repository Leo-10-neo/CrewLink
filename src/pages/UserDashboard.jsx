import { useState, useEffect } from 'react';
import { Container, Card, Button, Row, Col, Alert, Modal, Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const UserDashboard = () => {
  const [events, setEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchEvents();
    fetchRegisteredEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/events');
      setEvents(response.data);
    } catch (error) {
      setError('Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegisteredEvents = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegisteredEvents(response.data.user.registeredEvents || []);
    } catch (error) {
      console.error('Error fetching registered events:', error);
    }
  };

  const handleRegister = async (eventId) => {
    try {
      await axios.post(`http://localhost:5000/api/events/${eventId}/register`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchEvents();
      await fetchRegisteredEvents();
      setShowModal(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to register for event');
    }
  };

  const handleUnregister = async (eventId) => {
    try {
      await axios.post(`http://localhost:5000/api/events/${eventId}/unregister`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchEvents();
      await fetchRegisteredEvents();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to unregister from event');
    }
  };

  const isRegistered = (eventId) => {
    return registeredEvents.some(event => event._id === eventId);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <Container className="text-center mt-5"><div>Loading...</div></Container>;
  }

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Welcome, {user?.username}!</h2>
        <Button variant="danger" onClick={handleLogout}>Logout</Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      <h3 className="mb-4">Available Events</h3>
      
      {events.length === 0 ? (
        <Alert variant="info">No events available at the moment.</Alert>
      ) : (
        <Row>
          {events.map(event => (
            <Col key={event._id} md={6} lg={4} className="mb-4">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>{event.title}</Card.Title>
                  <Card.Text className="text-muted small">
                    {formatDate(event.date)}
                  </Card.Text>
                  <Card.Text>{event.description}</Card.Text>
                  <Card.Text>
                    <strong>Location:</strong> {event.location}
                  </Card.Text>
                  <Card.Text>
                    <strong>Capacity:</strong> {event.registeredCount}/{event.capacity}
                  </Card.Text>
                  <div className="mt-3">
                    {isRegistered(event._id) ? (
                      <Button
                        variant="warning"
                        onClick={() => handleUnregister(event._id)}
                        disabled={loading}
                      >
                        Unregister
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowModal(true);
                        }}
                        disabled={event.registeredCount >= event.capacity}
                      >
                        {event.registeredCount >= event.capacity ? 'Fully Booked' : 'Register'}
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Register for Event</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEvent && (
            <div>
              <h5>{selectedEvent.title}</h5>
              <p>{formatDate(selectedEvent.date)}</p>
              <p>{selectedEvent.description}</p>
              <p><strong>Location:</strong> {selectedEvent.location}</p>
              <p><strong>Available spots:</strong> {selectedEvent.capacity - selectedEvent.registeredCount}</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => selectedEvent && handleRegister(selectedEvent._id)}
          >
            Confirm Registration
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default UserDashboard;