const express = require('express');
const { adminAuth } = require('../middleware/auth');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Booking = require('../models/Booking');
const VolunteerProfile = require('../models/VolunteerProfile');

const router = express.Router();

// Get all certificates and eligible volunteers
router.get('/', adminAuth, async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .populate('volunteer', 'fullName username')
      .populate('event', 'title date')
      .populate('approvedBy', 'fullName username')
      .sort({ createdAt: -1 });
    
    // Get all volunteers
    const volunteers = await User.find({ role: 'volunteer' }).select('fullName username');
    
    // Get all bookings to know which events volunteers participated in
    const bookings = await Booking.find({ status: 'approved' }).populate('event', 'title');

    // Get profiles for points
    const profiles = await VolunteerProfile.find();
    const profileMap = {};
    profiles.forEach(p => {
      if (p.user) profileMap[p.user.toString()] = p.crewPoints || 0;
    });
    
    const pendingVolunteers = [];
    
    for (const vol of volunteers) {
      const volBookings = bookings.filter(b => b.user && b.user.toString() === vol._id.toString() && b.event);
      const points = profileMap[vol._id.toString()] || 0;
      
      // If volunteer has approved bookings, check if they need certificates
      if (volBookings.length > 0) {
        // Find which events don't have certificates yet
        const generatedEventIds = certificates
          .filter(c => c.volunteer && c.volunteer._id.toString() === vol._id.toString())
          .map(c => c.event && c.event._id.toString());
          
        const pendingEvents = volBookings
          .filter(b => !generatedEventIds.includes(b.event._id.toString()))
          .map(b => b.event);
          
        if (pendingEvents.length > 0) {
          pendingVolunteers.push({
            volunteer: vol,
            events: pendingEvents,
            points,
            isEligible: points >= 500
          });
        }
      }
    }

    res.json({ certificates, pendingVolunteers });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate a certificate
router.post('/generate', adminAuth, async (req, res) => {
  try {
    const { volunteerId, eventId } = req.body;
    
    if (!volunteerId || !eventId) {
      return res.status(400).json({ message: 'Volunteer and Event are required' });
    }

    // Check volunteer 500 points requirement
    const profile = await VolunteerProfile.findOne({ user: volunteerId });
    const points = profile?.crewPoints || 0;
    if (points < 500) {
      return res.status(400).json({ 
        message: `Volunteer has ${points} points. 500 points must be obtained to get a certificate.` 
      });
    }
    
    // Check if already exists
    const existing = await Certificate.findOne({ volunteer: volunteerId, event: eventId });
    if (existing) {
      return res.status(400).json({ message: 'Certificate already generated for this event' });
    }
    
    // Generate unique ID
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const certificateId = `CL-2026-${randomStr}`;
    
    const cert = new Certificate({
      volunteer: volunteerId,
      event: eventId,
      certificateId,
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: req.user._id
    });
    
    await cert.save();
    
    res.status(201).json(cert);
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve or Reject a certificate
router.patch('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved, rejected, or pending.' });
    }

    const cert = await Certificate.findById(req.params.id)
      .populate('volunteer', 'fullName username email')
      .populate('event', 'title date');

    if (!cert) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    cert.status = status;
    if (status === 'approved') {
      cert.approvedAt = new Date();
      cert.approvedBy = req.user._id;
    } else if (status === 'rejected') {
      cert.approvedAt = undefined;
      cert.approvedBy = req.user._id;
    }
    await cert.save();

    // Notify the volunteer
    if (status === 'approved') {
      const Notification = require('../models/Notification');
      const eventTitle = cert.event?.title || 'CrewLink Operations';
      const volId = cert.volunteer?._id || cert.volunteer;
      if (volId) {
        await Notification.create({
          userId: volId,
          message: `🎉 Great news! Your Certificate of Appreciation for "${eventTitle}" (ID: ${cert.certificateId}) has been approved by the Admin! You can now download it from your Certificates tab.`,
          type: 'success',
          link: '/volunteer/dashboard'
        });
      }
    } else if (status === 'rejected') {
      const Notification = require('../models/Notification');
      const eventTitle = cert.event?.title || 'CrewLink Operations';
      const volId = cert.volunteer?._id || cert.volunteer;
      if (volId) {
        await Notification.create({
          userId: volId,
          message: `Notice: Your Certificate for "${eventTitle}" was not approved by the Admin. Please contact operations for questions.`,
          type: 'error',
          link: '/volunteer/dashboard'
        });
      }
    }

    res.json({ message: `Certificate ${status} successfully`, certificate: cert });
  } catch (error) {
    console.error('Update certificate status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
