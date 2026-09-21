const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const VolunteerProfile = require('../models/VolunteerProfile');
const VolunteerTask = require('../models/VolunteerTask');
const Attendance = require('../models/Attendance');
const Certificate = require('../models/Certificate');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

// Auth middleware
const auth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// ──────────────────────────────────────────
// PROFILE
// ──────────────────────────────────────────

// GET profile (auto-create if missing)
router.get('/profile', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    let profile = await VolunteerProfile.findOne({ user: req.userId }).populate('user', 'username email photo aadharNo panCardNo address age fullName gender phone upiId city skills availability experience preferredEventTypes languages emergencyContact bloodGroup');

    if (!profile) {
      profile = await VolunteerProfile.create({
        user: req.userId,
        fullName: user?.fullName || user?.username || '',
        city: user?.city || '',
        phone: user?.phone || '',
        upiId: user?.upiId || '',
        photo: user?.photo || '',
        aadharNo: user?.aadharNo || '',
        panCardNo: user?.panCardNo || '',
        address: user?.address || '',
        age: user?.age || null,
        gender: user?.gender || '',
        skills: Array.isArray(user?.skills) ? user.skills.join(', ') : (user?.skills || ''),
        availability: Array.isArray(user?.availability) ? user.availability.join(', ') : (user?.availability || ''),
        experience: user?.experience || '',
        preferredEventTypes: Array.isArray(user?.preferredEventTypes) ? user.preferredEventTypes.join(', ') : (user?.preferredEventTypes || ''),
        languages: Array.isArray(user?.languages) ? user.languages : [],
        emergencyContact: user?.emergencyContact || { name: '', phone: '', relation: '' },
        bloodGroup: user?.bloodGroup || ''
      });
    } else {
      const mergedValues = {
        fullName: profile.fullName || user?.fullName || user?.username || '',
        city: profile.city || user?.city || '',
        phone: profile.phone || user?.phone || '',
        upiId: profile.upiId || user?.upiId || '',
        photo: profile.photo || user?.photo || '',
        aadharNo: profile.aadharNo || user?.aadharNo || '',
        panCardNo: profile.panCardNo || user?.panCardNo || '',
        address: profile.address || user?.address || '',
        age: profile.age ?? user?.age ?? null,
        gender: profile.gender || user?.gender || '',
        skills: profile.skills || (Array.isArray(user?.skills) ? user.skills.join(', ') : (user?.skills || '')),
        availability: profile.availability || (Array.isArray(user?.availability) ? user.availability.join(', ') : (user?.availability || '')),
        experience: profile.experience || user?.experience || '',
        preferredEventTypes: profile.preferredEventTypes || (Array.isArray(user?.preferredEventTypes) ? user.preferredEventTypes.join(', ') : (user?.preferredEventTypes || '')),
        languages: profile.languages?.length ? profile.languages : (Array.isArray(user?.languages) ? user.languages : []),
        emergencyContact: profile.emergencyContact && Object.values(profile.emergencyContact).some(Boolean) ? profile.emergencyContact : (user?.emergencyContact || { name: '', phone: '', relation: '' }),
        bloodGroup: profile.bloodGroup || user?.bloodGroup || ''
      };

      Object.assign(profile, mergedValues);
      await profile.save();
    }

    profile = await VolunteerProfile.findById(profile._id).populate('user', 'username email photo aadharNo panCardNo address age fullName gender phone upiId city skills availability experience preferredEventTypes languages emergencyContact bloodGroup');
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const { fullName, city, phone, upiId, skills, availability, experience, preferredEventTypes, photo, aadharNo, panCardNo, address, age, gender, languages, emergencyContact, bloodGroup } = req.body;
    let profile = await VolunteerProfile.findOne({ user: req.userId });
    if (!profile) {
      profile = await VolunteerProfile.create({ user: req.userId });
    }

    const normalizeList = (value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') return value.split(',').map(v => v.trim()).filter(Boolean);
      return [];
    };

    const nextSkills = Array.isArray(skills) ? skills : normalizeList(skills);
    const nextAvailability = Array.isArray(availability) ? availability : normalizeList(availability);
    const nextEventTypes = Array.isArray(preferredEventTypes) ? preferredEventTypes : normalizeList(preferredEventTypes);
    const nextLanguages = Array.isArray(languages) ? languages : normalizeList(languages);

    Object.assign(profile, {
      fullName: fullName ?? profile.fullName ?? '',
      city: city ?? profile.city ?? '',
      phone: phone ?? profile.phone ?? '',
      upiId: upiId ?? profile.upiId ?? '',
      photo: photo ?? profile.photo ?? '',
      aadharNo: aadharNo ?? profile.aadharNo ?? '',
      panCardNo: panCardNo ?? profile.panCardNo ?? '',
      address: address ?? profile.address ?? '',
      age: age ?? profile.age ?? null,
      gender: gender ?? profile.gender ?? '',
      skills: nextSkills.join(', '),
      availability: nextAvailability.join(', '),
      experience: experience ?? profile.experience ?? '',
      preferredEventTypes: nextEventTypes.join(', '),
      languages: nextLanguages,
      emergencyContact: emergencyContact ?? profile.emergencyContact ?? { name: '', phone: '', relation: '' },
      bloodGroup: bloodGroup ?? profile.bloodGroup ?? ''
    });
    await profile.save();

    const user = await User.findById(req.userId);
    if (user) {
      Object.assign(user, {
        fullName: fullName || user.fullName || '',
        city: city || user.city || '',
        phone: phone || user.phone || '',
        upiId: upiId ?? user.upiId ?? '',
        photo: photo || user.photo || '',
        aadharNo: aadharNo || user.aadharNo || '',
        panCardNo: panCardNo || user.panCardNo || '',
        address: address || user.address || '',
        age: age ?? user.age ?? null,
        gender: gender || user.gender || '',
        skills: nextSkills,
        availability: nextAvailability,
        experience: experience || user.experience || '',
        preferredEventTypes: nextEventTypes,
        languages: nextLanguages,
        emergencyContact: emergencyContact || user.emergencyContact || { name: '', phone: '', relation: '' },
        bloodGroup: bloodGroup || user.bloodGroup || ''
      });
      await user.save();
    }

    profile = await VolunteerProfile.findById(profile._id).populate('user', 'username email photo aadharNo panCardNo address age fullName gender phone upiId city skills availability experience preferredEventTypes languages emergencyContact bloodGroup');
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ──────────────────────────────────────────
// OVERVIEW / STATS
// ──────────────────────────────────────────

router.get('/overview', auth, async (req, res) => {
  try {
    let profile = await VolunteerProfile.findOne({ user: req.userId });
    if (!profile) {
      profile = await VolunteerProfile.create({ user: req.userId });
    }

    const assignedEvents = await Booking.countDocuments({ user: req.userId });
    const openTasks = await VolunteerTask.countDocuments({ volunteer: req.userId, status: { $ne: 'completed' } });
    const crewPoints = profile.crewPoints || 0;
    const applicationStatus = profile.applicationStatus || 'approved';

    // Available events (approved, not already booked)
    const bookedEventIds = (await Booking.find({ user: req.userId }).select('event')).map(b => b.event);
    const availableEvents = await Event.find({
      status: 'approved',
      _id: { $nin: bookedEventIds }
    }).limit(5).lean();

    // Next tasks (latest incomplete)
    const nextTasks = await VolunteerTask.find({ volunteer: req.userId })
      .populate('event', 'title')
      .sort({ dueDate: 1 })
      .limit(5)
      .lean();

    res.json({
      applicationStatus,
      assignedEvents,
      openTasks,
      crewPoints,
      availableEvents,
      nextTasks,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ──────────────────────────────────────────
// TASKS
// ──────────────────────────────────────────

// GET all tasks for this volunteer
router.get('/tasks', auth, async (req, res) => {
  try {
    const tasks = await VolunteerTask.find({ volunteer: req.userId })
      .populate('event', 'title rules date')
      .sort({ dueDate: 1 })
      .lean();

    tasks.sort((a, b) => {
      const isCompletedA = a.status === 'completed' ? 1 : 0;
      const isCompletedB = b.status === 'completed' ? 1 : 0;
      if (isCompletedA !== isCompletedB) return isCompletedA - isCompletedB;
      const timeA = new Date(a.dueDate || a.startTime || 0).getTime();
      const timeB = new Date(b.dueDate || b.startTime || 0).getTime();
      return timeA - timeB;
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT update task status
router.put('/tasks/:id/status', auth, async (req, res) => {
  try {
    const { status, photo } = req.body;
    
    if (status === 'completed' && !photo) {
      return res.status(400).json({ message: 'Photo proof is required to complete a task' });
    }

    let updateFields = { status };
    if (status === 'completed') {
      updateFields.paymentStatus = 'pending_approval';
      if (photo) updateFields.completedPhoto = photo;
    }

    const task = await VolunteerTask.findOneAndUpdate(
      { _id: req.params.id, volunteer: req.userId },
      updateFields,
      { new: true }
    ).populate('event', 'title').populate('volunteer', 'username fullName');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Award crew points on completion and notify admin
    if (status === 'completed') {
      await VolunteerProfile.findOneAndUpdate(
        { user: req.userId },
        { $inc: { crewPoints: 60 } }
      );

      // Check if 500 points reached to auto-generate certificate
      await checkAndAutoGenerateCertificates(req.userId);

      const Notification = require('../models/Notification');
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin' });
      const volunteerName = task.volunteer.fullName || task.volunteer.username;
      
      for (const admin of admins) {
        await Notification.create({
          userId: admin._id,
          message: `${volunteerName} has completed the task "${task.taskName}". Review proof and approve payment of ₹${task.salary || 0}.`,
          type: 'task_completed',
          link: '/admin/dashboard?view=tasks'
        });
      }
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper: automatically generate certificate once volunteer reaches 500 points
async function checkAndAutoGenerateCertificates(userId) {
  try {
    const profile = await VolunteerProfile.findOne({ user: userId });
    if (!profile || (profile.crewPoints || 0) < 500) return [];

    const [tasks, bookings, attendances] = await Promise.all([
      VolunteerTask.find({ volunteer: userId }).select('event'),
      Booking.find({ user: userId }).select('event'),
      Attendance.find({ volunteer: userId }).select('event')
    ]);

    const eventIds = new Set();
    tasks.forEach(t => { if (t.event) eventIds.add(t.event.toString()); });
    bookings.forEach(b => { if (b.event) eventIds.add(b.event.toString()); });
    attendances.forEach(a => { if (a.event) eventIds.add(a.event.toString()); });

    if (eventIds.size === 0) {
      const anyEvent = await Event.findOne();
      if (anyEvent) eventIds.add(anyEvent._id.toString());
    }

    const createdCerts = [];
    for (const eventId of eventIds) {
      const existing = await Certificate.findOne({ volunteer: userId, event: eventId });
      if (!existing) {
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const certificateId = `CL-2026-${randomStr}`;
        const newCert = await Certificate.create({
          volunteer: userId,
          event: eventId,
          certificateId,
          status: 'pending'
        });
        createdCerts.push(newCert);
      }
    }

    if (createdCerts.length > 0) {
      const Notification = require('../models/Notification');
      const User = require('../models/User');
      
      const volUser = await User.findById(userId);
      const volName = profile.fullName || volUser?.fullName || volUser?.username || 'A volunteer';
      
      // Notify admins that certificate is pending approval
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await Notification.create({
          userId: admin._id,
          message: `🎖️ ${volName} has achieved 500+ crew points! Certificate(s) are awaiting your approval.`,
          type: 'certificate_pending',
          link: '/admin/dashboard?view=certificates'
        });
      }

      // Notify the volunteer
      await Notification.create({
        userId,
        message: '🎉 Congratulations! You have achieved 500+ crew points! Your Certificate of Appreciation has been submitted for Admin approval.',
        type: 'info',
        link: '/volunteer/dashboard'
      });
    }

    return createdCerts;
  } catch (err) {
    console.error('Error auto-generating certificates:', err);
    return [];
  }
}

// GET single task with chat messages
router.get('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await VolunteerTask.findOne({ _id: req.params.id, volunteer: req.userId })
      .populate('event', 'title rules')
      .lean();

    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST send chat message for task
router.post('/tasks/:id/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || (!message.text && !message.image && !message.audio)) {
      return res.status(400).json({ message: 'Message text, image, or voice note is required' });
    }

    const task = await VolunteerTask.findOne({ _id: req.params.id, volunteer: req.userId });
    
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Initialize chatMessages array if it doesn't exist
    if (!task.chatMessages) {
      task.chatMessages = [];
    }

    // Use the actual volunteer user ID
    const messageWithSenderId = {
      ...message,
      sender: req.userId
    };

    // Add new message
    task.chatMessages.push(messageWithSenderId);
    await task.save();

    // Create notification for admin
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' });
    const Notification = require('../models/Notification');
    
    console.log('Creating notifications for admins. Found admins:', admins.length);
    
    let adminNotifMessage = '';
    if (message.text && message.text.trim()) {
      const textPreview = message.text.trim().length > 90
        ? message.text.trim().substring(0, 87) + '...'
        : message.text.trim();
      adminNotifMessage = `New message from ${message.senderName || 'Volunteer'} regarding task "${task.taskName}": "${textPreview}"`;
    } else if (message.audio) {
      adminNotifMessage = `🎤 New voice note from ${message.senderName || 'Volunteer'} regarding task "${task.taskName}"`;
    } else if (message.image) {
      adminNotifMessage = `📷 ${message.senderName || 'Volunteer'} sent a photo regarding task "${task.taskName}"`;
    } else {
      adminNotifMessage = `New message from ${message.senderName || 'Volunteer'} regarding task "${task.taskName}"`;
    }

    for (const admin of admins) {
      try {
        await Notification.create({
          userId: admin._id,
          message: adminNotifMessage,
          type: 'chat_message',
          link: `/admin/dashboard?view=tasks&taskId=${task._id}`,
          taskId: task._id
        });
        console.log('Notification created for admin:', admin.username);
      } catch (error) {
        console.error('Error creating notification for admin:', error);
      }
    }

    // Return updated task with chat messages
    const updatedTask = await VolunteerTask.findById(task._id)
      .populate('event', 'title rules')
      .lean();

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ──────────────────────────────────────────
// ATTENDANCE
// ──────────────────────────────────────────

router.get('/attendance', auth, async (req, res) => {
  try {
    const Booking = require('../models/Booking');
    
    // Auto-reconcile attendance records for any assigned tasks or bookings
    const [bookings, assignedTasks] = await Promise.all([
      Booking.find({ user: req.userId }).select('event'),
      VolunteerTask.find({ volunteer: req.userId }).populate('event', 'title').sort({ createdAt: 1 })
    ]);

    // Reconcile each assigned task with an Attendance record
    for (const t of assignedTasks) {
      if (!t.event) continue;
      const eventId = t.event._id ? t.event._id : t.event;
      let existing = await Attendance.findOne({ task: t._id });
      if (!existing) {
        // Check for an older unlinked attendance record for this event and volunteer
        const legacy = await Attendance.findOne({ volunteer: req.userId, event: eventId, task: { $exists: false } });
        if (legacy) {
          legacy.task = t._id;
          await legacy.save();
        } else {
          await Attendance.create({
            volunteer: req.userId,
            event: eventId,
            task: t._id,
            status: 'pending'
          });
        }
      }
    }

    // Reconcile bookings without tasks
    for (const b of bookings) {
      if (!b.event) continue;
      const existing = await Attendance.findOne({ volunteer: req.userId, event: b.event });
      if (!existing) {
        await Attendance.create({ volunteer: req.userId, event: b.event, status: 'pending' });
      }
    }

    let records = await Attendance.find({ volunteer: req.userId })
      .populate('event', 'title')
      .populate('task', 'taskName status')
      .lean();

    // Sort: Pending/Active (checkOut is null and not absent) first, Completed/Absent last
    records.sort((a, b) => {
      const isDoneA = (a.status === 'absent' || (a.status === 'present' && a.checkOut)) ? 1 : 0;
      const isDoneB = (b.status === 'absent' || (b.status === 'present' && b.checkOut)) ? 1 : 0;
      if (isDoneA !== isDoneB) return isDoneA - isDoneB;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    const profile = await VolunteerProfile.findOne({ user: req.userId });
    const presentDays = records.filter(r => r.status === 'present').length;

    res.json({
      points: profile?.crewPoints || 0,
      presentDays,
      records,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT toggle attendance (check-in / check-out)
router.put('/attendance/:id/toggle', auth, async (req, res) => {
  try {
    const record = await Attendance.findOne({ _id: req.params.id, volunteer: req.userId })
      .populate('volunteer', 'username fullName')
      .populate('event', 'title');
      
    if (!record) return res.status(404).json({ message: 'Attendance record not found' });

    let justCheckedIn = false;
    let justCheckedOut = false;

    if (record.status === 'pending') {
      record.status = 'present';
      record.checkIn = new Date();
      justCheckedIn = true;
    } else if (record.status === 'present' && !record.checkOut) {
      record.checkOut = new Date();
      justCheckedOut = true;
    }

    await record.save();

    const User = require('../models/User');
    const Notification = require('../models/Notification');
    const volunteerName = record.volunteer?.fullName || record.volunteer?.username || 'A volunteer';
    const eventTitle = record.event?.title || 'Unknown Event';

    if (justCheckedIn) {
      // Award attendance points
      await VolunteerProfile.findOneAndUpdate(
        { user: req.userId },
        { $inc: { crewPoints: 40 } }
      );

      // Check if 500 points reached to auto-generate certificate
      await checkAndAutoGenerateCertificates(req.userId);

      try {
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
          await Notification.create({
            userId: admin._id,
            message: `${volunteerName} has arrived and checked in for the event "${eventTitle}".`,
            type: 'info',
            link: '/admin/dashboard?view=tasks'
          });
        }
      } catch (notifErr) {
        console.error('Error creating check-in notification:', notifErr.message);
      }
    }

    if (justCheckedOut) {
      try {
        const admins = await User.find({ role: 'admin' });
        for (const admin of admins) {
          await Notification.create({
            userId: admin._id,
            message: `${volunteerName} has completed their shift and checked out from the event "${eventTitle}".`,
            type: 'info',
            link: '/admin/dashboard?view=tasks'
          });
        }
      } catch (notifErr) {
        console.error('Error creating check-out notification:', notifErr.message);
      }
    }

    const updated = await Attendance.findById(record._id).populate('event', 'title');
    res.json(updated);
  } catch (error) {
    console.error('Error toggling attendance:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ──────────────────────────────────────────
// CERTIFICATES
// ──────────────────────────────────────────

router.get('/certificates', auth, async (req, res) => {
  try {
    // Automatically generate certificate if volunteer has reached 500 points
    await checkAndAutoGenerateCertificates(req.userId);

    const certs = await Certificate.find({ volunteer: req.userId })
      .populate('event', 'title date location')
      .populate('volunteer', 'fullName username')
      .sort({ issuedDate: -1 })
      .lean();

    const profile = await VolunteerProfile.findOne({ user: req.userId });
    const points = profile?.crewPoints || 0;

    res.json({
      certificates: certs,
      points,
      requiredPoints: 500,
      isEligible: points >= 500
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Explicit claim / generate certificate once 500 points are reached
router.post('/certificates/claim', auth, async (req, res) => {
  try {
    const profile = await VolunteerProfile.findOne({ user: req.userId });
    const points = profile?.crewPoints || 0;
    if (points < 500) {
      return res.status(400).json({ message: `You need 500 points to generate a certificate. Current points: ${points}` });
    }

    await checkAndAutoGenerateCertificates(req.userId);

    const certs = await Certificate.find({ volunteer: req.userId })
      .populate('event', 'title date location')
      .populate('volunteer', 'fullName username')
      .sort({ issuedDate: -1 })
      .lean();

    res.json({ message: 'Certificate generated successfully!', certificates: certs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ──────────────────────────────────────────
// APPLY to an event as volunteer
// ──────────────────────────────────────────

router.post('/apply/:eventId', auth, async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const existing = await Booking.findOne({ user: req.userId, event: eventId });
    if (existing) return res.status(400).json({ message: 'Already applied' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Create booking
    await Booking.create({
      user: req.userId,
      event: eventId,
      bookingDate: event.date ? new Date(event.date).toLocaleDateString() : 'TBD',
      bookingTime: 'TBD'
    });

    // Create attendance record
    await Attendance.create({
      volunteer: req.userId,
      event: eventId,
      status: 'pending'
    });

    // Increment registered count
    await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });

    res.json({ message: 'Applied successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ──────────────────────────────────────────
// ADMIN: Tasks & Attendance
// ──────────────────────────────────────────
const { adminAuth } = require('../middleware/auth');

// GET all tasks (admin)
router.get('/admin/tasks', adminAuth, async (req, res) => {
  try {
    const tasks = await VolunteerTask.find()
      .populate('volunteer', 'username fullName phone upiId email')
      .populate('event', 'title date')
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    const attendances = await Attendance.find().lean();
    const profiles = await VolunteerProfile.find().lean();

    const tasksWithAtt = tasks.map(t => {
      const prof = profiles.find(p => p.user && t.volunteer && p.user.toString() === t.volunteer._id.toString());
      const volPhone = t.volunteer?.phone || prof?.phone || '';
      const volUpiId = t.volunteer?.upiId || prof?.upiId || '';

      const att = attendances.find(a => 
        (a.task && a.task.toString() === t._id.toString()) ||
        (!a.task && a.volunteer?.toString() === t.volunteer?._id?.toString() && a.event?.toString() === t.event?._id?.toString())
      );
      return {
        ...t,
        volunteer: t.volunteer ? {
          ...t.volunteer,
          phone: volPhone,
          upiId: volUpiId
        } : null,
        attendanceStatus: (att && att.status !== 'pending') ? att.status : null
      };
    });

    tasksWithAtt.sort((a, b) => {
      const isCompletedA = a.status === 'completed' ? 1 : 0;
      const isCompletedB = b.status === 'completed' ? 1 : 0;
      if (isCompletedA !== isCompletedB) return isCompletedA - isCompletedB;
      const timeA = new Date(a.startTime || a.dueDate || a.event?.date || 0).getTime();
      const timeB = new Date(b.startTime || b.dueDate || b.event?.date || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });

    res.json(tasksWithAtt);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST assign task (admin)
router.post('/admin/tasks', adminAuth, async (req, res) => {
  try {
    const { volunteerId, eventId, taskName, startTime, dueDate, rules, salary } = req.body;
    if (salary !== undefined && Number(salary) < 200) {
      return res.status(400).json({ message: 'Salary must be at least ₹200' });
    }
    let finalDueDate = dueDate || startTime;
    if (!finalDueDate && eventId) {
      const ev = await Event.findById(eventId);
      if (ev && ev.date) finalDueDate = ev.date;
    }
    const task = await VolunteerTask.create({ 
      volunteer: volunteerId, 
      event: eventId, 
      taskName, 
      startTime: startTime || finalDueDate, 
      dueDate: finalDueDate, 
      rules, 
      salary 
    });
    await Attendance.create({ volunteer: volunteerId, event: eventId, task: task._id, status: 'pending' });
    const populated = await VolunteerTask.findById(task._id)
      .populate('volunteer', 'username fullName')
      .populate('event', 'title date');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT edit task (admin)
router.put('/admin/tasks/:id', adminAuth, async (req, res) => {
  try {
    const { volunteerId, eventId, taskName, startTime, dueDate, rules, salary } = req.body;
    if (salary !== undefined && Number(salary) < 200) {
      return res.status(400).json({ message: 'Salary must be at least ₹200' });
    }
    let finalDueDate = dueDate || startTime;
    if (!finalDueDate && eventId) {
      const ev = await Event.findById(eventId);
      if (ev && ev.date) finalDueDate = ev.date;
    }
    const task = await VolunteerTask.findByIdAndUpdate(
      req.params.id,
      { 
        volunteer: volunteerId, 
        event: eventId, 
        taskName, 
        startTime: startTime || finalDueDate, 
        dueDate: finalDueDate, 
        rules, 
        salary 
      },
      { new: true }
    ).populate('volunteer', 'username fullName').populate('event', 'title date');
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE task (admin)
router.delete('/admin/tasks/:id', adminAuth, async (req, res) => {
  try {
    const task = await VolunteerTask.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await Attendance.deleteMany({ task: req.params.id });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH approve task payment (admin)
router.patch('/admin/tasks/:id/payment', adminAuth, async (req, res) => {
  try {
    const { status, paymentMethod, upiPhone, upiId, transactionId, paidAmount } = req.body;
    const newStatus = status || 'approved';

    const updateData = {
      paymentStatus: newStatus
    };

    if (newStatus === 'approved') {
      updateData.paymentApprovedAt = new Date();
      updateData.paymentMethod = paymentMethod || 'UPI';
      if (upiPhone !== undefined) updateData.upiPhone = upiPhone;
      if (upiId !== undefined) updateData.upiId = upiId;
      if (transactionId !== undefined) updateData.transactionId = transactionId;
      if (paidAmount !== undefined) updateData.paidAmount = Number(paidAmount);
    }

    const task = await VolunteerTask.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('volunteer', 'username fullName phone upiId email').populate('event', 'title');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (newStatus === 'approved') {
      const Notification = require('../models/Notification');
      const amount = task.paidAmount || task.salary || 0;
      const destination = task.upiPhone ? `to ${task.upiPhone}` : (task.upiId ? `to ${task.upiId}` : '');
      const refNote = task.transactionId ? ` (UTR / Ref: ${task.transactionId})` : '';

      await Notification.create({
        userId: task.volunteer._id,
        message: `Admin has paid ₹${amount} via UPI ${destination} for task "${task.taskName}".${refNote}`,
        type: 'success',
        link: '/volunteer/dashboard'
      });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH attendance status (admin)
router.patch('/admin/attendance/:volunteerId/:eventId', adminAuth, async (req, res) => {
  try {
    const { status, taskId } = req.body;
    const query = taskId
      ? { task: taskId }
      : { volunteer: req.params.volunteerId, event: req.params.eventId };
    const record = await Attendance.findOneAndUpdate(
      query,
      { status, ...(status === 'present' ? { checkIn: new Date() } : {}) },
      { new: true, upsert: true }
    ).populate('event', 'title');
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET single task with chat messages (admin)
router.get('/admin/tasks/:id', adminAuth, async (req, res) => {
  try {
    const task = await VolunteerTask.findById(req.params.id)
      .populate('event', 'title rules')
      .populate('volunteer', 'username fullName')
      .lean();

    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST send chat message for task (admin)
router.post('/admin/tasks/:id/chat', adminAuth, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || (!message.text && !message.image && !message.audio)) {
      return res.status(400).json({ message: 'Message text, image, or voice note is required' });
    }

    const task = await VolunteerTask.findById(req.params.id).populate('volunteer', 'username fullName');
    
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    console.log('Admin sending message for task:', task.taskName);
    console.log('Task volunteer:', task.volunteer);
    console.log('Volunteer ID:', task.volunteer?._id);

    // Initialize chatMessages array if it doesn't exist
    if (!task.chatMessages) {
      task.chatMessages = [];
    }

    // Use the actual admin user ID if provided, otherwise use the string placeholder
    const messageWithSenderId = {
      ...message,
      sender: message.sender === 'admin' ? req.user._id : message.sender
    };

    // Add new message
    task.chatMessages.push(messageWithSenderId);
    await task.save();

    // Create notification for volunteer
    const Notification = require('../models/Notification');
    console.log('Creating notification for volunteer:', task.volunteer);
    
    try {
      let notifMessage = '';
      if (message.text && message.text.trim()) {
        const textPreview = message.text.trim().length > 90
          ? message.text.trim().substring(0, 87) + '...'
          : message.text.trim();
        notifMessage = `New message from Admin regarding task "${task.taskName}": "${textPreview}"`;
      } else if (message.audio) {
        notifMessage = `🎤 New voice note from Admin regarding task "${task.taskName}"`;
      } else if (message.image) {
        notifMessage = `📷 Admin sent a photo regarding task "${task.taskName}"`;
      } else {
        notifMessage = `New message from Admin regarding task "${task.taskName}"`;
      }

      await Notification.create({
        userId: task.volunteer,
        message: notifMessage,
        type: 'chat_message',
        link: `/volunteer/event-support/${task._id}`,
        taskId: task._id
      });
      console.log('Notification created successfully for volunteer with text preview');
    } catch (error) {
      console.error('Error creating notification for volunteer:', error);
    }

    // Return updated task with chat messages
    const updatedTask = await VolunteerTask.findById(task._id)
      .populate('event', 'title rules')
      .populate('volunteer', 'username fullName')
      .lean();

    res.json(updatedTask);
  } catch (error) {
    console.error('Error in admin chat route:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ──────────────────────────────────────────
// VOLUNTEER EVENT TASK APPLICATIONS
// ──────────────────────────────────────────

// POST apply for a task on an event (volunteer)
router.post('/apply-task', auth, async (req, res) => {
  try {
    const { eventId, taskName, salary, note } = req.body;
    if (!eventId || !taskName) {
      return res.status(400).json({ message: 'Event and Task Name are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const parsedSalary = salary ? Math.max(200, Number(salary)) : 200;

    // Check if user already applied or has this task for this event
    const existing = await VolunteerTask.findOne({
      volunteer: req.userId,
      event: eventId,
      taskName: taskName.trim(),
      applicationStatus: { $in: ['pending', 'approved'] }
    });

    if (existing) {
      return res.status(400).json({ 
        message: existing.applicationStatus === 'approved' 
          ? 'You are already assigned to this task!' 
          : 'You already have a pending application for this task.' 
      });
    }

    const User = require('../models/User');
    const volUser = await User.findById(req.userId);
    const volunteerName = volUser?.fullName || volUser?.username || 'A volunteer';

    const task = await VolunteerTask.create({
      volunteer: req.userId,
      event: eventId,
      taskName: taskName.trim(),
      salary: parsedSalary,
      rules: event.rules || '',
      startTime: event.date || new Date(),
      dueDate: event.date || new Date(),
      applicationStatus: 'pending',
      applicationNote: note || '',
      status: 'pending'
    });

    // Notify all admins about new application
    const Notification = require('../models/Notification');
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        userId: admin._id,
        message: `${volunteerName} applied for the task "${taskName.trim()}" at "${event.title}".`,
        type: 'task_applied',
        link: '/admin/dashboard?view=tasks'
      });
    }

    const populated = await VolunteerTask.findById(task._id)
      .populate('event', 'title date location category imageUrl')
      .populate('volunteer', 'username fullName email phone photo');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Apply task error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET all events with volunteer's applied/assigned status
router.get('/events-with-status', auth, async (req, res) => {
  try {
    const events = await Event.find({ status: 'approved' }).sort({ date: 1 }).lean();
    const volunteerTasks = await VolunteerTask.find({ volunteer: req.userId }).lean();

    const eventsWithStatus = events.map(event => {
      const myTasks = volunteerTasks.filter(t => t.event?.toString() === event._id.toString());
      return {
        ...event,
        myTasks
      };
    });

    res.json(eventsWithStatus);
  } catch (error) {
    console.error('Events with status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET all pending volunteer task applications (admin)
router.get('/admin/applications', adminAuth, async (req, res) => {
  try {
    const applications = await VolunteerTask.find({ applicationStatus: 'pending' })
      .populate('volunteer', 'username fullName email phone photo skills availability city')
      .populate('event', 'title date location category price')
      .sort({ createdAt: -1 })
      .lean();
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PATCH approve or reject volunteer task application (admin)
router.patch('/admin/applications/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const task = await VolunteerTask.findById(req.params.id)
      .populate('volunteer', 'username fullName email')
      .populate('event', 'title date location assignedVolunteers');

    if (!task) return res.status(404).json({ message: 'Application not found' });

    task.applicationStatus = status;
    await task.save();

    const Notification = require('../models/Notification');

    if (status === 'approved') {
      const event = await Event.findById(task.event._id);
      if (event) {
        event.assignedVolunteers = event.assignedVolunteers || [];
        if (!event.assignedVolunteers.some(v => v.toString() === task.volunteer._id.toString())) {
          event.assignedVolunteers.push(task.volunteer._id);
          await event.save();
        }
      }

      const existingAtt = await Attendance.findOne({ task: task._id });
      if (!existingAtt) {
        await Attendance.create({
          volunteer: task.volunteer._id,
          event: task.event._id,
          task: task._id,
          status: 'pending'
        });
      }

      await Notification.create({
        userId: task.volunteer._id,
        message: `Great news! Admin approved your application for "${task.taskName}" at "${task.event?.title}". You can now start working on this task!`,
        type: 'task_approved',
        link: '/volunteer/dashboard'
      });
    } else if (status === 'rejected') {
      await Notification.create({
        userId: task.volunteer._id,
        message: `Your application for "${task.taskName}" at "${task.event?.title}" was not approved. You can apply for other available events!`,
        type: 'info',
        link: '/volunteer/dashboard'
      });
    }

    res.json({ message: `Application ${status} successfully`, task });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

