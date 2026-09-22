const express = require('express');
const User = require('../models/User');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

console.log('Users routes loaded');

// Get all users (admin only)
router.get('/', adminAuth, async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    
    // Fetch bookings and profiles for these users
    const Booking = require('../models/Booking');
    const VolunteerProfile = require('../models/VolunteerProfile');
    const bookings = await Booking.find().populate('event', 'title date location');
    const profiles = await VolunteerProfile.find().lean();
    const profileMap = {};
    profiles.forEach(p => {
      if (p.user) profileMap[p.user.toString()] = p;
    });
    
    // Attach bookings/events and volunteer profile details to users
    const usersWithEvents = users.map(user => {
      user.registeredEvents = bookings.filter(b => b.user && b.user.toString() === user._id.toString()).map(b => b.event);
      const prof = profileMap[user._id.toString()];
      if (prof) {
        user.fullName = user.fullName || prof.fullName || user.username;
        user.city = user.city || prof.city;
        user.phone = user.phone || prof.phone;
        user.upiId = user.upiId || prof.upiId;
        user.photo = user.photo || prof.photo;
        if (!user.skills || user.skills.length === 0) {
          user.skills = typeof prof.skills === 'string' ? prof.skills.split(',').map(s => s.trim()).filter(Boolean) : (prof.skills || []);
        }
      }
      return user;
    });

    res.json(usersWithEvents);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single user (admin only)
router.get('/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const Booking = require('../models/Booking');
    const bookings = await Booking.find({ user: user._id }).populate('event', 'title date location');
    user.registeredEvents = bookings.map(b => b.event);
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user role (admin only)
router.put('/:id/role', adminAuth, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User role updated successfully', user });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});
// Update user profile status (admin only)
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Pending', 'Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { profileStatus: status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User status updated successfully', user });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findByIdAndDelete(userId);

    // Cascade cleanups
    const VolunteerProfile = require('../models/VolunteerProfile');
    const VolunteerTask = require('../models/VolunteerTask');
    const Attendance = require('../models/Attendance');
    const Certificate = require('../models/Certificate');
    const Event = require('../models/Event');
    const Booking = require('../models/Booking');
    const Notification = require('../models/Notification');

    await Promise.all([
      VolunteerProfile.deleteMany({ user: userId }),
      VolunteerTask.deleteMany({ volunteer: userId }),
      Attendance.deleteMany({ volunteer: userId }),
      Certificate.deleteMany({ volunteer: userId }),
      Event.updateMany({ assignedVolunteers: userId }, { $pull: { assignedVolunteers: userId } }),
      Booking.deleteMany({ user: userId }),
      Notification.deleteMany({ userId: userId })
    ]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;