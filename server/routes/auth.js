const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const VolunteerProfile = require('../models/VolunteerProfile');
const { auth } = require('../middleware/auth');

const router = express.Router();

console.log('Auth routes loaded');

// Register
router.post('/register', async (req, res) => {
  try {
    const { 
      username, email, password, role, 
      photo, aadharNo, panCardNo, address, age,
      fullName, gender, phone, city, skills, experience,
      languages, availability, preferredEventTypes, expertRole, emergencyContact, bloodGroup
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or username' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const userData = {
      username,
      email,
      password: hashedPassword,
      role: role || 'user'
    };

    if (role === 'volunteer') {
      userData.photo = photo;
      userData.aadharNo = aadharNo;
      userData.panCardNo = panCardNo;
      userData.address = address;
      userData.age = age;
      
      userData.fullName = fullName;
      userData.gender = gender;
      userData.phone = phone;
      userData.city = city;
      userData.skills = skills || [];
      userData.experience = experience;
      userData.languages = languages || [];
      userData.availability = availability || [];
      userData.preferredEventTypes = preferredEventTypes || [];
      userData.expertRole = expertRole || '';
      if (emergencyContact) {
        userData.emergencyContact = emergencyContact;
      }
      userData.bloodGroup = bloodGroup;
      userData.profileStatus = 'Verified';
    }

    const user = new User(userData);

    await user.save();

    if (role === 'volunteer') {
      const normalizeList = (value) => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') return value.split(',').map(v => v.trim()).filter(Boolean);
        return [];
      };

      await VolunteerProfile.create({
        user: user._id,
        fullName: user.fullName || '',
        city: user.city || '',
        phone: user.phone || '',
        photo: user.photo || '',
        aadharNo: user.aadharNo || '',
        panCardNo: user.panCardNo || '',
        address: user.address || '',
        age: user.age ?? null,
        gender: user.gender || '',
        skills: normalizeList(user.skills).join(', '),
        availability: normalizeList(user.availability).join(', '),
        experience: user.experience || '',
        preferredEventTypes: normalizeList(user.preferredEventTypes).join(', '),
        expertRole: user.expertRole || '',
        languages: normalizeList(user.languages),
        emergencyContact: user.emergencyContact || { name: '', phone: '', relation: '' },
        bloodGroup: user.bloodGroup || ''
      });
    }

    console.log('Volunteer registered successfully:', user.username);
    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const rawInput = (req.body.email || req.body.username || '').trim();
    const password = (req.body.password || '').trim();

    if (!rawInput || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Case-insensitive find by email OR username
    const escapedInput = rawInput.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const user = await User.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${escapedInput}$`, 'i') } },
        { username: { $regex: new RegExp(`^${escapedInput}$`, 'i') } }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Google Login
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'No token provided' });
    }

    // Fetch user info from Google using the access token
    const googleResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!googleResponse.ok) {
      return res.status(401).json({ message: 'Invalid Google token' });
    }

    const { email, name, sub: googleId } = await googleResponse.json();

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // If user exists but doesn't have googleId, we can link them
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user
      user = new User({
        username: name || email.split('@')[0],
        email,
        googleId,
        role: 'user'
      });
      await user.save();
    }

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Google Login successful',
      token: jwtToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Server error during Google login' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Fetch user's bookings and attach events
    const Booking = require('../models/Booking');
    const bookings = await Booking.find({ user: user._id }).populate('event', 'title date location');
    const userEvents = bookings.map(b => {
      // Handle cases where the event might have been deleted but booking remains
      if (!b.event) return null;
      const eventObj = b.event.toObject();
      eventObj.bookingDate = b.bookingDate;
      eventObj.bookingTime = b.bookingTime;
      eventObj.bookingId = b._id;
      return eventObj;
    }).filter(Boolean);

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        registeredEvents: userEvents // Maintain backwards compatibility for frontend for now
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;