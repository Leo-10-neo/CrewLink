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
        user.aadharNo = user.aadharNo || prof.aadharNo;
        user.panCardNo = user.panCardNo || prof.panCardNo;
        user.address = user.address || prof.address;
        user.age = user.age != null ? user.age : prof.age;
        user.gender = user.gender || prof.gender;
        user.experience = user.experience || prof.experience;
        user.expertRole = user.expertRole || prof.expertRole;
        user.bloodGroup = user.bloodGroup || prof.bloodGroup;
        if (!user.emergencyContact || !user.emergencyContact.name) {
          user.emergencyContact = prof.emergencyContact;
        }
        if (!user.skills || user.skills.length === 0) {
          user.skills = typeof prof.skills === 'string' ? prof.skills.split(',').map(s => s.trim()).filter(Boolean) : (prof.skills || []);
        }
        if (!user.languages || user.languages.length === 0) {
          user.languages = Array.isArray(prof.languages) ? prof.languages : (typeof prof.languages === 'string' ? prof.languages.split(',').map(s => s.trim()).filter(Boolean) : []);
        }
        if (!user.availability || user.availability.length === 0) {
          user.availability = typeof prof.availability === 'string' ? prof.availability.split(',').map(s => s.trim()).filter(Boolean) : (prof.availability || []);
        }
        if (!user.preferredEventTypes || user.preferredEventTypes.length === 0) {
          user.preferredEventTypes = typeof prof.preferredEventTypes === 'string' ? prof.preferredEventTypes.split(',').map(s => s.trim()).filter(Boolean) : (prof.preferredEventTypes || []);
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

// Helper to normalize array inputs
const normalizeList = (val) => {
  if (Array.isArray(val)) return val.map(s => String(s).trim()).filter(Boolean);
  if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
  return [];
};

// Add new volunteer (admin only)
router.post('/volunteer', adminAuth, async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const VolunteerProfile = require('../models/VolunteerProfile');
    
    let {
      username, email, password,
      fullName, city, phone, upiId,
      skills, availability, experience, preferredEventTypes, languages,
      expertRole, emergencyContact, emergencyName, emergencyPhone, emergencyRelation,
      bloodGroup, photo, aadharNo, panCardNo, age, gender, address, profileStatus
    } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (!username) {
      const baseUser = fullName ? fullName.toLowerCase().replace(/[^a-z0-9]/g, '') : cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '');
      username = (baseUser || 'volunteer') + Math.floor(100 + Math.random() * 900);
    } else {
      username = username.trim();
    }

    // Check if user with email or username already exists
    const existing = await User.findOne({ $or: [{ email: cleanEmail }, { username }] });
    if (existing) {
      return res.status(400).json({ message: 'A user with this email or username already exists' });
    }

    // Password: default to Volunteer@123 if not specified
    const plainPassword = password && password.trim() ? password.trim() : 'Volunteer@123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    const finalEmergencyContact = emergencyContact && (emergencyContact.name || emergencyContact.phone) ? emergencyContact : {
      name: emergencyName || '',
      phone: emergencyPhone || '',
      relation: emergencyRelation || ''
    };

    const parsedAge = age !== '' && age !== undefined && age !== null ? parseInt(age, 10) : undefined;

    const newUserData = {
      username,
      email: cleanEmail,
      password: hashedPassword,
      role: 'volunteer',
      fullName: fullName || username,
      city: city || '',
      phone: phone || '',
      upiId: upiId || '',
      photo: photo || '',
      aadharNo: aadharNo || '',
      panCardNo: panCardNo || '',
      address: address || '',
      age: isNaN(parsedAge) ? undefined : parsedAge,
      gender: gender || '',
      skills: normalizeList(skills),
      experience: experience || '',
      languages: normalizeList(languages),
      availability: normalizeList(availability),
      preferredEventTypes: normalizeList(preferredEventTypes),
      expertRole: expertRole || 'Volunteer',
      emergencyContact: finalEmergencyContact,
      bloodGroup: bloodGroup || '',
      profileStatus: profileStatus || 'Verified'
    };

    const user = new User(newUserData);
    await user.save();

    // Create corresponding VolunteerProfile
    await VolunteerProfile.create({
      user: user._id,
      fullName: user.fullName,
      city: user.city,
      phone: user.phone,
      upiId: user.upiId,
      photo: user.photo,
      aadharNo: user.aadharNo,
      panCardNo: user.panCardNo,
      address: user.address,
      age: user.age ?? null,
      gender: user.gender,
      skills: user.skills.join(', '),
      availability: user.availability.join(', '),
      experience: user.experience,
      preferredEventTypes: user.preferredEventTypes.join(', '),
      expertRole: user.expertRole,
      languages: user.languages,
      emergencyContact: user.emergencyContact,
      bloodGroup: user.bloodGroup,
      applicationStatus: 'approved'
    });

    const userObj = user.toObject();
    delete userObj.password;

    res.status(201).json({ message: 'Volunteer added successfully', volunteer: userObj });
  } catch (error) {
    console.error('Create volunteer error:', error);
    res.status(500).json({ message: error.message || 'Server error creating volunteer' });
  }
});

// Bulk import volunteers from Excel/CSV (admin only)
router.post('/volunteers/bulk-import', adminAuth, async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const VolunteerProfile = require('../models/VolunteerProfile');
    const { sendVolunteerWelcomeEmail } = require('../services/emailService');

    const { volunteers, sendEmails = true, loginUrl } = req.body;

    if (!Array.isArray(volunteers) || volunteers.length === 0) {
      return res.status(400).json({ message: 'No volunteer records provided in upload.' });
    }

    const results = [];
    let createdCount = 0;
    let skippedCount = 0;

    for (let index = 0; index < volunteers.length; index++) {
      const row = volunteers[index];
      const fullName = (row.fullName || row.name || '').trim();
      const rawEmail = (row.email || row.mail || '').trim();
      const rawPhone = (row.phone || row.phoneNo || row.mobile || '').trim();
      const gender = (row.gender || 'Other').trim();
      const expertRole = (row.role || row.expertRole || 'Volunteer').trim();

      if (!rawEmail || !rawEmail.includes('@')) {
        results.push({
          index: index + 1,
          fullName: fullName || 'Unknown',
          email: rawEmail || 'Missing',
          phone: rawPhone,
          gender,
          expertRole,
          status: 'skipped',
          reason: 'Missing or invalid email address'
        });
        skippedCount++;
        continue;
      }

      if (!rawPhone) {
        results.push({
          index: index + 1,
          fullName: fullName || 'Unknown',
          email: rawEmail,
          phone: 'Missing',
          gender,
          expertRole,
          status: 'skipped',
          reason: 'Missing phone number'
        });
        skippedCount++;
        continue;
      }

      const cleanEmail = rawEmail.toLowerCase();

      // Check if user already exists
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        results.push({
          index: index + 1,
          fullName: existingUser.fullName || fullName,
          email: cleanEmail,
          phone: rawPhone,
          gender,
          expertRole,
          status: 'skipped',
          reason: 'Email is already registered'
        });
        skippedCount++;
        continue;
      }

      // Generate clean unique username
      const baseName = fullName 
        ? fullName.toLowerCase().replace(/[^a-z0-9]/g, '') 
        : cleanEmail.split('@')[0].replace(/[^a-z0-9]/g, '');
      let username = (baseName || 'volunteer') + Math.floor(1000 + Math.random() * 9000);
      let attempts = 0;
      while (await User.findOne({ username }) && attempts < 5) {
        username = (baseName || 'volunteer') + Math.floor(1000 + Math.random() * 9000);
        attempts++;
      }

      // Generate auto-generated password: e.g. Crew@4819
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const plainPassword = `Crew@${randomSuffix}`;

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);

      // Create User
      const newUser = new User({
        username,
        email: cleanEmail,
        password: hashedPassword,
        role: 'volunteer',
        fullName: fullName || username,
        phone: rawPhone,
        gender: gender || 'Other',
        expertRole: expertRole || 'Volunteer',
        profileStatus: 'Verified'
      });
      await newUser.save();

      // Create VolunteerProfile
      await VolunteerProfile.create({
        user: newUser._id,
        fullName: newUser.fullName,
        phone: newUser.phone,
        gender: newUser.gender,
        expertRole: newUser.expertRole,
        applicationStatus: 'approved'
      });

      // Send email if enabled
      let emailStatus = { success: false, skipped: true };
      if (sendEmails !== false) {
        emailStatus = await sendVolunteerWelcomeEmail({
          email: cleanEmail,
          fullName: newUser.fullName,
          username,
          password: plainPassword,
          expertRole: newUser.expertRole,
          loginUrl
        });
      }

      results.push({
        index: index + 1,
        id: newUser._id,
        fullName: newUser.fullName,
        email: cleanEmail,
        username,
        generatedPassword: plainPassword,
        phone: rawPhone,
        gender,
        expertRole,
        emailSent: emailStatus.success,
        emailNote: emailStatus.isMock ? 'Credentials saved (SMTP mock)' : (emailStatus.error ? `Email error: ${emailStatus.error}` : 'Email sent successfully'),
        status: 'created'
      });
      createdCount++;
    }

    res.json({
      success: true,
      message: `Bulk import completed: ${createdCount} volunteer(s) created, ${skippedCount} skipped.`,
      createdCount,
      skippedCount,
      results
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ message: error.message || 'Server error during bulk volunteer import' });
  }
});

// Update volunteer details (admin only)
router.put('/:id/volunteer', adminAuth, async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const VolunteerProfile = require('../models/VolunteerProfile');
    const userId = req.params.id;

    const {
      fullName, city, phone, upiId,
      skills, availability, experience, preferredEventTypes, languages,
      expertRole, emergencyContact, emergencyName, emergencyPhone, emergencyRelation,
      bloodGroup, photo, aadharNo, panCardNo, age, gender, address, profileStatus,
      email, username, password
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Volunteer not found' });
    }

    if (fullName !== undefined) user.fullName = fullName;
    if (city !== undefined) user.city = city;
    if (phone !== undefined) user.phone = phone;
    if (upiId !== undefined) user.upiId = upiId;
    if (photo !== undefined) user.photo = photo;
    if (aadharNo !== undefined) user.aadharNo = aadharNo;
    if (panCardNo !== undefined) user.panCardNo = panCardNo;
    if (address !== undefined) user.address = address;
    if (age !== undefined) {
      const parsedAge = age !== '' && age !== null ? parseInt(age, 10) : undefined;
      user.age = isNaN(parsedAge) ? undefined : parsedAge;
    }
    if (gender !== undefined) user.gender = gender;
    if (skills !== undefined) user.skills = normalizeList(skills);
    if (experience !== undefined) user.experience = experience;
    if (languages !== undefined) user.languages = normalizeList(languages);
    if (availability !== undefined) user.availability = normalizeList(availability);
    if (preferredEventTypes !== undefined) user.preferredEventTypes = normalizeList(preferredEventTypes);
    if (expertRole !== undefined) user.expertRole = expertRole;
    if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
    if (profileStatus !== undefined) user.profileStatus = profileStatus;

    if (emergencyContact !== undefined) {
      user.emergencyContact = emergencyContact;
    } else if (emergencyName !== undefined || emergencyPhone !== undefined || emergencyRelation !== undefined) {
      user.emergencyContact = {
        name: emergencyName ?? user.emergencyContact?.name ?? '',
        phone: emergencyPhone ?? user.emergencyContact?.phone ?? '',
        relation: emergencyRelation ?? user.emergencyContact?.relation ?? ''
      };
    }

    if (email && email.toLowerCase().trim() !== user.email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase().trim(), _id: { $ne: userId } });
      if (existingEmail) return res.status(400).json({ message: 'Email already taken by another user' });
      user.email = email.toLowerCase().trim();
    }

    if (username && username.trim() !== user.username) {
      const existingUser = await User.findOne({ username: username.trim(), _id: { $ne: userId } });
      if (existingUser) return res.status(400).json({ message: 'Username already taken' });
      user.username = username.trim();
    }

    if (password && password.trim()) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password.trim(), salt);
    }

    await user.save();

    // Also update VolunteerProfile
    let profile = await VolunteerProfile.findOne({ user: userId });
    if (!profile) {
      profile = new VolunteerProfile({ user: userId });
    }
    profile.fullName = user.fullName || '';
    profile.city = user.city || '';
    profile.phone = user.phone || '';
    profile.upiId = user.upiId || '';
    profile.photo = user.photo || '';
    profile.aadharNo = user.aadharNo || '';
    profile.panCardNo = user.panCardNo || '';
    profile.address = user.address || '';
    profile.age = user.age ?? null;
    profile.gender = user.gender || '';
    profile.skills = user.skills.join(', ');
    profile.availability = user.availability.join(', ');
    profile.experience = user.experience || '';
    profile.preferredEventTypes = user.preferredEventTypes.join(', ');
    profile.expertRole = user.expertRole || '';
    profile.languages = user.languages;
    profile.emergencyContact = user.emergencyContact;
    profile.bloodGroup = user.bloodGroup || '';
    await profile.save();

    const userObj = user.toObject();
    delete userObj.password;

    res.json({ message: 'Volunteer updated successfully', volunteer: userObj });
  } catch (error) {
    console.error('Update volunteer error:', error);
    res.status(500).json({ message: error.message || 'Server error updating volunteer' });
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
    let user = await User.findById(userId);
    let targetUserId = userId;

    if (!user) {
      // Check if this was passed a VolunteerProfile ID instead of User ID
      const VolunteerProfile = require('../models/VolunteerProfile');
      const profile = await VolunteerProfile.findById(userId);
      if (profile && profile.user) {
        targetUserId = profile.user.toString();
        user = await User.findById(targetUserId);
      }
    }

    if (user) {
      await User.findByIdAndDelete(targetUserId);
    }

    // Cascade cleanups
    const VolunteerProfile = require('../models/VolunteerProfile');
    const VolunteerTask = require('../models/VolunteerTask');
    const Attendance = require('../models/Attendance');
    const Certificate = require('../models/Certificate');
    const Event = require('../models/Event');
    const Booking = require('../models/Booking');
    const Notification = require('../models/Notification');

    await Promise.all([
      VolunteerProfile.deleteMany({ $or: [{ user: targetUserId }, { _id: userId }] }),
      VolunteerTask.deleteMany({ volunteer: targetUserId }),
      Attendance.deleteMany({ volunteer: targetUserId }),
      Certificate.deleteMany({ volunteer: targetUserId }),
      Event.updateMany({ assignedVolunteers: targetUserId }, { $pull: { assignedVolunteers: targetUserId } }),
      Booking.deleteMany({ user: targetUserId }),
      Notification.deleteMany({ userId: targetUserId })
    ]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;