const express = require('express');
const Event = require('../models/Event');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

console.log('Events routes loaded');

// Get all events (public)
router.get('/', async (req, res) => {
  try {
    const events = await Event.find({ $or: [{ status: 'approved' }, { status: { $exists: false } }] })
      .populate('createdBy', 'username email')
      .sort({ date: 1 });
    
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all events including pending (admin only)
router.get('/all', adminAuth, async (req, res) => {
  try {
    const events = await Event.find()
      .populate('createdBy', 'username email')
      .populate('assignedVolunteers', 'username email')
      .sort({ date: -1 });
    
    // Fetch all bookings and attach to events
    const Booking = require('../models/Booking');
    const bookings = await Booking.find().populate('user', 'username email');
    
    // We cannot easily attach virtuals directly to mongoose documents without .lean(), 
    // so we will map it manually
    const eventsWithBookings = events.map(event => {
      const eventObj = event.toObject();
      eventObj.bookings = bookings.filter(b => b.event.toString() === event._id.toString());
      return eventObj;
    });

    res.json(eventsWithBookings);
  } catch (error) {
    console.error('Get all events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single event
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create event (admin or user)
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, rules, date, time, location, capacity, imageUrl, price, category, subCategory, decorations } = req.body;

    // Admins create approved events, normal users create pending events
    const status = req.user.role === 'admin' ? 'approved' : 'pending';

    const event = new Event({
      title,
      description: description || 'No description',
      rules: rules || '',
      date,
      time,
      location,
      capacity: capacity || 1,
      imageUrl,
      price: price || 0,
      category: category || 'General',
      subCategory,
      decorations,
      createdBy: req.user._id,
      status
    });

    await event.save();
    await event.populate('createdBy', 'username email');

    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { title, description, rules, date, location, capacity, imageUrl, price, category } = req.body;

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { title, description, rules, date, location, capacity, imageUrl, price, category },
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event updated successfully', event });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update event status (admin only)
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('createdBy', 'username email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: `Event ${status} successfully`, event });
  } catch (error) {
    console.error('Update event status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign volunteer to event (admin only)
router.post('/:id/assign-volunteer', adminAuth, async (req, res) => {
  try {
    const { volunteerId } = req.body;
    
    if (!volunteerId) {
      return res.status(400).json({ message: 'Volunteer ID is required' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if volunteer is already assigned
    if (event.assignedVolunteers && event.assignedVolunteers.includes(volunteerId)) {
      return res.status(400).json({ message: 'Volunteer is already assigned to this event' });
    }

    // Add volunteer to event
    event.assignedVolunteers = event.assignedVolunteers || [];
    event.assignedVolunteers.push(volunteerId);
    
    await event.save();

    // Automatically create a default Task and Attendance record for the volunteer
    const VolunteerTask = require('../models/VolunteerTask');
    const Attendance = require('../models/Attendance');

    await VolunteerTask.create({
      volunteer: volunteerId,
      event: event._id,
      taskName: 'Event Support',
      description: `Support role for ${event.title}`,
      dueDate: event.date ? new Date(event.date) : new Date(),
      status: 'pending'
    });

    await Attendance.create({
      volunteer: volunteerId,
      event: event._id,
      status: 'pending'
    });

    res.json({ message: 'Volunteer assigned successfully', event });
  } catch (error) {
    console.error('Assign volunteer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete event (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register for event (user only)
router.post('/:id/register', auth, async (req, res) => {
  try {
    const { bookingDate, bookingTime } = req.body;
    
    if (!bookingDate || !bookingTime) {
      return res.status(400).json({ message: 'Booking date and time are required' });
    }

    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if event is full (this is a simplified overall capacity check)
    if (event.registeredCount >= event.capacity) {
      return res.status(400).json({ message: 'Event is fully booked' });
    }

    const Booking = require('../models/Booking');

    // Create the booking
    const booking = new Booking({
      event: event._id,
      user: req.user._id,
      bookingDate,
      bookingTime
    });
    
    await booking.save();

    // Increment overall capacity
    event.registeredCount += 1;
    await event.save();

    res.json({ message: 'Successfully registered for event', booking });
  } catch (error) {
    console.error('Register for event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unregister from event (user only)
router.post('/:id/unregister', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const Booking = require('../models/Booking');
    
    // Find and delete the booking
    const booking = await Booking.findOneAndDelete({
      event: event._id,
      user: req.user._id
    });

    if (!booking) {
      return res.status(400).json({ message: 'Not registered for this event' });
    }

    event.registeredCount -= 1;
    await event.save();

    res.json({ message: 'Successfully unregistered from event' });
  } catch (error) {
    console.error('Unregister from event error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;